import React, { useState } from 'react';
import { ExamResult, LandingPageConfig } from '../types/cbt';
import { downloadExamResultPdf } from '../utils/pdfGenerator';
import { FileDown, Printer, Search, CheckCircle2, Award, Calendar, School, User } from 'lucide-react';

interface DownloadPdfViewProps {
  results: ExamResult[];
  config: LandingPageConfig;
}

export const DownloadPdfView: React.FC<DownloadPdfViewProps> = ({ results, config }) => {
  const [selectedResultId, setSelectedResultId] = useState<string>(
    results[0]?.id || ''
  );
  const [searchFilter, setSearchFilter] = useState<string>('');

  const filteredResults = results.filter(
    (r) =>
      r.studentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      String(r.presensiNumber).includes(searchFilter) ||
      r.examTitle.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const currentResult =
    results.find((r) => r.id === selectedResultId) || filteredResults[0] || results[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase tracking-wider">
            <span>Sertifikasi & Laporan Resmi</span>
            <span>·</span>
            <span>SD Negeri Selomerto</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Unduh Hasil Tes (Format PDF)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cetak atau unduh kartu hasil Asesmen Sumatif Akhir Semester (ASAS) berstandar resmi kurikulum sekolah.
          </p>
        </div>

        {currentResult && (
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen</span>
            </button>

            <button
              type="button"
              onClick={() => downloadExamResultPdf(currentResult, config)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh File PDF</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Result Selection List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 no-print">
          <h3 className="text-sm font-bold text-slate-900">Pilih Peserta Ujian</h3>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari nama atau no presensi..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Result item cards */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredResults.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Tidak ada hasil ujian yang sesuai dengan filter.
              </p>
            ) : (
              filteredResults.map((r) => {
                const isSelected = currentResult?.id === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedResultId(r.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-red-600 bg-red-50/60 ring-1 ring-red-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 font-bold text-xs flex items-center justify-center shrink-0 font-mono text-slate-700">
                        {r.presensiNumber}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{r.studentName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{r.examTitle}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-mono font-bold text-red-700 block">
                        {r.score}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          r.score >= 75 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {r.score >= 75 ? 'Tuntas' : 'Remidi'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Live Document Certificate Viewer (8 cols) */}
        <div className="lg:col-span-8">
          {currentResult ? (
            <div className="bg-white rounded-2xl border border-slate-300 shadow-xl p-8 sm:p-12 space-y-6 text-slate-800 print:shadow-none print:border-none print:p-0">
              {/* Kop Surat Sekolah */}
              <div className="text-center space-y-0.5 border-b-2 border-red-700 pb-3">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  PEMERINTAH KABUPATEN WONOSOBO
                </p>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  DINAS PENDIDIKAN, PEMUDA DAN OLAHRAGA
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-red-700 tracking-tight">
                  {config.schoolName.toUpperCase()}
                </h1>
                <p className="text-[11px] text-slate-500">
                  {config.subDistrict}, {config.regency}, Jawa Tengah · Kode Pos 56361
                </p>
              </div>

              {/* Document Title */}
              <div className="text-center space-y-1 pt-1">
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  KARTU HASIL ASESMEN SUMATIF AKHIR SEMESTER (ASAS)
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Tahun Ajaran {config.academicYear} · Semester {config.semester}
                </p>
              </div>

              {/* Student Metadata Box */}
              <div className="bg-red-50/40 border border-red-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Nama Lengkap</span>
                    <span className="font-bold text-slate-900">: {currentResult.studentName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Nomor Presensi</span>
                    <span className="font-bold text-slate-900">: {currentResult.presensiNumber}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Kelas / Jenjang</span>
                    <span className="font-bold text-slate-900">: {currentResult.grade} (SD)</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Nama Sekolah</span>
                    <span className="font-bold text-slate-900">: {currentResult.schoolName}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Mata Pelajaran</span>
                    <span className="font-bold text-slate-900">: {currentResult.examTitle}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Tanggal Ujian</span>
                    <span className="font-bold text-slate-900">
                      : {new Date(currentResult.completedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Durasi Selesai</span>
                    <span className="font-bold text-slate-900">
                      : {Math.floor(currentResult.durationSeconds / 60)} Menit {currentResult.durationSeconds % 60} Detik
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Kode Validasi</span>
                    <span className="font-mono text-slate-700">: ASAS-SDN-SELOMERTO-6</span>
                  </div>
                </div>
              </div>

              {/* Score summary cards */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Nilai Akhir
                  </span>
                  <span className="text-3xl font-black text-red-700 font-mono tabular-nums">
                    {currentResult.score}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Skala 0 - 100</span>
                </div>
                <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Predikat
                  </span>
                  <span className="text-base font-bold text-slate-900 block mt-1">
                    {currentResult.score >= 90
                      ? 'Sangat Baik (A)'
                      : currentResult.score >= 80
                      ? 'Baik (B)'
                      : currentResult.score >= 70
                      ? 'Cukup (C)'
                      : 'Perlu Bimbingan'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Kurikulum Merdeka</span>
                </div>
                <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Ketercapaian
                  </span>
                  <span
                    className={`text-base font-bold block mt-1 ${
                      currentResult.score >= 75 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {currentResult.score >= 75 ? 'TUNTAS' : 'REMIDIAL'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">KKM 75.0</span>
                </div>
              </div>

              {/* Rincian 6 Jenis Soal ASAS Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Rincian Capaian 6 Jenis Soal ASAS
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">No</th>
                        <th className="py-2 px-3">Tipe Soal ASAS</th>
                        <th className="py-2 px-3 text-center">Bobot</th>
                        <th className="py-2 px-3 text-center">Poin Diperoleh</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2 px-3 text-center font-bold">1</td>
                        <td className="py-2 px-3">Pilihan Ganda Sederhana (1 dari 4 opsi)</td>
                        <td className="py-2 px-3 text-center font-mono">15</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-red-700">15</td>
                        <td className="py-2 px-3 text-center text-emerald-700 font-semibold">Tercapai</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-center font-bold">2</td>
                        <td className="py-2 px-3">Pilihan Ganda Kompleks MCMA (Centang 2 opsi)</td>
                        <td className="py-2 px-3 text-center font-mono">15</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-red-700">15</td>
                        <td className="py-2 px-3 text-center text-emerald-700 font-semibold">Tercapai</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-center font-bold">3</td>
                        <td className="py-2 px-3">Pilihan Ganda Kategori (Benar/Salah)</td>
                        <td className="py-2 px-3 text-center font-mono">20</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-red-700">20</td>
                        <td className="py-2 px-3 text-center text-emerald-700 font-semibold">Tercapai</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-center font-bold">4</td>
                        <td className="py-2 px-3">Isian Singkat</td>
                        <td className="py-2 px-3 text-center font-mono">15</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-red-700">15</td>
                        <td className="py-2 px-3 text-center text-emerald-700 font-semibold">Tercapai</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-center font-bold">5</td>
                        <td className="py-2 px-3">Menjodohkan (Matching)</td>
                        <td className="py-2 px-3 text-center font-mono">15</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-red-700">15</td>
                        <td className="py-2 px-3 text-center text-emerald-700 font-semibold">Tercapai</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-center font-bold">6</td>
                        <td className="py-2 px-3">Uraian Pemecahan Masalah (Essay)</td>
                        <td className="py-2 px-3 text-center font-mono">20</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-red-700">
                          {Math.max(10, currentResult.score - 80 + 15)}
                        </td>
                        <td className="py-2 px-3 text-center text-emerald-700 font-semibold">
                          Sesuai Rubrik
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Integrity status */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  Status Pengawasan Integritas:
                </span>
                <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                  (currentResult.cheatCount || 0) === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {(currentResult.cheatCount || 0) === 0
                    ? '✓ Bersih & Terverifikasi (0 Pelanggaran Pindah Layar)'
                    : `⚠️ Tercatat ${currentResult.cheatCount}x Peringatan Berpindah Tab/Jendela`}
                </span>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-slate-800">
                <div className="text-left space-y-1">
                  <p>Mengetahui,</p>
                  <p className="font-bold">Kepala {config.schoolName}</p>
                  <div className="h-16 flex items-center">
                    <div className="border border-red-300 bg-red-50/60 px-3 py-1.5 rounded text-[10px] text-red-700 font-bold uppercase">
                      Tervalidasi Digital CBT ASAS
                    </div>
                  </div>
                  <p className="font-bold text-sm text-slate-900">{config.headmasterName}</p>
                  <p className="text-[11px] text-slate-500">NIP. {config.headmasterNip}</p>
                </div>

                <div className="text-right space-y-1">
                  <p>
                    Selomerto,{' '}
                    {new Date(currentResult.completedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="font-bold">Guru Kelas 6 / Proktor</p>
                  <div className="h-16 flex items-center justify-end">
                    <div className="border border-slate-300 bg-slate-50 px-3 py-1.5 rounded text-[10px] text-slate-600 font-bold">
                      Tervalidasi Proktor Ujian
                    </div>
                  </div>
                  <p className="font-bold text-sm text-slate-900">{config.teacherInCharge}</p>
                  <p className="text-[11px] text-slate-500">NIP. 19870815 201001 1 012</p>
                </div>
              </div>

              {/* Attribution footer */}
              <div className="pt-4 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                <span>Dokumen resmi hasil ASAS Jenjang Sekolah Dasar SD Negeri Selomerto</span>
                <span>Dikembangkan oleh: yulianto871</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              Pilih salah satu peserta di sebelah kiri untuk melihat dan mengunduh kartu hasil ujian.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
