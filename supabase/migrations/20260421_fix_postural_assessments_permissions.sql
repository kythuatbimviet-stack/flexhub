-- Fix: Grant schema usage and table permissions to anon + authenticated roles
-- This resolves: error code 42501 "permission denied for schema public"

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on postural_assessments table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.postural_assessments TO authenticated;
GRANT SELECT ON TABLE public.postural_assessments TO anon;

-- Ensure sequence is accessible (for generated UUIDs if any serial columns added later)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Also grant on clients table for the JOIN query to work via anon/authenticated
GRANT SELECT ON TABLE public.clients TO authenticated, anon;
