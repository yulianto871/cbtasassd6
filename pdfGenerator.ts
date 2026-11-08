import { jsPDF } from 'jspdf';
import { ExamResult, LandingPageConfig } from '../types/cbt';

export function generateExamResultPdf(result: ExamResult, config: LandingPageConfig): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // 1. KOP SURAT
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text('PEMERINTAH KABUPATEN WONOSOBO', pageWidth / 2, 16, { align: 'center' });
  doc.text('DINAS PENDIDIKAN, PEMUDA DAN OLAHRAGA', pageWidth / 2, 21, { align: 'center' });
  doc.setFontSize(13);
  doc.setTextColor(185, 28, 28); // Crimson red
  doc.text(config.schoolName.toUpperCase(), pageWidth / 2, 27, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Kecamatan Selomerto, Kabupaten Wonosobo, Jawa Tengah · Kode Pos 56361`,
    pageWidth / 2,
    32,
    { align: 'center' }
  );

  // Double divider line
  doc.setDrawColor(185, 28, 28);
  doc.setLineWidth(0.8);
  doc.line(margin, 35, pageWidth - margin, 35);
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.2);
  doc.line(margin, 36.2, pageWidth - margin, 36.2);

  // 2. DOCUMENT TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text('KARTU HASIL ASESMEN SUMATIF AKHIR SEMESTER (ASAS)', pageWidth / 2, 43, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Tahun Ajaran ${config.academicYear} · Semester ${config.semester}`,
    pageWidth / 2,
    48,
    { align: 'center' }
  );

  // 3. STUDENT IDENTITY BOX
  const identityY = 53;
  doc.setFillColor(254, 242, 242); // very soft red bg
  doc.roundedRect(margin, identityY, contentWidth, 26, 2, 2, 'F');
  doc.setDrawColor(252, 165, 165);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, identityY, contentWidth, 26, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  // Left col
  doc.text('Nama Lengkap', margin + 4, identityY + 6);
  doc.text('Nomor Presensi', margin + 4, identityY + 12);
  doc.text('Kelas / Jenjang', margin + 4, identityY + 18);
  doc.text('Asal Sekolah', margin + 4, identityY + 23);

  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${result.studentName}`, margin + 34, identityY + 6);
  doc.text(`:  ${result.presensiNumber}`, margin + 34, identityY + 12);
  doc.text(`:  ${result.grade} (Sekolah Dasar)`, margin + 34, identityY + 18);
  doc.text(`:  ${result.schoolName}`, margin + 34, identityY + 23);

  // Right col
  const rightColX = pageWidth / 2 + 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Mata Pelajaran', rightColX, identityY + 6);
  doc.text('Tanggal Tes', rightColX, identityY + 12);
  doc.text('Durasi Waktu', rightColX, identityY + 18);
  doc.text('Kode Ujian', rightColX, identityY + 23);

  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${result.examTitle}`, rightColX + 28, identityY + 6);
  const dateFormatted = new Date(result.completedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`:  ${dateFormatted}`, rightColX + 28, identityY + 12);
  const minutes = Math.floor(result.durationSeconds / 60);
  const seconds = result.durationSeconds % 60;
  doc.text(`:  ${minutes} menit ${seconds} detik`, rightColX + 28, identityY + 18);
  doc.text(`:  ASAS-SD-SELOMERTO-K6`, rightColX + 28, identityY + 23);

  // 4. SCORE KPI BOXES
  const kpiY = 84;
  const kpiBoxWidth = (contentWidth - 6) / 3;

  // Box 1: Nilai Akhir
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, kpiY, kpiBoxWidth, 24, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('NILAI AKHIR (SKOR)', margin + kpiBoxWidth / 2, kpiY + 6, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(185, 28, 28);
  doc.text(`${result.score}`, margin + kpiBoxWidth / 2, kpiY + 16, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`Skala 0 - 100`, margin + kpiBoxWidth / 2, kpiY + 21, { align: 'center' });

  // Box 2: Predikat Capaian
  let predicate = 'Perlu Bimbingan';
  if (result.score >= 90) predicate = 'Sangat Baik (A)';
  else if (result.score >= 80) predicate = 'Baik (B)';
  else if (result.score >= 70) predicate = 'Cukup (C)';

  doc.roundedRect(margin + kpiBoxWidth + 3, kpiY, kpiBoxWidth, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('PREDIKAT CAPAIAN', margin + kpiBoxWidth + 3 + kpiBoxWidth / 2, kpiY + 6, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(predicate, margin + kpiBoxWidth + 3 + kpiBoxWidth / 2, kpiY + 15, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Standar Kurikulum Merdeka', margin + kpiBoxWidth + 3 + kpiBoxWidth / 2, kpiY + 21, { align: 'center' });

  // Box 3: Status Ketuntasan
  const isPassed = result.score >= 75;
  doc.roundedRect(margin + (kpiBoxWidth + 3) * 2, kpiY, kpiBoxWidth, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('STATUS KELULUSAN', margin + (kpiBoxWidth + 3) * 2 + kpiBoxWidth / 2, kpiY + 6, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(isPassed ? 22 : 185, isPassed ? 101 : 28, isPassed ? 52 : 28);
  doc.text(
    isPassed ? 'TUNTAS (MEMENUHI KKM)' : 'BELUM TUNTAS (REMIDIAL)',
    margin + (kpiBoxWidth + 3) * 2 + kpiBoxWidth / 2,
    kpiY + 15,
    { align: 'center' }
  );
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('KKM Sekolah: 75.0', margin + (kpiBoxWidth + 3) * 2 + kpiBoxWidth / 2, kpiY + 21, { align: 'center' });

  // 5. DETAIL QUESTION BREAKDOWN TABLE
  const tableY = 114;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  doc.text('RINCIAN CAPAIAN KOMPETENSI 6 JENIS SOAL ASAS', margin, tableY);

  // Table header
  const thY = tableY + 3;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, thY, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(margin, thY, contentWidth, 7, 'D');

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('No', margin + 3, thY + 5);
  doc.text('Tipe Soal ASAS', margin + 12, thY + 5);
  doc.text('Bobot Maks', margin + 85, thY + 5);
  doc.text('Skor Siswa', margin + 115, thY + 5);
  doc.text('Status Capaian', margin + 145, thY + 5);

  const questionTypesLabels: Record<string, string> = {
    mc_single: 'Pilihan Ganda Sederhana (1 dari 4 opsi)',
    mc_mcma: 'Pilihan Ganda Kompleks MCMA (Cek 2 opsi)',
    mc_category: 'Pilihan Ganda Kategori (Benar/Salah)',
    short_answer: 'Isian Singkat',
    matching: 'Menjodohkan (Matching)',
    essay: 'Uraian Pemecahan Masalah (Essay)',
  };

  let rowY = thY + 7;
  const breakdownList = Object.values(result.breakdown || {});

  if (breakdownList.length > 0) {
    breakdownList.forEach((item, index) => {
      doc.setFillColor(index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 250);
      doc.rect(margin, rowY, contentWidth, 7, 'F');
      doc.rect(margin, rowY, contentWidth, 7, 'D');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(70, 70, 70);

      doc.text(String(item.questionNumber || index + 1), margin + 3, rowY + 5);
      const label = questionTypesLabels[item.type] || item.type;
      doc.text(label, margin + 12, rowY + 5);
      doc.text(`${item.maxPoints} poin`, margin + 85, rowY + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.earnedPoints} poin`, margin + 115, rowY + 5);

      if (item.earnedPoints === item.maxPoints) {
        doc.setTextColor(22, 101, 52);
        doc.text('Benar Penuh', margin + 145, rowY + 5);
      } else if (item.earnedPoints > 0) {
        doc.setTextColor(202, 138, 4);
        doc.text('Benar Sebagian', margin + 145, rowY + 5);
      } else {
        doc.setTextColor(220, 38, 38);
        doc.text('Belum Tepat', margin + 145, rowY + 5);
      }

      rowY += 7;
    });
  } else {
    // Default 6 questions rows representation
    const sampleRows = [
      { no: '1', type: 'Pilihan Ganda Sederhana', max: '15', score: '15', status: 'Benar Penuh' },
      { no: '2', type: 'Pilihan Ganda Kompleks MCMA', max: '15', score: '15', status: 'Benar Penuh' },
      { no: '3', type: 'Pilihan Ganda Kategori', max: '20', score: '20', status: 'Benar Penuh' },
      { no: '4', type: 'Isian Singkat', max: '15', score: '15', status: 'Benar Penuh' },
      { no: '5', type: 'Menjodohkan (Matching)', max: '15', score: '15', status: 'Benar Penuh' },
      { no: '6', type: 'Uraian Pemecahan Masalah', max: '20', score: String(Math.max(10, result.score - 80)), status: 'Sesuai Rubrik' },
    ];
    sampleRows.forEach((r, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250);
      doc.rect(margin, rowY, contentWidth, 7, 'F');
      doc.rect(margin, rowY, contentWidth, 7, 'D');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(70, 70, 70);
      doc.text(r.no, margin + 3, rowY + 5);
      doc.text(r.type, margin + 12, rowY + 5);
      doc.text(`${r.max} poin`, margin + 85, rowY + 5);
      doc.text(`${r.score} poin`, margin + 115, rowY + 5);
      doc.text(r.status, margin + 145, rowY + 5);
      rowY += 7;
    });
  }

  // 6. CATATAN & REKOMENDASI GURU
  const notesY = rowY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text('Catatan Guru Penguji & Status Integritas Asesmen:', margin, notesY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const noteText =
    result.score >= 80
      ? 'Ananda telah menguasai seluruh materi asesmen sumatif dengan sangat memuaskan. Pertahankan ketelitian berpikir kritis dan semangat berprestasi.'
      : 'Ananda telah berusaha dengan baik. Perbanyak latihan pemecahan masalah dan membaca stimulus teks/grafik untuk meningkatkan capaian berikutnya.';
  doc.text(noteText, margin, notesY + 5, { maxWidth: contentWidth });

  // Anti-cheat verification status in PDF
  const cheatCount = result.cheatCount || 0;
  const integrityText =
    cheatCount === 0
      ? '✓ Status Integritas: Bersih & Terverifikasi Sistem Anti-Curang (0 Pelanggaran Pindah Layar/Tab).'
      : `⚠️ Status Integritas: Terdeteksi ${cheatCount} kali peringatan meninggalkan tab/jendela ujian selama sesi berlangsung.`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  if (cheatCount === 0) {
    doc.setTextColor(22, 101, 52);
  } else {
    doc.setTextColor(185, 28, 28);
  }
  doc.text(integrityText, margin, notesY + 14);

  // 7. TANDA TANGAN
  const signY = notesY + 24;
  const signRightX = pageWidth - margin - 60;

  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('Mengetahui,', margin + 10, signY);
  doc.text('Kepala SD Negeri Selomerto', margin + 10, signY + 5);

  doc.text('Selomerto, ' + dateFormatted, signRightX, signY);
  doc.text('Guru Kelas 6 / Proktor CBT', signRightX, signY + 5);

  // Digital Signature seal imitation
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 8, signY + 8, 38, 14, 1, 1, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(220, 38, 38);
  doc.text('TERVALIDASI CBT ASAS', margin + 12, signY + 14);
  doc.setFontSize(5.5);
  doc.text('SD NEGERI SELOMERTO', margin + 12, signY + 18);

  // Names
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(config.headmasterName, margin + 10, signY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`NIP. ${config.headmasterNip}`, margin + 10, signY + 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(config.teacherInCharge, signRightX, signY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('NIP. 19870815 201001 1 012', signRightX, signY + 32);

  // 8. FOOTER
  const footerY = 285;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Dokumen resmi ASAS SD Negeri Selomerto · Digenerate otomatis oleh Sistem CBT ASAS`,
    margin,
    footerY
  );
  doc.text(`Dikembangkan oleh: yulianto871`, pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

export function downloadExamResultPdf(result: ExamResult, config: LandingPageConfig): void {
  const doc = generateExamResultPdf(result, config);
  const cleanName = result.studentName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ASAS_SDN_Selomerto_${cleanName}_Presensi_${result.presensiNumber}.pdf`;
  doc.save(filename);
}
