/**
 * SECURITY-HARDENED Stripe Checkout Utility
 *
 * Fixes applied:
 *  - HIGH-1:  generateTransactionID is no longer used client-side for anything
 *             security-sensitive. The server now generates the canonical ID.
 *             This client-side function is kept only for UI display references.
 *  - MED-5:   Forms now submit to /api/submit (server proxy) then redirect to
 *             Stripe via /api/stripe-checkout. The Google Apps Script URL is
 *             NEVER called from the browser.
 *
 * IMPORTANT: The `amount` is no longer sent from the client to /api/stripe-checkout.
 * The server determines the price from (type, tier) — see api/stripe-checkout.js.
 */

/**
 * Creates a Stripe checkout session and returns the redirect URL.
 * The server determines the canonical price — do NOT send `amount` from the client.
 *
 * @param {{ type: string, name?: string, email?: string, tier?: string }} params
 * @returns {Promise<{ url: string, transactionID: string }>}
 */
export async function fetchCheckoutSession({ type, name, email, tier }) {
  const response = await fetch('/api/stripe-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // CSRF mitigation: non-simple Content-Type prevents cross-site form submission
    },
    body: JSON.stringify({ type, name, email, tier }),
    // SECURITY: Never send credentials/cookies cross-origin
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    // SECURITY: Show user-safe message only; do not expose raw server errors
    throw new Error(data?.error || 'Unable to open checkout. Please try again.');
  }

  const data = await response.json();

  if (!data.url) {
    throw new Error('Checkout is temporarily unavailable. Please try again.');
  }

  // For free tickets the server may return a direct URL with no Stripe redirect
  return { url: data.url, transactionID: data.transactionID || '' };
}

/**
 * Submits form data through the secure server-side proxy.
 * The Google Apps Script URL is NEVER called from the browser.
 *
 * @param {Object} formData - The form payload (validated server-side too)
 * @returns {Promise<{ success: boolean }>}
 */
export async function submitForm(formData) {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Submission failed. Please try again.');
  }

  return response.json();
}
