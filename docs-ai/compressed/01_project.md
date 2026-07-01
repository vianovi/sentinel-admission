# Sentinel Admission — Project, Architecture & Environment
> Load this file every session. Contains stable project context, architecture, environment reference, and current route/menu truth.

---

## Project Overview

| | Value |
|---|---|
| **Internal name** | `Sentinel Admission` — never shown to end users |
| **Website brand** | `Al-Muntaha School` / `Al-Muntaha Islamic Boarding School` |
| **APP_NAME** | `"Al-Muntaha School"` → navbar, footer, browser title |
| **APP_TAGLINE** | `"Menuju Puncak Ilmu & Akhlak"` → sub-navbar |
| **Purpose** | Digital admission system / SPMB for Indonesian education institutions |
| **Target users** | Islamic boarding schools, SMP/SMA/SMK, and general school admission committees |

⚠️ The name **Sentinel** must never appear on any user-facing page.

---

## Execution Reminder

Before executing any code change, make sure the working branch is correct and aligned with the feature being built.

Environment note:
- The project runs on Fedora KDE Plasma with Fish shell.
- Use Fish syntax. Prefer `set -gx`, never Bash `export`.
- `dev-mode` exists for active coding / many local changes.
- `demo-mode` exists for public access, testing with friends, and tunnel/domain demos.

This file is not a real-time status tracker. It is a project reference, architecture note, and build checklist. Always verify the latest source directly before execution.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12 |
| Bridge | Inertia.js v2 |
| Frontend | React + TypeScript |
| Styling | Tailwind CSS (`darkMode: 'class'`) |
| Animation | Anime.js |
| Charts | Recharts |
| UI Libraries | SweetAlert2, react-select, flatpickr |
| Icons | Font Awesome 6 |
| Route helper | Ziggy |
| HTTP client | Axios |

---

## Color System

```js
// Brand
navy: '#0f172a' | gold: '#d4a017' | goldhover: '#b5850b' | light: '#f1f5f9'

// Shell tokens (Sidebar, Topbar)
--shell-bg:      #080d18 (dark) | #f0ebe0 (light)
--shell-surface: #0a0f1e (dark) | #faf7f0 (light)
--shell-border:  rgba(255,255,255,0.05) (dark) | rgba(0,0,0,0.06) (light)

// Content tokens (DataDiri, DataKesehatan, etc.)
--content-bg:      #0d1424 (dark) | #fdf9f3 (light)
--content-surface: #111827 (dark) | #ffffff (light)
--content-card:    rgba(255,255,255,0.04) (dark) | rgba(0,0,0,0.025) (light)
--content-border:  rgba(255,255,255,0.08) (dark) | rgba(0,0,0,0.08) (light)
--content-muted:   rgba(255,255,255,0.04) (dark) | rgba(0,0,0,0.03) (light)
```

### Dashboard Accent Colors

| Area | Accent |
|---|---|
| Candidate Data Diri | `blue-500` |
| Candidate Data Kesehatan | `cyan-500` |
| Candidate Data Wali | `violet-500` |
| Candidate Dokumen | `amber-500` |
| Candidate Pembayaran | `orange-500` |
| Staff Dashboard | `emerald-500` |
| Admin Dashboard | `rose-500` |

---

## Environment & Aliases

| Item | Value |
|---|---|
| Shell | Fish |
| OS | Fedora KDE Plasma |
| Package manager | `dnf` |
| Project path | `/home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission` |
| Setup | Docker + Cloudflare Tunnel |
| Domain | `spmb.playground-ku.my.id` |
| DB | MariaDB at `172.17.0.1:3306` · DB: `sentinel_admission_db` · User: `sentinel_core` |
| Email | Mailtrap sandbox |

### Fish Aliases

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

### ENV Files

```
.env        → active file read by Laravel
.env.local  → dev mode config
.env.tunnel → demo mode config (HTTPS, secure cookies)
.env.bak    → original backup, not read by system
```

---

## Git Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready only. No unverified code. |
| `develop` | Integration hub. All `feat/*` merge here first, audit before `main`. |
| `lab-hack` | Security experiments. Intentional vulnerabilities. Never merge or push. |
| `feat/*` | Daily work. Flow: `feat/*` → `develop` → audit → `main`. |

Branch may change by session. Always confirm with `git branch --show-current` before execution.

⚠️ `config/sentinel.php` must never exist in `main` or `develop`.

---

## Role & Permission Model

Global auth roles are fixed:

```txt
candidate
staff
admin
```

Important decision:
- Do not add global roles like `bendahara`, `operator`, `verifikator`, or `administrasi`.
- Those are domain/menu groupings, not auth roles.
- Staff may represent different real-world parts of the committee, but auth remains `staff`.
- Admin has all staff domains plus admin-only system control.

SPMB payment scope:
- The system validates registration/initial admission payments only.
- It is not a full treasury, accounting, cashbook, debt, installment, or finance-management system.
- Payment data can be exported/recapped for external/internal finance workflows.

---

## Database Schema

> Schema is treated as final. Any schema change requires explicit confirmation from Silvia first.

### Core Tables

```
users                         → auth, role, avatar, whatsapp_number, is_active,
                                 pending_email, pending_email_token, pending_email_requested_at
registration_drafts           → wizard data, double key (reg_code + secret_token),
                                 candidate_id FK, soft delete, expires_at
candidates                    → linked user+draft+wave, full candidate data, candidate_code,
                                 data_change_request JSON
latest candidate data tables  → guardians, health_records, candidate_documents, payments
admission_waves               → available_programs JSON, available_majors JSON, majors_enabled
candidate_document_security   → magic bytes result, polyglot scan, file hash, upload IP
```

### Candidate Status Flow

```txt
draft → submitted → verified → accepted / rejected
```

### Candidate Code System

```txt
registration_code: REG-{random4}-{yy}-G{wave}
candidate_code:    CDT-{random4}-{yy}-G{wave}

candidate_code is generated by replacing only the prefix:
REG- → CDT-
```

### Auto-Submitted Criteria via Observers

```txt
candidates:     religion, program_choice
guardians:      mother_name, income_type, father_status, mother_status, no_kk
health_records: blood_type, rhesus, height_cm, weight_kg,
                general_health_condition, eye_right_type, eye_left_type
```

### Candidate Change Request

Stored in `candidates.data_change_request` as JSON.

Current pending format:

```json
{
  "field": "full_name",
  "old_value": "old value",
  "new_value": "new value",
  "reason": "reason with minimum length",
  "status": "pending",
  "requested_at": "ISO timestamp"
}
```

Allowed requested fields:

```txt
full_name, nisn, nik, gender, place_of_birth, date_of_birth, address_detail, school_origin
```

Known risk:
- `address_detail` may become string `"Array"` when old value is cast improperly.
- Fix this during Staff/Admin `Permintaan Perubahan` workflow build.

### Candidate Email Change Request

Stored in `users`:

```txt
email
pending_email
pending_email_token
pending_email_requested_at
```

Current state:
- Candidate can request and cancel.
- Token is generated but final verification endpoint is not implemented yet.
- Staff/admin approval workflow is not implemented yet.

---

## Controller Structure — Current Namespaces

```txt
app/Http/Controllers/
├── Auth/
├── Admission/
├── Public/
└── Dashboard/
    ├── Candidate/
    │   ├── IndexController.php
    │   ├── ProfileController.php
    │   ├── DataDiriController.php
    │   ├── GuardianController.php
    │   ├── HealthRecordController.php
    │   ├── DocumentController.php
    │   └── PaymentController.php
    ├── Staff/
    │   ├── IndexController.php
    │   └── ProfileController.php
    └── Admin/
        ├── IndexController.php
        ├── CandidateController.php
        ├── WaveController.php
        ├── StaffController.php
        └── ProfileController.php
```

Older docs may mention `app/Http/Controllers/Staff/*` or `Admin/*` directly. Treat those as outdated unless source confirms otherwise.

---

## Frontend Structure — Current Reference

```txt
resources/js/
├── Components/
│   ├── Landing/
│   ├── Dashboard/
│   │   ├── Candidate/
│   │   │   ├── DataDiri/
│   │   │   ├── DataKesehatan/
│   │   │   └── Shared/
│   │   ├── Staff/
│   │   │   ├── Index/
│   │   │   ├── Candidates/
│   │   │   ├── Show/
│   │   │   ├── Profile/
│   │   │   └── Shared/
│   │   └── Shared/
│   ├── UI/
│   └── Wizard/
├── Layouts/
│   ├── DashboardLayout.tsx
│   └── DashboardSplitLayout.tsx
└── Pages/
    ├── Dashboard/
    │   ├── Candidate/
    │   ├── Staff/
    │   ├── Admin/
    │   └── Index.tsx
    ├── Admission/
    └── Landing/
```

Architecture decision:
- Pages should be thin orchestrators.
- Logic and UI details live inside domain components.
- No new dashboard layout unless explicitly approved.

---

## Routes Reference — Current Truth

### Form Wizard / Guest

```txt
GET/POST /daftar
POST     /daftar/check-draft
POST     /daftar/check-duplicate
POST     /daftar/resume
POST     /daftar/step1
PUT      /daftar/step2/{draft}
PUT      /daftar/step3/init/{draft}
PUT      /daftar/step3/{draft}
GET/POST /register
```

### Candidate Dashboard

```txt
GET       /dashboard
GET/PUT   /dashboard/profile
POST      /dashboard/profile/avatar
POST      /dashboard/profile/email
DELETE    /dashboard/profile/email

GET/PUT   /dashboard/data-diri
POST      /dashboard/data-diri/change-request
DELETE    /dashboard/data-diri/change-request

GET/POST  /dashboard/data-wali
GET/POST  /dashboard/data-kesehatan
POST/DEL  /dashboard/data-kesehatan/dokumen/{docType}

GET       /dashboard/data-dokumen
POST      /dashboard/data-dokumen/upload
GET       /dashboard/data-dokumen/preview/{document}
GET       /dashboard/data-dokumen/download/{document}
DELETE    /dashboard/data-dokumen/{document}

GET       /dashboard/pembayaran
POST      /dashboard/pembayaran
POST      /dashboard/pembayaran/{payment}/proof
POST      /dashboard/pembayaran/{payment}/cancel
```

Status page note:
- Candidate status is visible in the main dashboard/profile areas.
- Dedicated `/dashboard/status` route is not active yet.
- Sidebar `Status` should point to ComingSoon until built.

### Staff Dashboard

```txt
GET       /dashboard/staff
GET       /dashboard/staff/candidates
GET       /dashboard/staff/candidates/{candidate}
GET       /dashboard/staff/candidates/{candidate}/{section}
GET/PUT   /dashboard/staff/profile
POST      /dashboard/staff/profile/avatar
```

Current staff capabilities:
- Dashboard real stats/trend/recent submissions.
- Candidate list with search, status filter, wave filter, pagination.
- Candidate detail/show with readonly data sections.
- Staff document preview + verify/reject is active.
- Staff payment proof preview + verify/reject is active.
- Staff profile show/update/avatar is active.

Current staff gap:
- No approve/reject workflow for candidate data change request.
- No approve/reject/finalize workflow for candidate email change request.

### Admin Dashboard

```txt
GET       /dashboard/admin
GET       /dashboard/admin/candidates
GET       /dashboard/admin/waves
GET       /dashboard/admin/staff-list
GET/PUT   /dashboard/admin/profile
```

Current admin status:
- Admin dashboard index is functional and uses DB data.
- Admin candidates/waves/staff/profile routes and controllers exist.
- React pages for those admin subpages are not yet implemented, so they are not usable yet.

---

## Navigation & Sidebar Policy

### Candidate Navigation

```txt
MENU
- Dashboard ✅
- Kalender SPMB → ComingSoon
- Informasi → ComingSoon

PENDAFTARAN
- Data Diri ✅
- Data Kesehatan ✅
- Data Wali ✅
- Dokumen ✅
- Pembayaran ✅
- Status → ComingSoon

AKUN
- Profil ✅
```

### Staff/Admin Domain Grouping

Use menu grouping by work domain, not by new auth roles.

```txt
MENU
- Dashboard
- Kandidat
- Permintaan Perubahan
- Seleksi & Status
- Laporan Umum

ADMINISTRASI
- Dokumen

PEMBAYARAN
- Pembayaran
- Rekap Pembayaran

PENGATURAN ADMIN
- Gelombang
- Program / Jalur
- Staff
- Pengaturan Sistem

AKUN
- Profil
```

Build policy:
- Active menu items must route to real pages.
- Future menu items may stay visible but must route to ComingSoon, not 404.
- Do not create fake features; label inactive features clearly.

---

## ComingSoon Policy

Existing references:
- `Error Pages` already support NotFound + comingSoon mode.
- Candidate `TabTimKesehatan.tsx` is a good visual reference for in-tab placeholder.

Decision:
- For sidebar/future menu routes, prefer one universal role-aware ComingSoon page/mode.
- ComingSoon should work for candidate, staff, and admin dashboards.
- It should include feature name, short description, status, and a back-to-dashboard button.

---

## Document Feature — Required Level Policy

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

`requiredLevel` is currently a UI label only. It is not a hard backend block.

---

## Form Wizard — Complete Flow

```txt
FormWizard mount → POST check-draft
Step 1 → POST /step1
Step 2 → PUT /step2/{draft}
Step 3 mount → PUT /step3/init/{draft}
Step 3 submit → PUT /step3/{draft}
POST /register → create user + candidate + guardian → soft delete draft → auto login → dashboard
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

| Email | Role | Status |
|---|---|---|
| `admin@spmb.com` | Admin | dashboard index usable |
| `staff@spmb.com` | Staff | staff dashboard usable |
| `silvia@spmb.com` | Candidate | submitted, can access payment |
| `rizky@spmb.com` | Candidate | draft, restricted/comingSoon behavior |

Password: `password` for all accounts.
