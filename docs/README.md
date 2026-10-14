# Dokumentasi Sentinel Admission System

Dokumentasi resmi arsitektur sistem, alur pendaftaran, operasional, dan referensi teknis Sentinel Admission.

---

## 1. Getting Started (`docs/getting-started/`)
- [Local Development Setup](getting-started/local-development.md) — Panduan penyiapan environment lokal, dependensi, database MariaDB, dan Docker.
- [Demo Accounts & Testing](getting-started/demo-testing.md) — Kredensial akun demo bawaan seeder, simulasi traffic live, dan perintah test.

## 2. Arsitektur & Standar (`docs/architecture/`)
- [Candidate Lifecycle & SPMB Documents](architecture/candidate-lifecycle.md) — Alur pendaftaran berjenjang, spesifikasi 7 dokumen wajib, dan aturan gerbang evaluasi.
- [Security & Upload Standard](architecture/security-and-uploads.md) — Standar keamanan 9 domain OWASP, autentikasi, serta 4 lapis validasi upload berkas.
- [Frontend Standards & UI System](architecture/frontend-standards.md) — Standar React 18, token tema Amber/Slate, 4 state wajib UI, 5 state upload, dan motion Anime.js.
- [Backend Development](architecture/backend-development.md) — Standar Laravel 12, service layer, transaksi atomik DB, dan observer lifecycle.
- [Pre-Build Architecture Audit](architecture/architectural-lessons.md) — Alur diskusi pra-implementasi, template blueprint fitur, dan pencegahan architectural drift.
- [Build Rules](architecture/build-rules.md) — Konfigurasi bundling Vite 7, chunk splitting, dan optimasi performa asset.
- [Core Domain & Business Model](architecture/core-context.md) — Konteks inti domain bisnis SPMB, alur wizard, kode kandidat, dan aturan validasi.

## 3. Operasional Sistem (`docs/operations/`)
- [Traffic Simulator & Demo Injector](operations/traffic-simulator.md) — Panduan simulasi live traffic pendaftar, benchmark beban, dan pembersihan data demo.
- [Deployment & Docker](operations/deployment-and-docker.md) — Konfigurasi container Apache, runtime PHP 8.4, WebSocket Reverb, dan Cloudflare Tunnel.
- [Emergency Rollback](operations/emergency-rollback.md) — Prosedur tanggap darurat rollback aplikasi dan mitigasi kegagalan database.

## 4. Referensi Teknis (`docs/reference/`)
- [Database Schema & Entities](reference/database-schema.md) — Kamus lengkap 32 tabel MariaDB, kolom, relasi, dan indeks.
- [Routes Map & Navigation](reference/routes-and-navigation.md) — Pemetaan 218 rute aplikasi dan hierarki sidebar per role.
- [Tech Stack & Dependencies](reference/tech-stack.md) — Tumpukan teknologi resmi, versi runtime, dan inventaris library.
- [Human Review Checklist](reference/human-review-checklist.md) — Lembar persetujuan manual pengujian end-to-end dan UI/UX (Bahasa Indonesia).
- [Official References](reference/official-references.md) — Tautan dokumentasi resmi framework (Laravel 12, Vite, Inertia, OWASP).



