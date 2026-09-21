-- Migration 012: Supabase Storage Setup for Almari Images
-- Run this in your Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard)

-- 1. Ensure the storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'almari-images',
  'almari-images',
  true,
  52428800, -- 50 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Drop any previous policies on storage.objects for almari-images to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view almari images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload almari images" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload almari images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update almari images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete almari images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public bucket view" ON storage.buckets;
DROP POLICY IF EXISTS "Allow all uploads to almari-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads from almari-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to almari-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes to almari-images" ON storage.objects;

-- 3. Policy: Allow public viewing of buckets
CREATE POLICY "Allow public bucket view"
ON storage.buckets FOR SELECT
USING ( public = true );

-- 4. Policy: Allow anyone (public, authenticated, anon) to read images
CREATE POLICY "Allow all reads from almari-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'almari-images' );

-- 5. Policy: Allow anyone to upload images to almari-images bucket
CREATE POLICY "Allow all uploads to almari-images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'almari-images' );

-- 6. Policy: Allow anyone to update images in almari-images bucket
CREATE POLICY "Allow all updates to almari-images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'almari-images' );

-- 7. Policy: Allow anyone to delete images in almari-images bucket
CREATE POLICY "Allow all deletes to almari-images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'almari-images' );
