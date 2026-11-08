# CBT ASAS SD Negeri Selomerto (Online Multi-Device & GitHub Pages)

Aplikasi Computer Based Test (CBT) Asesmen Sumatif Akhir Semester (ASAS) Kelas 6 SD Negeri Selomerto berbasis React + Vite + Tailwind CSS dengan integrasi cloud database **Supabase** untuk sinkronisasi real-time antar perangkat (HP, tablet, laptop) dan siap di-publish di **GitHub Pages**.

Dikembangkan oleh: **yulianto871**

---

## Fitur Utama

1. **6 Jenis Soal ASAS Standar Kurikulum Merdeka:**
   - Pilihan Ganda sederhana (1 dari 4 opsi)
   - Pilihan Ganda Kompleks / MCMA (mencentang 2 opsi benar)
   - Pilihan Ganda Kategori (Benar/Salah, Tepat/Kurang Tepat, Sesuai/Tidak Sesuai)
   - Isian Singkat (dengan toleransi jawaban)
   - Menjodohkan (Matching pairs interaktif)
   - Uraian / Essay (dengan rubrik dan koreksi otomatis kata kunci)
2. **Sistem Integritas & Anti-Curang:**
   - Deteksi otomatis perpindahan tab, aplikasi, atau keluar dari layar penuh
   - Log pelanggaran transparan untuk pengawas/guru
3. **Pengacakan Soal & Opsi Jawaban:**
   - Nomor soal dan pilihan jawaban diacak otomatis untuk tiap siswa
4. **Database Supabase Cloud (Multi-Device):**
   - Siswa dapat mengerjakan dari perangkat manapun dan nilai langsung tersinkronisasi online ke Leaderboard & Panel Admin
5. **Ekspor & Laporan Lengkap:**
   - Unduh Hasil Ujian Siswa (PDF Resmi dengan skor dan rincian jawaban)
   - Unduh Rekap Nilai & Analisis Butir Soal (Excel `.xlsx`)
6. **Panel Administrasi CMS Lengkap:**
   - Kelola Mata Pelajaran & Durasi Ujian
   - Bank Soal dengan stimulus teks, gambar, dan grafik interaktif
   - Manajemen Anggota Siswa (Password Custom)
   - Editor Tampilan Landing Page
   - Manajemen Database Supabase & Cadangan JSON Lokal

---

## Panduan Setup Supabase & Deploy ke GitHub Pages

### Langkah 1: Buat Database di Supabase
1. Buka [https://supabase.com](https://supabase.com) dan buat akun gratis.
2. Buat Project Baru (contoh nama: `cbt-sdn-selomerto`, region: `Singapore`).
3. Buka menu **SQL Editor** &rarr; klik **New Query**.
4. Salin seluruh isi file `supabase-schema.sql` di repository ini, tempel ke SQL Editor, lalu klik tombol **RUN**.
5. Buka menu **Project Settings &gt; Data API**, salin:
   - **Project URL** (contoh: `https://xyzabcdefghijklmnop.supabase.co`)
   - **anon public key** (contoh: `eyJhbGciOiJIUzI1NiIsIn...`)

### Langkah 2: Hubungkan ke Aplikasi
1. Buka aplikasi CBT ASAS &rarr; Login Admin.
2. Masuk ke tab **Database Supabase Online**.
3. Masukkan `Project URL` dan `Anon Key` &rarr; klik **Simpan & Hubungkan**.
4. Klik **Upload Seluruh Data ke Supabase** untuk mengisi bank soal dan siswa awal.

### Langkah 3: Publish ke GitHub Pages
1. Push repository ini ke akun GitHub Anda.
2. Buka repository di GitHub &rarr; **Settings** &rarr; **Pages**.
3. Pada **Build and deployment > Source**, pilih **GitHub Actions** (atau deploy build branch `dist`).
4. (Opsional) Tambahkan Secret `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di **Settings > Secrets and variables > Actions** jika ingin kredensial otomatis terbawa saat build.
5. URL CBT ASAS Anda akan aktif di `https://username.github.io/repo-name/` dan siap digunakan serentak oleh seluruh siswa!
