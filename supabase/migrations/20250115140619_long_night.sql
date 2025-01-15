/*
  # Create articles schema with proper relationships

  1. New Tables
    - `articles`
      - `id` (uuid, primary key)
      - `author_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `content` (text)
      - `category` (text)
      - `tags` (text[])
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on articles table
    - Add policies for viewing published articles
    - Add policies for authors to manage their articles
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS articles CASCADE;

-- Create articles table
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
  CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE
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
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();