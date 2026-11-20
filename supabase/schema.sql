-- ==============================================================================
-- SUPABASE BACKEND SCHEMA: Form Inputs & Transaction Monitoring (No OAuth Required)
-- ==============================================================================
-- Description:
--   Complete SQL schema for public/anonymous form submissions, payment
--   transactions, automated audit logging, risk monitoring, and alert triggers.
-- How to apply:
--   1. Open your Supabase Project Dashboard -> SQL Editor
--   2. Paste this entire file and click "Run"
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
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

-- 3. TABLE: form_submissions (Captures raw public form inputs)
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    
    -- Submitter Information (No OAuth needed)
    type submission_type NOT NULL DEFAULT 'General',
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    
    -- Flexible Form Payload
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Metadata & Security Context
    ip_address TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'new' -- 'new', 'processed', 'archived', 'spam'
);

-- Indexing for fast search & filtering
CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON public.form_submissions(email);
CREATE INDEX IF NOT EXISTS idx_form_submissions_type ON public.form_submissions(type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON public.form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_payload ON public.form_submissions USING gin(payload);

-- 4. TABLE: transactions (Tracks payments, orders, and financial entries)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    
    -- Relationship to form submission (optional)
    submission_id UUID REFERENCES public.form_submissions(id) ON DELETE SET NULL,
    
    -- Payer identification
    payer_email TEXT NOT NULL,
    payer_name TEXT,
    
    -- Financial details
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method TEXT NOT NULL DEFAULT 'stripe', -- 'stripe', 'zelle', 'venmo', 'cashapp', 'manual'
    
    -- External Reference (Stripe Session ID, Charge ID, PayPal ID, etc.)
    gateway_reference TEXT UNIQUE,
    
    -- State & Monitoring Fields
    status transaction_status NOT NULL DEFAULT 'pending',
    risk_level risk_level NOT NULL DEFAULT 'low',
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    risk_reason TEXT,
    
    -- Custom Metadata (tier, ticket quantity, discount codes, etc.)
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_payer_email ON public.transactions(payer_email);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_risk_level ON public.transactions(risk_level);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_ref ON public.transactions(gateway_reference);

-- 5. TABLE: transaction_audit_logs (Immutable audit trail for monitoring)
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

-- 6. TABLE: monitoring_alerts (Automated security, fraud, and anomaly alerts)
CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- 'HIGH_VALUE', 'VELOCITY_LIMIT', 'REPEATED_FAILURES', 'STATUS_DISCREPANCY'
    severity alert_severity NOT NULL DEFAULT 'warning',
    message TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON public.monitoring_alerts(is_resolved) WHERE NOT is_resolved;
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.monitoring_alerts(created_at DESC);

-- ==============================================================================
-- 7. AUTOMATED TRIGGERS & BUSINESS LOGIC
-- ==============================================================================

-- Helper: Auto-update `updated_at` column
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

-- Trigger Function: Audit Log on Transaction Status Change
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
            'Status transition triggered automatically'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_log_transaction_status
AFTER UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.log_transaction_status_change();

-- Trigger Function: Transaction Monitoring & Fraud Detection Engine
CREATE OR REPLACE FUNCTION public.monitor_transaction_rules()
RETURNS TRIGGER AS $$
DECLARE
    recent_failure_count INT;
    recent_velocity_count INT;
BEGIN
    -- RULE 1: High-value transaction threshold flag (> $1000)
    IF NEW.amount >= 1000.00 THEN
        NEW.is_suspicious := true;
        NEW.risk_level := 'high';
        NEW.risk_reason := coalesce(NEW.risk_reason || '; ', '') || 'High transaction amount (> $1,000)';

        INSERT INTO public.monitoring_alerts (
            transaction_id,
            alert_type,
            severity,
            message,
            details
        ) VALUES (
            NEW.id,
            'HIGH_VALUE',
            'warning',
            format('Transaction %s exceeds $1000 limit (Amount: $%s)', NEW.id, NEW.amount),
            jsonb_build_object('amount', NEW.amount, 'email', NEW.payer_email)
        );
    END IF;

    -- RULE 2: Velocity Check - More than 3 transactions from same email in past 10 minutes
    SELECT COUNT(*) INTO recent_velocity_count
    FROM public.transactions
    WHERE payer_email = NEW.payer_email
      AND created_at > (timezone('utc', now()) - INTERVAL '10 minutes')
      AND id <> NEW.id;

    IF recent_velocity_count >= 3 THEN
        NEW.is_suspicious := true;
        NEW.risk_level := 'critical';
        NEW.risk_reason := coalesce(NEW.risk_reason || '; ', '') || 'Velocity spike: >3 transactions in 10 minutes';

        INSERT INTO public.monitoring_alerts (
            transaction_id,
            alert_type,
            severity,
            message,
            details
        ) VALUES (
            NEW.id,
            'VELOCITY_LIMIT',
            'critical',
            format('Payer %s attempted %s transactions within 10 minutes', NEW.payer_email, recent_velocity_count + 1),
            jsonb_build_object('payer_email', NEW.payer_email, 'velocity_count', recent_velocity_count + 1)
        );
    END IF;

    -- RULE 3: Repeated failures from same email/IP in last 1 hour
    IF NEW.status = 'failed' THEN
        SELECT COUNT(*) INTO recent_failure_count
        FROM public.transactions
        WHERE payer_email = NEW.payer_email
          AND status = 'failed'
          AND created_at > (timezone('utc', now()) - INTERVAL '1 hour');

        IF recent_failure_count >= 2 THEN
            INSERT INTO public.monitoring_alerts (
                transaction_id,
                alert_type,
                severity,
                message,
                details
            ) VALUES (
                NEW.id,
                'REPEATED_FAILURES',
                'high',
                format('Payer %s has %s failed transactions in the last hour', NEW.payer_email, recent_failure_count + 1),
                jsonb_build_object('payer_email', NEW.payer_email, 'failures', recent_failure_count + 1)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_monitor_transaction
BEFORE INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.monitor_transaction_rules();

-- ==============================================================================
-- 8. MONITORING DASHBOARD VIEWS
-- ==============================================================================

-- Daily Transaction Health & Monitoring Summary
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

-- Active Unresolved Alerts with Context
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

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ==============================================================================
-- No OAuth scenario:
--  - Public/Anon users can INSERT form inputs and initiate transactions (Write-Only).
--  - Public/Anon CANNOT read, edit, or delete any data (Prevents data scraping).
--  - Backend (via SUPABASE_SERVICE_ROLE_KEY) has unrestricted access to manage, 
--    process, and monitor transactions.

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Form Submissions Policies
CREATE POLICY "Anon can insert submissions" 
    ON public.form_submissions 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

-- Transactions Policies
CREATE POLICY "Anon can insert transactions" 
    ON public.transactions 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

-- Deny public reading by default (empty select policy for anon)
-- Service Role automatically bypasses RLS and can perform all operations.
