-- Migration: Add featured creator columns
-- Adds is_featured and featured_order to users table for the "Our Top Creators" page.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT NULL;

-- Partial index for fast lookups on the public page
CREATE INDEX IF NOT EXISTS idx_users_featured
  ON public.users (featured_order ASC NULLS LAST)
  WHERE is_featured = true;

-- Public RPC: returns profile fields for featured creators, ordered by featured_order.
-- Uses SECURITY DEFINER to bypass RLS so unauthenticated visitors can access it
-- (same pattern as get_public_profile).
CREATE OR REPLACE FUNCTION get_featured_creators()
RETURNS TABLE (
  id          UUID,
  handle      TEXT,
  display_name TEXT,
  bio         TEXT,
  avatar_url  TEXT,
  social_links JSONB,
  featured_order INTEGER
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    u.id,
    u.handle,
    u.display_name,
    u.bio,
    u.avatar_url,
    u.social_links,
    u.featured_order
  FROM public.users u
  WHERE u.is_creator = true
    AND u.is_featured = true
  ORDER BY u.featured_order ASC NULLS LAST, u.display_name ASC;
$$;

-- Admin helper: counts how many creators are currently featured.
-- Used to enforce the max-8 limit in the admin UI.
CREATE OR REPLACE FUNCTION count_featured_creators()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.users
  WHERE is_featured = true;
$$;
