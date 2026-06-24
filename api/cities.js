/**
 * Cities/Nodes data proxy endpoint.
 *
 * SECURITY (MED-5): The Google Apps Script URL is server-side only.
 * The browser calls /api/cities and never knows the script URL.
 *
 * This endpoint fetches city/node data from the Apps Script and returns it.
 * Falls back to static data if the script is unavailable.
 */

import { createRateLimiter } from './_middleware.js';

const rateLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60 * 1000 });

// Static fallback if the Apps Script is unavailable
const FALLBACK_NODES = [
  { name: 'New York, NY', status: 'Active Node', date: 'System 01' },
  { name: 'Washington, D.C.', status: 'Pending Sync', date: 'System 02' },
  { name: 'Atlanta, GA', status: 'Planned', date: 'Expansion' },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!rateLimiter.check(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

  if (!GOOGLE_SCRIPT_URL) {
    // Return fallback data without error
    return res.status(200).json(FALLBACK_NODES);
  }

  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getCities`, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_WEBHOOK_SECRET}`,
      },
    });

    if (!response.ok) {
      return res.status(200).json(FALLBACK_NODES);
    }

    const data = await response.json();

    // Validate response is an array
    if (!Array.isArray(data)) {
      return res.status(200).json(FALLBACK_NODES);
    }

    // Sanitize returned data — only allow expected fields with string values
    const sanitized = data
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        name: typeof item.name === 'string' ? item.name.slice(0, 100) : '',
        status: typeof item.status === 'string' ? item.status.slice(0, 50) : '',
        date: typeof item.date === 'string' ? item.date.slice(0, 50) : '',
      }))
      .filter(item => item.name.length > 0)
      .slice(0, 50); // Cap at 50 cities

    return res.status(200).json(sanitized.length > 0 ? sanitized : FALLBACK_NODES);
  } catch (error) {
    console.error('[api/cities] Error fetching from Apps Script', { message: error.message });
    return res.status(200).json(FALLBACK_NODES);
  }
}
