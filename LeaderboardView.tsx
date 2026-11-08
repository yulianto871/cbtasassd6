import React, { useState } from 'react';
import { ExamResult, ExamSubject } from '../types/cbt';
import { exportResultsToExcel } from '../utils/spreadsheetExporter';
import { Award, Trophy, Medal, Search, FileSpreadsheet, ArrowUpDown, RefreshCw } from 'lucide-react';

interface LeaderboardViewProps {
  results: ExamResult[];
  exams: ExamSubject[];
  onStartExam: (examId?: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isOnline?: boolean;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  results,
  exams,
  onStartExam,
  onRefresh,
  isRefreshing = false,
  isOnline = false,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter results
  let filtered = results.filter((r) => {
    const matchExam = selectedExamId === 'all' || r.examId === selectedExamId;
    const matchSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.presensiNumber).includes(searchQuery);
    return matchExam && matchSearch;
  });

  // Sort descending by score, then ascending by duration
  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.durationSeconds - b.durationSeconds;
  });

  const top1 = filtered[0];
  const top2 = filtered[1];
  const top3 = filtered[2];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase tracking-wider">
            <span>Papan Prestasi</span>
            <span>·</span>
            <span>SD Negeri Selomerto</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Leaderboard Hasil ASAS Kelas 6
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Peringkat pencapaian nilai asesmen sumatif akhir semester seluruh peserta didik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onRefresh && (
            <button
              type="button"
              disabled={isRefreshing}
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Perbarui data nilai online dari Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-red-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Sinkron Nilai'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => exportResultsToExcel(filtered, 'Leaderboard_ASAS')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Spreadsheet Excel</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {filtered.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 (Silver) */}
          {top2 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center text-center shadow-xs order-2 sm:order-1 sm:mt-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg border-2 border-slate-300 mb-3">
                🥈 2
              </div>
              <span className="text-xs font-semibold text-slate-400">Peringkat 2</span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5 truncate max-w-full">
                {top2.studentName}
              </h4>
              <p className="text-xs text-slate-500">
                Presensi No. {top2.presensiNumber} · {top2.grade}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 w-full flex justify-between items-center text-xs">
                <span className="text-slate-500">{top2.examTitle.split('-')[0]}</span>
                <span className="text-xl font-mono font-bold text-slate-800 tabular-nums">
                  {top2.score}
                </span>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold) */}
          {top1 && (
            <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 flex flex-col items-center text-center shadow-md order-1 sm:order-2 bg-gradient-to-b from-amber-50/50 to-white">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-2xl border-2 border-amber-400 mb-3 shadow-inner">
                👑 1
              </div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Juara 1 Tertinggi
              </span>
              <h4 className="text-lg font-black text-slate-900 mt-0.5 truncate max-w-full">
                {top1.studentName}
              </h4>
              <p className="text-xs text-slate-500">
                Presensi No. {top1.presensiNumber} · SD Negeri Selomerto
              </p>
              <div className="mt-4 pt-3 border-t border-amber-200 w-full flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">{top1.examTitle.split('-')[0]}</span>
                <span className="text-3xl font-mono font-black text-red-700 tabular-nums">
                  {top1.score}
                </span>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center text-center shadow-xs order-3 sm:order-3 sm:mt-8">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-lg border-2 border-amber-300 mb-3">
                🥉 3
              </div>
              <span className="text-xs font-semibold text-slate-400">Peringkat 3</span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5 truncate max-w-full">
                {top3.studentName}
              </h4>
              <p className="text-xs text-slate-500">
                Presensi No. {top3.presensiNumber} · {top3.grade}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 w-full flex justify-between items-center text-xs">
                <span className="text-slate-500">{top3.examTitle.split('-')[0]}</span>
                <span className="text-xl font-mono font-bold text-slate-800 tabular-nums">
                  {top3.score}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Exam subject filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto w-full sm:w-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setSelectedExamId('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              selectedExamId === 'all'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Mapel
          </button>
          {exams.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setSelectedExamId(ex.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedExamId === ex.id
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {ex.subjectCode}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau no presensi..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Complete Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-3 w-16 text-center">Presensi</th>
                <th className="py-3.5 px-4">Nama Peserta Didik</th>
                <th className="py-3.5 px-4">Mata Pelajaran</th>
                <th className="py-3.5 px-4 text-center">Nilai Akhir</th>
                <th className="py-3.5 px-4 text-center">Ketuntasan</th>
                <th className="py-3.5 px-4 text-center">Durasi</th>
                <th className="py-3.5 px-4 text-right">Waktu Submit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    Belum ada data nilai asesmen yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filtered.map((res, index) => {
                  const rank = index + 1;
                  const isTopRank = rank <= 3;
                  return (
                    <tr
                      key={res.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isTopRank ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            rank === 1
                              ? 'bg-amber-100 text-amber-800'
                              : rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : rank === 3
                              ? 'bg-orange-100 text-orange-800'
                              : 'text-slate-600'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                        {res.presensiNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{res.studentName}</span>
                        <span className="text-[11px] text-slate-500">
                          {res.schoolName} · {res.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {res.examTitle}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-extrabold text-base text-red-700 tabular-nums">
                        {res.score}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                            res.score >= 75
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {res.score >= 75 ? 'Tuntas' : 'Remidial'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-600 tabular-nums">
                        {Math.floor(res.durationSeconds / 60)}m {res.durationSeconds % 60}s
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                        {new Date(res.completedAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
  );
};
