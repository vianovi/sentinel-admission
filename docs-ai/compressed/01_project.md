# Sentinel Admission — Project, Architecture & Environment
> Load this file every session. Contains project context, stack, DB schema, and environment reference.

---

## Project Overview

| | Value |
|---|---|
| **Internal name** | `Sentinel Admission` (never shown to end users) |
| **Website brand** | `Al-Muntaha School` / `Al-Muntaha Islamic Boarding School` |
| **APP_NAME** | `"Al-Muntaha School"` → navbar, footer, browser title |
| **APP_TAGLINE** | `"Menuju Puncak Ilmu & Akhlak"` → sub-navbar |
| **Purpose** | Digital admission system (SPMB) for Islamic boarding schools in Indonesia |
| **Target users** | Pondok Pesantren (Tahfidz/Kitab track) + general schools (SMP/SMA/SMK) |

⚠️ The name "Sentinel" must NEVER appear on any user-facing page.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12 |
| Bridge | Inertia.js v2 |
| Frontend | React + TypeScript |
| Styling | Tailwind CSS (`darkMode: 'class'`) |
| Animation | Anime.js |
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

---

## Environment & Aliases

| Item | Value |
|---|---|
| Shell | FISH — use `set -gx`, never `export` |
| OS | Fedora KDE Plasma |
| Package manager | `dnf` |
| Project path | `/home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission` |
| Setup | Docker + Cloudflare Tunnel |
| Domain | `spmb.playground-ku.my.id` |
| DB | MariaDB at `172.17.0.1:3306` · DB: `sentinel_admission_db` · User: `sentinel_core` |
| Email | Mailtrap sandbox |

### Dev vs Demo Mode — ASK AT START OF EVERY SESSION

| | Dev Mode | Demo Mode |
|---|---|---|
| Switch | `dev-mode` | `demo-mode` |
| Access | `localhost:8080` | `https://spmb.playground-ku.my.id` |
| Frontend | `npm run dev` (already running) | `build` or `deploy` |
| HTTPS | ❌ | ✅ |
| Midtrans | ❌ | ✅ required |

### Fish Aliases

| Alias | Action |
|---|---|
| `sentinel` | cd to project path |
| `build` | `npm run build && docker compose restart` (frontend changes) |
| `deploy` | build + restart + clear all cache (route/config/.env changes) |
| `db-reset` | `migrate:fresh --seed` |
| `art-clear` | config + route + view + cache clear |
| `tinker` | php artisan tinker via docker |
| `log` | tail laravel.log |
| `app` | exec into app container bash |
| `dcup` / `dcdwn` | docker compose up/down |
| `tunnel-on/off` | start/stop cloudflared |
| `dev-mode` / `demo-mode` | swap .env + tunnel + art-clear |

### ENV Files (all in .gitignore)
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
| `lab-hack` | Security experiments. Intentional vulnerabilities. NEVER merge or push to GitHub. |
| `feat/*` | Daily work. Flow: `feat/*` → `develop` → audit → `main` |
| `feat/dashboard-polish-v2` | **Currently active** |

⚠️ `config/sentinel.php` (Sentinel Toggle) must NEVER exist in `main` or `develop`.

---

## Database Schema

> Schema is FINAL. Any change requires explicit confirmation from Silvia first.

### Core Tables

```
users                         → auth, role, avatar, whatsapp_number, is_active
registration_drafts           → wizard data, double key (reg_code + secret_token),
                                 candidate_id FK, soft delete, expires_at
candidates                    → linked user+draft+wave, full candidate data, candidate_code
guardians                     → parent/guardian data, candidate_code
admission_waves               → available_programs (JSON), available_majors (JSON),
                                 majors_enabled (boolean)
health_records                → 1 record per candidate, candidate_code
candidate_documents           → document uploads, candidate_code
candidate_document_security   → magic bytes result, polyglot scan, file hash, upload IP
payments                      → payment records, candidate_code
```

### Candidate Status Flow
`draft` → `submitted` → `verified` → `accepted` / `rejected`

### Auto-Submitted Criteria (13 fields — via Observer)
```
candidates:     religion, program_choice
guardians:      mother_name, income_type, father_status, mother_status, no_kk
health_records: blood_type, rhesus, height_cm, weight_kg,
                general_health_condition, eye_right_type, eye_left_type
```

### Candidate Code System
```
registration_code format: REG-{random4}-{yy}-G{wave}  (e.g. REG-A3X9-26-G2)
candidate_code:           CDT-{random4}-{yy}-G{wave}  (same suffix, prefix changed only)
→ Set via: str_replace('REG-', 'CDT-', $draft->registration_code)
→ Generated once at step3 init. Loop uniqueness check with withTrashed().
→ CandidateObserver propagates to: guardians, health_records, candidate_documents, payments
```

### candidates (editable columns)
```
candidate_code, email, phone_number, religion, child_order, siblings_count
hobbies, ambitions, habits, extracurricular_interests (JSON)
postal_code, school_npsn, certificate_number, birth_certificate_number
family_card_number, program_choice, major_choice
data_change_request (JSON), status, is_transfer (bool)
```

### health_records
```
candidate_id (unique), candidate_code
blood_type (enum: A,B,AB,O,unknown), rhesus (enum: positive,negative,unknown)
height_cm, weight_kg  [BMI computed in model, not stored]
general_health_condition, mental_health_notes
eye_right_type/value, eye_left_type/value, eye_condition_since
major_illnesses, last_illness
allergy_food, allergy_medicine, allergy_condition
physical_disabilities, chronic_disease_doc_path, surat_sehat_path, bpjs_card_path, vaccine_card_path
special_notes, parent_concern_notes
```

### guardians
```
candidate_id, candidate_code
father: name, nik, place_of_birth, date_of_birth, job, income, phone
mother: name (NOT NULL), nik, place_of_birth, date_of_birth, job, income, phone
guardian: name, relation, job, income, phone (optional)
no_kk
```

---

## Controller Structure

```
app/Http/Controllers/
├── Auth/        → AuthenticatedSession, EmailVerification, NewPassword, PasswordResetLink
├── Candidate/   → Dashboard, Profile, DataDiri, HealthRecord, Guardian, Document, Payment
├── Staff/       → DashboardController
├── Admin/       → DashboardController
├── Admission/   → FormWizardController, RegisterController
└── Public/      → WelcomeController
```

### Observers
```
app/Observers/
├── CandidateObserver.php    → propagate candidate_code + checkAndSubmit()
├── GuardianObserver.php     → trigger checkAndSubmit via CandidateObserver
└── HealthRecordObserver.php → trigger checkAndSubmit via CandidateObserver
```

### Services
```
app/Services/DocumentSecurityService.php → 4-layer Sentinel file security
```

---

## Frontend Structure

```
resources/js/
├── Components/
│   ├── Landing/      → TopBar, Navbar, HeroSection, CinematicShowcase, Footer, etc.
│   ├── Dashboard/
│   │   ├── Candidate/
│   │   │   ├── DataDiri/       → TabIdentitas, TabAlamat, TabMinat, TabProgram
│   │   │   ├── DataKesehatan/  → TabRangkuman, TabFisik, TabRiwayat, TabCatatanKhusus, TabTimKesehatan
│   │   │   └── Shared/         → CandidateSidebar.tsx
│   │   └── Shared/             → Backdrop, Sidebar, Topbar
│   ├── UI/           → Field.tsx, InfoRow, ProgressRing, selectStyles.ts
│   └── Wizard/       → WizardStep1-3, WizardSidebar, ResumeModal, useWizardStorage.ts
├── Layouts/
│   ├── DashboardLayout.tsx        → no right sidebar
│   └── DashboardSplitLayout.tsx   → with sticky right sidebar (props: aside, asideWidth)
└── Pages/
    ├── Dashboard/Candidate/       → DataDiri, DataKesehatan, DataWali, DataDokumen, Index, Profile
    ├── Admission/                 → FormWizard, Register
    └── Landing/                   → Welcome
```

### Layout Usage
```tsx
// With right sidebar (most candidate pages)
<DashboardSplitLayout aside={<CandidateSidebar ... />}>
// Without sidebar
<DashboardLayout>
```

### DashboardSplitLayout Sticky Key
```
h-screen → flex-col
  [Topbar shrink-0]
  flex-1 flex-row overflow-hidden
    ├── flex-1 overflow-y-auto   ← main content (children)
    └── w-[280px] overflow-y-auto ← sticky right sidebar (aside)
```

### CandidateSidebar Props
```tsx
{
  user: { name, avatar_url, initials },
  candidate: { full_name, nisn, nik, gender_label, date_of_birth_label,
               school_origin, status, program_choice, admission_wave },
  completion: number,  // 0-100
  tips?: string[]
}
```

### Controller Props Pattern (always follow this)
```php
$candidate = $user->candidate()->with('admissionWave')->first();
// Pass to Inertia:
'user'      => ['name', 'avatar_url', 'initials'],
'candidate' => ['full_name', 'nisn', 'nik', 'gender_label', 'date_of_birth_label',
                'school_origin', 'status', 'program_choice', 'admission_wave'],
```

### Navigation (Candidate Sidebar)
```
MENU:        Dashboard✅  Kalender SPMB⏳  Informasi⏳
PENDAFTARAN: Data Diri✅  Data Kesehatan✅  Data Wali✅  Dokumen✅  Pembayaran✅  Status⏳
AKUN:        Profil✅
```

---

## Form Wizard — Complete Flow

### localStorage Keys (all prefixed `wizard_*`)
```
wizard_step1 · wizard_step2 · wizard_step3 · wizard_draft_id · wizard_last_step
```

### Step-by-Step Flow
```
FormWizard mount → POST check-draft
  → valid:   restore data from localStorage
  → invalid: clearWizardStorage() → fresh start

Step 1 → POST /step1 (upsert)
  → expires_at set ONLY on INSERT (now+2days), never updated on edit
  → duplicate check always runs (include current_draft_id to exclude self)
  → cleanup old drafts with same NISN/NIK before INSERT

Step 2 → PUT /step2/{draft}

Step 3 mount → guard: if draftId empty → redirect
  → PUT /step3/init/{draft} (auto, min 800ms loading)
  → generate code + token, set cookie

Step 3 submit → PUT /step3/{draft} → save school_origin
  → redirect screen 2.5s → router.visit('/register')

POST /register → CREATE user + candidate + guardian → soft delete draft
  → delete cookie → auto login → redirect /dashboard

Dashboard mount → clearWizardStorage()
```

### Expiry & Cookie Logic
```
expires_at    = now+2days, set at step1 INSERT only, never modified
draft_token   = cookie duration = remaining minutes of expires_at
Expired draft = forceDelete draft + delete cookie + redirect /daftar
```

---

## GlobalProgressBar
```
Mounted in app.tsx via GlobalProgressBar component
Auto-triggers on Inertia navigation
Color: gold #d4a017
createInertiaApp config: progress: false (uses custom GlobalProgressBar, not built-in)
Wizard step transition: trigger manually via data-wizard-bar / data-wizard-glow DOM attributes
```

---

## Landing Page — Section Order & Colors
```
TopBar            → bg-navy (dark)
Navbar            → bg-navy/90 (top) → glassmorphism (on hero) → bg-white (scrolled)
HeroSection       → dark overlay + bg-image + wave divider bottom (navy)
ProfileSection    → bg-navy (dark) + wave divider bottom (white)
VisiMisiSection   → bg-white + dotted pattern
HighlightSection  → bg-white
GallerySection    → bg-navy (dark) + wave top & bottom ← RHYTHM BREAKER
FacilitiesSection → bg-slate-50
HowToRegister     → bg-slate-50
Footer            → bg-navy (dark)
```

---

## Routes Reference

### Form Wizard (guest only)
```
GET/POST /daftar, /daftar/check-draft, /daftar/check-duplicate, /daftar/resume
POST     /daftar/step1
PUT      /daftar/step2/{draft}
PUT      /daftar/step3/init/{draft}   ← must be above step3/{draft} in routes file
PUT      /daftar/step3/{draft}
GET/POST /register                    ← ValidateDraftToken middleware
```

### Dashboard Candidate
```
GET/PUT  /dashboard/profile
POST     /dashboard/profile/avatar
GET/PUT  /dashboard/data-diri
POST/DEL /dashboard/data-diri/change-request
GET/POST /dashboard/data-kesehatan
POST/DEL /dashboard/data-kesehatan/dokumen/{docType}
⏳ Pending: /data-wali, /dokumen, /pembayaran, /status
```

---

## Testing Accounts (from CandidateSeeder)

| Email | Role | Status |
|---|---|---|
| `admin@spmb.com` | Admin | — |
| `staff@spmb.com` | Staff | — |
| `silvia@spmb.com` | Candidate | submitted ✅ can access Payment |
| `rizky@spmb.com` | Candidate | draft ❌ redirects to comingSoon |

Password: `password` for all accounts.
