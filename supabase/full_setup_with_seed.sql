-- ==============================================================================
-- SUPABASE COMPLETE BACKEND SETUP & SEED DATA (ALL-IN-ONE)
-- ==============================================================================
-- Includes:
--   1. Extensions & Custom Types
--   2. Tables: form_submissions, transactions, transaction_audit_logs, monitoring_alerts
--   3. Triggers: Auto updated_at, Audit trail logging, Real-time Fraud/Velocity rules
--   4. Views: Daily Monitoring Metrics, Active Unresolved Alerts
--   5. Row Level Security (RLS) configured for No-OAuth Form Submissions
--   6. Comprehensive Seed Data across all tables
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE submission_type AS ENUM (
        'Vendor', 'Attendee', 'Venue', 'Contact', 'Visitor', 
        'Newsletter', 'CityRequest', 'Staff', 'Sponsor', 'Promoter', 'General'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM (
        'pending', 'processing', 'completed', 'failed', 'refunded', 'disputed', 'flagged'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Form Submissions Table (Public inputs, No OAuth required)
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    type submission_type NOT NULL DEFAULT 'General',
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'new' -- 'new', 'processed', 'archived', 'spam'
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON public.form_submissions(email);
CREATE INDEX IF NOT EXISTS idx_form_submissions_type ON public.form_submissions(type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON public.form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_payload ON public.form_submissions USING gin(payload);

-- Transactions Table (Financial records & monitoring status)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    submission_id UUID REFERENCES public.form_submissions(id) ON DELETE SET NULL,
    payer_email TEXT NOT NULL,
    payer_name TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method TEXT NOT NULL DEFAULT 'stripe',
    gateway_reference TEXT UNIQUE,
    status transaction_status NOT NULL DEFAULT 'pending',
    risk_level risk_level NOT NULL DEFAULT 'low',
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    risk_reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_payer_email ON public.transactions(payer_email);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_risk_level ON public.transactions(risk_level);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_ref ON public.transactions(gateway_reference);

-- Audit Logs Table (State transitions and event history)
CREATE TABLE IF NOT EXISTS public.transaction_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    previous_status transaction_status,
    new_status transaction_status NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    changed_by TEXT DEFAULT 'system',
    note TEXT,
    context JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_transaction_id ON public.transaction_audit_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON public.transaction_audit_logs(changed_at DESC);

-- Monitoring Alerts Table (Flagged high risk, velocity spikes, repeated failures)
CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    severity alert_severity NOT NULL DEFAULT 'warning',
    message TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON public.monitoring_alerts(is_resolved) WHERE NOT is_resolved;
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.monitoring_alerts(created_at DESC);

-- 4. TRIGGERS & BUSINESS LOGIC

-- Timestamp helper
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_form_submissions_updated_at
BEFORE UPDATE ON public.form_submissions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Status Transition Audit Trigger
CREATE OR REPLACE FUNCTION public.log_transaction_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.transaction_audit_logs (
            transaction_id,
            previous_status,
            new_status,
            changed_by,
            note
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            current_user,
            'Status transition recorded automatically'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_log_transaction_status
AFTER UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.log_transaction_status_change();

-- Risk Monitoring Engine Trigger
CREATE OR REPLACE FUNCTION public.monitor_transaction_rules()
RETURNS TRIGGER AS $$
DECLARE
    recent_velocity_count INT;
BEGIN
    -- Rule 1: High Transaction Value (>= $1000)
    IF NEW.amount >= 1000.00 THEN
        NEW.is_suspicious := true;
        NEW.risk_level := 'high';
        NEW.risk_reason := coalesce(NEW.risk_reason || '; ', '') || 'High transaction amount (> $1,000)';

        INSERT INTO public.monitoring_alerts (
            transaction_id, alert_type, severity, message, details
        ) VALUES (
            NEW.id, 'HIGH_VALUE', 'warning',
            format('Transaction %s exceeds $1,000 threshold (Amount: $%s)', NEW.id, NEW.amount),
            jsonb_build_object('amount', NEW.amount, 'email', NEW.payer_email)
        );
    END IF;

    -- Rule 2: Velocity Check (More than 3 transactions in 10 minutes)
    SELECT COUNT(*) INTO recent_velocity_count
    FROM public.transactions
    WHERE payer_email = NEW.payer_email
      AND created_at > (timezone('utc', now()) - INTERVAL '10 minutes')
      AND id <> NEW.id;

    IF recent_velocity_count >= 3 THEN
        NEW.is_suspicious := true;
        NEW.risk_level := 'critical';
        NEW.risk_reason := coalesce(NEW.risk_reason || '; ', '') || 'Velocity spike detected';

        INSERT INTO public.monitoring_alerts (
            transaction_id, alert_type, severity, message, details
        ) VALUES (
            NEW.id, 'VELOCITY_LIMIT', 'critical',
            format('Payer %s attempted %s transactions within 10 minutes', NEW.payer_email, recent_velocity_count + 1),
            jsonb_build_object('payer_email', NEW.payer_email, 'attempts', recent_velocity_count + 1)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_monitor_transaction
BEFORE INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.monitor_transaction_rules();

-- 5. MONITORING VIEWS

CREATE OR REPLACE VIEW public.view_daily_transaction_metrics AS
SELECT 
    date_trunc('day', created_at) AS report_date,
    count(*) AS total_transactions,
    count(*) FILTER (WHERE status = 'completed') AS successful_count,
    count(*) FILTER (WHERE status = 'failed') AS failed_count,
    count(*) FILTER (WHERE is_suspicious) AS suspicious_count,
    coalesce(sum(amount) FILTER (WHERE status = 'completed'), 0) AS total_revenue,
    round(avg(amount) FILTER (WHERE status = 'completed'), 2) AS avg_ticket_size,
    round(
        (count(*) FILTER (WHERE status = 'failed')::numeric / nullif(count(*), 0)::numeric) * 100, 
        2
    ) AS failure_rate_percentage
FROM public.transactions
GROUP BY date_trunc('day', created_at)
ORDER BY report_date DESC;

CREATE OR REPLACE VIEW public.view_active_monitoring_alerts AS
SELECT 
    a.id AS alert_id,
    a.created_at,
    a.alert_type,
    a.severity,
    a.message,
    a.details,
    t.id AS transaction_id,
    t.payer_email,
    t.amount,
    t.currency,
    t.status AS transaction_status,
    t.risk_level,
    t.risk_reason
FROM public.monitoring_alerts a
LEFT JOIN public.transactions t ON a.transaction_id = t.id
WHERE NOT a.is_resolved
ORDER BY a.created_at DESC;

-- 6. ROW LEVEL SECURITY (RLS) FOR NO-OAUTH
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can insert submissions" ON public.form_submissions;
CREATE POLICY "Anon can insert submissions" 
    ON public.form_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can insert transactions" ON public.transactions;
CREATE POLICY "Anon can insert transactions" 
    ON public.transactions FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ==============================================================================
-- 7. COMPLETE SAMPLE SEED DATA
-- ==============================================================================

-- Seed: Form Submissions
INSERT INTO public.form_submissions (id, type, email, full_name, phone, payload, ip_address, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Vendor', 'alice.artisan@example.com', 'Alice Smith', '+1-555-0101', 
   '{"business_name": "Alice Handmade Crafts", "city": "New York", "booth_size": "10x10", "tier": "Standard"}'::jsonb, 
   '192.168.1.101', 'processed'),
  ('22222222-2222-2222-2222-222222222222', 'Attendee', 'bob.collector@example.com', 'Bob Johnson', '+1-555-0102', 
   '{"ticket_type": "VIP-EarlyAccess", "tickets_count": 2, "newsletter_opt_in": true}'::jsonb, 
   '192.168.1.102', 'processed'),
  ('33333333-3333-3333-3333-333333333333', 'Sponsor', 'carol.corp@sponsorbrand.io', 'Carol Williams', '+1-555-0103', 
   '{"company": "Apex Dynamics Inc", "tier": "Headline", "budget_allocated": 5000}'::jsonb, 
   '192.168.1.103', 'new'),
  ('44444444-4444-4444-4444-444444444444', 'Contact', 'david.inquiry@gmail.com', 'David Miller', '+1-555-0104', 
   '{"subject": "Venue inquiries for 2027", "message": "Can we reserve spaces for next summer?"}'::jsonb, 
   '192.168.1.104', 'new')
ON CONFLICT (id) DO NOTHING;

-- Seed: Normal, High-Value, and Suspicious Transactions
INSERT INTO public.transactions (id, submission_id, payer_email, payer_name, amount, currency, payment_method, gateway_reference, status, risk_level, is_suspicious, risk_reason, metadata, ip_address)
VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'alice.artisan@example.com', 'Alice Smith', 150.00, 'USD', 'stripe', 'cs_test_normal_001', 'completed', 'low', false, NULL, '{"tier": "Standard Booth"}'::jsonb, '192.168.1.101'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'bob.collector@example.com', 'Bob Johnson', 75.00, 'USD', 'stripe', 'cs_test_normal_002', 'completed', 'low', false, NULL, '{"tickets": 2}'::jsonb, '192.168.1.102'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'carol.corp@sponsorbrand.io', 'Carol Williams', 2500.00, 'USD', 'stripe', 'cs_test_highvalue_003', 'processing', 'high', true, 'High transaction amount (> $1,000)', '{"package": "Headline Sponsor"}'::jsonb, '192.168.1.103'),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'suspicious.actor@burnermail.org', 'Unknown Spammer', 499.00, 'USD', 'stripe', 'cs_test_failed_004', 'failed', 'medium', true, 'Payment processor declined card; multiple attempts', '{"error_code": "card_declined"}'::jsonb, '45.134.20.12')
ON CONFLICT (id) DO NOTHING;

-- Seed: Audit Logs
INSERT INTO public.transaction_audit_logs (transaction_id, previous_status, new_status, changed_by, note)
VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pending', 'processing', 'stripe_webhook', 'Stripe checkout.session.created received'),
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'processing', 'completed', 'stripe_webhook', 'Stripe checkout.session.completed confirmed'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pending', 'completed', 'stripe_webhook', 'Instant checkout confirmation'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pending', 'processing', 'system', 'Awaiting wire / large amount authorization'),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pending', 'failed', 'stripe_webhook', 'Card declined by issuing bank')
ON CONFLICT DO NOTHING;

-- Seed: Active Monitoring Alerts
INSERT INTO public.monitoring_alerts (id, transaction_id, alert_type, severity, message, details, is_resolved)
VALUES
  ('b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'HIGH_VALUE', 'warning', 'Transaction aaaaaaa3 exceeds $1,000 threshold (Amount: $2500.00)', '{"amount": 2500.00, "email": "carol.corp@sponsorbrand.io"}'::jsonb, false),
  ('b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SUSPICIOUS_PAYER', 'high', 'Declined card attempt from unrecognized IP 45.134.20.12', '{"ip": "45.134.20.12", "email": "suspicious.actor@burnermail.org"}'::jsonb, false)
ON CONFLICT (id) DO NOTHING;
