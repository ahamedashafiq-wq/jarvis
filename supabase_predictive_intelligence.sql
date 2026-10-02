-- ====================================================
-- PHASE 12: JARVIS PREDICTIVE INTELLIGENCE CORE
-- Table: intelligence_insights
-- ====================================================

CREATE TABLE IF NOT EXISTS public.intelligence_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_id TEXT,
    insight_type TEXT NOT NULL CHECK (
        insight_type IN (
            'DEADLINE_WATCH',
            'TASK_BACKLOG',
            'PROJECT_INACTIVITY',
            'AUTOMATION_FAILURE',
            'OBJECTIVE_BOTTLENECK',
            'WORKLOAD_CONCENTRATION',
            'FOCUS_PATTERN',
            'SYSTEM_PATTERN'
        )
    ),
    severity TEXT NOT NULL CHECK (severity IN ('INFO', 'NOTICE', 'WARNING')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    uncertainties JSONB DEFAULT '[]'::jsonb,
    data_sufficiency TEXT NOT NULL DEFAULT 'SUFFICIENT_DATA' CHECK (
        data_sufficiency IN ('SUFFICIENT_DATA', 'LIMITED_DATA', 'INSUFFICIENT_DATA')
    ),
    fingerprint TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (
        status IN ('NEW', 'SEEN', 'DISMISSED', 'RESOLVED', 'EXPIRED')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_notified_at TIMESTAMPTZ
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_insights_user_status ON public.intelligence_insights(user_id, status);
CREATE INDEX IF NOT EXISTS idx_insights_fingerprint ON public.intelligence_insights(user_id, fingerprint);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON public.intelligence_insights(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.intelligence_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access, insert, update, delete their own insights
DROP POLICY IF EXISTS "Users can only access their own intelligence insights" ON public.intelligence_insights;
CREATE POLICY "Users can only access their own intelligence insights"
    ON public.intelligence_insights
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
