/**
 * Supabase Client & Backend Utility Module
 * 
 * Configured for:
 * - Public form inputs (No OAuth / Zero login required)
 * - Safe client-side anonymous inserts protected by Row Level Security (RLS)
 * - Administrative / Backend transaction monitoring, audit queries, and alert resolution
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables support both Vite (import.meta.env) and Node/Next (process.env)
const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  '';

const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  '';

const SUPABASE_SERVICE_ROLE_KEY = 
  (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) ||
  '';

// Warn if keys are missing
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase] Warning: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are missing. Set them in .env.local to enable Supabase.'
  );
}

/**
 * 1. Public Client (For Browser / Forms - Uses Anon Key)
 * Row Level Security allows this client ONLY to insert submissions and transactions.
 * It cannot read or modify any existing data.
 */
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key'
);

/**
 * 2. Admin Client (For Serverless Functions / Backend API routes ONLY)
 * Never expose this client or SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export const getAdminSupabase = () => {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[Supabase] SUPABASE_SERVICE_ROLE_KEY is required for server admin operations.');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};

// ============================================================================
// FORM SUBMISSION FUNCTIONS (No OAuth Required)
// ============================================================================

/**
 * Submits any form payload directly to Supabase without requiring user authentication.
 * 
 * @param {Object} params
 * @param {string} params.type - 'Vendor', 'Attendee', 'Venue', 'Contact', 'Sponsor', etc.
 * @param {string} params.email - Submitter's email
 * @param {string} [params.fullName] - Submitter's full name
 * @param {string} [params.phone] - Submitter's phone number
 * @param {Object} [params.payload] - Dynamic form fields (business name, booth, notes, etc.)
 * @returns {Promise<{data: any, error: any}>}
 */
export async function submitForm({ type = 'General', email, fullName, phone, payload = {} }) {
  if (!email) {
    return { data: null, error: new Error('Email is required for form submission.') };
  }

  const { data, error } = await supabase
    .from('form_submissions')
    .insert([
      {
        type,
        email: email.trim().toLowerCase(),
        full_name: fullName?.trim() || null,
        phone: phone?.trim() || null,
        payload,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      }
    ])
    .select('id, created_at')
    .single();

  return { data, error };
}

// ============================================================================
// TRANSACTION & MONITORING FUNCTIONS
// ============================================================================

/**
 * Records a new transaction attempt or checkout initialization.
 * Automatically runs Supabase triggers for velocity spikes and fraud detection.
 * 
 * @param {Object} params
 * @param {string} [params.submissionId] - Optional link to form submission UUID
 * @param {string} params.payerEmail - Payer's email
 * @param {string} [params.payerName] - Payer's name
 * @param {number} params.amount - Transaction amount (e.g., 150.00)
 * @param {string} [params.currency] - Default 'USD'
 * @param {string} [params.paymentMethod] - 'stripe', 'zelle', 'venmo', etc.
 * @param {string} [params.gatewayReference] - Stripe session id or reference
 * @param {Object} [params.metadata] - Extra metadata (ticket tier, discount codes, etc.)
 */
export async function createTransaction({
  submissionId,
  payerEmail,
  payerName,
  amount,
  currency = 'USD',
  paymentMethod = 'stripe',
  gatewayReference,
  metadata = {}
}) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        submission_id: submissionId || null,
        payer_email: payerEmail.trim().toLowerCase(),
        payer_name: payerName?.trim() || null,
        amount,
        currency,
        payment_method: paymentMethod,
        gateway_reference: gatewayReference || null,
        status: 'pending',
        metadata
      }
    ])
    .select('id, status, risk_level, is_suspicious')
    .single();

  return { data, error };
}

/**
 * Server-side helper: Updates transaction status and automatically generates audit logs.
 * Must be executed in serverless / backend environment.
 */
export async function updateTransactionStatus(transactionId, newStatus, note = '') {
  const adminClient = getAdminSupabase();

  const { data, error } = await adminClient
    .from('transactions')
    .update({ status: newStatus })
    .eq('id', transactionId)
    .select();

  return { data, error };
}

/**
 * Server-side helper: Fetches active unresolved transaction monitoring alerts.
 */
export async function getActiveMonitoringAlerts() {
  const adminClient = getAdminSupabase();

  const { data, error } = await adminClient
    .from('view_active_monitoring_alerts')
    .select('*');

  return { data, error };
}

/**
 * Server-side helper: Fetches daily transaction summary and failure rate metrics.
 */
export async function getDailyTransactionMetrics() {
  const adminClient = getAdminSupabase();

  const { data, error } = await adminClient
    .from('view_daily_transaction_metrics')
    .select('*');

  return { data, error };
}

/**
 * Server-side helper: Mark an alert as resolved.
 */
export async function resolveAlert(alertId, resolvedBy = 'admin') {
  const adminClient = getAdminSupabase();

  const { data, error } = await adminClient
    .from('monitoring_alerts')
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy
    })
    .eq('id', alertId)
    .select();

  return { data, error };
}
