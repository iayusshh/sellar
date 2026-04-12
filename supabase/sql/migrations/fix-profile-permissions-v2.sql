-- ==========================================
-- FIX PROFILE PERMISSIONS & STORAGE (V2)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Ensure 'avatars' bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage Policies (Drop existing to ensure clean slate)
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- Allow authenticated users to upload to their own folder (user_id/filename)
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Allow public read access
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'avatars' );

-- Allow users to update/delete their own files
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

-- 3. Users Table RLS (Fix "permission denied")
-- Drop the policy we created before, and any potential conflicting ones
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Recreate with permissive check for the user's own row
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure other policies don't conflict (standard SELECT are fine)

-- 4. Grant permissions explicitly (sometimes needed for new tables/roles)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE users TO service_role;

-- 5. Debug info (optional, runs immediately)
-- You can check if this returns your user ID to verify RLS is working for you
-- SELECT auth.uid();
