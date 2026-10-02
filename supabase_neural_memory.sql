-- ==============================================================================
-- PHASE 11: JARVIS ZORO EDITION — NEURAL MEMORY & KNOWLEDGE GRAPH SCHEMA
-- ==============================================================================

-- 1. Knowledge Entities Table
CREATE TABLE IF NOT EXISTS public.knowledge_entities (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (
        entity_type IN (
            'PERSON',
            'PROJECT',
            'MISSION',
            'OBJECTIVE',
            'TASK',
            'CONCEPT',
            'DOCUMENT',
            'CONVERSATION',
            'MEMORY',
            'VISION_ANALYSIS',
            'GOAL',
            'DEADLINE',
            'DECISION',
            'PREFERENCE',
            'OTHER'
        )
    ),
    name TEXT NOT NULL,
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance & rapid graph lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_user_id ON public.knowledge_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_type ON public.knowledge_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_name ON public.knowledge_entities(name);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_user_type ON public.knowledge_entities(user_id, entity_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.knowledge_entities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own knowledge entities"
    ON public.knowledge_entities
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Knowledge Relationships Table
CREATE TABLE IF NOT EXISTS public.knowledge_relationships (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_entity_id TEXT NOT NULL REFERENCES public.knowledge_entities(id) ON DELETE CASCADE,
    target_entity_id TEXT NOT NULL REFERENCES public.knowledge_entities(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_relationship UNIQUE (user_id, source_entity_id, target_entity_id, relationship_type)
);

-- Indexes for bidirectional graph traversal
CREATE INDEX IF NOT EXISTS idx_knowledge_rel_user_id ON public.knowledge_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_rel_source ON public.knowledge_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_rel_target ON public.knowledge_relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_rel_type ON public.knowledge_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_rel_traverse ON public.knowledge_relationships(user_id, source_entity_id, target_entity_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.knowledge_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own knowledge relationships"
    ON public.knowledge_relationships
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Structured Decision Memory Table
CREATE TABLE IF NOT EXISTS public.knowledge_decisions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    decision TEXT NOT NULL,
    context TEXT,
    project_name TEXT,
    project_entity_id TEXT,
    source TEXT NOT NULL DEFAULT 'USER_SAVED',
    quality TEXT NOT NULL DEFAULT 'EXPLICITLY_SAVED',
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUPERSEDED', 'REVERTED')),
    superseded_by TEXT,
    supersedes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_decisions_user ON public.knowledge_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_decisions_project ON public.knowledge_decisions(project_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_decisions_status ON public.knowledge_decisions(status);

ALTER TABLE public.knowledge_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own decisions"
    ON public.knowledge_decisions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

