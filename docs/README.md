# Dokumentasi Sentinel Admission System

Dokumentasi resmi arsitektur, operasional, referensi teknis, dan audit sistem Sentinel Admission.

---

## 1. Arsitektur & Standar (`docs/architecture/`)
- [Candidate Lifecycle & SPMB Documents](architecture/candidate-lifecycle.md) — Alur pendaftaran berjenjang, spesifikasi 7 dokumen wajib, dan aturan gerbang evaluasi.
- [Security & Upload Standard](architecture/security-and-uploads.md) — Standar keamanan 9 domain OWASP, autentikasi, serta 4 lapis validasi upload berkas.
- [Frontend Standards & UI System](architecture/frontend-standards.md) — Standar React 18, token tema Amber/Slate, 4 state wajib UI, 5 state upload, dan motion Anime.js.
- [Backend Development](architecture/backend-development.md) — Standar Laravel 12, service layer, transaksi atomik DB, dan observer lifecycle.
- [Build Rules](architecture/build-rules.md) — Konfigurasi bundling Vite 7, chunk splitting, dan optimasi performa asset.
- [Architectural Lessons](architecture/architectural-lessons.md) — Catatan retrospektif arsitektural dan audit pra-implementasi fitur.
- [Core Context & Domain](architecture/core-context.md) — Konteks inti domain bisnis SPMB, alur wizard, dan arsitektur aplikasi.

## 2. Operasional Sistem (`docs/operations/`)
- [Traffic Simulator & Demo Injector](operations/traffic-simulator.md) — Panduan simulasi live traffic pendaftar, benchmark beban, dan pembersihan data demo.
- [Deployment & Docker](operations/deployment-and-docker.md) — Konfigurasi container Apache, runtime PHP 8.4, WebSocket Reverb, dan Cloudflare Tunnel.
- [Emergency Rollback](operations/emergency-rollback.md) — Prosedur tanggap darurat rollback aplikasi dan mitigasi kegagalan database.

## 3. State Aktif Auditor (`docs/state-aktif/`)
- [Current State](state-aktif/CURRENT.md) — Koordinat aktif slice pengerjaan audit dan status verifikasi terkini.
- [Queue](state-aktif/QUEUE.md) — Antrean slice audit berdasarkan ketergantungan modul.
- [Blockers](state-aktif/BLOCKERS.md) — Isu eskalasi aktif yang memerlukan keputusan pemilik proyek.
- [Decisions](state-aktif/DECISIONS.md) — Keputusan arsitektural yang mengikat secara durabel (D-001 hingga D-009).
- [Handoff](state-aktif/HANDOFF.md) — Catatan transfer konteks antar-sesi kerja auditor.
- [Context Summary](state-aktif/CONTEXT-SUMMARY.md) — Ringkasan snapshot konfigurasi teknis dan batas aplikasi terverifikasi.

## 4. Audit & Kesiapan Produksi (`docs/audit/`)
- [Auditor Charter](audit/auditor-charter.md) — Misi, etika skeptisisme, dan batasan otonomi auditor produksi.
- [Auditor Operating Rules](audit/operating-rules.md) — SOP pra-audit, penambalan minimal, dan standar verifikasi bukti.
- [Execution Runbook](audit/execution-runbook.md) — Prosedur langkah-demi-langkah pelaksanaan audit slice.
- [Release Gates](audit/release-gates.md) — Kriteria gerbang kelulusan G0 hingga G7 sebelum promosi kandidat rilis.
- [Production Readiness](audit/production-readiness.md) — Checklist teknis kesiapan deploy produksi (kode, data, runtime, keamanan).
- [Branching & Promotion](audit/branching-and-promotion.md) — Strategi branch release candidate dan alur promosi versi.
- [Production Manifest](audit/production-manifest.md) — Ledger status kelulusan audit per slice fitur.
- [Promotion Ledger](audit/promotion-ledger.md) — Riwayat pencatatan promosi release candidate.
- [Documentation Policy](audit/documentation-policy.md) — Kebijakan penyimpanan bukti audit dan sanitasi data log.
- [Master Audit Task](audit/tasks/master-production-audit.task.md) — Definisi master audit task dan checklist slice 01 s.d. 11.
- [Reports & Evidence](audit/reports/README.md) — Laporan temuan audit dan rekaman bukti eksekusi perintah per slice.

## 5. Referensi Teknis (`docs/reference/`)
- [Tech Stack & Dependencies](reference/tech-stack.md) — Tumpukan teknologi resmi, versi runtime, dan inventaris library.
- [Human Review Checklist](reference/human-review-checklist.md) — Lembar persetujuan manual pengujian end-to-end dan UI/UX (Bahasa Indonesia).
- [Official References](reference/official-references.md) — Tautan dokumentasi resmi framework (Laravel 12, Vite, Inertia, OWASP).

