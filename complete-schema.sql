-- ============================================
-- Badminton Club Tracker - Complete Database Schema
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
  category TEXT NOT NULL, -- 'Singles', 'Doubles', 'Service', 'Fitness'
  skill_name TEXT NOT NULL, -- e.g., 'Footwork', 'Smash', 'Stamina', etc.
  rating INTEGER CHECK (rating >= 0 AND rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(player_id, category, skill_name)
);

-- Training sessions data table
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  sessions_attended INTEGER DEFAULT 0,
  works_on_technique TEXT DEFAULT 'No', -- 'Yes', 'No', 'Sometimes', 'Always'
  points_scored INTEGER DEFAULT 0,
  points_conceded INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(player_id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(player_id)
);

-- Voting sessions table
CREATE TABLE IF NOT EXISTS voting_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_date DATE NOT NULL,
  session_time TIME DEFAULT '18:00:00',
  venue TEXT DEFAULT 'Regular Venue',
  cost_per_player DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  max_players INTEGER DEFAULT 8,
  description TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'closed', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(session_date)
);

-- Player votes table
CREATE TABLE IF NOT EXISTS player_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  vote_status TEXT NOT NULL DEFAULT 'yes', -- 'yes', 'no', 'maybe'
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, player_id)
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
CREATE INDEX IF NOT EXISTS idx_training_sessions_player_id ON training_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_expenses_player_id ON expenses(player_id);
CREATE INDEX IF NOT EXISTS idx_deposits_player_id ON deposits(player_id);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_date ON voting_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_player_votes_session_id ON player_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_player_votes_player_id ON player_votes(player_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Players policies
CREATE POLICY "Anyone can view players" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can add players" ON players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON players FOR UPDATE TO authenticated USING (true);

-- Skill ratings policies
CREATE POLICY "Anyone can view skill ratings" ON skill_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can add skill ratings" ON skill_ratings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update skill ratings" ON skill_ratings FOR UPDATE TO authenticated USING (true);

-- Training sessions policies
CREATE POLICY "Anyone can view training sessions" ON training_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can add training sessions" ON training_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update training sessions" ON training_sessions FOR UPDATE TO authenticated USING (true);

-- Expenses policies
CREATE POLICY "Anyone can view expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can add expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update expenses" ON expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anyone can delete expenses" ON expenses FOR DELETE TO authenticated USING (true);

-- Deposits policies
CREATE POLICY "Anyone can view deposits" ON deposits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can add deposits" ON deposits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update deposits" ON deposits FOR UPDATE TO authenticated USING (true);

-- Voting sessions policies
CREATE POLICY "Anyone can view voting sessions" ON voting_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can add voting sessions" ON voting_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update voting sessions" ON voting_sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anyone can delete voting sessions" ON voting_sessions FOR DELETE TO authenticated USING (true);

-- Player votes policies
CREATE POLICY "Anyone can view votes" ON player_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can add votes" ON player_votes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update votes" ON player_votes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anyone can delete votes" ON player_votes FOR DELETE TO authenticated USING (true);

-- Profiles policies
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

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

CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();