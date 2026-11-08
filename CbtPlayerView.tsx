import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ExamSubject, ExamResult, LandingPageConfig } from '../types/cbt';
import { StimulusRenderer } from '../components/StimulusRenderer';
import { QuestionRenderer } from '../components/QuestionRenderer';
import { gradeExam } from '../utils/scoring';
import { downloadExamResultPdf } from '../utils/pdfGenerator';
import { storage } from '../utils/storage';
import { insertResultToSupabase, isSupabaseConfigured } from '../services/supabaseService';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Award,
  Home,
  Check,
  Type,
  Maximize2,
  Lock,
} from 'lucide-react';

interface CbtPlayerViewProps {
  exam: ExamSubject;
  student: {
    fullName: string;
    presensiNumber: number;
    schoolName: string;
    grade: string;
  };
  config: LandingPageConfig;
  onFinishExam: (result: ExamResult) => void;
  onGoToDashboard: () => void;
  onGoToLeaderboard: () => void;
}

export const CbtPlayerView: React.FC<CbtPlayerViewProps> = ({
  exam,
  student,
  config,
  onFinishExam,
  onGoToDashboard,
  onGoToLeaderboard,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [doubtful, setDoubtful] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(exam.durationMinutes * 60);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [examFinished, setExamFinished] = useState<boolean>(false);
  const [finalResult, setFinalResult] = useState<ExamResult | null>(null);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('normal');
  const [isOnlineSaved, setIsOnlineSaved] = useState<boolean>(false);

  // Anti-cheating states
  const [cheatCount, setCheatCount] = useState<number>(0);
  const [cheatLog, setCheatLog] = useState<string[]>([]);
  const [showCheatModal, setShowCheatModal] = useState<boolean>(false);
  const [cheatModalMsg, setCheatModalMsg] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);
  const cheatCountRef = useRef<number>(0);
  cheatCountRef.current = cheatCount;

  const maxWarnings = config.maxCheatWarnings || 3;
  const isAntiCheatOn = config.antiCheatEnabled !== false;

  const questions = exam.questions || [];
  const currentQuestion = questions[currentIndex];

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Anti-cheating event listeners
  useEffect(() => {
    if (examFinished || !isAntiCheatOn) return;

    const recordViolation = (reason: string) => {
      if (examFinished) return;
      const timeStr = new Date().toLocaleTimeString('id-ID');
      const logEntry = `[${timeStr}] ${reason}`;
      const newCount = cheatCountRef.current + 1;

      setCheatCount(newCount);
      setCheatLog((prev) => [...prev, logEntry]);

      if (newCount >= maxWarnings) {
        setCheatModalMsg(
          `Batas toleransi pelanggaran (${maxWarnings}x) telah tercapai! Ujian Anda otomatis dikumpulkan demi integritas asesmen.`
        );
        setShowCheatModal(true);
        setTimeout(() => {
          handleSubmitExam();
        }, 3000);
      } else {
        setCheatModalMsg(
          `Peringatan ${newCount} dari ${maxWarnings}: Sistem mendeteksi Anda berpindah aplikasi atau meninggalkan tab ujian. Aktivitas ini dicatat dalam sistem!`
        );
        setShowCheatModal(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('Terdeteksi berpindah tab browser atau meminimalkan layar.');
      }
    };

    const handleWindowBlur = () => {
      // Trigger warning when window loses focus
      recordViolation('Terdeteksi jendela ujian kehilangan fokus (membuka aplikasi lain).');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12, Ctrl+U, Ctrl+Shift+I, Alt+Tab prevention alert
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        recordViolation('Mencoba membuka fitur inspeksi / shortcut tombol terlarang.');
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && !examFinished) {
        recordViolation('Keluar dari mode layar penuh (fullscreen).');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [examFinished, isAntiCheatOn, maxWarnings]);

  // Countdown timer
  useEffect(() => {
    if (examFinished) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [examFinished]);

  const handleAutoSubmit = () => {
    handleSubmitExam();
  };

  const handleAnswerChange = (val: any) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  const toggleDoubtful = () => {
    if (!currentQuestion) return;
    setDoubtful((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const isQuestionAnswered = (qId: string): boolean => {
    const val = answers[qId];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    if (typeof val === 'object' && Object.keys(val).length === 0) return false;
    return true;
  };

  const answeredCount = questions.filter((q) => isQuestionAnswered(q.id)).length;
  const doubtfulCount = Object.values(doubtful).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;

  const handleSubmitExam = async () => {
    clearInterval(timerRef.current);
    setShowConfirmModal(false);

    const elapsedSeconds = Math.max(
      10,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    );

    // Automatic grading engine
    const scoreData = gradeExam(exam, answers);

    const result: ExamResult = {
      id: `res-${Date.now()}-${student.presensiNumber}`,
      studentId: `std-${student.presensiNumber}`,
      studentName: student.fullName,
      presensiNumber: student.presensiNumber,
      schoolName: student.schoolName,
      grade: student.grade,
      examId: exam.id,
      examTitle: exam.title,
      score: scoreData.score,
      totalEarnedPoints: scoreData.totalEarnedPoints,
      totalMaxPoints: scoreData.totalMaxPoints,
      percentage: scoreData.percentage,
      isPassed: scoreData.isPassed,
      completedAt: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      answers,
      doubtfulAnswers: doubtful,
      breakdown: scoreData.breakdown,
      cheatCount: cheatCountRef.current,
      cheatLog: cheatLog,
    };

    // Save to persistent storage
    storage.addResult(result);
    setFinalResult(result);
    setExamFinished(true);
    onFinishExam(result);

    // Sync to Supabase online database if configured
    if (isSupabaseConfigured()) {
      insertResultToSupabase(result).then((success) => {
        if (success) {
          setIsOnlineSaved(true);
        }
      });
    }

    // Trigger celebratory confetti
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#DC2626', '#E11D48', '#F59E0B', '#10B981'],
    });
  };

  // Format timer MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const isTimeCritical = secondsRemaining < 300; // less than 5 minutes

  const fontSizeClasses = {
    normal: 'text-base',
    large: 'text-lg',
    xl: 'text-xl',
  };

  // Guard: If exam is not active/released
  if (exam.status !== 'active') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-amber-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Soal Belum Dirilis oleh Admin</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Mata pelajaran <strong>{exam.title}</strong> saat ini belum atau sudah tidak dirilis oleh pengawas ruangan. Siswa belum diizinkan mengerjakan soal ini.
          </p>
          <button
            type="button"
            onClick={onGoToDashboard}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RESULT SCREEN AFTER SUBMISSION
  // ==========================================
  if (examFinished && finalResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Top banner */}
          <div className="bg-red-600 p-8 text-white text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-red-200">
              Evaluasi Selesai · Asesmen Sumatif Akhir Semester
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              Selamat, {finalResult.studentName}!
            </h2>
            <p className="text-xs sm:text-sm text-red-100 max-w-lg mx-auto">
              Jawaban Anda telah selesai dikoreksi secara otomatis oleh sistem CBT {finalResult.schoolName}.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Score Showcase Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Nilai Akhir */}
              <div className="p-6 rounded-2xl bg-red-50/70 border border-red-200 text-center flex flex-col justify-center">
                <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                  Nilai Akhir Ujian
                </span>
                <span className="text-5xl font-black text-red-700 font-mono my-2 tabular-nums">
                  {finalResult.score}
                </span>
                <span className="text-xs text-red-600 font-medium">
                  {finalResult.totalEarnedPoints} dari {finalResult.totalMaxPoints} poin maksimal
                </span>
              </div>

              {/* Status KKM */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Status Kelulusan
                </span>
                <span
                  className={`text-xl font-bold my-2 ${
                    finalResult.isPassed ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {finalResult.isPassed ? 'TUNTAS (LULUS)' : 'PERLU REMIDIAL'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Standar KKM: {exam.passingScore}.0
                </span>
              </div>

              {/* Durasi Pengerjaan */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Durasi Pengerjaan
                </span>
                <span className="text-2xl font-bold text-slate-800 font-mono my-2 tabular-nums">
                  {Math.floor(finalResult.durationSeconds / 60)} Menit {finalResult.durationSeconds % 60} Detik
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  No. Presensi {finalResult.presensiNumber} · {finalResult.grade}
                </span>
              </div>
            </div>

            {/* Anti-cheat Integrity Summary */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              (finalResult.cheatCount || 0) === 0
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center gap-2.5">
                {(finalResult.cheatCount || 0) === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold block">
                    {(finalResult.cheatCount || 0) === 0
                      ? 'Integritas Ujian: Bersih & Terverifikasi (0 Pelanggaran)'
                      : `Integritas Ujian: Tercatat ${finalResult.cheatCount}x Peringatan Berpindah Tab/Layar`}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Sistem anti-curang mencatat aktivitas kepatuhan peserta selama sesi ujian berlangsung.
                  </span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-md font-bold text-center self-start sm:self-auto ${
                (finalResult.cheatCount || 0) === 0 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
              }`}>
                {(finalResult.cheatCount || 0) === 0 ? 'Integritas 100%' : `${finalResult.cheatCount} Peringatan`}
              </span>
            </div>

            {/* Online Supabase Sync Status */}
            {isOnlineSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Nilai ujian berhasil tersimpan online ke database Supabase dan langsung terintegrasi di Leaderboard!</span>
              </div>
            )}

            {/* Actions: Download PDF, Leaderboard, Home */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => downloadExamResultPdf(finalResult, config)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Unduh Hasil Tes (PDF Resmi)</span>
              </button>

              <button
                type="button"
                onClick={onGoToLeaderboard}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-300 text-sm shadow-xs transition-all cursor-pointer"
              >
                <Award className="w-4 h-4 text-red-600" />
                <span>Lihat Peringkat Nilai</span>
              </button>

              <button
                type="button"
                onClick={onGoToDashboard}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Kembali ke Beranda</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE CBT TEST PLAYER INTERFACE
  // ==========================================
  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      className="min-h-screen bg-slate-100 flex flex-col select-none"
    >
      {/* 1. TOP STATUS BAR (Countdown Timer, Student Info, Font Size Controls, Fullscreen) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Subject & Student Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {exam.subjectCode.slice(0, 3)}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {exam.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">No. {student.presensiNumber}</span>
                <span>·</span>
                <span className="truncate max-w-[150px] sm:max-w-none">{student.fullName}</span>
                <span>·</span>
                <span>{student.grade}</span>
                {isAntiCheatOn && (
                  <>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Anti-Curang Aktif
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Font size toggle, Fullscreen, & Countdown timer */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
              title="Layar Penuh"
            >
              <Maximize2 className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">{isFullscreen ? 'Keluar Full' : 'Layar Penuh'}</span>
            </button>
            {/* Font size selectors for elementary students */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded transition-colors ${fontSize === 'normal' ? 'bg-white shadow-xs text-red-700' : 'hover:text-slate-900'}`}
                title="Ukuran teks normal"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded transition-colors text-sm ${fontSize === 'large' ? 'bg-white shadow-xs text-red-700' : 'hover:text-slate-900'}`}
                title="Ukuran teks besar"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize('xl')}
                className={`px-2 py-1 rounded transition-colors text-base ${fontSize === 'xl' ? 'bg-white shadow-xs text-red-700' : 'hover:text-slate-900'}`}
                title="Ukuran teks ekstra besar"
              >
                A++
              </button>
            </div>

            {/* Timer countdown */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-mono font-bold text-sm sm:text-base border transition-all ${
                isTimeCritical
                  ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-400'
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-600' : 'text-slate-500'}`} />
              <span className="tabular-nums">{formatTime(secondsRemaining)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN TEST CONTENT & QUESTION PALETTE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6 w-full">
        {/* Left / Center Zone: Stimulus & Current Question (8 cols) */}
        <div className="flex-1 space-y-5">
          {/* Question Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header: Question number & point */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
                  Butir Soal {currentIndex + 1} dari {questions.length}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">Bobot: {currentQuestion?.points} Poin</span>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                {currentQuestion?.type === 'mc_single' && 'Pilihan Ganda Sederhana'}
                {currentQuestion?.type === 'mc_mcma' && 'Pilihan Ganda Kompleks (MCMA)'}
                {currentQuestion?.type === 'mc_category' && 'Pilihan Ganda Kategori'}
                {currentQuestion?.type === 'short_answer' && 'Isian Singkat'}
                {currentQuestion?.type === 'matching' && 'Menjodohkan (Matching)'}
                {currentQuestion?.type === 'essay' && 'Uraian Pemecahan Masalah'}
              </span>
            </div>

            {/* Stimulus if present */}
            {currentQuestion && currentQuestion.stimulusType !== 'none' && (
              <StimulusRenderer
                stimulusType={currentQuestion.stimulusType}
                stimulusTitle={currentQuestion.stimulusTitle}
                stimulusText={currentQuestion.stimulusText}
                stimulusImage={currentQuestion.stimulusImage}
                stimulusChart={currentQuestion.stimulusChart}
                stimulusLink={currentQuestion.stimulusLink}
              />
            )}

            {/* Interactive Question Input */}
            {currentQuestion && (
              <QuestionRenderer
                question={currentQuestion}
                userAnswer={answers[currentQuestion.id]}
                onChangeAnswer={handleAnswerChange}
                fontSizeClass={fontSizeClasses[fontSize]}
              />
            )}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Previous */}
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {/* Ragu-Ragu toggle */}
            <button
              type="button"
              onClick={toggleDoubtful}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                currentQuestion && doubtful[currentQuestion.id]
                  ? 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-amber-50 hover:text-amber-800'
              }`}
            >
              <input
                type="checkbox"
                readOnly
                checked={currentQuestion ? !!doubtful[currentQuestion.id] : false}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span>Ragu-Ragu</span>
            </button>

            {/* Next or Submit */}
            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesai Ujian</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Zone: Question Palette Grid (4 cols on lg) */}
        <aside className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Navigasi Nomor Soal</h3>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {answeredCount}/{questions.length} Dijawab
              </span>
            </div>

            {/* Number grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2.5">
              {questions.map((q, idx) => {
                const isCurrent = currentIndex === idx;
                const isAnswered = isQuestionAnswered(q.id);
                const isDoubt = doubtful[q.id];

                let btnStyle = 'bg-white border-slate-300 text-slate-700 hover:border-slate-400';
                if (isAnswered) {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                }
                if (isDoubt) {
                  btnStyle = 'bg-amber-400 text-slate-900 border-amber-500 font-bold';
                }
                if (isCurrent) {
                  btnStyle += ' ring-2 ring-red-600 ring-offset-2';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend / Keterangan Warna */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-emerald-600 shrink-0" />
                <span>Sudah Dijawab ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-amber-400 shrink-0" />
                <span>Ragu-Ragu ({doubtfulCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-white border border-slate-300 shrink-0" />
                <span>Belum Dijawab ({unansweredCount})</span>
              </div>
            </div>

            {/* Selesai button in sidebar */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kumpulkan & Selesai Ujian</span>
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* 3. CONFIRMATION MODAL BEFORE SUBMIT */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Konfirmasi Selesai Ujian</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Apakah Anda yakin ingin mengakhiri dan mengirimkan jawaban asesmen ini?
                </p>
              </div>

              {/* Status summary */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 text-left">
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Soal telah dijawab:</span>
                  <span>{answeredCount} butir</span>
                </div>
                {doubtfulCount > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Masih ragu-ragu:</span>
                    <span>{doubtfulCount} butir</span>
                  </div>
                )}
                {unansweredCount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Belum dijawab:</span>
                    <span>{unansweredCount} butir</span>
                  </div>
                )}
              </div>

              {unansweredCount > 0 && (
                <p className="text-[11px] text-rose-600 font-medium">
                  Perhatian: Masih terdapat soal yang belum dijawab. Jawaban kosong bernilai 0.
                </p>
              )}

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl bg-white"
                >
                  Periksa Kembali
                </button>
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Ya, Selesai & Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ANTI-CHEAT VIOLATION WARNING MODAL */}
      {showCheatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-rose-500 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-600 p-6 text-white text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto border-2 border-white/40">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black">PERINGATAN INTEGRITAS CBT!</h3>
              <p className="text-xs text-rose-100">
                SD Negeri Selomerto · Sistem Pemantau Ujian Aktif
              </p>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-950 leading-relaxed">
                {cheatModalMsg}
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  Pelanggaran tercatat:{' '}
                  <span className="font-bold text-rose-600">
                    {cheatCount} dari {maxWarnings} kali kesempatan
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Dilarang membuka tab lain, berpindah jendela, meminimalkan layar, atau menggunakan tombol pintasan selama ujian.
                </p>
              </div>

              {cheatCount < maxWarnings ? (
                <button
                  type="button"
                  onClick={() => setShowCheatModal(false)}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
                >
                  Saya Mengerti & Kembali Mengerjakan Soal
                </button>
              ) : (
                <p className="text-xs font-bold text-rose-700 animate-pulse">
                  Mengumpulkan lembar jawaban secara otomatis...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
