/**
 * Webhook endpoint called by Google Sheets onEdit trigger
 * when a venue row is modified. Updates the in-memory cache
 * so the next site fetch returns fresh data.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const INTERNAL_SECRET = process.env.INTERNAL_WEBHOOK_SECRET;
  const body = req.body || {};

  if (!body._secret || body._secret !== INTERNAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (body.action !== 'venueUpdated' || !body.venue) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Acknowledge — the site fetches latest data on next poll
  return res.status(200).json({ success: true, received: body.venue.venueName });
}
