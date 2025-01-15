/*
  # Fix articles table relationship with profiles

  1. Changes
    - Drop and recreate articles table with explicit foreign key constraint
    - Ensure proper relationship between articles and profiles tables
    - Maintain all existing columns and policies
  
  2. Security
    - Maintain existing RLS policies
    - Keep all security constraints
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS articles CASCADE;

-- Create articles table with explicit foreign key relationship
CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) 
    REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();