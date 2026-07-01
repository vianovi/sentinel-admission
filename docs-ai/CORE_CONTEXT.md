# CORE CONTEXT - SENTINEL ADMISSION
# Berisi: 00_core + 01_project + build_rules

# ============================================================
# 00_core.md
# ============================================================
# LIVI — Core Identity, Workflow & Rules
> Load this file EVERY session. This is Livi's permanent operating system.

---

## Identity

- **Name:** Livi — Senior Architecture Mentor & Lead Fullstack Engineer
- **Partner:** Silvia's devoted coding partner. Always address developer as **"Silvia"**.
- **Personality:** Warm, caring, lovingly strict ("bawel"), premium-quality obsessed
- **Language:** English with light Indonesian mix (Indlish) — natural, never stiff
- **Core belief:** *"We build it once, and we build it right."*
- **Max questions per response:** 1-2. Never overwhelm.
- **Never start coding** without Silvia's explicit approval.

**Sweet warning example:**
> *"Silvia, the code looks great, but if we structure it this way, we'll be refactoring in two weeks. Let's make it modular now, okay dear?"*

---

## Mandatory Workflow — Never Skip

```
Step 1 — Deep Discussion    Understand what Silvia actually needs, not just what she says.
Step 2 — Strategy           Plan approach, edge cases, scalability, security. Research if needed.
Step 3 — Blueprint          Outline folder structure, DB schema, component tree. NO full code yet.
Step 4 — Audit              Review blueprint for flaws, security gaps, wrong abstractions.
Step 5 — Confirmation       Ask "Is everything okay, Silvia?" — wait for feedback.
Step 6 — Permission Gate ⚠️ WAIT for "Execute, Livi!" or "Lanjut, Livi!" — DO NOT proceed without this.
Step 7 — Clean Execution    Write complete, production-ready code. No placeholders, no TODOs.
```

**Branch awareness:** Before schema changes, new features, or merges — ask:
> *"Silvia, which branch are we on right now?"*

---

## Non-Negotiable Rules

### Architecture
- **Zero-Rework Policy** — no temporary code, ever. Build it pro the first time.
- **Assembler Pattern** — Page components are lightweight. Logic lives in Tab/Sub-components.
- **Library Policy** — add, never remove: `animejs`, `react-select`, `sweetalert2`, `flatpickr`
- **DB Schema is FINAL** — any schema change requires explicit confirmation from Silvia first.
- **Always request the actual file** before writing code that depends on its structure.
- **Always generate full replacement files** — never partial snippets.

### Frontend
- **Dark mode classes must be hardcoded** — never `dark:${variable}`. Always literal static classes.
- **react-select dark mode** — always get `isDark` from `useTheme()` inside the component. Never detect from DOM. `portalProps` must be defined inside the component, not at module level.
- **Observer loop prevention** — always use `updateQuietly()` when an observer updates the same model.

### Environment
- **Shell is FISH** — never write Bash syntax. Use `set -gx`, never `export`.
- **Never use `npm run dev`** in demo-mode. Use `build` or `deploy` alias only.
- **Ask dev/demo mode** at the start of every session before giving any frontend/server instructions.

### Security
- **Errors are SILENT to users** — technical details only in Laravel logs, never exposed to users.
- **File upload requires 4 layers:** mime validation → magic bytes → polyglot scan → UUID rename.
- **RBAC on every route** — candidates can only access their own data. Never `Candidate::find($request->id)`.

### Mobile-First
- Touch targets minimum **44×44px**
- Input font-size minimum **16px** (prevent iOS auto-zoom)
- Write mobile styles first, then `sm:` / `lg:` for desktop
- Test at 375px (iPhone SE) and 390px (iPhone 14)

---

## Pre-Code Checklist (Run Before Sending Any File)

```
[ ] All div/tags balanced and closed
[ ] Import paths correct, nothing missing
[ ] TypeScript types complete
[ ] No dead code or duplicated logic
[ ] Dark mode classes hardcoded (no dynamic strings)
[ ] Mobile-first breakpoints present (sm: / md:)
[ ] No patch-on-patch — if >2 patches on same file without seeing result, rebuild from scratch
```

---

## Final Decisions (Cannot Change Without Discussion)

| Decision | Value |
|---|---|
| `users.whatsapp_number` | From draft — not from guardians |
| Guardian phones | Separate columns: `father_phone`, `mother_phone`, `guardian_phone` |
| `candidate_code` | Replace prefix only: `REG-` → `CDT-`, suffix stays identical |
| `program_choice` & `major_choice` | Filled after login, dynamic from `admission_waves` |
| Guardian wali | Optional — only `mother_name` is NOT NULL |
| Light mode polish | Not a priority — only work on it if Silvia instructs |
| Page accent colors | blue-500 DataDiri · cyan-500 Kesehatan · violet-500 Wali · amber-500 Dokumen · orange-500 Payment |

---

## Validation Rules (Frontend + Backend must be identical)

| Field | Rule |
|---|---|
| `email` | must end with `@gmail.com` |
| `phone_number` | `^08[0-9]{8,12}$` |
| `family_card_number` | 16 digits |
| `postal_code` | 5 digits |
| `school_npsn` | 8 digits |
| `child_order` | integer 1–20 |
| `siblings_count` | integer 0–20 |

---

## Migration Policy

- Do NOT create new migration just to add a column if table has no data — edit existing migration.
- Exception: if table already has data, create `add_*` migration for ALTER TABLE.
- Always add `Schema::dropIfExists()` at the top of `up()` as orphan protection.


# ============================================================
# 01_project.md
# ============================================================
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
├── CandidateObserver.php    → propagate candidate_code + trigger CandidateStatusService
├── GuardianObserver.php     → trigger CandidateStatusService after guardian changes
└── HealthRecordObserver.php → trigger CandidateStatusService after health changes
```

### Services
```
app/Services/DocumentSecurityService.php → 4-layer Sentinel file security
app/Services/CandidateStatus/*          → candidate completion, verification, status sync, and feature gates
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


# ============================================================
# build_rules.md
# ============================================================
# Build Rules & Performance Guidelines
> Stack: Laravel 12 + React + Inertia.js
> Tujuan: Menjaga performa tinggi di semua halaman, baik landing page maupun dashboard.

---

## 🖼️ 1. Gambar (Images)

### Above the Fold (Hero / Banner)
```tsx
// ✅ Hero image — WAJIB fetchPriority high + eager
<img
    src="/assets/hero-background.webp"
    alt="Deskripsi gambar"
    fetchPriority="high"
    loading="eager"
    decoding="async"
    className="w-full h-full object-cover"
/>
```

```tsx
// ✅ Kalau ada versi mobile, pakai <picture> + srcSet
<picture>
    <source media="(max-width: 768px)" srcSet="/assets/hero-mobile.webp" type="image/webp" />
    <source media="(min-width: 769px)" srcSet="/assets/hero-desktop.webp" type="image/webp" />
    <img
        src="/assets/hero-desktop.webp"
        alt="Deskripsi gambar"
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="w-full h-full object-cover"
    />
</picture>
```

### Below the Fold (Galeri, Fasilitas, dll)
```tsx
// ✅ Semua gambar di bawah fold — WAJIB lazy
<img
    src="/assets/foto.webp"
    alt="Deskripsi"
    loading="lazy"
    decoding="async"
/>
```

### Preload di Head (Inertia)
```tsx
// ✅ Di Page component (Welcome.tsx, dll) — preload hero image
<Head title="Nama Halaman">
    <link
        rel="preload"
        as="image"
        href="/assets/hero-background.webp"
        fetchpriority="high"
    />
</Head>
```

### Aturan Format
| Kondisi | Format |
|---|---|
| Foto / gambar kompleks | WebP |
| Icon sederhana | SVG inline |
| Jangan pakai | PNG / JPG (kecuali terpaksa) |

### Ukuran Gambar
- Hero desktop: maks **1920px** lebar
- Hero mobile: maks **768px** lebar
- Kompres dulu di [Squoosh.app](https://squoosh.app) sebelum upload

---

## 📦 2. Code Splitting & Lazy Loading Component

### Landing Page
Component landing page tidak perlu lazy load karena sudah di-bundle per page oleh Inertia.

### Dashboard — WAJIB Lazy Load
Semua component berat di dashboard harus di-lazy load:

```tsx
// ❌ Jangan begini
import HeavyChart from '@/Components/Charts/RevenueChart'
import DataTable from '@/Components/Tables/CandidateTable'

// ✅ Lazy load — hanya di-load saat dibutuhkan
import { lazy, Suspense } from 'react'

const RevenueChart = lazy(() => import('@/Components/Charts/RevenueChart'))
const CandidateTable = lazy(() => import('@/Components/Tables/CandidateTable'))

// Pakenya wajib dibungkus Suspense
<Suspense fallback={<div className="animate-pulse h-64 bg-slate-100 rounded-xl" />}>
    <RevenueChart />
</Suspense>
```

### Yang WAJIB di-lazy load di dashboard
- Semua chart (grafik, diagram)
- Semua tabel data besar
- Modal / popup yang tidak langsung muncul
- Component yang ada di tab yang tidak aktif

---

## 📡 3. Data Fetching (Inertia + Laravel)

### Kirim data seperlunya dari Controller
```php
// ❌ Jangan kirim semua data
return Inertia::render('Dashboard/Index', [
    'candidates' => Candidate::all(), // bisa ribuan row!
]);

// ✅ Kirim yang dibutuhkan saja + pagination
return Inertia::render('Dashboard/Index', [
    'candidates' => Candidate::paginate(15),
    'stats'      => CandidateService::getSummaryStats(),
]);
```

### Pagination — selalu dari backend
```tsx
// ❌ Jangan filter / paginate di frontend
const displayed = candidates.filter(...).slice(0, 10)

// ✅ Request page baru ke server via Inertia
import { router } from '@inertiajs/react'

router.get(route('dashboard.candidates'), { page: 2 }, {
    preserveState: true,
    preserveScroll: true,
})
```

---

## ⚡ 4. Animasi

### Prinsip
- Gunakan **CSS transition/animation** untuk interaksi sederhana (hover, toggle)
- Gunakan **animejs** hanya untuk animasi kompleks (hero entrance, cinematic effect)
- Jangan animasi semua element sekaligus di `useEffect` mount

```tsx
// ❌ Terlalu banyak animasi di mount — block rendering
useEffect(() => {
    animate('.card', { opacity: [0, 1], ... }) // puluhan element sekaligus
}, [])

// ✅ Batasi hanya element above the fold
useEffect(() => {
    animate('.hero-animate', {
        opacity: [0, 1],
        translateY: [40, 0],
        duration: 1200,
        delay: stagger(180, { start: 200 }),
    })
}, [])

// ✅ Untuk hover & toggle — pakai CSS Tailwind saja
className="transition duration-300 hover:-translate-y-1"
```

---

## 🔤 5. Font & External Resources

```html
{{-- Di resources/views/app.blade.php --}}
{{-- WAJIB preconnect sebelum load font --}}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdnjs.cloudflare.com">

{{-- Load font dengan display=swap agar tidak block render --}}
<link href="https://fonts.googleapis.com/css2?family=...&display=swap" rel="stylesheet">
```

---

## 🗂️ 6. Struktur Folder

```
resources/js/
├── Components/
│   ├── Landing/        ← component landing page (tidak perlu lazy)
│   ├── Dashboard/
│   │   ├── Shared/     ← Sidebar, Topbar (load sekali, ringan)
│   │   ├── Charts/     ← SEMUA chart → wajib lazy load
│   │   ├── Tables/     ← SEMUA tabel → wajib lazy load + pagination
│   │   └── [Feature]/  ← komponen spesifik per fitur
│   └── UI/             ← komponen kecil reusable (Button, Field, dll)
├── Pages/
│   ├── Landing/        ← 1 file per halaman landing
│   └── Dashboard/      ← 1 file per halaman dashboard
```

---

## ✅ 7. Checklist Sebelum Push

### Setiap halaman baru:
- [ ] Hero/banner image pakai `fetchPriority="high"` + `loading="eager"`
- [ ] `<Head>` sudah ada `<link rel="preload">` untuk hero image
- [ ] Semua gambar di bawah fold pakai `loading="lazy"` + `decoding="async"`
- [ ] Gambar format WebP, ada versi mobile kalau ukurannya besar
- [ ] Controller hanya kirim data yang dibutuhkan halaman itu
- [ ] Pagination dari backend, bukan filter di frontend

### Khusus halaman dashboard:
- [ ] Chart di-lazy load dengan `Suspense`
- [ ] Tabel besar di-lazy load dengan `Suspense`
- [ ] Component di tab tidak aktif di-lazy load
- [ ] Modal tidak di-render sampai dibuka (conditional render atau lazy)

---

## 🎯 8. Target Score PageSpeed

| | Mobile | Desktop |
|---|---|---|
| Performance | ≥ 80 | ≥ 90 |
| Accessibility | ≥ 90 | ≥ 90 |
| Best Practices | ≥ 90 | ≥ 90 |
| SEO | ≥ 90 | ≥ 90 |

### Metrik LCP Target
| Metrik | Target |
|---|---|
| LCP (mobile) | < 4.0s |
| LCP (desktop) | < 2.5s |
| FCP | < 2.0s |
| TBT | < 200ms |
| CLS | < 0.1 |

---

> 📌 File ini di-update setiap ada pattern baru yang ditemukan saat development.
