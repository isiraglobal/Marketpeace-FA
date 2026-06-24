/**
 * SECURITY-HARDENED Stripe Webhook Handler
 *
 * Fixes applied:
 *  - CRIT-1: Stripe signature verification is now MANDATORY. No fallback to unverified body.
 *  - HIGH-2:  INTERNAL_WEBHOOK_SECRET sent to Apps Script for request authentication.
 *  - HIGH-4:  Only generic errors returned to client; full details logged server-side.
 *  - MED-7:   PII not logged; transaction IDs partially redacted in logs.
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// SECURITY: Apps Script URL must be in environment — never hardcoded or in frontend
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.warn('[stripe-webhook] Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing signature header' });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook misconfigured' });
  }

  let event;

  try {
    const body = await bufferRequest(req);
    // SECURITY: MANDATORY signature verification. No fallback, no catch-and-continue.
    // If this throws, the request is forged or tampered with.
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // SECURITY: Return 400, do NOT process this event. Log without exposing internals.
    console.warn('[stripe-webhook] Signature verification failed. Request rejected.', {
      error: err.message,
    });
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Process only the events we care about
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { type, transactionID } = session.metadata || {};

    // Basic validation of metadata
    if (!type || !transactionID) {
      console.error('[stripe-webhook] Missing metadata on completed session', { sessionId: session.id });
      return res.status(200).json({ received: true }); // Return 200 so Stripe doesn't retry
    }

    // SECURITY: Only call Apps Script if URL is configured
    if (!GOOGLE_SCRIPT_URL) {
      console.error('[stripe-webhook] GOOGLE_SCRIPT_URL not configured');
    } else {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // SECURITY: Shared secret for Apps Script to verify this request is legitimate
            'Authorization': `Bearer ${process.env.INTERNAL_WEBHOOK_SECRET}`,
          },
          body: JSON.stringify({
            action: 'updateStatus',
            type: type,
            transactionID: transactionID,
            status: 'Paid',
            receiptURL: session.receipt_url || '',
          }),
        });

        if (!response.ok) {
          // Log failure but don't expose details to Stripe's retry mechanism
          console.error('[stripe-webhook] Apps Script update failed', { status: response.status });
        } else {
          // SECURITY: Log minimal info — no PII, partial TID only
          console.log('[stripe-webhook] Payment status updated', {
            tidPrefix: transactionID.slice(0, 8) + '***',
            type,
          });
        }
      } catch (error) {
        console.error('[stripe-webhook] Error calling Apps Script', { message: error.message });
      }
    }
  }

  // Always return 200 to acknowledge receipt to Stripe
  return res.status(200).json({ received: true });
}

// Helper to buffer the raw request body (required for Stripe signature verification)
async function bufferRequest(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// SECURITY: Must disable body parser so we receive raw bytes for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
