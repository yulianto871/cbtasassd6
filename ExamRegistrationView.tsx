import React, { useState } from 'react';
import { ExamSubject, StudentMember, LandingPageConfig } from '../types/cbt';
import {
  User,
  School,
  Hash,
  GraduationCap,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface ExamRegistrationViewProps {
  exams: ExamSubject[];
  students: StudentMember[];
  config: LandingPageConfig;
  preselectedExamId?: string;
  onStartExamSession: (studentData: {
    fullName: string;
    presensiNumber: number;
    schoolName: string;
    grade: string;
    exam: ExamSubject;
  }) => void;
  onGoToDashboard: () => void;
}

export const ExamRegistrationView: React.FC<ExamRegistrationViewProps> = ({
  exams,
  students,
  config,
  preselectedExamId,
  onStartExamSession,
  onGoToDashboard,
}) => {
  const releasedExams = exams.filter((e) => e.status === 'active');

  // Pre-select exam: prioritize preselected if active, or first active exam
  const initialExamId = () => {
    if (preselectedExamId) {
      const match = exams.find((e) => e.id === preselectedExamId);
      if (match && match.status === 'active') return match.id;
    }
    return releasedExams[0]?.id || exams[0]?.id || '';
  };

  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId());
  const [fullName, setFullName] = useState<string>('');
  const [presensiNumber, setPresensiNumber] = useState<string>('');
  const [customPassword, setCustomPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fixed values according to requirements
  const schoolName = 'SD Negeri Selomerto'; // Otomatis
  const grade = 'Kelas 6'; // Otomatis

  // Fast auto-fill when student chooses their presensi number
  const handlePresensiChange = (val: string) => {
    setPresensiNumber(val);
    setErrorMsg('');
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      const found = students.find((s) => s.presensiNumber === num);
      if (found) {
        setFullName(found.fullName);
      }
    }
  };

  const handleSelectStudent = (st: StudentMember) => {
    setFullName(st.fullName);
    setPresensiNumber(String(st.presensiNumber));
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Nama Lengkap siswa wajib diisikan!');
      return;
    }
    const pNum = parseInt(presensiNumber, 10);
    if (isNaN(pNum) || pNum < 1 || pNum > 50) {
      setErrorMsg('Nomor Presensi harus berupa angka 1 - 50!');
      return;
    }

    const targetExam = exams.find((ex) => ex.id === selectedExamId);
    if (!targetExam) {
      setErrorMsg('Silakan pilih mata pelajaran ujian!');
      return;
    }

    // Release check
    if (targetExam.status !== 'active') {
      setErrorMsg(
        `Soal untuk mata pelajaran "${targetExam.title}" belum dirilis oleh admin/pengawas! Silakan pilih mata pelajaran yang sudah berstatus 'Dirilis' atau tunggu instruksi pengawas ruangan.`
      );
      return;
    }

    // Password custom verification
    const passInput = customPassword.trim();
    if (!passInput) {
      setErrorMsg('Password custom siswa wajib diisikan!');
      return;
    }

    // Verify against student's registered custom password
    const studentMatch = students.find((s) => s.presensiNumber === pNum);
    const validStudentPass = studentMatch?.customPassword;

    // If student is registered in roster, verify custom password matches
    if (validStudentPass && passInput.toLowerCase() !== validStudentPass.toLowerCase()) {
      setErrorMsg(
        `Password custom tidak cocok untuk ${studentMatch.fullName}! Silakan periksa kembali password akun siswa Anda.`
      );
      return;
    }

    // Success -> Start exam session
    onStartExamSession({
      fullName: fullName.trim(),
      presensiNumber: pNum,
      schoolName,
      grade,
      exam: targetExam,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-200">
                Pendaftaran & Masuk CBT
              </span>
              <h2 className="text-xl sm:text-2xl font-black mt-1 text-white">
                Formulir Peserta ASAS Kelas 6
              </h2>
              <p className="text-xs text-red-100 mt-1">
                Lengkapi identitas siswa di bawah ini untuk memulai pengerjaan tes.
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Quick select chip bar for students */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-red-600" /> Pilih Cepat Berdasarkan Nomor Presensi:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {students.slice(0, 15).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleSelectStudent(st)}
                className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                  presensiNumber === String(st.presensiNumber)
                    ? 'bg-red-600 text-white border-red-600 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
                }`}
              >
                No. {st.presensiNumber} - {st.fullName.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs font-semibold text-rose-900 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* 1. Nama Sekolah (OTOMATIS SD Negeri Selomerto) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-red-600" />
                <span>Nama Sekolah (Otomatis)</span>
              </label>
              <input
                type="text"
                readOnly
                value={schoolName}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-not-allowed select-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                * Terkunci otomatis untuk SD Negeri Selomerto
              </span>
            </div>

            {/* 2. Kelas 6 (OTOMATIS Kelas 6) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-red-600" />
                <span>Kelas (Otomatis)</span>
              </label>
              <input
                type="text"
                readOnly
                value={grade}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-not-allowed select-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                * Terkunci otomatis untuk Jenjang Kelas 6
              </span>
            </div>

            {/* 3. Nomor Presensi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-red-600" />
                <span>Nomor Presensi (Wajib)</span>
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={presensiNumber}
                onChange={(e) => handlePresensiChange(e.target.value)}
                placeholder="Contoh: 1, 2, 3..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Masukkan nomor absen di kelas
              </span>
            </div>

            {/* 4. Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-red-600" />
                <span>Nama Lengkap Siswa (Wajib)</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan nama lengkap siswa..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 5. Mata Pelajaran ASAS */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Mata Pelajaran Asesmen:
              </label>
              <span className="text-[11px] text-slate-500">
                {releasedExams.length} dari {exams.length} Mapel Telah Dirilis
              </span>
            </div>

            {releasedExams.length === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 mb-3">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">Belum Ada Soal yang Dirilis</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Pengawas ujian belum merilis soal asesmen. Siswa belum dapat memulai tes hingga pengawas mengklik tombol <strong>"Rilis Soal"</strong> di panel pengawas CBT.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exams.map((ex) => {
                const isReleased = ex.status === 'active';
                const isSelected = selectedExamId === ex.id;

                return (
                  <label
                    key={ex.id}
                    onClick={() => {
                      if (!isReleased) {
                        setErrorMsg(
                          `Soal untuk ${ex.title} belum dirilis oleh pengawas. Silakan pilih mapel yang sudah berstatus 'Dirilis'.`
                        );
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      !isReleased
                        ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                        : isSelected
                        ? 'border-red-600 bg-red-50/50 ring-1 ring-red-600 cursor-pointer'
                        : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exam-choice"
                      disabled={!isReleased}
                      value={ex.id}
                      checked={isSelected && isReleased}
                      onChange={() => {
                        if (isReleased) {
                          setSelectedExamId(ex.id);
                          setErrorMsg('');
                        }
                      }}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-sm font-bold ${
                            isReleased ? 'text-slate-900' : 'text-slate-500'
                          }`}
                        >
                          {ex.title}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap shrink-0 ${
                            isReleased
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isReleased ? '🟢 Dirilis' : '🔒 Belum Dirilis'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {ex.durationMinutes} Menit · {ex.questions.length} Butir Soal · KKM {ex.passingScore}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 6. Password Custom Siswa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-red-600" />
                <span>Password Custom Siswa (Wajib)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Sesuai akun yang dibagikan guru
              </span>
            </label>
            <input
              type="password"
              required
              value={customPassword}
              onChange={(e) => {
                setCustomPassword(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Masukkan password custom siswa (contoh: faiz6)..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onGoToDashboard}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Kembali ke Beranda
            </button>

            <button
              type="submit"
              disabled={releasedExams.length === 0}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 font-bold rounded-xl shadow-md text-sm transition-all ${
                releasedExams.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
              }`}
            >
              <span>Mulai Kerjakan Asesmen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
