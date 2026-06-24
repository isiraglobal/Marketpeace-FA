import { createRateLimiter } from './_middleware.js';

const rateLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60 * 1000 });

const FALLBACK_NODES = [
  { name: 'New York, NY', status: 'Active Node', date: 'System 01' },
  { name: 'Washington, D.C.', status: 'Pending Sync', date: 'System 02' },
  { name: 'Atlanta, GA', status: 'Planned', date: 'Expansion' },
];

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!rateLimiter.check(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
  const INTERNAL_SECRET = process.env.INTERNAL_WEBHOOK_SECRET;

  if (!GOOGLE_SCRIPT_URL) {
    return res.status(200).json(FALLBACK_NODES);
  }

  try {
    const isPost = req.method === 'POST';
    const fetchOptions = isPost
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getCities', _secret: INTERNAL_SECRET }),
        }
      : { method: 'GET', headers: {} };

    const url = isPost ? GOOGLE_SCRIPT_URL : `${GOOGLE_SCRIPT_URL}?action=getCities`;

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      return res.status(200).json(FALLBACK_NODES);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return res.status(200).json(FALLBACK_NODES);
    }

    const sanitized = data
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        name: typeof item.name === 'string' ? item.name.slice(0, 100) : '',
        status: typeof item.status === 'string' ? item.status.slice(0, 50) : '',
        date: typeof item.date === 'string' ? item.date.slice(0, 50) : '',
      }))
      .filter(item => item.name.length > 0)
      .slice(0, 50);

    return res.status(200).json(sanitized.length > 0 ? sanitized : FALLBACK_NODES);
  } catch (error) {
    console.error('[api/cities] Error fetching from Apps Script', { message: error.message });
    return res.status(200).json(FALLBACK_NODES);
  }
}
