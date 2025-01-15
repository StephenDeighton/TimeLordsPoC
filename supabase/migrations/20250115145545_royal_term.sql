/*
  # Storage Policies for Avatar Management

  1. Changes
    - Enable storage extension
    - Create avatars bucket
    - Set up comprehensive storage policies

  2. Security
    - Public read access for all avatars
    - Authenticated users can manage their own avatars
    - Users can only access their own folders
*/

-- Enable storage extension
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "extensions";

-- Ensure the avatars bucket exists and is public
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'storage.buckets table does not exist. Please ensure storage extension is properly enabled.';
END $$;

-- Remove any existing policies to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'storage.objects table does not exist. Please ensure storage extension is properly enabled.';
END $$;

-- Create comprehensive policies for avatar management
DO $$
BEGIN
  -- Public read access
  CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

  -- Authenticated users can upload to their own folder
  CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Users can update their own avatars
  CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Users can delete their own avatars
  CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'storage.objects table does not exist. Please ensure storage extension is properly enabled.';
END $$;