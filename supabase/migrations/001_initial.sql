-- NestBrain Database Schema
-- Run this in Supabase SQL Editor or via CLI migrations

-- ─── Profiles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  company TEXT,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro' | 'enterprise'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Projects ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}', -- { pieces, materials, edgeBands, config, ... }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their projects"
  ON projects FOR ALL USING (auth.uid() = user_id);

-- ─── Materials Library ────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  data JSONB NOT NULL,
  UNIQUE(user_id, code)
);

CREATE INDEX idx_materials_library_user_id ON materials_library(user_id);

ALTER TABLE materials_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their materials"
  ON materials_library FOR ALL USING (auth.uid() = user_id);

-- ─── Edge Bands Library ───────────────────────────────────
CREATE TABLE IF NOT EXISTS edge_bands_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  data JSONB NOT NULL,
  UNIQUE(user_id, code)
);

CREATE INDEX idx_edge_bands_library_user_id ON edge_bands_library(user_id);

ALTER TABLE edge_bands_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their edge bands"
  ON edge_bands_library FOR ALL USING (auth.uid() = user_id);
