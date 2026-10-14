# Database Schema & Entity Reference

Dokumen ini merupakan Single Source of Truth (SSOT) untuk skema basis data MariaDB pada sistem Sentinel Admission, diverifikasi langsung terhadap seluruh file migrasi di `database/migrations/`.

---

## 1. Domain Pengguna & Autentikasi

### `users`
Tabel akun pengguna sistem untuk seluruh role (kandidat, staf, admin).
- **Kolom Utama:**
  - `id` (bigint unsigned, PK)
  - `name` (string)
  - `email` (string, unique)
  - `email_verified_at` (timestamp, nullable)
  - `password` (string)
  - `role` (enum: `candidate`, `staff`, `admin`, default `candidate`)
  - `whatsapp_number` (string, nullable) — nomor kontak WA yang dinormalisasi
  - `avatar` (string, nullable) — path foto profil di storage
  - `is_active` (boolean, default true) — kontrol penonaktifan akun staf/admin
  - `pending_email` (string, nullable) — alur pergantian email yang diajukan
  - `pending_email_token` (string, nullable)
  - `pending_email_status` (enum: `pending`, `approved`, `rejected`, nullable)
  - `pending_email_reviewed_by` (FK users, nullable)
  - `pending_email_reviewed_at` (timestamp, nullable)
  - `pending_email_rejection_reason` (text, nullable)
  - `pending_email_requested_at` (timestamp, nullable)
  - `remember_token` (string, nullable), `created_at`, `updated_at`

### Tabel Bawaan Framework:
- `password_reset_tokens` (`email` PK, `token`, `created_at`)
- `sessions` (`id` PK, `user_id` FK nullable, `ip_address`, `user_agent`, `payload`, `last_activity`)
- `cache`, `cache_locks`
- `jobs`, `job_batches`, `failed_jobs`
- `telescope_entries`, `telescope_entries_tags`, `telescope_monitoring`

---

## 2. Domain Gelombang & Pendaftaran

### `admission_waves`
Pengaturan periode gelombang pendaftaran, kuota, dan jalur yang dibuka.
- **Kolom:** `id`, `wave_name`, `wave_number` (int), `start_date`, `end_date`, `quota` (int), `is_active` (bool), `available_programs` (json), `available_majors` (json), `majors_enabled` (bool), `description` (text, nullable), timestamps.

### `admission_programs`
Master program/jurusan pendidikan (misal: SMP Reguler, SMA IPA, Pesantren Tahfidz).
- **Kolom:** `id`, `name`, `code` (string unique), `description` (text, nullable), `is_active` (bool), timestamps.

### `extracurriculars`
Master data ekstrakurikuler yang dapat dipilih kandidat.
- **Kolom:** `id`, `name`, `category` (string), `description` (text, nullable), `is_active` (bool), timestamps.

### `registration_drafts`
Penyimpanan formulir pendaftaran bertahap (Form Wizard Step 1–3) sebelum akun resmi dibuat.
- **Kolom:**
  - `id` (bigint unsigned, PK)
  - `registration_code` (string 50, unique) — format `REG-{4char}-{yy}-G{wave}`
  - `secret_token` (string 64) — token validasi kepemilikan draft (HttpOnly)
  - `candidate_id` (FK candidates, nullable, onDelete cascade)
  - `current_step` (tinyint unsigned, default 1)
  - `step1_data`, `step2_data`, `step3_data` (json, nullable)
  - `expires_at` (timestamp)
  - `softDeletes`, timestamps

---

## 3. Domain Profil Kandidat, Keluarga & Dokumen

### `candidates`
Profil pendaftar inti dan koordinasi status kelulusan.
- **Kolom Utama:**
  - `id` (bigint unsigned, PK)
  - `user_id` (FK users, unique, onDelete cascade)
  - `admission_wave_id` (FK admission_waves)
  - `candidate_code` (string 50, unique) — format `CDT-{4char}-{yy}-G{wave}`
  - `full_name`, `nickname` (nullable)
  - `gender` (enum: `L`, `P`)
  - `nisn` (string 10, nullable), `nik` (string 16, nullable)
  - `birth_place`, `birth_date`
  - `address_province`, `address_city`, `address_district`, `address_village`, `address_detail`, `postal_code`
  - `previous_school_name`, `previous_school_npsn`
  - `program_choice`, `major_choice`
  - `is_transfer` (boolean, default false)
  - `status` (enum: `draft`, `submitted`, `verified`, `accepted`, `rejected`, default `draft`)
  - `data_change_request` (json, nullable) — pengajuan revisi data pasca-verifikasi
  - `timestamps`, `softDeletes`

### `guardians`
Data orang tua kandung (ayah, ibu) dan wali murid.
- **Kolom:** `id`, `candidate_id` (FK unique, onDelete cascade), data ayah (`father_name`, `father_nik`, `father_occupation`, `father_income_range`, `father_phone`), data ibu (`mother_name`, `mother_nik`, `mother_occupation`, `mother_income_range`, `mother_phone`), data wali (`guardian_name`, `guardian_phone`, dll.), timestamps.

### `health_records`
Informasi riwayat medis calon peserta.
- **Kolom:** `id`, `candidate_id` (FK unique, onDelete cascade), `blood_type`, `height_cm`, `weight_kg`, `has_allergies`, `allergy_details`, `has_chronic_illness`, `bpjs_card_path` (nullable / opsional), timestamps.

### `candidate_documents`
Berkas fisik pendaftaran yang diunggah kandidat ke storage privat.
- **Kolom:**
  - `id`, `candidate_id` (FK), `candidate_code` (denormalized string)
  - `doc_type` (varchar 50) — misal `photo_formal`, `birth_certificate`, `family_card`
  - `doc_group` (enum: `identity`, `academic`, `achievement`, `welfare`, `boarding`)
  - `original_filename`, `stored_filename` (UUID v4)
  - `file_path` (string) — direktori di `storage/app/private/`
  - `mime_type`, `file_size_kb`
  - `status` (enum: `pending`, `verified`, `rejected`, default `pending`)
  - `rejection_reason` (text, nullable)
  - `verified_by` (FK users, nullable), `verified_at` (timestamp, nullable)
  - timestamps, softDeletes

### `candidate_document_security`
Audit keamanan hasil inspeksi biner dan pemindaian berkas.
- **Kolom:** `id`, `document_id` (FK unique, onDelete cascade), `magic_bytes_result` (enum: `passed`, `suspicious`, `rejected`), `polyglot_clean` (bool), `polyglot_detail` (string, nullable), `detected_mime`, `file_hash` (sha256), `upload_ip`, `user_agent`, `scanned_at`.

---

## 4. Domain Pembayaran & Keuangan

### `payments`
Pencatatan transaksi pembayaran biaya pendaftaran (Midtrans Snap / Bukti Transfer Manual).
- **Kolom:**
  - `id` (bigint unsigned, PK)
  - `candidate_id` (FK candidates, onDelete cascade)
  - `order_id` (string, unique) — kode transaksi pembayaran
  - `amount` (decimal 12,2)
  - `payment_type` (enum: `midtrans`, `manual_transfer`)
  - `status` (enum: `pending`, `paid`, `failed`, `expired`, `cancelled`, default `pending`)
  - `snap_token` (string, nullable)
  - `proof_path` (string, nullable) — bukti transfer jika pembayaran manual
  - `verified_by` (FK users, nullable), `verified_at` (timestamp, nullable)
  - `paid_at` (timestamp, nullable), `timestamps`

### `payment_configs`
Pengaturan nominal biaya pendaftaran per program atau gelombang.
- **Kolom:** `id`, `name`, `amount` (decimal 12,2), `program_id` (FK nullable), timestamps.

---

## 5. Domain Ujian Seleksi Online (CBT)

### `exam_subjects` & `exam_packages`
Master kategori mata pelajaran dan paket ujian.
- **`exam_subjects`:** `id`, `name`, `code`, timestamps.
- **`exam_packages`:** `id`, `subject_id` (FK), `title`, `duration_minutes` (int), `passing_score` (int), `is_active` (bool), timestamps.

### `exam_questions`
Bank soal pilihan ganda (A-E) yang di-import via XLSX atau dibuat admin.
- **Kolom:** `id`, `package_id` (FK), `question_text` (text), `question_image` (nullable), options (`option_a`, `option_b`, `option_c`, `option_d`, `option_e`), `correct_answer` (char 1: A-E), `explanation` (text, nullable), timestamps.

### `exam_sessions` & `exam_session_candidates`
Penjadwalan sesi ujian dan pemetaan peserta yang berhak mengikuti CBT.
- **`exam_sessions`:** `id`, `title`, `start_time`, `end_time`, `is_active`, `package_order_type` (default `sequential`), timestamps.
- **`exam_session_packages`:** Pivot tabel paket soal dalam sesi ujian.
- **`exam_session_candidates`:** `id`, `session_id` (FK), `candidate_id` (FK), `access_token` (string nullable), `status` (enum: `assigned`, `in_progress`, `completed`), timestamps.

### `exam_attempts` & `exam_attempt_answers`
Perekaman pengerjaan ujian oleh kandidat.
- **`exam_attempts`:** `id`, `session_candidate_id` (FK), `start_time`, `expires_at` (timestamp), `submitted_at`, `score` (decimal 5,2), `status` (enum: `in_progress`, `submitted`, `timed_out`, `abandoned`), timestamps.
- **`exam_attempt_answers`:** `id`, `attempt_id` (FK), `question_id` (FK), `selected_answer` (char 1), `is_correct` (bool), timestamps.
- **`exam_audit_logs`:** Log pelanggaran / perpindahan tab peserta selama ujian berlangsung.

---

## 6. Domain Agenda & Kalender SPMB

### `candidate_calendar_events` & `candidate_calendar_settings`
- **`candidate_calendar_events`:** `id`, `user_id` (FK nullable), `title`, `description`, `start_time`, `end_time`, `event_type` (enum: `system`, `personal`, `academic`, `exam`), timestamps.
- **`candidate_calendar_settings`:** `id`, `user_id` (FK unique), `show_javanese_calendar` (bool default false), timestamps.
