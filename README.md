# VIOLET (Virtual Integrated Online Evaluation Tool)

Sistem Ujian Berbasis Komputer (Computer-Based Test/CBT) realtime yang komprehensif, dirancang untuk pengelolaan dan pemantauan ujian yang mulus. Dibangun dengan teknologi modern untuk memastikan kinerja tinggi, skalabilitas, dan pengalaman pengguna yang premium.

## 🚀 Ringkasan

**VIOLET** menyediakan solusi lengkap untuk menyelenggarakan ujian online. Sistem ini menjembatani administrator/instruktur dan siswa dengan sinkronisasi jawaban, status ujian, dan hasil secara realtime. Mendukung batch skala besar, bank soal yang kompleks, dan analitik terperinci.

## ✨ Fitur Utama

### 👥 Manajemen Pengguna & Peserta

- **Manajemen Admin**: Autentikasi aman dan akses berbasis peran.
- **Manajemen Peserta (Siswa)**:
  - Impor peserta dengan cepat melalui Excel atau alat visual "Quick Import".
  - Profil siswa terperinci dengan riwayat ujian dan pelacakan kinerja.
  - **Manajemen Batch**: Mengatur siswa ke dalam kelas/batch untuk penugasan yang lebih mudah.
  - **Analitik Terperinci**: Melihat grafik kinerja batch (skor rata-rata, tingkat kelulusan).

### 📝 Manajemen Ujian & Soal

- **Bank Soal**: Mengatur soal ke dalam bank yang dapat digunakan kembali.
- **Dukungan Multimedia**: Soal dapat menyertakan gambar (dengan kompresi).
- **Impor Manual & Massal**: Impor soal satu per satu atau sekaligus melalui format tertentu.
- **Penjadwalan Ujian**: Jadwalkan ujian dengan waktu mulai/selesai dan durasi yang tepat.
- **Aturan Ujian**: Konfigurasi pengacakan, kode akses, dan izin peninjauan kembali.

### ⚡ Pemantauan & Pelaksanaan Realtime

- **Dashboard Langsung**: Pantau semua peserta aktif secara realtime.
- **Pelacakan Status**: Lihat siapa yang online, offline, atau telah mengumpulkan.
- **Penilaian Realtime**: Metrik diperbarui saat siswa menjawab.
- **Ketahanan (Resilience)**:
  - Sinkronisasi data otomatis.
  - "Blocking Overlay" untuk menjeda ujian jika koneksi terputus, dan melanjutkan otomatis saat pulih.
- **Keamanan**:
  - Perlindungan anti-copy/paste.

### 📊 Pelaporan & Analitik

- **Laporan Komprehensif**: Hasilkan laporan detail untuk siswa dan batch.
- **Opsi Ekspor**:
  - **Excel**: Ekspor data mentah atau skor yang dinormalisasi.
  - **PDF**: Buat slip hasil yang sesuai format.
- **Visualisasi**: Grafik interaktif untuk distribusi skor dan progres.

## 🛠 Teknologi yang Digunakan (Tech Stack)

### Backend

- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database**: PostgreSQL 15
- **ORM**: TypeORM
- **Realtime**: Socket.io (WebSockets) untuk komunikasi dua arah.
- **Autentikasi**: Passport.js (JWT Strategy)
- **Penjadwalan Tugas**: @nestjs/schedule (Cron jobs)

### Frontend

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI Library**: [Mantine UI](https://mantine.dev/)
- **Styling**: TailwindCSS
- **State/Data Fetching**: Axios, SWR (implied), Socket.io-client.
- **Charts**: Chart.js / Recharts.

### Infrastruktur

- **Docker**: Layanan database dalam container.

## ⚙️ Prasyarat

- **Node.js**: v18.0.0 atau lebih tinggi
- **Docker & Docker Compose**: Untuk menjalankan database.

## 🚀 Cara Setup

### 1. Setup Database

Jalankan container PostgreSQL:

```bash
docker-compose up -d
```

Ini akan memulai instance PostgreSQL pada port `5432` dengan user `admin` dan password `password` (konfigurasi default).

### 2. Setup Backend

Masuk ke direktori backend dan install dependencies:

```bash
cd backend/api
npm install
```

Konfigurasi Variabel Lingkungan (.env):
Buat file `.env` di `backend/api/` dengan isi berikut (sesuaikan jika perlu):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=password
DB_DATABASE=cbt_db
JWT_SECRET=supersecretkey123
```

Jalankan Backend:

```bash
# Mode Development
npm run start:dev
```

API akan berjalan di `http://localhost:3000` (port default NestJS).

### 3. Setup Frontend

Masuk ke direktori frontend:

```bash
cd frontend
npm install
```

Konfigurasi Variabel Lingkungan (.env.local):
Buat file `.env.local` di `frontend/` dengan isi berikut (sesuaikan jika perlu):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Jalankan Frontend:

```bash
# Development server
npm run dev
```

Aplikasi akan tersedia di `http://localhost:3001` (dikonfigurasi di `package.json`).

## 📁 Struktur Proyek

```
violet/
├── backend/
│   └── api/          # Aplikasi Backend NestJS
│       └── src/      # (Modules: Users, Exams, LiveExam, dll.)
├── frontend/         # Aplikasi Frontend Next.js
│   └── src/          # (App Router, Components, dll.)
├── docker-compose.yml # Infrastruktur Database
└── Rencana fitur tambahan.txt # Peta Jalan/Rencana Fitur
```
