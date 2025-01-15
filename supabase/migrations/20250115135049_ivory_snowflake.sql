/*
  # Fix database schema issues

  1. Changes
    - Drop and recreate tables to ensure clean state
    - Fix policy issues
    - Ensure correct triggers

  2. Security
    - Enable RLS on all tables
    - Add correct policies for profiles and webinars
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS webinars CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  bio text,
  interests text[] DEFAULT '{}',
  services_offered text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create webinars table
CREATE TABLE webinars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  max_participants integer DEFAULT 100,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create webinars policies
CREATE POLICY "Published webinars are viewable by everyone"
  ON webinars FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can create webinars"
  ON webinars FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update own webinars"
  ON webinars FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webinars_updated_at ON webinars;
CREATE TRIGGER update_webinars_updated_at
  BEFORE UPDATE ON webinars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();