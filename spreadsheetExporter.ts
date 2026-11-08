import * as XLSX from 'xlsx';
import { ExamResult, StudentMember } from '../types/cbt';

export function exportResultsToExcel(results: ExamResult[], subjectTitle: string = 'ASAS_Kelas_6'): void {
  const rows = results.map((r, idx) => ({
    'No Peringkat': idx + 1,
    'No Presensi': r.presensiNumber,
    'Nama Lengkap': r.studentName,
    'Sekolah': r.schoolName,
    'Kelas': r.grade,
    'Mata Pelajaran': r.examTitle,
    'Nilai Akhir': r.score,
    'Status KKM': r.score >= 75 ? 'TUNTAS' : 'REMIDIAL',
    'Predikat': r.score >= 90 ? 'A (Sangat Baik)' : r.score >= 80 ? 'B (Baik)' : r.score >= 70 ? 'C (Cukup)' : 'D (Perlu Bimbingan)',
    'Integritas (Anti-Curang)': (r.cheatCount || 0) === 0 ? 'Bersih (0 Peringatan)' : `${r.cheatCount}x Peringatan`,
    'Durasi (Menit)': Math.round(r.durationSeconds / 60),
    'Waktu Selesai': new Date(r.completedAt).toLocaleString('id-ID'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Peringkat
    { wch: 12 }, // Presensi
    { wch: 28 }, // Nama
    { wch: 22 }, // Sekolah
    { wch: 10 }, // Kelas
    { wch: 30 }, // Mapel
    { wch: 12 }, // Nilai
    { wch: 14 }, // Status KKM
    { wch: 18 }, // Predikat
    { wch: 24 }, // Integritas
    { wch: 14 }, // Durasi
    { wch: 22 }, // Waktu
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai ASAS');

  const fileName = `Rekap_Nilai_ASAS_SDN_Selomerto_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportStudentsToExcel(students: StudentMember[]): void {
  const rows = students.map((s, idx) => ({
    'No': idx + 1,
    'No Presensi': s.presensiNumber,
    'Nama Lengkap': s.fullName,
    'Jenis Kelamin': s.gender || '-',
    'Sekolah': s.schoolName,
    'Kelas': s.grade,
    'Password Custom': s.customPassword,
    'Terdaftar Pada': s.registeredAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 28 },
    { wch: 14 },
    { wch: 22 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Anggota Siswa');
  XLSX.writeFile(workbook, `Daftar_Siswa_Kelas6_SDN_Selomerto.xlsx`);
}

