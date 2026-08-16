-- =============================================================================
-- StockSense AI - Supabase & PostgreSQL Production Database Migration
-- Purpose: Schema provisioning for subscription entitlements & webhook idempotency
-- Database Engine: PostgreSQL 14+ / Supabase
-- =============================================================================

-- 1. User Subscriptions Table
-- Stores user tier entitlements, billing intervals, status, and duration bounds.
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    user_id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    currency TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    current_period_start TEXT NOT NULL,
    current_period_end TEXT NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    last_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Processed Webhook Events Table
-- Guarantees atomic webhook idempotency by tracking processed event identifiers.
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Query Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_provider ON public.user_subscriptions(provider);
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_time ON public.processed_webhook_events(processed_at);

-- 4. Enable Row Level Security (RLS) Best-Practice Documentation:
-- When using SUPABASE_SERVICE_ROLE_KEY from the server-side FastAPI backend,
-- service-role requests bypass RLS automatically. If client-side access is ever added,
-- enable RLS and add selective SELECT policies per auth.uid().
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (default in Supabase, explicit policy for clarity)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_subscriptions' AND policyname = 'Service role full access on user_subscriptions'
    ) THEN
        CREATE POLICY "Service role full access on user_subscriptions"
            ON public.user_subscriptions
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processed_webhook_events' AND policyname = 'Service role full access on processed_webhook_events'
    ) THEN
        CREATE POLICY "Service role full access on processed_webhook_events"
            ON public.processed_webhook_events
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
