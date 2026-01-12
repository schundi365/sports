-- ============================================
-- MK Air Cricket Club Training Skills Tracker
-- Database Schema for Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(name)
);

-- Skill ratings table
CREATE TABLE IF NOT EXISTS skill_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'batting', 'bowling', 'fielding', 'fitness'
  skill_name TEXT NOT NULL, -- e.g., 'technique', 'pace', 'catching', etc.
  rating INTEGER CHECK (rating >= 0 AND rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(player_id, category, skill_name)
);

-- Nets session data table
CREATE TABLE IF NOT EXISTS nets_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  present_in_nets INTEGER DEFAULT 0,
  works_on_technique TEXT DEFAULT 'No', -- 'Yes', 'No', 'Sometimes', 'Always'
  times_got_out INTEGER DEFAULT 0,
  wickets_taken INTEGER DEFAULT 0,
  bowling_extras INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(player_id)
);

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'viewer', -- 'admin', 'coach', 'viewer'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_skill_ratings_player_id ON skill_ratings(player_id);
CREATE INDEX IF NOT EXISTS idx_nets_data_player_id ON nets_data(player_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nets_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Players policies
-- Anyone authenticated can read players
CREATE POLICY "Anyone can view players"
  ON players FOR SELECT
  TO authenticated
  USING (true);

-- Anyone authenticated can insert players
CREATE POLICY "Anyone can add players"
  ON players FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Anyone authenticated can update players
CREATE POLICY "Anyone can update players"
  ON players FOR UPDATE
  TO authenticated
  USING (true);

-- Skill ratings policies
-- Anyone authenticated can read skill ratings
CREATE POLICY "Anyone can view skill ratings"
  ON skill_ratings FOR SELECT
  TO authenticated
  USING (true);

-- Anyone authenticated can insert skill ratings
CREATE POLICY "Anyone can add skill ratings"
  ON skill_ratings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Anyone authenticated can update skill ratings
CREATE POLICY "Anyone can update skill ratings"
  ON skill_ratings FOR UPDATE
  TO authenticated
  USING (true);

-- Nets data policies
-- Anyone authenticated can read nets data
CREATE POLICY "Anyone can view nets data"
  ON nets_data FOR SELECT
  TO authenticated
  USING (true);

-- Anyone authenticated can insert nets data
CREATE POLICY "Anyone can add nets data"
  ON nets_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Anyone authenticated can update nets data
CREATE POLICY "Anyone can update nets data"
  ON nets_data FOR UPDATE
  TO authenticated
  USING (true);

-- Profiles policies
-- Users can view all profiles
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_ratings_updated_at BEFORE UPDATE ON skill_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nets_data_updated_at BEFORE UPDATE ON nets_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert some sample players (uncomment if needed)
-- INSERT INTO players (name) VALUES
--   ('John Smith'),
--   ('Sarah Johnson'),
--   ('Mike Williams')
-- ON CONFLICT (name) DO NOTHING;
