import { createRateLimiter, timingSafeEqual } from '../_middleware.js';

const rateLimiter = createRateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!rateLimiter.check(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
  }

  const { id, password } = req.body;

  const ADMIN_ID = process.env.ADMIN_ID;
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (!ADMIN_ID || !ADMIN_PASS) {
    return res.status(500).json({ error: 'Login service not configured' });
  }

  // Use timingSafeEqual to prevent timing attacks
  const isIdValid = timingSafeEqual(id, ADMIN_ID);
  const isPassValid = timingSafeEqual(password, ADMIN_PASS);

  if (isIdValid && isPassValid) {
    // SECURITY: Use a stable token derived from internal secret
    const token = Buffer.from(`${ADMIN_ID}:${process.env.INTERNAL_WEBHOOK_SECRET}`).toString('base64');
    
    // SECURITY: Set as a secure, httpOnly, sameSite cookie
    // This prevents XSS from reading the token.
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', [
      `adminToken=${token}; Path=/; HttpOnly; ${isProd ? 'Secure;' : ''} SameSite=Strict; Max-Age=86400`
    ]);

    return res.status(200).json({ success: true, token });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
}
