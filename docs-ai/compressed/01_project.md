# Sentinel Admission - Project, Architecture & Environment
> Stable project reference refreshed against the current repository. Always verify source files before execution.

---

## Project Overview

| | Value |
|---|---|
| **Internal name** | `Sentinel Admission` - never shown to end users |
| **Website brand** | `Al-Muntaha School` / `Al-Muntaha Islamic Boarding School` |
| **APP_NAME** | `"Al-Muntaha School"` - navbar, footer, browser title |
| **APP_TAGLINE** | `"Menuju Puncak Ilmu & Akhlak"` - sub-navbar |
| **Purpose** | Digital admission system / SPMB for Indonesian education institutions |
| **Target users** | Islamic boarding schools, SMP/SMA/SMK, and school admission committees |

The name **Sentinel** must not appear on user-facing pages.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12, PHP 8.2+ |
| Bridge | Inertia.js v2 |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS 3 (`darkMode: 'class'`) |
| Build | Vite 7 |
| Auth scaffolding | Laravel Breeze-derived auth |
| Tests | Pest 4 + PHPUnit config |
| Payments | Midtrans PHP SDK + manual proof upload |
| Excel import/export | OpenSpout |
| Route helper | Ziggy |
| HTTP client | Axios |
| UI/interaction libraries | Anime.js, SweetAlert2, react-select, flatpickr |
| Calendar | FullCalendar (`daygrid`, `timegrid`, `list`, `interaction`) |
| Charts | Recharts |
| PDF/image preview helpers | react-pdf, yet-another-react-lightbox |
| Icons | Font Awesome 6 classes |

---

## Environment Reference

| Item | Value |
|---|---|
| Local OS | Fedora KDE Plasma |
| Local shell preference | Fish aliases for Silvia's environment |
| Current Codex shell | Bash in this workspace |
| Project path | `/home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission` |
| Setup | Docker + Cloudflare Tunnel |
| Domain | `spmb.playground-ku.my.id` |
| DB | MariaDB at `172.17.0.1:3306`, DB `sentinel_admission_db`, user `sentinel_core` |
| Email | Mailtrap sandbox |

### NPM Scripts

```json
{
  "build": "tsc && vite build",
  "dev": "vite",
  "lint": "eslint resources/js --ext .js,.jsx,.ts,.tsx --ignore-path .gitignore --fix"
}
```

### Known Fish Aliases

| Alias | Action |
|---|---|
| `sentinel` | cd to project path |
| `build` | `npm run build && docker compose restart` |
| `deploy` | build + restart + clear all cache |
| `db-reset` | `migrate:fresh --seed` |
| `art-clear` | config + route + view + cache clear |
| `tinker` | php artisan tinker via docker |
| `log` | tail Laravel log |
| `app` | exec into app container |
| `dcup` / `dcdwn` | docker compose up/down |
| `tunnel-on/off` | start/stop Cloudflare tunnel |
| `dev-mode` / `demo-mode` | swap `.env` mode + tunnel/cache handling |

---

## Git Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready only |
| `develop` | Integration hub before audit/main |
| `lab-hack` | Security experiments; never merge/push |
| `feat/*` | Daily feature branches |
| `critical/*` | Critical audit/fix branches |

Current branch when refreshed: `critical/candidate-lifecycle-gates`.

`config/sentinel.php` must not exist in `main` or `develop`.

---

## Role & Permission Model

Global auth roles are fixed:

```txt
candidate
staff
admin
```

Do not add global roles like `bendahara`, `operator`, `verifikator`, or `administrasi`; those are work domains/menu groupings. Staff can represent operational committee members; admin has staff domains plus admin-only system controls.

Payment scope remains SPMB registration/initial admission payment validation, not full accounting, cashbook, debt, installment, or finance-management.

---

## Database Schema - Current Core

### Admission & Candidate Tables

```txt
users                         auth, role, avatar, whatsapp_number, is_active,
                              pending_email workflow fields
registration_drafts           wizard data, registration_code + secret_token,
                              candidate_id FK, soft delete, expires_at
admission_waves               wave schedule, available_programs JSON,
                              available_majors JSON, majors_enabled
admission_programs            program/jalur reference
extracurriculars              extracurricular reference
candidates                    linked user/draft/wave, identity, address,
                              program_choice, major_choice, status,
                              data_change_request JSON
guardians                     parent/guardian/family data
health_records                medical/health fields and health documents
candidate_documents           candidate uploaded admission documents
candidate_document_security   magic bytes, polyglot scan, file hash, upload IP
payments                      payment records, Midtrans/manual proof status
payment_configs               payment configuration/amounts
```

### Calendar Tables

```txt
candidate_calendar_events     candidate/user agenda and SPMB calendar events
candidate_calendar_settings   per-user setting, including Javanese calendar visibility
```

### Online Selection Exam Tables

```txt
exam_subjects
exam_packages
exam_import_batches
exam_questions
exam_sessions
exam_session_candidates
exam_attempts
exam_attempt_answers
exam_audit_logs
```

---

## Candidate Lifecycle

```txt
draft -> submitted -> verified -> accepted / rejected
```

Lifecycle/completion logic is service-owned under:

```txt
app/Services/CandidateStatus/
```

Important classes:

```txt
CandidateCompletionEvaluator
CandidateVerificationEvaluator
CandidateStatusService
CandidateGateService
CandidateVerificationChecklist
```

Observers trigger synchronization after candidate, guardian, and health updates. Do not duplicate lifecycle rules inside page controllers.

### Candidate Code System

```txt
registration_code: REG-{random4}-{yy}-G{wave}
candidate_code:    CDT-{random4}-{yy}-G{wave}
```

`candidate_code` is generated by replacing only the prefix `REG-` -> `CDT-`; suffix stays identical.

---

## Change Request Workflows

### Candidate Data Change

Stored in `candidates.data_change_request` as JSON. Pending payload starts with:

```json
{
  "field": "full_name",
  "old_value": "old value",
  "new_value": "new value",
  "reason": "reason",
  "status": "pending",
  "requested_at": "ISO timestamp"
}
```

After review it may include reviewer/process metadata:

```txt
reviewed_by, reviewed_by_name, reviewed_at, processed_at,
processed_by, processed_by_role, rejection_reason
```

Allowed requested fields are currently:

```txt
full_name, nisn, nik, gender, place_of_birth, date_of_birth, address_detail, school_origin
```

Staff and admin approve/reject workflows are implemented through `ChangeRequestController` and `ChangeRequestService`.

### Candidate Email Change

Stored in `users`:

```txt
pending_email
pending_email_token
pending_email_status
pending_email_reviewed_by
pending_email_reviewed_at
pending_email_rejection_reason
pending_email_requested_at
```

Current flow:

```txt
candidate requests -> staff/admin approve or reject -> candidate applies approved email from profile
```

Approval is manual verification; approved requests clear token and set `pending_email_status = approved`.

---

## Controller Structure

```txt
app/Http/Controllers/
├── Admission/
├── Auth/
├── Public/
├── Webhook/
│   └── MidtransController.php
└── Dashboard/
    ├── Candidate/
    │   ├── CalendarController.php
    │   ├── DataDiriController.php
    │   ├── DocumentController.php
    │   ├── Exam/
    │   ├── GuardianController.php
    │   ├── HealthRecordController.php
    │   ├── IndexController.php
    │   ├── PaymentController.php
    │   └── ProfileController.php
    ├── Staff/
    │   ├── Exam/
    │   ├── IndexController.php
    │   └── ProfileController.php
    ├── Admin/
    │   ├── Exam/
    │   ├── CandidateController.php
    │   ├── IndexController.php
    │   ├── ProfileController.php
    │   ├── StaffController.php
    │   └── WaveController.php
    ├── ChangeRequestController.php
    ├── ComingSoonController.php
    └── SecureFileController.php
```

Older docs that mention `app/Http/Controllers/Staff/*` or `Admin/*` directly are outdated unless source confirms otherwise.

---

## Frontend Structure

```txt
resources/js/
├── Components/
│   ├── Landing/
│   ├── Dashboard/
│   │   ├── Admin/Exam/
│   │   ├── Candidate/
│   │   │   ├── Calendar/
│   │   │   ├── DataDiri/
│   │   │   ├── DataDokumen/
│   │   │   ├── DataKesehatan/
│   │   │   ├── DataWali/
│   │   │   ├── Exam/
│   │   │   ├── Index/
│   │   │   ├── Pembayaran/
│   │   │   └── Shared/
│   │   ├── ChangeRequests/
│   │   ├── Staff/
│   │   └── Shared/
│   ├── UI/
│   └── Wizard/
├── Layouts/
└── Pages/
    ├── Admission/
    ├── Auth/
    ├── Dashboard/
    │   ├── Admin/
    │   │   └── Exam/
    │   ├── Candidate/
    │   │   └── Exam/
    │   ├── Operations/
    │   └── Staff/
    │       └── Exam/
    ├── Errors/
    └── Landing/
```

Pages should stay thin orchestrators. Feature UI and logic live in domain components.

---

## Routes Reference

### Public & Admission

```txt
GET      /
GET      /media/gallery/{filename}
GET      /daftar
POST     /daftar/check-draft
POST     /daftar/check-duplicate
POST     /daftar/resume
POST     /daftar/step1
PUT      /daftar/step2/{draft}
PUT      /daftar/step3/init/{draft}
PUT      /daftar/step3/{draft}
POST     /payment/webhook
```

`/register` routes are provided from `routes/auth.php` / auth scaffolding, not inside the admission group in `routes/web.php`.

### Candidate Dashboard

```txt
GET       /dashboard

GET       /dashboard/calendar
GET       /dashboard/calendar/events
POST      /dashboard/calendar/agenda
PATCH     /dashboard/calendar/settings
GET       /dashboard/info              ComingSoon
GET       /dashboard/status            ComingSoon

GET       /dashboard/seleksi
GET       /dashboard/seleksi/sesi/{session}
POST      /dashboard/seleksi/sesi/{session}/start
GET       /dashboard/seleksi/attempts/{attempt}
GET       /dashboard/seleksi/attempts/{attempt}/sync
POST      /dashboard/seleksi/attempts/{attempt}/answers
POST      /dashboard/seleksi/attempts/{attempt}/submit

GET/PUT   /dashboard/profile
GET/POST  /dashboard/profile/avatar
POST      /dashboard/profile/email
DELETE    /dashboard/profile/email
POST      /dashboard/profile/email/apply

GET/PUT   /dashboard/data-diri
POST      /dashboard/data-diri/change-request
DELETE    /dashboard/data-diri/change-request

GET/PUT   /dashboard/data-wali
GET/POST  /dashboard/data-kesehatan
POST/DEL  /dashboard/data-kesehatan/dokumen/{docType}
GET       /dashboard/data-kesehatan/dokumen/{docType}/preview

GET       /dashboard/data-dokumen
POST      /dashboard/data-dokumen/{docType}
GET       /dashboard/data-dokumen/preview/{document}
GET       /dashboard/data-dokumen/download/{document}
DELETE    /dashboard/data-dokumen/{document}

GET       /dashboard/pembayaran
POST      /dashboard/pembayaran
DELETE    /dashboard/pembayaran/{payment}
POST      /dashboard/pembayaran/snap-token
GET       /dashboard/pembayaran/status
GET       /dashboard/pembayaran/proof/{payment}
POST      /dashboard/pembayaran/upload-proof
```

### Staff Dashboard

```txt
GET       /dashboard/staff
GET       /dashboard/staff/calendar        ComingSoon
GET       /dashboard/staff/candidates
GET       /dashboard/staff/candidates/{candidate}
GET       /dashboard/staff/candidates/{candidate}/{section}
POST      /dashboard/staff/candidates/{candidate}/status

GET       /dashboard/staff/change-requests
POST      /dashboard/staff/change-requests/data/{candidate}/approve
POST      /dashboard/staff/change-requests/data/{candidate}/reject
POST      /dashboard/staff/change-requests/email/{candidate}/approve
POST      /dashboard/staff/change-requests/email/{candidate}/reject

GET       /dashboard/staff/exams/results
GET       /dashboard/staff/exams/sessions  ComingSoon
GET       /dashboard/staff/exams/results/{attempt}

GET       /dashboard/staff/reports          ComingSoon
GET       /dashboard/staff/payment-recap    ComingSoon
POST      /dashboard/staff/documents/{document}/verify
GET       /dashboard/staff/documents/{document}/preview
POST      /dashboard/staff/payments/{payment}/verify
GET       /dashboard/staff/payments/{payment}/proof
GET/PUT   /dashboard/staff/profile
GET/POST  /dashboard/staff/profile/avatar
```

### Admin Dashboard

```txt
GET       /dashboard/admin
GET       /dashboard/admin/calendar        ComingSoon
GET       /dashboard/admin/candidates
GET       /dashboard/admin/candidates/{candidate}
GET       /dashboard/admin/candidates/{candidate}/{section}
POST      /dashboard/admin/candidates/{candidate}/status
DELETE    /dashboard/admin/candidates/{candidate}

GET       /dashboard/admin/waves
POST      /dashboard/admin/waves/{wave}/toggle
GET       /dashboard/admin/staff-list
POST      /dashboard/admin/staff/{user}/toggle

GET       /dashboard/admin/change-requests
POST      /dashboard/admin/change-requests/data/{candidate}/approve
POST      /dashboard/admin/change-requests/data/{candidate}/reject
POST      /dashboard/admin/change-requests/email/{candidate}/approve
POST      /dashboard/admin/change-requests/email/{candidate}/reject

GET       /dashboard/admin/exams
CRUD      /dashboard/admin/exams/subjects
CRUD      /dashboard/admin/exams/packages
POST      /dashboard/admin/exams/packages/{package}/publish
POST      /dashboard/admin/exams/packages/{package}/close
GET       /dashboard/admin/exams/packages/{package}/template
GET/POST  /dashboard/admin/exams/packages/{package}/imports
GET       /dashboard/admin/exams/imports/{batch}
CRUD      /dashboard/admin/exams/sessions
POST      /dashboard/admin/exams/sessions/{session}/candidates
GET       /dashboard/admin/exams/results
GET       /dashboard/admin/exams/results/{attempt}

GET       /dashboard/admin/reports          ComingSoon
GET       /dashboard/admin/users            ComingSoon
GET       /dashboard/admin/announcements    ComingSoon
GET       /dashboard/admin/payment-recap    ComingSoon
GET       /dashboard/admin/programs         ComingSoon
GET       /dashboard/admin/settings         ComingSoon
GET/PUT   /dashboard/admin/profile
GET/POST  /dashboard/admin/profile/avatar
```

---

## Navigation Truth

Source file: `resources/js/config/navigation.ts`.

### Candidate

```txt
MENU
- Dashboard
- Kalender SPMB
- Pengumuman (ComingSoon route)
- Bantuan (ComingSoon route)

PENDAFTARAN
- Data Pendaftaran
  - Data Diri
  - Data Wali
  - Data Kesehatan
- Berkas & Pembayaran
  - Dokumen
  - Pembayaran
  - Riwayat Pembayaran (ComingSoon route)
- Seleksi
  - Ujian Seleksi
  - Status Seleksi (ComingSoon route)
  - Hasil Seleksi (ComingSoon route)

AKUN
- Profil
```

### Staff

```txt
MENU
- Dashboard
- Staff Kalender (ComingSoon route)
- Kandidat
  - Semua Kandidat
  - Data Diri
  - Data Wali
  - Data Kesehatan
  - Perlu Tindakan
- Verifikasi
  - Review Dokumen
  - Review Pembayaran
- Seleksi
  - Hasil Ujian
  - Sesi Ujian (ComingSoon route)
- Rekap / Laporan (ComingSoon route)

AKUN
- Profil
```

### Admin

```txt
MENU
- Dashboard
- Kalender SPMB (ComingSoon route)
- Kandidat
  - Semua Kandidat
  - Data Diri
  - Data Wali
  - Data Kesehatan
  - Permintaan Perubahan
  - Perlu Tindakan
- Verifikasi
  - Review Dokumen
  - Review Pembayaran
- Seleksi
  - Paket Soal
  - Sesi Ujian
  - Hasil Ujian
- Rekap / Laporan (ComingSoon route)

MANAJEMEN
- Staff
- Pengguna (ComingSoon route)

KONFIGURASI SPMB
- Gelombang
- Program / Jalur (ComingSoon route)
- Pengumuman (ComingSoon route)

AKUN
- Profil
```

Active items must route to real pages. Future items may stay visible but must route to ComingSoon, not 404.

---

## Current Feature Status

| Area | Status |
|---|---|
| Landing page | Active |
| Guest registration wizard | Active |
| Candidate dashboard | Active |
| Candidate calendar | Active |
| Candidate profile/avatar/email request/apply | Active |
| Candidate data diri/wali/kesehatan/dokumen | Active |
| Candidate payment | Active, supports Midtrans snap token/status and manual proof upload |
| Candidate online selection exam | Active |
| Staff dashboard/candidate review | Active |
| Staff document/payment verification | Active |
| Staff/admin change request review | Active |
| Staff exam results | Active |
| Admin dashboard/candidates/waves/staff | Active |
| Admin online exam management | Active |
| Reports/payment recap/program settings/system settings | ComingSoon |
| Dedicated candidate status page | ComingSoon |

---

## Document Feature Policy

| Group | Doc Types | Required Level |
|---|---|---|
| identity | photo_formal, birth_certificate, family_card, parent_id_card | Required |
| academic | graduation_certificate, report_card | Required |
| academic | academic_transcript | Optional |
| academic | transfer_letter | Required if `is_transfer = true` |
| achievement | all | Optional / bonus |
| welfare | kip_card, welfare_card, poverty_letter | Choose one if applicable |
| boarding | parent_statement | Required UI label only |
| boarding | recommendation_letter | Optional |

`requiredLevel` is currently a UI label/document-state signal, not a universal hard backend block unless source code for the specific flow enforces it.

---

## Form Wizard Flow

```txt
FormWizard mount -> POST check-draft
Step 1 -> POST /step1
Step 2 -> PUT /step2/{draft}
Step 3 mount -> PUT /step3/init/{draft}
Step 3 submit -> PUT /step3/{draft}
Register/auth flow -> create user + candidate + guardian -> soft delete draft -> auto login -> dashboard
```

### localStorage Keys

```txt
wizard_step1
wizard_step2
wizard_step3
wizard_draft_id
wizard_last_step
```

---

## Testing Accounts

Seeder-provided accounts historically include:

| Email | Role |
|---|---|
| `admin@spmb.com` | Admin |
| `staff@spmb.com` | Staff |
| `silvia@spmb.com` | Candidate |
| `rizky@spmb.com` | Candidate |

Password is usually `password` for seeded local accounts. Verify seeders if login behavior matters.
