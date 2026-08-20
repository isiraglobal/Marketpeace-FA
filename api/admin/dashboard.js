/**
 * Admin Revenue & Ops Dashboard API
 *
 * GET /api/admin/dashboard → aggregate metrics from the read-only apps-script
 * getDash action. Non-destructive: it never writes to the sheet.
 *
 * Auth: bearer token OR httpOnly cookie — same as /api/admin/cities.
 */

import { createRateLimiter, timingSafeEqual } from '../_middleware.js';

const rateLimiter = createRateLimiter({ maxRequests: 20, windowMs: 15 * 60 * 1000 });

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getDash',
        _secret: process.env.INTERNAL_WEBHOOK_SECRET,
      }),
    });

    if (!response.ok) throw new Error('Apps Script dash failed');

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    console.error('[api/admin/dashboard] Error', { message: error.message });
    return res.status(500).json({ error: 'Operation failed' });
  }
}