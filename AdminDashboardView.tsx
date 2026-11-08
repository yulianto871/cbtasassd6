import React, { useState } from 'react';
import {
  ExamSubject,
  StudentMember,
  ExamResult,
  LandingPageConfig,
  Question,
} from '../types/cbt';
import { QuestionEditorModal } from '../components/QuestionEditorModal';
import { QuestionPreviewModal } from '../components/QuestionPreviewModal';
import {
  exportResultsToExcel,
  exportStudentsToExcel,
} from '../utils/spreadsheetExporter';
import { storage } from '../utils/storage';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  isSupabaseConfigured,
  testSupabaseConnection,
  pushAllLocalDataToSupabase,
  fetchExamsFromSupabase,
  fetchStudentsFromSupabase,
  fetchResultsFromSupabase,
  fetchConfigFromSupabase,
  SUPABASE_SQL_MIGRATION_SCRIPT,
  upsertExamToSupabase,
  deleteExamFromSupabase,
  upsertStudentToSupabase,
  deleteStudentFromSupabase,
  deleteResultFromSupabase,
  saveConfigToSupabase,
} from '../services/supabaseService';
import {
  Users,
  FileQuestion,
  LayoutTemplate,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Send,
  Database,
  Download,
  Upload,
  Lock,
  BookOpen,
  CopyPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Award,
  KeyRound,
  X,
  Shuffle,
} from 'lucide-react';

interface AdminDashboardViewProps {
  exams: ExamSubject[];
  students: StudentMember[];
  results: ExamResult[];
  config: LandingPageConfig;
  onUpdateExams: (exams: ExamSubject[]) => void;
  onUpdateStudents: (students: StudentMember[]) => void;
  onUpdateResults: (results: ExamResult[]) => void;
  onUpdateConfig: (config: LandingPageConfig) => void;
}

type AdminTab =
  | 'monitoring'
  | 'mata_pelajaran'
  | 'bank_soal'
  | 'anggota'
  | 'landing_page'
  | 'supabase'
  | 'pengaturan';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  exams,
  students,
  results,
  config,
  onUpdateExams,
  onUpdateStudents,
  onUpdateResults,
  onUpdateConfig,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('monitoring');

  // Exam / Question state
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isQuestionEditorOpen, setIsQuestionEditorOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Subject (Mata Pelajaran) CRUD states
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<ExamSubject | null>(null);
  const [subTitle, setSubTitle] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subDuration, setSubDuration] = useState(60);
  const [subPassingScore, setSubPassingScore] = useState(75);
  const [subStatus, setSubStatus] = useState<'active' | 'inactive'>('active');
  const [subRandomQ, setSubRandomQ] = useState(true);
  const [subRandomO, setSubRandomO] = useState(true);

  // Student form modal / state (CRUD)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentMember | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPresensi, setNewStudentPresensi] = useState('');
  const [newStudentPass, setNewStudentPass] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'L' | 'P'>('L');

  // Landing Page CMS form states
  const [cmsConfig, setCmsConfig] = useState<LandingPageConfig>(config);
  const [cmsSaveNotice, setCmsSaveNotice] = useState(false);

  // Supabase states
  const initialCreds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCreds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialCreds.anonKey);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [isSqlCopied, setIsSqlCopied] = useState(false);

  // Admin password change
  const [newAdminPass, setNewAdminPass] = useState('');
  const [adminPassMsg, setAdminPassMsg] = useState('');

  // Selected cheat log for modal inspection
  const [selectedCheatLog, setSelectedCheatLog] = useState<{
    studentName: string;
    log: string[];
  } | null>(null);

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // ==========================================
  // HANDLERS: MATA PELAJARAN (EXAM SUBJECT CRUD)
  // ==========================================
  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubTitle('');
    setSubCode('');
    setSubDuration(60);
    setSubPassingScore(75);
    setSubStatus('active');
    setSubRandomQ(true);
    setSubRandomO(true);
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (ex: ExamSubject) => {
    setEditingSubject(ex);
    setSubTitle(ex.title);
    setSubCode(ex.subjectCode);
    setSubDuration(ex.durationMinutes);
    setSubPassingScore(ex.passingScore);
    setSubStatus(ex.status);
    setSubRandomQ(ex.randomizeQuestions !== false);
    setSubRandomO(ex.randomizeOptions !== false);
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTitle.trim() || !subCode.trim()) {
      alert('Nama Mata Pelajaran dan Kode Mapel wajib diisi!');
      return;
    }

    if (editingSubject) {
      // Update
      const updated = exams.map((ex) =>
        ex.id === editingSubject.id
          ? {
              ...ex,
              title: subTitle.trim(),
              subjectCode: subCode.trim().toUpperCase(),
              durationMinutes: Number(subDuration) || 60,
              passingScore: Number(subPassingScore) || 75,
              status: subStatus,
              isReleased: subStatus === 'active',
              releasedAt: subStatus === 'active' ? (ex.releasedAt || new Date().toISOString()) : undefined,
              randomizeQuestions: subRandomQ,
              randomizeOptions: subRandomO,
            }
          : ex
      );
      onUpdateExams(updated);
      storage.saveExams(updated);
      const updatedSubject = updated.find((ex) => ex.id === editingSubject.id);
      if (updatedSubject && isSupabaseConfigured()) {
        upsertExamToSupabase(updatedSubject).catch((err) => console.error(err));
      }
    } else {
      // Create
      const newSubject: ExamSubject = {
        id: `exam-${Date.now()}`,
        title: subTitle.trim(),
        subjectCode: subCode.trim().toUpperCase(),
        grade: 'Kelas 6',
        schoolName: config.schoolName,
        durationMinutes: Number(subDuration) || 60,
        totalQuestions: 0,
        passingScore: Number(subPassingScore) || 75,
        academicYear: config.academicYear,
        semester: config.semester,
        status: subStatus,
        isReleased: subStatus === 'active',
        releasedAt: subStatus === 'active' ? new Date().toISOString() : undefined,
        randomizeQuestions: subRandomQ,
        randomizeOptions: subRandomO,
        questions: [],
      };
      const updated = [...exams, newSubject];
      onUpdateExams(updated);
      storage.saveExams(updated);
      setSelectedExamId(newSubject.id);
      if (isSupabaseConfigured()) {
        upsertExamToSupabase(newSubject).catch((err) => console.error(err));
      }
    }

    setIsSubjectModalOpen(false);
  };

  const handleDeleteSubject = (id: string) => {
    if (exams.length <= 1) {
      alert('Minimal harus ada 1 mata pelajaran ujian.');
      return;
    }
    const target = exams.find((e) => e.id === id);
    if (!confirm(`Apakah Anda yakin ingin menghapus paket mapel "${target?.title}" beserta seluruh soalnya?`)) {
      return;
    }
    const updated = exams.filter((e) => e.id !== id);
    onUpdateExams(updated);
    storage.saveExams(updated);
    if (selectedExamId === id) {
      setSelectedExamId(updated[0]?.id || '');
    }
    if (isSupabaseConfigured()) {
      deleteExamFromSupabase(id).catch((err) => console.error(err));
    }
  };

  const handleDuplicateSubject = (ex: ExamSubject) => {
    const cloned: ExamSubject = {
      ...ex,
      id: `exam-clone-${Date.now()}`,
      title: `${ex.title} (Salinan)`,
      subjectCode: `${ex.subjectCode}-SALIN`,
      status: 'active',
      questions: ex.questions.map((q) => ({
        ...q,
        id: `q-${Date.now()}-${q.number}`,
      })),
    };
    const updated = [...exams, cloned];
    onUpdateExams(updated);
    storage.saveExams(updated);
    setSelectedExamId(cloned.id);
    alert(`Berhasil menduplikasi paket "${ex.title}"!`);
  };

  const handleToggleSubjectStatus = (id: string) => {
    const target = exams.find((ex) => ex.id === id);
    if (!target) return;
    const willRelease = target.status !== 'active';
    const updated = exams.map((ex) =>
      ex.id === id
        ? {
            ...ex,
            status: (willRelease ? 'active' : 'inactive') as 'active' | 'inactive',
            isReleased: willRelease,
            releasedAt: willRelease ? new Date().toISOString() : undefined,
          }
        : ex
    );
    onUpdateExams(updated);
    storage.saveExams(updated);

    const changedExam = updated.find((ex) => ex.id === id);
    if (changedExam && isSupabaseConfigured()) {
      upsertExamToSupabase(changedExam).catch((err) => console.error(err));
    }

    if (willRelease) {
      alert(
        `🚀 Soal untuk "${target.title}" BERHASIL DIRILIS!\nSiswa sekarang dapat melihat dan langsung mengerjakan soal asesmen ini di beranda dan pendaftaran.`
      );
    } else {
      alert(
        `🔒 Soal untuk "${target.title}" TELAH DITARIK / DIKUNCI.\nSiswa tidak dapat mengakses soal ini lagi hingga dirilis kembali.`
      );
    }
  };

  // ==========================================
  // HANDLERS: QUESTIONS
  // ==========================================
  const handleOpenAddQuestion = () => {
    if (!currentExam) return;
    const nextNumber = currentExam.questions.length + 1;
    setEditingQuestion({
      id: `q-${Date.now()}`,
      number: nextNumber,
      type: 'mc_single',
      points: 15,
      questionText: '',
      stimulusType: 'none',
      options: [
        { id: 'A', label: 'A', text: '', image: '' },
        { id: 'B', label: 'B', text: '', image: '' },
        { id: 'C', label: 'C', text: '', image: '' },
        { id: 'D', label: 'D', text: '', image: '' },
      ],
      correctAnswerSingle: 'A',
    });
    setIsQuestionEditorOpen(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setIsQuestionEditorOpen(true);
  };

  const handleSaveQuestion = (savedQ: Question) => {
    if (!currentExam) return;
    const exists = currentExam.questions.some((q) => q.id === savedQ.id);
    let updatedQuestions: Question[];

    if (exists) {
      updatedQuestions = currentExam.questions.map((q) => (q.id === savedQ.id ? savedQ : q));
    } else {
      updatedQuestions = [...currentExam.questions, savedQ];
    }

    const updatedExam: ExamSubject = {
      ...currentExam,
      questions: updatedQuestions,
      totalQuestions: updatedQuestions.length,
    };

    const updatedExams = exams.map((ex) => (ex.id === updatedExam.id ? updatedExam : ex));
    onUpdateExams(updatedExams);
    storage.saveExams(updatedExams);
    setIsQuestionEditorOpen(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!currentExam) return;
    if (!confirm('Apakah Anda yakin ingin menghapus butir soal ini?')) return;

    const filtered = currentExam.questions
      .filter((q) => q.id !== qId)
      .map((q, idx) => ({ ...q, number: idx + 1 }));

    const updatedExam: ExamSubject = {
      ...currentExam,
      questions: filtered,
      totalQuestions: filtered.length,
    };

    const updatedExams = exams.map((ex) => (ex.id === updatedExam.id ? updatedExam : ex));
    onUpdateExams(updatedExams);
    storage.saveExams(updatedExams);
  };

  // ==========================================
  // HANDLERS: STUDENTS (CRUD)
  // ==========================================
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const pNum = parseInt(newStudentPresensi, 10);
    if (isNaN(pNum)) return;

    const newStudent: StudentMember = {
      id: `std-${Date.now()}`,
      fullName: newStudentName.trim(),
      schoolName: config.schoolName,
      presensiNumber: pNum,
      grade: 'Kelas 6',
      customPassword: newStudentPass.trim() || `siswa${pNum}`,
      registeredAt: new Date().toISOString().slice(0, 10),
      gender: newStudentGender,
    };

    const updated = [...students, newStudent].sort((a, b) => a.presensiNumber - b.presensiNumber);
    onUpdateStudents(updated);
    storage.saveStudents(updated);

    setNewStudentName('');
    setNewStudentPresensi('');
    setNewStudentPass('');
    setIsAddStudentOpen(false);
  };

  const handleOpenEditStudent = (st: StudentMember) => {
    setEditingStudent(st);
    setNewStudentName(st.fullName);
    setNewStudentPresensi(String(st.presensiNumber));
    setNewStudentPass(st.customPassword);
    setNewStudentGender(st.gender || 'L');
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !newStudentName.trim()) return;
    const pNum = parseInt(newStudentPresensi, 10) || editingStudent.presensiNumber;

    const updated = students
      .map((s) =>
        s.id === editingStudent.id
          ? {
              ...s,
              fullName: newStudentName.trim(),
              presensiNumber: pNum,
              customPassword: newStudentPass.trim() || s.customPassword,
              gender: newStudentGender,
            }
          : s
      )
      .sort((a, b) => a.presensiNumber - b.presensiNumber);

    onUpdateStudents(updated);
    storage.saveStudents(updated);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (stdId: string) => {
    if (!confirm('Hapus peserta ujian ini?')) return;
    const updated = students.filter((s) => s.id !== stdId);
    onUpdateStudents(updated);
    storage.saveStudents(updated);
  };

  // ==========================================
  // HANDLERS: RESULTS & GOOGLE SHEETS
  // ==========================================
  const handleDeleteResult = (resId: string) => {
    if (!confirm('Hapus riwayat nilai ujian ini?')) return;
    const updated = results.filter((r) => r.id !== resId);
    onUpdateResults(updated);
    storage.saveResults(updated);
  };

  // Save Landing Page CMS
  const handleSaveLandingCms = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(cmsConfig);
    storage.saveLandingConfig(cmsConfig);
    setCmsSaveNotice(true);
    setTimeout(() => setCmsSaveNotice(false), 3000);
  };

  // Change Admin Pass
  const handleChangeAdminPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPass.trim() || newAdminPass.length < 4) {
      setAdminPassMsg('Password minimal 4 karakter.');
      return;
    }
    storage.setAdminPassword(newAdminPass.trim());
    setAdminPassMsg('Password admin berhasil diperbarui!');
    setNewAdminPass('');
    setTimeout(() => setAdminPassMsg(''), 3000);
  };

  // ==========================================
  // HANDLERS: SUPABASE DATABASE ONLINE
  // ==========================================
  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = supabaseUrl.trim();
    const cleanKey = supabaseAnonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setSupabaseStatusMsg({
        type: 'error',
        text: 'URL Project dan Anon Key wajib diisi!',
      });
      return;
    }

    saveSupabaseCredentials(cleanUrl, cleanKey);
    setIsTestingSupabase(true);
    setSupabaseStatusMsg({ type: 'info', text: 'Menghubungkan ke Supabase...' });

    const test = await testSupabaseConnection(cleanUrl, cleanKey);
    setIsTestingSupabase(false);

    setSupabaseStatusMsg({
      type: test.success ? 'success' : 'error',
      text: test.message,
    });
  };

  const handleTestSupabaseOnly = async () => {
    setIsTestingSupabase(true);
    setSupabaseStatusMsg({ type: 'info', text: 'Menguji koneksi ke database Supabase...' });
    const test = await testSupabaseConnection(supabaseUrl.trim(), supabaseAnonKey.trim());
    setIsTestingSupabase(false);
    setSupabaseStatusMsg({
      type: test.success ? 'success' : 'error',
      text: test.message,
    });
  };

  const handleDisconnectSupabase = () => {
    if (!confirm('Putuskan koneksi database Supabase? Sistem akan kembali ke mode penyimpanan lokal browser.')) return;
    saveSupabaseCredentials('', '');
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setSupabaseStatusMsg({
      type: 'info',
      text: 'Koneksi Supabase diputuskan. Aplikasi saat ini menggunakan database lokal browser.',
    });
  };

  const handleSyncLocalToSupabase = async () => {
    if (!isSupabaseConfigured()) {
      alert('Simpan konfigurasi Supabase terlebih dahulu!');
      return;
    }
    setIsSyncingSupabase(true);
    setSupabaseStatusMsg({ type: 'info', text: 'Mengunggah seluruh data lokal ke cloud Supabase...' });

    const res = await pushAllLocalDataToSupabase({
      exams,
      students,
      results,
      config,
    });

    setIsSyncingSupabase(false);
    setSupabaseStatusMsg({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handlePullSupabaseToLocal = async () => {
    if (!isSupabaseConfigured()) {
      alert('Simpan konfigurasi Supabase terlebih dahulu!');
      return;
    }
    setIsSyncingSupabase(true);
    setSupabaseStatusMsg({ type: 'info', text: 'Mengunduh data terbaru dari cloud Supabase...' });

    try {
      const [remoteExams, remoteStudents, remoteResults, remoteConfig] = await Promise.all([
        fetchExamsFromSupabase(),
        fetchStudentsFromSupabase(),
        fetchResultsFromSupabase(),
        fetchConfigFromSupabase(),
      ]);

      let count = 0;
      if (remoteExams && remoteExams.length > 0) {
        onUpdateExams(remoteExams);
        storage.saveExams(remoteExams);
        count += remoteExams.length;
      }
      if (remoteStudents && remoteStudents.length > 0) {
        onUpdateStudents(remoteStudents);
        storage.saveStudents(remoteStudents);
        count += remoteStudents.length;
      }
      if (remoteResults) {
        onUpdateResults(remoteResults);
        storage.saveResults(remoteResults);
      }
      if (remoteConfig) {
        onUpdateConfig(remoteConfig);
        storage.saveLandingConfig(remoteConfig);
        setCmsConfig(remoteConfig);
      }

      setIsSyncingSupabase(false);
      setSupabaseStatusMsg({
        type: 'success',
        text: `Berhasil menyinkronkan data dari Supabase ke perangkat ini (${count} mata pelajaran & siswa)!`,
      });
    } catch (err: any) {
      setIsSyncingSupabase(false);
      setSupabaseStatusMsg({
        type: 'error',
        text: `Gagal memuat data dari Supabase: ${err.message}`,
      });
    }
  };

  const handleCopySqlMigration = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION_SCRIPT);
    setIsSqlCopied(true);
    setTimeout(() => setIsSqlCopied(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase tracking-wider">
            <span>Portal Administrasi CBT ASAS</span>
            <span>·</span>
            <span>{config.schoolName}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Dashboard Manajemen Ujian
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola Mata Pelajaran, Bank Soal 6 Tipe ASAS, Rekap Nilai Spreadsheet, Anti-Curang, dan Anggota Siswa.
          </p>
        </div>

        {/* Quick Database Backup actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const json = storage.exportFullBackup();
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Backup_CBT_ASAS_Selomerto_${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 text-xs shadow-xs"
            title="Download backup data JSON"
          >
            <Download className="w-3.5 h-3.5" /> Backup DB
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('monitoring')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'monitoring'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-red-600" />
          <span>Monitoring & Rekap Nilai</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mata_pelajaran')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'mata_pelajaran'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-red-600" />
          <span>Mata Pelajaran ({exams.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bank_soal')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'bank_soal'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileQuestion className="w-4 h-4 text-red-600" />
          <span>Bank Soal (6 Tipe ASAS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('anggota')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'anggota'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-red-600" />
          <span>Data Anggota Siswa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('landing_page')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'landing_page'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutTemplate className="w-4 h-4 text-red-600" />
          <span>Editor Landing Page</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'supabase'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Database Supabase Online</span>
          {isSupabaseConfigured() ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pengaturan')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'pengaturan'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4 text-red-600" />
          <span>Pengaturan & Keamanan</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: MONITORING & REKAP NILAI (Excel / Anti-Cheat Log)       */}
      {/* ============================================================== */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Action strip */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Rekap Hasil Ujian ({results.length} Peserta Selesai)
              </h3>
              <p className="text-xs text-slate-500">
                Laporan nilai otomatis, status KKM, dan catatan riwayat integritas (anti-curang) peserta.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => exportResultsToExcel(results)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh Rekap Nilai (.XLSX)</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
                  <tr>
                    <th className="py-3 px-3 w-14 text-center">Presensi</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-3 text-center">Nilai</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Integritas (Anti-Curang)</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                        Belum ada peserta yang menyelesaikan ujian.
                      </td>
                    </tr>
                  ) : (
                    results.map((res) => {
                      const cCount = res.cheatCount || 0;
                      return (
                        <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                            {res.presensiNumber}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{res.studentName}</span>
                            <span className="text-[11px] text-slate-400">
                              {res.schoolName} · {res.grade}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-medium text-slate-700">
                            {res.examTitle}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-black text-red-700 text-base tabular-nums">
                            {res.score}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded ${
                                res.score >= 75
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {res.score >= 75 ? 'Tuntas' : 'Remidi'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {cCount === 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5" /> Bersih (0)
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedCheatLog({
                                    studentName: res.studentName,
                                    log: res.cheatLog || [
                                      `Terdeteksi ${cCount} kali meninggalkan jendela ujian.`,
                                    ],
                                  })
                                }
                                className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-0.5 rounded border border-rose-200 cursor-pointer"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" /> {cCount}x Peringatan
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteResult(res.id)}
                              title="Hapus Nilai / Izinkan Ujian Ulang"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: MATA PELAJARAN (FULL CRUD: ADD, EDIT, DELETE, CLONE)    */}
      {/* ============================================================== */}
      {activeTab === 'mata_pelajaran' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kelola Mata Pelajaran Asesmen ({exams.length} Paket)
              </h3>
              <p className="text-xs text-slate-500">
                Tambah mata pelajaran baru, sesuaikan durasi pengerjaan, KKM, kebijakan acak, atau duplikasi paket soal.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddSubject}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mata Pelajaran Baru</span>
            </button>
          </div>

          {/* Subject Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-red-300 transition-all space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      {ex.subjectCode}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        ex.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {ex.status === 'active' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Telah Dirilis</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Belum Dirilis</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{ex.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ex.grade} · {ex.questions.length} Butir Soal Terdaftar
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Durasi</span>
                      <span className="font-bold text-slate-800">{ex.durationMinutes}m</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">KKM</span>
                      <span className="font-bold text-slate-800">{ex.passingScore}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Bank Soal</span>
                      <span className="font-bold text-red-700">{ex.questions.length} Butir</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicateSubject(ex)}
                      className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                      title="Duplikasi / Kloning Paket Soal"
                    >
                      <CopyPlus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditSubject(ex)}
                      className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                      title="Edit Pengaturan Mapel"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {exams.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(ex.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                        title="Hapus Mapel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSubjectStatus(ex.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
                        ex.status === 'active'
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                      }`}
                      title={ex.status === 'active' ? 'Tutup rilis soal dari siswa' : 'Rilis soal ke siswa'}
                    >
                      {ex.status === 'active' ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Tutup Soal</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Rilis Soal</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExamId(ex.id);
                        setActiveTab('bank_soal');
                      }}
                      className="text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition-colors cursor-pointer"
                    >
                      Kelola Soal ➔
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: BANK SOAL (6 TIPE ASAS, STIMULUS EDITOR, PREVIEW)      */}
      {/* ============================================================== */}
      {activeTab === 'bank_soal' && (
        <div className="space-y-6">
          {/* Top subject selector & add question */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Mata Pelajaran:</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.questions.length} Soal)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddQuestion}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Butir Soal Baru</span>
            </button>
          </div>

          {/* Status Rilis Soal Mata Pelajaran Banner */}
          {currentExam && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                currentExam.status === 'active'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs'
                  : 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    currentExam.status === 'active'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {currentExam.status === 'active' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Lock className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status Akses Siswa ({currentExam.subjectCode}):
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        currentExam.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {currentExam.status === 'active'
                        ? '🟢 TELAH DIRILIS (MUNCUL DI SISWA)'
                        : '🔒 BELUM DIRILIS (TERKUNCI / DRAFT)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {currentExam.status === 'active'
                      ? `Soal ${currentExam.title} sudah dirilis. Siswa Kelas 6 dapat melihat dan langsung mengerjakan ujian ini di halaman siswa.`
                      : `Soal ${currentExam.title} belum dirilis. Siswa tidak dapat melihat atau mengerjakan soal ini sampai Anda mengklik tombol "Rilis Soal Sekarang".`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleToggleSubjectStatus(currentExam.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
                    currentExam.status === 'active'
                      ? 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {currentExam.status === 'active' ? (
                    <>
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>Tarik / Kunci Rilis Soal</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      <span>Rilis Soal ke Siswa Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Question List */}
          <div className="space-y-4">
            {currentExam?.questions.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-500 rounded-2xl border border-slate-200">
                Belum ada butir soal pada paket ini. Klik tombol Tambah Soal Baru di atas.
              </div>
            ) : (
              currentExam?.questions.map((q) => {
                const typeLabels: Record<string, string> = {
                  mc_single: '1) Pilihan Ganda Sederhana',
                  mc_mcma: '2) Pilihan Ganda Kompleks (MCMA)',
                  mc_category: '3) Pilihan Ganda Kategori',
                  short_answer: '4) Isian Singkat',
                  matching: '5) Menjodohkan (Matching)',
                  essay: '6) Uraian Pemecahan Masalah',
                };

                const hasOptionImages = (q.options || []).some((o) => !!o.image);

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center font-mono">
                          #{q.number}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {typeLabels[q.type] || q.type}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {q.points} Poin
                        </span>
                        {q.stimulusType !== 'none' && (
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            Stimulus: {q.stimulusType}
                          </span>
                        )}
                        {hasOptionImages && (
                          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Ada Gambar Opsi
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewQuestion(q)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Pratinjau soal sebelum dilaunching"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" /> Pratinjau
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditQuestion(q)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Hapus soal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                      {q.questionText}
                    </p>

                    {q.stimulusTitle && (
                      <p className="text-xs text-slate-500 italic">
                        Stimulus: {q.stimulusTitle}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: DATA ANGGOTA SISWA (FULL CRUD)                          */}
      {/* ============================================================== */}
      {activeTab === 'anggota' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Daftar Peserta Ujian ({students.length} Siswa Terdaftar)
              </h3>
              <p className="text-xs text-slate-500">
                Siswa Kelas 6 SD Negeri Selomerto dengan nomor presensi dan password custom masing-masing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportStudentsToExcel(students)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" /> Unduh Excel
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewStudentName('');
                  setNewStudentPresensi(String(students.length + 1));
                  setNewStudentPass('');
                  setIsAddStudentOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah Siswa
              </button>
            </div>
          </div>

          {/* Student list table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Presensi</th>
                    <th className="py-3 px-4">Nama Lengkap Siswa</th>
                    <th className="py-3 px-3 text-center">L/P</th>
                    <th className="py-3 px-4">Asal Sekolah</th>
                    <th className="py-3 px-3 text-center">Kelas</th>
                    <th className="py-3 px-4">Password Custom</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {st.presensiNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{st.fullName}</td>
                      <td className="py-3 px-3 text-center text-xs font-semibold text-slate-600">
                        {st.gender || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{st.schoolName}</td>
                      <td className="py-3 px-3 text-center text-xs font-semibold text-slate-700">
                        {st.grade}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-red-700 font-bold">
                        {st.customPassword}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditStudent(st)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                            title="Edit Data Siswa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(st.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: EDITOR LANDING PAGE CMS & ANTI-CHEAT SETTINGS          */}
      {/* ============================================================== */}
      {activeTab === 'landing_page' && (
        <form onSubmit={handleSaveLandingCms} className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Editor Tampilan Landing Page</h3>
              <p className="text-xs text-slate-500">
                Ubah judul, sambutan, nama kepala sekolah, jadwal ujian, dan tata tertib aplikasi secara langsung.
              </p>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors self-start sm:self-auto"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan Landing Page</span>
            </button>
          </div>

          {cmsSaveNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Perubahan landing page berhasil disimpan ke sistem!</span>
            </div>
          )}

          {/* Anti-Cheating System Configuration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-600" /> Pengaturan Sistem Anti-Curang
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cmsConfig.antiCheatEnabled !== false}
                  onChange={(e) =>
                    setCmsConfig({ ...cmsConfig, antiCheatEnabled: e.target.checked })
                  }
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Aktifkan Fitur Anti-Curang
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Memantau perpindahan tab browser, blur jendela, kunci klik kanan & pintasan tombol.
                  </span>
                </div>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Batas Toleransi Peringatan Pindah Tab
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={cmsConfig.maxCheatWarnings || 3}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      maxCheatWarnings: parseInt(e.target.value, 10) || 3,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-red-700 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Jika pelanggaran melebihi batas ini, lembar ujian otomatis terkumpul.
                </span>
              </div>
            </div>
          </div>

          {/* Global Randomization Configuration (Acak Soal & Acak Opsi) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-red-600" /> Kebijakan Acak Soal & Opsi Jawaban (Global)
            </h4>
            <p className="text-xs text-slate-500">
              Pengaturan default agar urutan soal dan urutan pilihan jawaban (A, B, C, D) yang pertama kali tampil pada setiap siswa berbeda-beda secara otomatis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cmsConfig.randomizeQuestions !== false}
                  onChange={(e) =>
                    setCmsConfig({ ...cmsConfig, randomizeQuestions: e.target.checked })
                  }
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Acak Nomor Urut Soal
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Siswa tidak dapat menyontek nomor soal karena urutan 1 s.d N berbeda tiap peserta.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cmsConfig.randomizeOptions !== false}
                  onChange={(e) =>
                    setCmsConfig({ ...cmsConfig, randomizeOptions: e.target.checked })
                  }
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Acak Opsi Pilihan Jawaban
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pilihan A, B, C, D diacak posisinya tanpa mempengaruhi keakuratan penskoran otomatis.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sekolah</label>
              <input
                type="text"
                value={cmsConfig.schoolName}
                onChange={(e) => setCmsConfig({ ...cmsConfig, schoolName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Aplikasi ASAS</label>
              <input
                type="text"
                value={cmsConfig.appTitle}
                onChange={(e) => setCmsConfig({ ...cmsConfig, appTitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Ajaran & Semester</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={cmsConfig.academicYear}
                  onChange={(e) => setCmsConfig({ ...cmsConfig, academicYear: e.target.value })}
                  placeholder="2026/2027"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={cmsConfig.semester}
                  onChange={(e) => setCmsConfig({ ...cmsConfig, semester: e.target.value })}
                  placeholder="Semester 1 (Ganjil)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Teks Pengumuman (Banner Merah)</label>
              <input
                type="text"
                value={cmsConfig.announcement}
                onChange={(e) => setCmsConfig({ ...cmsConfig, announcement: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Sambutan & Penjelasan Asesmen</label>
              <textarea
                rows={3}
                value={cmsConfig.welcomeMessage}
                onChange={(e) => setCmsConfig({ ...cmsConfig, welcomeMessage: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={cmsConfig.headmasterName}
                onChange={(e) => setCmsConfig({ ...cmsConfig, headmasterName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={cmsConfig.headmasterNip}
                onChange={(e) => setCmsConfig({ ...cmsConfig, headmasterNip: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Proktor / Guru Penguji</label>
              <input
                type="text"
                value={cmsConfig.teacherInCharge}
                onChange={(e) => setCmsConfig({ ...cmsConfig, teacherInCharge: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rentang Tanggal Pelaksanaan</label>
              <input
                type="text"
                value={cmsConfig.examDateRange}
                onChange={(e) => setCmsConfig({ ...cmsConfig, examDateRange: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* TAB: DATABASE SUPABASE ONLINE (MULTI-DEVICE & GITHUB PAGES)     */}
      {/* ============================================================== */}
      {activeTab === 'supabase' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Status & Overview Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Database Supabase Online (Multi-Perangkat & GitHub)
                    </h3>
                    {isSupabaseConfigured() ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Terkonfigurasi Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        Mode Lokal Browser
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Integrasikan database cloud PostgreSQL Supabase gratis agar ujian CBT ASAS dapat dikerjakan siswa dari semua HP, tablet, dan laptop secara bersamaan serta saat di-hosting di GitHub Pages.
                  </p>
                </div>
              </div>
            </div>

            {/* Credential Form */}
            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project URL Supabase
                </label>
                <input
                  type="url"
                  required
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzabcdefghijklmnop.supabase.co"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Didapatkan dari menu Supabase: <strong>Project Settings &gt; Data API &gt; Project URL</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Anon / Public API Key
                </label>
                <input
                  type="text"
                  required
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Kunci akses publik yang aman digunakan di peramban web siswa (Project Settings &gt; Data API &gt; anon public)
                </p>
              </div>

              {/* Status Banner */}
              {supabaseStatusMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    supabaseStatusMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : supabaseStatusMsg.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}
                >
                  {supabaseStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : supabaseStatusMsg.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                  )}
                  <span className="font-medium leading-relaxed">{supabaseStatusMsg.text}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isTestingSupabase}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                >
                  {isTestingSupabase ? 'Menghubungkan...' : 'Simpan & Hubungkan'}
                </button>

                <button
                  type="button"
                  disabled={isTestingSupabase || !supabaseUrl.trim()}
                  onClick={handleTestSupabaseOnly}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  Uji Koneksi Database
                </button>

                {isSupabaseConfigured() && (
                  <button
                    type="button"
                    onClick={handleDisconnectSupabase}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition-colors ml-auto"
                  >
                    Putuskan Koneksi
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Sync Local & Cloud Data Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Sinkronisasi Data Ujian Cloud (Local &harr; Supabase)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim data paket soal, bank soal 6 tipe, daftar siswa, dan nilai yang ada di komputer admin ke cloud Supabase agar langsung tampil di semua perangkat siswa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Push Local Data */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Upload Data Lokal ke Supabase (Seed Awal)</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Unggah seluruh paket soal ASAS ({exams.length} Mapel), daftar siswa ({students.length} Siswa), dan hasil nilai saat ini ke tabel Supabase.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSyncingSupabase}
                  onClick={handleSyncLocalToSupabase}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isSyncingSupabase ? 'Menyinkronkan...' : 'Upload Seluruh Data ke Supabase'}</span>
                </button>
              </div>

              {/* Pull Remote Data */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Tarik Data Supabase ke Perangkat Ini</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Ambil data soal, siswa, dan rekap nilai ujian terbaru yang telah disimpan di cloud Supabase untuk disimpan ke cache browser ini.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSyncingSupabase}
                  onClick={handlePullSupabaseToLocal}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{isSyncingSupabase ? 'Mengunduh...' : 'Tarik Data dari Supabase'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SQL Migration Script Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Skrip SQL Database Supabase (1-Klik Salin)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jalankan skrip ini sekali di menu <strong>SQL Editor &gt; New Query &gt; Run</strong> pada dashboard Supabase Anda untuk membuat 4 tabel dan izin akses publik (RLS).
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopySqlMigration}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors self-start sm:self-auto shrink-0"
              >
                {isSqlCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                <span>{isSqlCopied ? 'Skrip SQL Tersalin!' : 'Salin Skrip SQL'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed border border-slate-800 selection:bg-red-500 selection:text-white">
              {SUPABASE_SQL_MIGRATION_SCRIPT}
            </pre>
          </div>

          {/* GitHub Pages & Supabase Step-by-Step Guide */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-red-600" />
              <span>Panduan Lengkap: Online di Semua Device & Publish di GitHub Pages</span>
            </h3>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Buat Akun dan Project Gratis di Supabase:</strong>
                  Kunjungi <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-red-600 font-bold underline">supabase.com</a>, daftar gratis, lalu klik <em>New Project</em> (misal beri nama <code>cbt-sdn-selomerto</code> dan pilih region terdekat seperti <em>Singapore</em>).
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Jalankan Skrip SQL di Supabase SQL Editor:</strong>
                  Buka menu <strong>SQL Editor</strong> di dashboard Supabase &rarr; klik <strong>New Query</strong> &rarr; klik tombol <strong>Salin Skrip SQL</strong> di atas, tempel di editor, lalu klik <strong>Run</strong>. Keempat tabel (<code>cbt_exams</code>, <code>cbt_students</code>, <code>cbt_results</code>, <code>cbt_config</code>) beserta hak akses publik (RLS) akan aktif otomatis.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Hubungkan Kredensial API:</strong>
                  Masuk ke menu <strong>Project Settings &gt; Data API</strong>, salin <code>Project URL</code> dan <code>anon public key</code> ke form di atas, lalu klik <strong>Simpan & Hubungkan</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">4</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Upload Data Soal & Siswa:</strong>
                  Klik tombol <strong>Upload Seluruh Data ke Supabase</strong> di kartu sinkronisasi di atas agar bank soal 6 tipe ASAS dan daftar siswa terunggah ke database online.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">5</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Publish Gratis ke GitHub Pages:</strong>
                  Push seluruh repository ini ke GitHub. Di repository GitHub Anda, buka <strong>Settings &gt; Pages</strong> &rarr; pilih <em>Source: Deploy from a branch</em> atau <em>GitHub Actions</em>. CBT ASAS akan aktif di URL <code>https://username.github.io/repo-name</code> dan dapat langsung dibuka siswa dari perangkat manapun!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: PENGATURAN KEAMANAN & MANAJEMEN DATA (FULL WEB GITHUB)  */}
      {/* ============================================================== */}
      {activeTab === 'pengaturan' && (
        <div className="space-y-6">
          {/* Ganti Password Admin */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              <span>Pengaturan Keamanan Password Admin</span>
            </h3>
            <p className="text-xs text-slate-500">
              Ganti kata sandi akses menu administrasi CBT ASAS demi menjaga keamanan bank soal dan kerahasiaan penilaian.
            </p>
            <form onSubmit={handleChangeAdminPass} className="max-w-md space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Admin Baru
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newAdminPass}
                    onChange={(e) => setNewAdminPass(e.target.value)}
                    placeholder="Masukkan password baru..."
                    className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Ubah Password
                  </button>
                </div>
              </div>
              {adminPassMsg && (
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{adminPassMsg}</span>
                </p>
              )}
            </form>
          </div>

          {/* Local Database Management & GitHub Full Web Backup */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Manajemen Data & Cadangan Database Lokal (Full Web)
                </h3>
                <p className="text-xs text-slate-500">
                  Aplikasi CBT berjalan mandiri 100% pada peramban web (cocok untuk hosting di GitHub Pages atau web server lokal). Seluruh data dapat dicadangkan dan dipulihkan dalam format file JSON.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Export Backup Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-red-600" />
                    <span>Cadangkan Database (Export JSON)</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Unduh seluruh data bank soal, mata pelajaran, anggota siswa, dan rekap nilai dalam satu file cadangan aman.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const json = storage.exportFullBackup();
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Backup_CBT_ASAS_Selomerto_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Cadangan (.JSON)</span>
                </button>
              </div>

              {/* Import Backup Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Pulihkan Database (Import JSON)</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Unggah file cadangan JSON untuk memulihkan seluruh soal dan data ujian secara instan.
                  </p>
                </div>
                <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Pilih File Cadangan JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content && storage.importFullBackup(content)) {
                          alert('Database berhasil dipulihkan! Halaman akan dimuat ulang.');
                          window.location.reload();
                        } else {
                          alert('Format file JSON tidak valid!');
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Reset to default database button */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Reset Data ke Bawaan Sistem:</span>
                <span className="text-[11px] text-slate-500">
                  Mengembalikan bank soal 6 jenis ASAS, daftar peserta Kelas 6, dan rekap nilai ke data bawaan SD Negeri Selomerto.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin mengembalikan seluruh data ke bawaan awal? Data nilai baru akan terhapus.')) {
                    storage.resetAllDefaults();
                    alert('Data berhasil direset ke pengaturan awal! Halaman akan dimuat ulang.');
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold self-start sm:self-auto cursor-pointer transition-colors"
              >
                Reset ke Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: MATA PELAJARAN CRUD (ADD / EDIT)                        */}
      {/* ============================================================== */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Mata Pelajaran (Wajib)
                </label>
                <input
                  type="text"
                  required
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  placeholder="Contoh: Bahasa Indonesia - ASAS / Matematika"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Mapel (Wajib)
                  </label>
                  <input
                    type="text"
                    required
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                    placeholder="Contoh: BIN-K6"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Durasi (Menit)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    required
                    value={subDuration}
                    onChange={(e) => setSubDuration(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Standar KKM
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    required
                    value={subPassingScore}
                    onChange={(e) => setSubPassingScore(parseInt(e.target.value) || 75)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Publikasi
                  </label>
                  <select
                    value={subStatus}
                    onChange={(e) => setSubStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                  >
                    <option value="active">Aktif (Dapat Dikerjakan Siswa)</option>
                    <option value="inactive">Non-Aktif (Disembunyikan)</option>
                  </select>
                </div>
              </div>

              {/* Randomization Settings for this Subject */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Pengaturan Acak (Soal & Pilihan Jawaban):
                </span>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subRandomQ}
                    onChange={(e) => setSubRandomQ(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span>Acak Urutan Nomor Soal (Tampilan nomor awal siswa berbeda-beda)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subRandomO}
                    onChange={(e) => setSubRandomO(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span>Acak Pilihan Jawaban Opsi A, B, C, D (Kunci jawaban tetap akurat)</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                >
                  {editingSubject ? 'Simpan Perubahan' : 'Buat Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT STUDENT MEMBER                               */}
      {/* ============================================================== */}
      {(isAddStudentOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              {editingStudent ? 'Edit Anggota Siswa' : 'Tambah Anggota Siswa Baru'}
            </h3>
            <form
              onSubmit={editingStudent ? handleSaveEditStudent : handleAddStudent}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Presensi</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={60}
                  value={newStudentPresensi}
                  onChange={(e) => setNewStudentPresensi(e.target.value)}
                  placeholder="Contoh: 14"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Nama lengkap..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                <select
                  value={newStudentGender}
                  onChange={(e) => setNewStudentGender(e.target.value as 'L' | 'P')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="L">Laki-Laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password Custom</label>
                <input
                  type="text"
                  value={newStudentPass}
                  onChange={(e) => setNewStudentPass(e.target.value)}
                  placeholder="Contoh: siswa14"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddStudentOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CHEAT LOG INSPECTION                                    */}
      {/* ============================================================== */}
      {selectedCheatLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">
                  Log Pelanggaran: {selectedCheatLog.studentName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCheatLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedCheatLog.log.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-mono text-rose-900 leading-relaxed"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCheatLog(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: QUESTION EDITOR (with Stimulus & Option upload/paste)   */}
      {/* ============================================================== */}
      {isQuestionEditorOpen && (
        <QuestionEditorModal
          question={editingQuestion}
          examTitle={currentExam?.title || 'ASAS'}
          onSave={handleSaveQuestion}
          onClose={() => {
            setIsQuestionEditorOpen(false);
            setEditingQuestion(null);
          }}
          onPreview={(q) => setPreviewQuestion(q)}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: QUESTION PREVIEW (Before launching to students)         */}
      {/* ============================================================== */}
      {previewQuestion && (
        <QuestionPreviewModal
          question={previewQuestion}
          onClose={() => setPreviewQuestion(null)}
        />
      )}
    </div>
  );
};
