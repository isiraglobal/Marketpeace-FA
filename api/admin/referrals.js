/**
 * Admin Referral Ledger API
 *
 * - GET  /api/admin/referrals → full referral ledger + payouts (admin)
 * - POST /api/admin/referrals → run a bi-weekly payout run (method from body)
 *
 * Auth: bearer token OR httpOnly cookie — same verification as /api/admin/cities.
 */

import { createRateLimiter, timingSafeEqual } from '../_middleware.js';

const rateLimiter = createRateLimiter({ maxRequests: 30, windowMs: 15 * 60 * 1000 });

const ALLOWED_PAYOUT_METHODS = ['paypal', 'venmo', 'cashapp', 'zelle', 'credit'];

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!rateLimiter.check(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // SECURITY: Verify admin token with bitwise timing-safe comparison
  const authHeader = req.headers.authorization || '';
  const headerToken = authHeader.replace(/^Bearer\s+/i, '');
  const cookies = req.headers.cookie || '';
  const cookieToken = cookies.split(';').find(c => c.trim().startsWith('adminToken='))?.split('=')[1] || '';

  const token = headerToken || cookieToken;
  const expectedToken = Buffer.from(`${process.env.ADMIN_ID}:${process.env.INTERNAL_WEBHOOK_SECRET}`).toString('base64');

  if (!token || !timingSafeEqual(token, expectedToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
  if (!GOOGLE_SCRIPT_URL) {
    return res.status(500).json({ error: 'Storage service not configured' });
  }

  try {
    if (req.method === 'GET') {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'listReferrals',
          _secret: process.env.INTERNAL_WEBHOOK_SECRET,
        }),
      });

      if (!response.ok) throw new Error('Apps Script list failed');

      const result = await response.json();
      return res.status(200).json({
        entries: Array.isArray(result.entries) ? result.entries : [],
        referrers: result.referrers || {},
      });
    }

    if (req.method === 'POST') {
      const payoutMethod = String(req.body.payoutMethod || 'paypal').toLowerCase();
      if (!ALLOWED_PAYOUT_METHODS.includes(payoutMethod)) {
        return res.status(400).json({ error: 'Invalid payout method.' });
      }

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payoutReferrals',
          _secret: process.env.INTERNAL_WEBHOOK_SECRET,
          payoutMethod,
        }),
      });

      if (!response.ok) throw new Error('Apps Script payout failed');

      const result = await response.json();
      if (result.error) return res.status(400).json({ error: result.error });
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[api/admin/referrals] Error', { message: error.message });
    return res.status(500).json({ error: 'Operation failed' });
  }
}