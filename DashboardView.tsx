import React, { useState } from 'react';
import { LandingPageConfig, ExamSubject, StudentMember, ExamResult } from '../types/cbt';
import {
  ArrowRight,
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  Megaphone,
  Users,
  Sparkles,
  FileSpreadsheet,
  Lock,
  AlertCircle,
  Send,
} from 'lucide-react';

interface DashboardViewProps {
  config: LandingPageConfig;
  exams: ExamSubject[];
  students: StudentMember[];
  results: ExamResult[];
  onStartExam: (examId?: string) => void;
  onGoToLeaderboard: () => void;
  onOpenAdminLogin: () => void;
  isAdminLoggedIn: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  config,
  exams,
  students,
  results,
  onStartExam,
  onGoToLeaderboard,
  onOpenAdminLogin,
  isAdminLoggedIn,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'released'>('all');
  const activeExams = exams.filter((e) => e.status === 'active');
  const displayedExams = filterMode === 'released' ? activeExams : exams;
  const uniqueStudentsCompleted = new Set(results.map((r) => r.studentId)).size;

  return (
    <div className="space-y-12 pb-16">
      {/* 1. ANNOUNCEMENT STRIP */}
      {config.announcement && (
        <div className="bg-red-50/90 border-y border-red-200/80 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs text-red-950 font-medium">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-red-600 shrink-0" />
              <span>{config.announcement}</span>
            </div>
            <span className="hidden sm:inline-block font-medium text-[11px] text-red-700 bg-white px-2.5 py-0.5 rounded border border-red-200">
              Kelas 6 · SD Negeri Selomerto
            </span>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Text (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase tracking-wider">
                <span>{config.schoolName}</span>
                <span aria-hidden="true">·</span>
                <span>Tahun Ajaran {config.academicYear}</span>
                <span aria-hidden="true">·</span>
                <span>{config.semester}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {config.appTitle}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
                {config.welcomeMessage}
              </p>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onStartExam()}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all text-sm group"
              >
                <span>Daftar & Kerjakan Tes</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onGoToLeaderboard}
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-300 transition-all text-sm shadow-xs"
              >
                <Award className="w-4 h-4 text-red-600" />
                <span>Peringkat Nilai (Leaderboard)</span>
              </button>
            </div>

            {/* Trust and Key stats */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {activeExams.length}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Mata Pelajaran</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {students.length}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Siswa Terdaftar</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-red-700 font-mono tabular-nums">
                  {results.length}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Ujian Selesai</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">75.0</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Standar KKM</p>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Banner (5 cols) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100">
              <img
                src={config.heroBannerUrl}
                alt="Suasana Pelaksanaan CBT Siswa SD Negeri Selomerto"
                className="w-full h-80 lg:h-96 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">
                  Pelaksanaan ASAS Kelas 6
                </span>
                <p className="text-base font-bold text-white mt-0.5">
                  Fokus, Teliti, dan Junjung Tinggi Kejujuran
                </p>
                <p className="text-xs text-slate-200 mt-1">
                  SD Negeri Selomerto · Wonosobo, Jawa Tengah
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DAFTAR MATA PELAJARAN & STATUS RILIS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                Jadwal & Status Rilis Soal
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              Paket Ujian ASAS Kelas 6
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Soal pada setiap mata pelajaran hanya akan muncul untuk dikerjakan jika telah dirilis oleh pengawas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Mapel ({exams.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('released')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterMode === 'released'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Siap Dikerjakan ({activeExams.length})
              </button>
            </div>

            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 hidden sm:inline-block">
              Jadwal: {config.examDateRange}
            </span>
          </div>
        </div>

        {/* Notice when no exams are active */}
        {activeExams.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 mb-6">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Soal Ujian Belum Dirilis oleh Pengawas</h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Saat ini belum ada mata pelajaran yang dirilis oleh admin/pengawas. Siswa harap menunggu instruksi di ruang kelas. Begitu pengawas mengklik tombol <strong>"Rilis Soal"</strong>, tombol Mulai Ujian akan aktif secara otomatis.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedExams.map((exam) => {
            const isReleased = exam.status === 'active';

            return (
              <div
                key={exam.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between shadow-xs transition-all group ${
                  isReleased
                    ? 'bg-white border-slate-200 hover:border-red-300 hover:shadow-md'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      {exam.subjectCode}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {exam.durationMinutes}m
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          isReleased
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isReleased ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Telah Dirilis</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Belum Dirilis</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3
                      className={`text-lg font-bold transition-colors ${
                        isReleased
                          ? 'text-slate-900 group-hover:text-red-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {exam.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>{exam.grade}</span>
                      <span>·</span>
                      <span>{exam.questions.length} Butir Soal</span>
                      <span>·</span>
                      <span>KKM: {exam.passingScore}</span>
                    </div>
                  </div>

                  {/* Release status description banner */}
                  {!isReleased ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Soal mata pelajaran ini belum dibuka oleh pengawas. Menunggu tombol <strong>Rilis Soal</strong> diklik oleh admin.
                      </span>
                    </div>
                  ) : (
                    /* 6 Types of ASAS Questions Indicator */
                    <div className="pt-2 text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700 block mb-1">
                        Komposisi 6 Jenis Soal ASAS:
                      </span>
                      <span>
                        Pilihan Ganda · MCMA (2 opsi) · Kategori · Isian Singkat · Menjodohkan · Uraian
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Akses: Password Siswa
                  </span>

                  {isReleased ? (
                    <button
                      type="button"
                      onClick={() => onStartExam(exam.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Mulai Ujian</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          `Soal untuk mata pelajaran "${exam.title}" belum dirilis oleh admin/pengawas!\nSilakan tunggu instruksi pengawas ruangan.`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-lg text-xs border border-slate-200 cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Menunggu Rilis</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. TATA TERTIB & SAMBUTAN KEPALA SEKOLAH */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Rules (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-red-600" />
              Tata Tertib & Petunjuk Pengerjaan CBT ASAS
            </h3>
            <p className="text-xs text-slate-500">
              Harap dipahami oleh seluruh peserta didik sebelum mengklik tombol pengerjaan soal:
            </p>
            <div className="space-y-3 pt-2">
              {config.rules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                  <div className="w-5 h-5 rounded-full bg-red-50 text-red-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Headmaster Note & Proktor (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-red-700 tracking-wide uppercase">
                Pesan Kepala Sekolah
              </span>
              <p className="text-sm text-slate-700 italic leading-relaxed font-serif">
                "Asesmen Sumatif Akhir Semester bukan sekadar mencari nilai, melainkan cerminan
                proses belajar, ketekunan, dan kejujuran ananda sekalian. Tunjukkan kemampuan
                terbaik ananda dengan percaya diri."
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{config.headmasterName}</p>
                <p className="text-xs text-slate-500">NIP. {config.headmasterNip}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Kepala {config.schoolName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700">Proktor Pelaksana:</p>
                <p className="text-xs text-red-700 font-bold">{config.teacherInCharge}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
