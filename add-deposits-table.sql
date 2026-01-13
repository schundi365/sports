-- ============================================
-- Add Deposits Table to Existing Database
-- Run this if you already have the badminton club database set up
-- ============================================

-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(player_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_deposits_player_id ON deposits(player_id);

-- Enable Row Level Security
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Anyone can view deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can add deposits"
  ON deposits FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update deposits"
  ON deposits FOR UPDATE
  TO authenticated
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();