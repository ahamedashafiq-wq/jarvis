-- ==============================================================================
-- PHASE 9: JARVIS ZORO EDITION — AUTOMATION CORE DATABASE SCHEMA (SUPABASE / POSTGRES)
-- ==============================================================================

-- 1. Automations Table
CREATE TABLE IF NOT EXISTS public.automations (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'DISABLED', 'ERROR')),
    trigger_type TEXT NOT NULL,
    trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    condition_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    action_config JSONB NOT NULL,
    requires_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
    notify_on_run BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    total_runs INTEGER NOT NULL DEFAULT 0,
    success_runs INTEGER NOT NULL DEFAULT 0,
    failure_runs INTEGER NOT NULL DEFAULT 0,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON public.automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_status ON public.automations(status);
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON public.automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automations_next_run ON public.automations(next_run_at) WHERE status = 'ACTIVE';

-- Enable Row Level Security (RLS)
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own automations"
    ON public.automations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Automation Execution Logs Table
CREATE TABLE IF NOT EXISTS public.automation_runs (
    id TEXT PRIMARY KEY,
    automation_id TEXT NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED', 'CANCELLED')),
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    trigger_type TEXT,
    trigger_detail TEXT,
    condition_evaluation JSONB,
    action_type TEXT,
    result_summary TEXT,
    verified BOOLEAN DEFAULT FALSE,
    error_message TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_runs_user_id ON public.automation_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON public.automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_started ON public.automation_runs(started_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own automation execution logs"
    ON public.automation_runs
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
