/*
  # Enhanced Avatar Storage Policies

  1. Changes
    - Add comprehensive storage policies for the avatars bucket
    - Enable public read access for all avatar images
    - Restrict upload/update/delete permissions to authenticated users
    - Ensure users can only manage their own avatars

  2. Security
    - Public read access for all avatars
    - Write access limited to authenticated users
    - Users can only upload to their own folder
    - Users can only update/delete their own files
*/

-- Ensure the avatars bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove any existing policies for the avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

-- Create comprehensive policies for avatar management
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );