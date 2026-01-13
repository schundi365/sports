-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES (DROP + CREATE)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ======================
-- Players policies
-- ======================

DROP POLICY IF EXISTS "Anyone can view players" ON public.players;
CREATE POLICY "Anyone can view players"
  ON public.players FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can add players" ON public.players;
CREATE POLICY "Anyone can add players"
  ON public.players FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update players" ON public.players;
CREATE POLICY "Anyone can update players"
  ON public.players FOR UPDATE
  TO authenticated
  USING (true);

-- ======================
-- Skill ratings policies
-- ======================

DROP POLICY IF EXISTS "Anyone can view skill ratings" ON public.skill_ratings;
CREATE POLICY "Anyone can view skill ratings"
  ON public.skill_ratings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can add skill ratings" ON public.skill_ratings;
CREATE POLICY "Anyone can add skill ratings"
  ON public.skill_ratings FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update skill ratings" ON public.skill_ratings;
CREATE POLICY "Anyone can update skill ratings"
  ON public.skill_ratings FOR UPDATE
  TO authenticated
  USING (true);

-- ======================
-- Training sessions policies
-- ======================

DROP POLICY IF EXISTS "Anyone can view training sessions" ON public.training_sessions;
CREATE POLICY "Anyone can view training sessions"
  ON public.training_sessions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can add training sessions" ON public.training_sessions;
CREATE POLICY "Anyone can add training sessions"
  ON public.training_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update training sessions" ON public.training_sessions;
CREATE POLICY "Anyone can update training sessions"
  ON public.training_sessions FOR UPDATE
  TO authenticated
  USING (true);

-- ======================
-- Expenses policies
-- ======================

DROP POLICY IF EXISTS "Anyone can view expenses" ON public.expenses;
CREATE POLICY "Anyone can view expenses"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can add expenses" ON public.expenses;
CREATE POLICY "Anyone can add expenses"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update expenses" ON public.expenses;
CREATE POLICY "Anyone can update expenses"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete expenses" ON public.expenses;
CREATE POLICY "Anyone can delete expenses"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (true);

-- ======================
-- Deposits policies
-- ======================

DROP POLICY IF EXISTS "Anyone can view deposits" ON public.deposits;
CREATE POLICY "Anyone can view deposits"
  ON public.deposits FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can add deposits" ON public.deposits;
CREATE POLICY "Anyone can add deposits"
  ON public.deposits FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update deposits" ON public.deposits;
CREATE POLICY "Anyone can update deposits"
  ON public.deposits FOR UPDATE
  TO authenticated
  USING (true);

-- ======================
-- Profiles policies
-- ======================

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id);