-- ====================================================================
-- SKRIP SQL DATABASE SUPABASE CBT ASAS KELAS 6 SD NEGERI SELOMERTO
-- Panduan:
-- 1. Buat project baru gratis di https://supabase.com
-- 2. Buka menu: SQL Editor > New Query
-- 3. Tempel seluruh skrip ini lalu klik tombol "RUN"
-- 4. Masuk ke Project Settings > Data API untuk menyalin URL & anon key
-- ====================================================================

-- 1. TABEL MATA PELAJARAN & BANK SOAL (6 JENIS ASAS)
CREATE TABLE IF NOT EXISTS cbt_exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  grade TEXT NOT NULL DEFAULT 'Kelas 6',
  school_name TEXT NOT NULL DEFAULT 'SD Negeri Selomerto',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_questions INTEGER NOT NULL DEFAULT 0,
  passing_score INTEGER NOT NULL DEFAULT 75,
  academic_year TEXT DEFAULT '2026/2027',
  semester TEXT DEFAULT 'Semester 1 (Ganjil)',
  status TEXT DEFAULT 'active',
  randomize_questions BOOLEAN DEFAULT true,
  randomize_options BOOLEAN DEFAULT true,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABEL ANGGOTA SISWA KELAS 6
CREATE TABLE IF NOT EXISTS cbt_students (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  school_name TEXT NOT NULL DEFAULT 'SD Negeri Selomerto',
  presensi_number INTEGER NOT NULL,
  grade TEXT NOT NULL DEFAULT 'Kelas 6',
  custom_password TEXT NOT NULL,
  gender TEXT DEFAULT 'L',
  registered_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABEL HASIL UJIAN SISWA & INTEGRITAS (ANTI-CURANG)
CREATE TABLE IF NOT EXISTS cbt_results (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  presensi_number INTEGER NOT NULL,
  school_name TEXT NOT NULL DEFAULT 'SD Negeri Selomerto',
  grade TEXT NOT NULL DEFAULT 'Kelas 6',
  exam_id TEXT NOT NULL,
  exam_title TEXT NOT NULL,
  score NUMERIC NOT NULL,
  total_earned_points NUMERIC NOT NULL,
  total_max_points NUMERIC NOT NULL,
  percentage NUMERIC NOT NULL,
  is_passed BOOLEAN NOT NULL,
  completed_at TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  answers JSONB DEFAULT '{}'::jsonb,
  doubtful_answers JSONB DEFAULT '{}'::jsonb,
  breakdown JSONB DEFAULT '{}'::jsonb,
  cheat_count INTEGER DEFAULT 0,
  cheat_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABEL KONFIGURASI CMS LANDING PAGE
CREATE TABLE IF NOT EXISTS cbt_config (
  id TEXT PRIMARY KEY DEFAULT 'global_config',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_config ENABLE ROW LEVEL SECURITY;

-- 6. KEBIJAKAN AKSES PUBLIK (ANON KEY UNTUK WEB GITHUB PAGES)
-- Mengizinkan aplikasi web klien membaca dan menulis data asesmen tanpa server backend khusus
DROP POLICY IF EXISTS "Akses publik cbt_exams" ON cbt_exams;
DROP POLICY IF EXISTS "Akses publik cbt_students" ON cbt_students;
DROP POLICY IF EXISTS "Akses publik cbt_results" ON cbt_results;
DROP POLICY IF EXISTS "Akses publik cbt_config" ON cbt_config;

CREATE POLICY "Akses publik cbt_exams" ON cbt_exams FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Akses publik cbt_students" ON cbt_students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Akses publik cbt_results" ON cbt_results FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Akses publik cbt_config" ON cbt_config FOR ALL TO anon USING (true) WITH CHECK (true);
