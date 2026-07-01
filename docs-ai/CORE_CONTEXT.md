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
