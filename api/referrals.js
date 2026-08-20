/**
 * Public Referral Network API
 *
 * - registerReferrer → mints an MP-XXXX-XXX code (rate-limited, validated)
 * - lookupReferrer   → validates a code before a form is submitted
 *
 * Mirrors the security posture of /api/submit: Apps Script URL lives only
 * server-side, INTERNAL_WEBHOOK_SECRET is never exposed to the browser, and
 * all inputs are validated before forwarding.
 */

import { createRateLimiter } from './_middleware.js';

const registerLimiter = createRateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 });
const lookupLimiter = createRateLimiter({ maxRequests: 30, windowMs: 15 * 60 * 1000 });

const ALLOWED_PLATFORMS = ['website', 'qr', 'flyer', 'word-of-mouth', 'cafe', 'other'];
const ALLOWED_TYPES = ['referrer', 'vendor', 'venue', 'audience', 'promoter'];
const ALLOWED_PAYOUT_METHODS = ['paypal', 'venmo', 'cashapp', 'zelle'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const { action } = req.body;

  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
  if (!GOOGLE_SCRIPT_URL) {
    console.error('[api/referrals] GOOGLE_SCRIPT_URL not configured');
    return res.status(500).json({ error: 'Service unavailable. Please try again later.' });
  }

  try {
    if (action === 'lookupReferrer') {
      if (!lookupLimiter.check(ip)) {
        return res.status(429).json({ error: 'Too many lookups. Please try again later.' });
      }

      const code = String(req.body.code || '').trim().toUpperCase();
      if (!/^MP[-_][A-Z0-9]{2,6}$/.test(code)) {
        return res.status(400).json({ error: 'Invalid referral code format.' });
      }

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lookupReferrer',
          _secret: process.env.INTERNAL_WEBHOOK_SECRET,
          code,
        }),
      });

      if (!response.ok) {
        throw new Error('Apps Script lookup failed');
      }

      const result = await response.json();
      return res.status(200).json({ found: !!result.found, code, name: result.name || null });
    }

    if (action === 'registerReferrer') {
      if (!registerLimiter.check(ip)) {
        return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
      }

      const name = String(req.body.name || '').trim().slice(0, 100);
      const email = String(req.body.email || '').trim().toLowerCase().slice(0, 254);
      const phone = String(req.body.phone || '').trim().slice(0, 30);
      const platform = String(req.body.platform || 'website').trim().slice(0, 50);
      const type = String(req.body.type || 'referrer').trim().slice(0, 50);
      const payoutMethod = String(req.body.payoutMethod || 'paypal').trim().toLowerCase().slice(0, 30);

      if (name.length < 2) return res.status(400).json({ error: 'Name is required (min 2 characters).' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email is required.' });
      if (platform && !ALLOWED_PLATFORMS.includes(platform)) return res.status(400).json({ error: 'Invalid platform.' });
      if (type && !ALLOWED_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid referrer type.' });
      if (payoutMethod && !ALLOWED_PAYOUT_METHODS.includes(payoutMethod)) return res.status(400).json({ error: 'Invalid payout method.' });

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'registerReferrer',
          _secret: process.env.INTERNAL_WEBHOOK_SECRET,
          name,
          email,
          phone,
          platform,
          type,
          payoutMethod,
        }),
      });

      if (!response.ok) {
        throw new Error('Apps Script register failed');
      }

      const result = await response.json();
      if (result.error) return res.status(400).json({ error: result.error });
      return res.status(200).json({
        success: true,
        existing: !!result.existing,
        code: result.code,
        shareLink: result.shareLink,
      });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (error) {
    console.error('[api/referrals] Error', { message: error.message, action: req.body?.action });
    return res.status(500).json({ error: 'Operation failed. Please try again.' });
  }
}