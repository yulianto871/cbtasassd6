import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ExamSubject, StudentMember, ExamResult, LandingPageConfig } from '../types/cbt';

const STORAGE_KEYS = {
  URL: 'cbt_supabase_url',
  ANON_KEY: 'cbt_supabase_anon_key',
};

// Retrieve config from localStorage or Vite environment variables
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const localUrl = localStorage.getItem(STORAGE_KEYS.URL);
  const localKey = localStorage.getItem(STORAGE_KEYS.ANON_KEY);

  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  return {
    url: localUrl?.trim() || envUrl,
    anonKey: localKey?.trim() || envKey,
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (url) localStorage.setItem(STORAGE_KEYS.URL, url.trim());
  else localStorage.removeItem(STORAGE_KEYS.URL);

  if (anonKey) localStorage.setItem(STORAGE_KEYS.ANON_KEY, anonKey.trim());
  else localStorage.removeItem(STORAGE_KEYS.ANON_KEY);

  // Re-instantiate client
  cachedClient = null;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && url.startsWith('http') && anonKey && anonKey.length > 20);
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || !url.startsWith('http')) return null;

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Gagal menginisialisasi Supabase client:', err);
    return null;
  }
}

// ==========================================
// CONNECTION TEST
// ==========================================
export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string; tableCount?: number }> {
  const url = customUrl || getSupabaseCredentials().url;
  const key = customKey || getSupabaseCredentials().anonKey;

  if (!url || !key) {
    return {
      success: false,
      message: 'URL Project Supabase dan Anon Key wajib diisi!',
    };
  }

  try {
    const testClient = createClient(url, key, {
      auth: { persistSession: false },
    });

    // Check query on cbt_exams or system health
    const { data, error } = await testClient.from('cbt_exams').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message:
            'Terkoneksi ke Supabase, namun tabel belum dibuat! Silakan buka menu SQL Editor di Supabase dan jalankan script SQL di bawah.',
        };
      }
      return {
        success: false,
        message: `Koneksi gagal: ${error.message} (Kode: ${error.code})`,
      };
    }

    return {
      success: true,
      message: 'Koneksi ke database Supabase berhasil! Sistem siap online di semua perangkat.',
      tableCount: data ? data.length : 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal terhubung ke Supabase: ${err.message || 'Periksa kembali URL dan Anon Key'}`,
    };
  }
}

// ==========================================
// EXAMS (MATA PELAJARAN & SOAL)
// ==========================================
export async function fetchExamsFromSupabase(): Promise<ExamSubject[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('cbt_exams')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      subjectCode: item.subject_code,
      grade: item.grade || 'Kelas 6',
      schoolName: item.school_name || 'SD Negeri Selomerto',
      durationMinutes: item.duration_minutes || 60,
      totalQuestions: item.total_questions || (item.questions ? item.questions.length : 0),
      passingScore: item.passing_score || 75,
      academicYear: item.academic_year || '2026/2027',
      semester: item.semester || 'Semester 1 (Ganjil)',
      status: item.status || 'active',
      isReleased: item.status === 'active',
      randomizeQuestions: item.randomize_questions !== false,
      randomizeOptions: item.randomize_options !== false,
      questions: item.questions || [],
    }));
  } catch (err) {
    console.error('Gagal mengambil data soal dari Supabase:', err);
    return null;
  }
}

export async function upsertExamToSupabase(exam: ExamSubject): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: exam.id,
      title: exam.title,
      subject_code: exam.subjectCode,
      grade: exam.grade,
      school_name: exam.schoolName,
      duration_minutes: exam.durationMinutes,
      total_questions: exam.questions.length,
      passing_score: exam.passingScore,
      academic_year: exam.academicYear,
      semester: exam.semester,
      status: exam.status,
      randomize_questions: exam.randomizeQuestions !== false,
      randomize_options: exam.randomizeOptions !== false,
      questions: exam.questions,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('cbt_exams').upsert(row);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Gagal menyimpan soal ke Supabase:', err);
    return false;
  }
}

export async function deleteExamFromSupabase(examId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('cbt_exams').delete().eq('id', examId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Gagal menghapus soal dari Supabase:', err);
    return false;
  }
}

// ==========================================
// STUDENTS (ANGGOTA SISWA)
// ==========================================
export async function fetchStudentsFromSupabase(): Promise<StudentMember[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('cbt_students')
      .select('*')
      .order('presensi_number', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data.map((item: any) => ({
      id: item.id,
      fullName: item.full_name,
      schoolName: item.school_name || 'SD Negeri Selomerto',
      presensiNumber: item.presensi_number,
      grade: item.grade || 'Kelas 6',
      customPassword: item.custom_password,
      gender: item.gender || 'L',
      registeredAt: item.registered_at || new Date().toISOString().slice(0, 10),
    }));
  } catch (err) {
    console.error('Gagal mengambil data siswa dari Supabase:', err);
    return null;
  }
}

export async function upsertStudentToSupabase(student: StudentMember): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: student.id,
      full_name: student.fullName,
      school_name: student.schoolName,
      presensi_number: student.presensiNumber,
      grade: student.grade,
      custom_password: student.customPassword,
      gender: student.gender || 'L',
      registered_at: student.registeredAt,
    };

    const { error } = await client.from('cbt_students').upsert(row);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Gagal menyimpan siswa ke Supabase:', err);
    return false;
  }
}

export async function deleteStudentFromSupabase(studentId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('cbt_students').delete().eq('id', studentId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Gagal menghapus siswa dari Supabase:', err);
    return false;
  }
}

// ==========================================
// RESULTS (NILAI & MONITORING UJIAN)
// ==========================================
export async function fetchResultsFromSupabase(): Promise<ExamResult[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('cbt_results')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) throw error;
    if (!data) return null;

    return data.map((item: any) => ({
      id: item.id,
      studentId: item.student_id,
      studentName: item.student_name,
      presensiNumber: item.presensi_number,
      schoolName: item.school_name,
      grade: item.grade,
      examId: item.exam_id,
      examTitle: item.exam_title,
      score: Number(item.score),
      totalEarnedPoints: Number(item.total_earned_points),
      totalMaxPoints: Number(item.total_max_points),
      percentage: Number(item.percentage),
      isPassed: Boolean(item.is_passed),
      completedAt: item.completed_at,
      durationSeconds: Number(item.duration_seconds),
      answers: item.answers || {},
      doubtfulAnswers: item.doubtful_answers || {},
      breakdown: item.breakdown || {},
      cheatCount: item.cheat_count || 0,
      cheatLog: item.cheat_log || [],
    }));
  } catch (err) {
    console.error('Gagal mengambil data hasil ujian dari Supabase:', err);
    return null;
  }
}

export async function insertResultToSupabase(result: ExamResult): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: result.id,
      student_id: result.studentId,
      student_name: result.studentName,
      presensi_number: result.presensiNumber,
      school_name: result.schoolName,
      grade: result.grade,
      exam_id: result.examId,
      exam_title: result.examTitle,
      score: result.score,
      total_earned_points: result.totalEarnedPoints,
      total_max_points: result.totalMaxPoints,
      percentage: result.percentage,
      is_passed: result.isPassed,
      completed_at: result.completedAt,
      duration_seconds: result.durationSeconds,
      answers: result.answers || {},
      doubtful_answers: result.doubtfulAnswers || {},
      breakdown: result.breakdown || {},
      cheat_count: result.cheatCount || 0,
      cheat_log: result.cheatLog || [],
    };

    const { error } = await client.from('cbt_results').upsert(row);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Gagal mengirim nilai ujian ke Supabase:', err);
    return false;
  }
}

export async function deleteResultFromSupabase(resultId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('cbt_results').delete().eq('id', resultId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Gagal menghapus hasil ujian dari Supabase:', err);
    return false;
  }
}

// ==========================================
// CONFIG (LANDING PAGE CMS)
// ==========================================
export async function fetchConfigFromSupabase(): Promise<LandingPageConfig | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('cbt_config')
      .select('config')
      .eq('id', 'global_config')
      .single();

    if (error || !data) return null;
    return data.config as LandingPageConfig;
  } catch {
    return null;
  }
}

export async function saveConfigToSupabase(config: LandingPageConfig): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('cbt_config').upsert({
      id: 'global_config',
      config,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Gagal menyimpan config ke Supabase:', err);
    return false;
  }
}

// ==========================================
// BULK SYNC: LOCAL DATA -> SUPABASE
// ==========================================
export async function pushAllLocalDataToSupabase(data: {
  exams: ExamSubject[];
  students: StudentMember[];
  results: ExamResult[];
  config: LandingPageConfig;
}): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase belum dikonfigurasi. Masukkan URL dan Anon Key terlebih dahulu.',
    };
  }

  try {
    // 1. Upload exams
    for (const ex of data.exams) {
      await upsertExamToSupabase(ex);
    }

    // 2. Upload students
    for (const st of data.students) {
      await upsertStudentToSupabase(st);
    }

    // 3. Upload results
    for (const res of data.results) {
      await insertResultToSupabase(res);
    }

    // 4. Upload config
    await saveConfigToSupabase(data.config);

    return {
      success: true,
      message: `Sinkronisasi berhasil! ${data.exams.length} Mapel, ${data.students.length} Siswa, dan ${data.results.length} Nilai telah tersimpan online di Supabase.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal sinkronisasi data: ${err.message || 'Kesalahan jaringan'}`,
    };
  }
}

// ==========================================
// SQL SETUP SCRIPT FOR SUPABASE SQL EDITOR
// ==========================================
export const SUPABASE_SQL_MIGRATION_SCRIPT = `-- ====================================================================
-- SKRIP SQL DATABASE SUPABASE CBT ASAS KELAS 6 SD NEGERI SELOMERTO
-- Jalankan skrip ini sekali di menu: SQL Editor > New Query > Run
-- ====================================================================

-- 1. TABEL MATA PELAJARAN & BANK SOAL 6 JENIS
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

-- 3. TABEL HASIL UJIAN SISWA & MONITORING ANTI-CURANG
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

-- 6. BERIKAN AKSES PENUH KE PERAN ANON (PUBLIC WEB GITHUB PAGES)
-- Supaya aplikasi web static tanpa server dapat membaca dan menulis nilai ujian
DROP POLICY IF EXISTS "Akses publik cbt_exams" ON cbt_exams;
DROP POLICY IF EXISTS "Akses publik cbt_students" ON cbt_students;
DROP POLICY IF EXISTS "Akses publik cbt_results" ON cbt_results;
DROP POLICY IF EXISTS "Akses publik cbt_config" ON cbt_config;

CREATE POLICY "Akses publik cbt_exams" ON cbt_exams FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Akses publik cbt_students" ON cbt_students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Akses publik cbt_results" ON cbt_results FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Akses publik cbt_config" ON cbt_config FOR ALL TO anon USING (true) WITH CHECK (true);
`;
