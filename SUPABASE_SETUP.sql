-- ============================================================
-- BHADRAKALI CHITS MANAGER - Supabase Setup SQL
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the single-table database store
CREATE TABLE IF NOT EXISTS bhadrakali_db (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  data        JSONB    NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Insert the initial empty row (id=1)
INSERT INTO bhadrakali_db (id, data, updated_at)
VALUES (1, '{}', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Row Level Security
ALTER TABLE bhadrakali_db ENABLE ROW LEVEL SECURITY;

-- 4. Allow anonymous reads (members can read)
CREATE POLICY "Allow anon read" ON bhadrakali_db
  FOR SELECT USING (true);

-- 5. Allow anonymous writes (admin can write via same anon key)
CREATE POLICY "Allow anon write" ON bhadrakali_db
  FOR ALL USING (true) WITH CHECK (true);

-- Done! Your database is ready.
-- Now copy your Project URL and anon key from:
-- Supabase Dashboard → Settings → API
