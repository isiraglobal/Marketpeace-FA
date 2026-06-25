import { createRateLimiter } from './_middleware.js';

const rateLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60 * 1000 });

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!rateLimiter.check(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
  const INTERNAL_SECRET = process.env.INTERNAL_WEBHOOK_SECRET;

  if (!GOOGLE_SCRIPT_URL) {
    return res.status(200).json([]);
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getVenues', _secret: INTERNAL_SECRET }),
    });

    if (!response.ok) {
      return res.status(200).json([]);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return res.status(200).json([]);
    }

    const sanitized = data
      .filter(v => v && typeof v === 'object')
      .map(v => ({
        timestamp: typeof v.timestamp === 'string' ? v.timestamp.slice(0, 180) : '',
        status: typeof v.status === 'string' ? v.status.slice(0, 50) : '',
        venueName: typeof v.venueName === 'string' ? v.venueName.slice(0, 150) : '',
        contactName: typeof v.contactName === 'string' ? v.contactName.slice(0, 100) : '',
        email: typeof v.email === 'string' ? v.email.slice(0, 254) : '',
        phone: typeof v.phone === 'string' ? v.phone.slice(0, 20) : '',
        location: typeof v.location === 'string' ? v.location.slice(0, 200) : '',
        city: typeof v.city === 'string' ? v.city.slice(0, 100) : '',
        capacity: typeof v.capacity === 'string' ? v.capacity.slice(0, 20) : '',
        hasParking: typeof v.hasParking === 'string' ? v.hasParking.slice(0, 10) : '',
        hasWiFi: typeof v.hasWiFi === 'string' ? v.hasWiFi.slice(0, 10) : '',
        indoorOutdoor: typeof v.indoorOutdoor === 'string' ? v.indoorOutdoor.slice(0, 20) : '',
        notes: typeof v.notes === 'string' ? v.notes.slice(0, 1000) : '',
        contractURL: typeof v.contractURL === 'string' ? v.contractURL.slice(0, 200) : '',
        eventDate: typeof v.eventDate === 'string' ? v.eventDate.slice(0, 50) : '',
        lastUpdated: typeof v.lastUpdated === 'string' ? v.lastUpdated.slice(0, 180) : '',
      }))
      .filter(v => v.venueName.length > 0);

    return res.status(200).json(sanitized);
  } catch (error) {
    console.error('[api/venues] Error fetching from Apps Script', { message: error.message });
    return res.status(200).json([]);
  }
}
