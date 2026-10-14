# Routes Map & Navigation Truth

Dokumen ini merupakan Single Source of Truth (SSOT) untuk pemetaan rute aplikasi Laravel dan hierarki navigasi sidebar React, diverifikasi langsung dari `php artisan route:list` dan `resources/js/config/navigation.ts`.

---

## 1. Rute Publik & Alur Pendaftaran Tamu (Public & Guest Routes)

| Method | URI | Named Route | Controller / Action |
|---|---|---|---|
| `GET` | `/` | `home` | `Public\\WelcomeController@index` |
| `GET` | `/media/gallery/{filename}` | `media.gallery` | `Public\\WelcomeController@showGalleryMedia` |
| `GET` | `/daftar` | `daftar` | `Admission\\FormWizardController@show` |
| `POST` | `/daftar/check-draft` | `daftar.check-draft` | `Admission\\FormWizardController@checkDraft` |
| `POST` | `/daftar/check-duplicate` | `daftar.check-duplicate` | `Admission\\FormWizardController@checkDuplicate` |
| `POST` | `/daftar/resume` | `daftar.resume` | `Admission\\FormWizardController@resume` |
| `POST` | `/daftar/step1` | `daftar.step1` | `Admission\\FormWizardController@saveStep1` |
| `PUT` | `/daftar/step2/{draft}` | `daftar.step2` | `Admission\\FormWizardController@saveStep2` |
| `PUT` | `/daftar/step3/init/{draft}` | `daftar.step3.init` | `Admission\\FormWizardController@initStep3` |
| `PUT` | `/daftar/step3/{draft}` | `daftar.step3` | `Admission\\FormWizardController@saveStep3` |
| `POST` | `/payment/webhook` | `payment.webhook` | `Webhook\\MidtransController@handle` |

### Ujian Seleksi Tamu (Public CBT Exam):
| Method | URI | Named Route | Keterangan |
|---|---|---|---|
| `GET` | `/exam/p/{token?}` | `exam.public.landing` | Landing page token sesi ujian publik |
| `POST` | `/exam/p/{token}/start` | `exam.public.start` | Memulai pengerjaan ujian publik |
| `GET` | `/exam/attempts/{attempt}` | `exam.public.attempts.show` | Halaman pengerjaan soal ujian publik |
| `POST` | `/exam/attempts/{attempt}/save-answer` | `exam.public.attempts.save-answer` | Autosave jawaban realtime |
| `POST` | `/exam/attempts/{attempt}/submit` | `exam.public.attempts.submit` | Finalisasi / penyerahan lembar jawaban |

---

## 2. Dashboard Kandidat (`role:candidate`)

### Menu Utama:
- `GET /dashboard` (`dashboard.index`) — Beranda status pendaftaran
- `GET /dashboard/status-pendaftaran` (`dashboard.status-pendaftaran`) — Checklist tahapan pendaftaran terpadu
- `GET /dashboard/calendar` (`dashboard.calendar`) — Kalender SPMB kandidat
- `GET /dashboard/bantuan` (`dashboard.bantuan`) — Pusat informasi bantuan

### Data Pendaftaran:
- `GET /dashboard/data-diri` (`dashboard.data-diri`)
- `PUT /dashboard/data-diri` (`dashboard.data-diri.update`)
- `POST /dashboard/data-diri/change-request` (`dashboard.data-diri.change-request`)
- `GET /dashboard/data-wali` (`dashboard.data-wali`)
- `PUT /dashboard/data-wali` (`dashboard.data-wali.update`)
- `GET /dashboard/data-kesehatan` (`dashboard.data-kesehatan`)
- `PUT /dashboard/data-kesehatan` (`dashboard.data-kesehatan.update`)

### Berkas & Pembayaran:
- `GET /dashboard/data-dokumen` (`dashboard.data-dokumen.index`)
- `POST /dashboard/data-dokumen/{docType}` (`dashboard.data-dokumen.upload`)
- `GET /dashboard/data-dokumen/preview/{document}` (`dashboard.data-dokumen.preview`)
- `GET /dashboard/data-dokumen/download/{document}` (`dashboard.data-dokumen.download`)
- `DELETE /dashboard/data-dokumen/{document}` (`dashboard.data-dokumen.destroy`)
- `GET /dashboard/pembayaran` (`dashboard.pembayaran.index`)
- `POST /dashboard/pembayaran/snap-token` (`dashboard.pembayaran.snap-token`)
- `POST /dashboard/pembayaran/upload-proof` (`dashboard.pembayaran.upload-proof`)
- `GET /dashboard/pembayaran/riwayat` (`dashboard.pembayaran.riwayat`)

### Seleksi & Ujian:
- `GET /dashboard/seleksi` (`dashboard.seleksi.index`) — Daftar sesi ujian CBT
- `GET /dashboard/seleksi/sesi/{session}` (`dashboard.seleksi.show`)
- `POST /dashboard/seleksi/sesi/{session}/start` (`dashboard.seleksi.start`)
- `GET /dashboard/seleksi/attempts/{attempt}` (`dashboard.seleksi.attempts.show`)
- `POST /dashboard/seleksi/attempts/{attempt}/answers` (`dashboard.seleksi.answers.save`)
- `POST /dashboard/seleksi/attempts/{attempt}/submit` (`dashboard.seleksi.submit`)
- `GET /dashboard/seleksi/status` (`dashboard.seleksi.status`)
- `GET /dashboard/seleksi/hasil` (`dashboard.seleksi.hasil`)

---

## 3. Dashboard Staf Verifikator (`role:staff`)

### Verifikasi & Operasional:
- `GET /dashboard/staff` (`staff.dashboard`) — Beranda operasional staf
- `GET /dashboard/staff/candidates` (`staff.candidates.index`) — Daftar dan filter berkas seluruh kandidat
- `GET /dashboard/staff/candidate-status` (`staff.candidate-status`) — Matriks status alur kandidat
- `GET /dashboard/staff/candidates/{candidate}` (`staff.candidates.show`)
- `GET /dashboard/staff/candidates/{candidate}/status-pendaftaran` (`staff.candidates.status-pendaftaran`)
- `POST /dashboard/staff/candidates/{candidate}/status` (`staff.candidates.status`)
- `GET /dashboard/staff/change-requests` (`staff.change-requests.index`) — Antrean permohonan revisi data
- `POST /dashboard/staff/change-requests/data/{candidate}/approve`
- `POST /dashboard/staff/change-requests/data/{candidate}/reject`
- `POST /dashboard/staff/documents/{document}/verify` (`staff.documents.verify`)
- `GET /dashboard/staff/payment-operations` (`staff.payment-operations.index`) — Review bukti transfer manual
- `POST /dashboard/staff/payments/{payment}/verify` (`staff.payments.verify`)
- `GET /dashboard/staff/exams/results` (`staff.exams.results.index`) — Hasil dan skor ujian CBT
- `GET /dashboard/staff/reports` (`staff.reports`) — Unduh rekapitulasi data pendaftar

---

## 4. Dashboard Administrator (`role:admin`)

Admin memiliki seluruh kapabilitas staf ditambah konfigurasi tingkat sistem:

### Manajemen Pendaftaran:
- `GET /dashboard/admin` (`admin.dashboard`) — Metrik KPI dan statistik pendaftaran
- `GET /dashboard/admin/calendar` (`admin.calendar`) — Kalender agenda pendaftaran sistem
- `GET /dashboard/admin/candidates` (`admin.candidates.index`) — Pengelolaan data kandidat
- `DELETE /dashboard/admin/candidates/{candidate}` (`admin.candidates.delete`)
- `GET /dashboard/admin/waves` (`admin.waves.index`) — Pengaturan gelombang dan kuota
- `POST /dashboard/admin/waves/{wave}/toggle` (`admin.waves.toggle`)
- `GET /dashboard/admin/staff-list` (`admin.staff.index`) — Manajemen akun petugas staf
- `POST /dashboard/admin/staff/{user}/toggle` (`admin.staff.toggle`)

### Manajemen Ujian Seleksi (CBT Master):
- `GET /dashboard/admin/exams/media` (`admin.exams.media.index`) — Bank media gambar/file soal ujian
- `GET /dashboard/admin/exams/subjects` (`admin.exams.subjects.index`) — Kategori mata pelajaran ujian
- `GET /dashboard/admin/exams/packages` (`admin.exams.packages.index`) — Manajemen paket soal CBT
- `GET /dashboard/admin/exams/packages/{package}/template` — Unduh template import XLSX
- `POST /dashboard/admin/exams/packages/{package}/imports` — Streaming import soal via OpenSpout
- `GET /dashboard/admin/exams/sessions` (`admin.exams.sessions.index`) — Penjadwalan sesi ujian internal
- `GET /dashboard/admin/exams/public-sessions` (`admin.exams.public-sessions.index`) — Sesi ujian publik
- `GET /dashboard/admin/exams/results` (`admin.exams.results.index`) — Hasil dan perolehan nilai ujian
- `GET /dashboard/admin/exams/monitoring` (`admin.exams.monitoring.index`) — Live proctoring & monitoring

### Konfigurasi Sistem SPMB:
- `GET /dashboard/admin/programs` (`admin.programs`) — Master program/jalur pendaftaran
- `GET /dashboard/admin/settings` (`admin.settings`) — Pengaturan biaya (`payment-configs`), ekstrakurikuler, dan program studi
- `GET /dashboard/admin/reports` (`admin.reports`) — Rekap data pendaftar, keuangan, dan seleksi
- `GET /dashboard/admin/users` (`admin.users`) — Manajemen akun pengguna sistem
