/*
  # Create profiles and webinars tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `bio` (text)
      - `interests` (text array)
      - `services_offered` (text array)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `webinars`
      - `id` (uuid, primary key)
      - `host_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `starts_at` (timestamptz)
      - `ends_at` (timestamptz)
      - `max_participants` (integer)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Create policies for public viewing and user management
    - Set up updated_at triggers
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS webinars;
DROP TABLE IF EXISTS profiles;

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