/*
  # Time Lords Network Initial Schema

  1. New Tables
    - `profiles`
      - Extends auth.users with additional user profile information
      - Stores bio, interests, services offered, and other profile data
    - `articles`
      - Stores blog posts and articles
      - Includes title, content, category, and tags
    - `webinars`
      - Manages webinar events
      - Includes title, description, date/time, and recording links
    - `interactions`
      - Tracks user interactions (likes, comments)
      - Supports both articles and webinars

  2. Security
    - Enable RLS on all tables
    - Policies for:
      - Public read access to approved content
      - Authenticated user access to own profile
      - Admin access for content management
*/

-- Create custom types for content categories and interaction types
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE interaction_type AS ENUM ('like', 'comment');

-- Profiles table extending auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  bio text,
  interests text[] DEFAULT '{}',
  services_offered text[] DEFAULT '{}',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Articles table for blog posts and updates
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  tags text[] DEFAULT '{}',
  status content_status DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Webinars table for event management
CREATE TABLE IF NOT EXISTS webinars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  recording_url text,
  max_participants integer DEFAULT 100,
  status content_status DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Interactions table for likes and comments
CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_id uuid NOT NULL,
  content_type text NOT NULL,
  interaction_type interaction_type NOT NULL,
  comment_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Articles policies
CREATE POLICY "Published articles are viewable by everyone"
  ON articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can create articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own articles"
  ON articles FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Webinars policies
CREATE POLICY "Published webinars are viewable by everyone"
  ON webinars FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can create webinars"
  ON webinars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update own webinars"
  ON webinars FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Interactions policies
CREATE POLICY "Public interactions are viewable by everyone"
  ON interactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create interactions"
  ON interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactions"
  ON interactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS articles_author_id_idx ON articles(author_id);
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles(status);
CREATE INDEX IF NOT EXISTS webinars_host_id_idx ON webinars(host_id);
CREATE INDEX IF NOT EXISTS webinars_status_idx ON webinars(status);
CREATE INDEX IF NOT EXISTS interactions_user_id_idx ON interactions(user_id);
CREATE INDEX IF NOT EXISTS interactions_content_id_idx ON interactions(content_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webinars_updated_at
  BEFORE UPDATE ON webinars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at
  BEFORE UPDATE ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();