/*
  # Update profiles table policies

  1. Changes
    - Drop existing policies
    - Create new, more permissive policies for profile access
    - Allow users to read all profiles
    - Allow users to manage their own profile

  2. Security
    - Maintain RLS
    - Ensure users can only modify their own profile
    - Allow public reading of profiles
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new policies
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