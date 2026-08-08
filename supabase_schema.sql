-- ====================================================================
-- SKEMA DATABASE SUPABASE UNTUK APLIKASI PANTAUAN PEMENANGAN KANDIDAT
-- BBR @ SYNERGY smart system
-- ====================================================================

-- 1. Tabel Konfigurasi Kampanye
CREATE TABLE IF NOT EXISTS campaign_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT NOT NULL,
  vice_candidate_name TEXT NOT NULL,
  election_type TEXT NOT NULL,
  election_region TEXT NOT NULL,
  target_votes INT NOT NULL DEFAULT 0,
  total_dpt INT NOT NULL DEFAULT 0,
  election_date DATE,
  owner_whatsapp TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabel Pengguna / Tim Pemenangan
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'tim_pemenangan')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  phone TEXT,
  assigned_region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabel Pemilih (DPT & Target Suara)
CREATE TABLE IF NOT EXISTS voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nik VARCHAR(20) NOT NULL,
  nama TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  subdistrict TEXT NOT NULL, -- Desa / Kelurahan
  tps TEXT NOT NULL, -- e.g., TPS 01
  status TEXT NOT NULL CHECK (status IN ('pendukung', 'penolak', 'swing')),
  pic_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  pic_name TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabel Laporan Kegiatan Tim
CREATE TABLE IF NOT EXISTS activity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  progress_percent INT DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  date DATE NOT NULL,
  location TEXT NOT NULL,
  tps TEXT,
  photo_url TEXT,
  video_url TEXT,
  notes TEXT,
  created_by_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabel Kejadian Penting / Emergency Alert
CREATE TABLE IF NOT EXISTS urgent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('darurat', 'tinggi', 'sedang')),
  location TEXT NOT NULL,
  tps TEXT,
  photo_url TEXT,
  video_url TEXT,
  reported_by_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  reported_by_name TEXT NOT NULL,
  whatsapp_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Tabel Pantauan Tim Lawan / Opponent Intelligence
CREATE TABLE IF NOT EXISTS opponents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT NOT NULL,
  party TEXT,
  strength TEXT CHECK (strength IN ('tinggi', 'sedang', 'rendah')),
  estimated_votes INT DEFAULT 0,
  dominant_regions TEXT[],
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Tabel Instruksi / Komando Owner
CREATE TABLE IF NOT EXISTS owner_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_role TEXT DEFAULT 'Tim Pemenangan',
  target_region TEXT,
  sender_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexing untuk Performa Query
CREATE INDEX IF NOT EXISTS idx_voters_status ON voters(status);
CREATE INDEX IF NOT EXISTS idx_voters_subdistrict ON voters(subdistrict);
CREATE INDEX IF NOT EXISTS idx_voters_tps ON voters(tps);
CREATE INDEX IF NOT EXISTS idx_activity_reports_date ON activity_reports(date);
CREATE INDEX IF NOT EXISTS idx_urgent_events_level ON urgent_events(level);

-- Row Level Security (RLS) Policies
ALTER TABLE campaign_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE opponents ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_commands ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses Publik / Anon untuk pembacaan dan penulisan sesuai token applet
CREATE POLICY "Public Read Campaign Config" ON campaign_config FOR SELECT USING (true);
CREATE POLICY "Public All App Users" ON app_users FOR ALL USING (true);
CREATE POLICY "Public All Voters" ON voters FOR ALL USING (true);
CREATE POLICY "Public All Activity Reports" ON activity_reports FOR ALL USING (true);
CREATE POLICY "Public All Urgent Events" ON urgent_events FOR ALL USING (true);
CREATE POLICY "Public All Opponents" ON opponents FOR ALL USING (true);
CREATE POLICY "Public All Owner Commands" ON owner_commands FOR ALL USING (true);
