-- ==========================================
-- FIX PROFILE PERMISSIONS & STORAGE
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create 'avatars' bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload their own avatar
-- (Folder name must match user ID)
create policy "Authenticated users can upload avatars"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

-- 3. Allow public read access for avatars
create policy "Public read access for avatars"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );

-- 4. Allow users to update/delete their own avatars
create policy "Users can update own avatars"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

create policy "Users can delete own avatars"
on storage.objects for delete
to authenticated
using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

-- 5. Fix RLS on users table
-- The previous policy blocked admins/owners from updating their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Grant usage on public schema to anon/authenticated (just in case)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
