# Sentinel Admission — Current Status & Progress
> This file changes frequently. Update manually after every completed feature or decision.
> Last updated: Staff Dashboard — Full Build & Refactor session (May 2026)

---

## ⚡ Last Session Summary
> This section is overwritten every session. AI reads this first to restore context instantly.

```
Date     : 2026-05-03
Branch   : feat/staf-dashboard (renamed dari feat/staff-admin-dashboard, fokus staff dulu)

Did      :
  - Audit Phase 1 — semua sudah bersih SEBELUM session ini dimulai:
    IndexController.php (Staff) fields sudah benar, Topbar.tsx sudah dinamis per role,
    navigation.ts Staff sudah benar (no Verifikasi menu), web.php routes sudah lengkap
  - Upgrade IndexController.php — tambah submission_trend query (7 hari, fill missing days = 0)
  - Build Staff Dashboard Index.tsx — premium UI dengan Recharts charts, gradient icons,
    glow effects, spring animations (lazy load charts dengan Suspense)
  - Build Staff Profile.tsx — DashboardLayout (tanpa sidebar), gradient avatar, badge role
  - Refactor semua Staff pages ke component-based architecture:
    Candidates.tsx → CandidateFilters, CandidateTable, CandidatePagination
    Show.tsx → TabIdentitas, TabDokumen (lazy), TabWali, TabKesehatan
    Index.tsx → StatsGrid, StatusDistributionChart (lazy), SubmissionTrendChart (lazy), RecentSubmissionsList
    Profile.tsx → AvatarSection, ProfileEditForm
  - Semua file lolos audit internal: animejs V4, no dynamic dark class,
    lazy+Suspense untuk charts & TabDokumen, no :any, touch targets 44px+

Next     :
  - Test seluruh Staff Dashboard di browser (login staff@spmb.com)
  - Lanjut Phase 3: Admin Dashboard (Index, Candidates, Waves, Staff, Profile)
  - Setelah admin dashboard selesai & tested: ganti useIdleLogout ke 1200/300 (production)

Decisions:
  - Branch renamed: feat/staf-dashboard (fokus staff dulu, admin belakangan)
  - Component architecture: Pages = thin orchestrator, logic & UI di Components/
  - Charts pakai Recharts (bukan Chart.js) — lebih smooth, modern 2026
  - SubmissionTrendChart pakai AreaChart (bukan LineChart) — lebih visual
  - IndexController submission_trend: real data (bukan mock), fill missing days = 0
  - Growth % di stat cards: mock static dulu — real growth butuh historical snapshot table (future)
  - Profile.tsx Staff: DashboardLayout tanpa sidebar (lebih natural untuk profile page)
  - TabDokumen: lazy loaded — form-heavy, tidak perlu eager load
  - npm install recharts diperlukan sebelum build
```

> 💡 To update: tell Livi at end of session: **"Session done. Update 02_status.md."**

---

## Active Branch
`feat/staf-dashboard`

---

## Completed ✅

| Page / Feature | Notes |
|---|---|
| Landing Page v2.0 | Merged to develop. Clear. |
| CinematicShowcase | Double marquee, GalleryCard 3D parallax, lightbox, private media storage |
| Auth: Login Kandidat | Mobile dark view (amber/gold), brand header mobile ✅ |
| Auth: Login Staff/Admin | StaffLogin.tsx — Command Center, blue/cyan, no remember me ✅ |
| Auth: WrongPortal | Standalone dark page, konten dinamis per role ✅ |
| Auth: Forgot/Reset Password | Ada, needs final review |
| Auth: Register | Via wizard draft token |
| Form Wizard | 3-step pre-registration. Resume modal, duplicate check, localStorage. |
| Dashboard: Index | ✅ |
| Dashboard: Profile | ✅ |
| Dashboard: Data Diri | 4 tabs (tab 5 content TBD) |
| Dashboard: Data Kesehatan V2 | Wizard-style nav, partial save, cyan-500 accent |
| Dashboard: Data Wali V2 | Wizard-style nav, violet-500 accent |
| Dashboard: Data Dokumen V2 | Row style, drag & drop, 5 states, warning dots, amber-500 accent |
| Dashboard: Pembayaran V2 | Multi-channel, manual + gateway, orange-500 accent |
| Error Pages | 404 NotFound + comingSoon mode |
| Auto-Submitted Observer | CandidateObserver + GuardianObserver + HealthRecordObserver |
| Backend Security Fix | DocumentSecurityService magic bytes, wantsJson(), CandidateDocumentSecurity model fix |
| Infrastructure | docker-compose user:1000, filesystems.php private disk serve:true |
| Security: useIdleLogout | 1 timer, modal countdown, visibilitychange, destroy session ✅ |
| Blueprint: Staff & Admin Dashboard | blueprint_staff_admin_dashboard.md — 3 phase, 19 file ✅ |
| Staff Dashboard: Phase 1 Fixes | Controller fields, Topbar, navigation.ts, routes — semua bersih ✅ |
| Staff Dashboard: IndexController | +submission_trend real data query ✅ |
| Staff Dashboard: Index.tsx | Premium UI, Recharts (AreaChart + BarChart), lazy load, animations ✅ |
| Staff Dashboard: Candidates.tsx | Modular: CandidateFilters, CandidateTable, CandidatePagination ✅ |
| Staff Dashboard: Show.tsx | Modular: TabIdentitas, TabDokumen (lazy), TabWali, TabKesehatan ✅ |
| Staff Dashboard: Profile.tsx | DashboardLayout, modular: AvatarSection, ProfileEditForm ✅ |
| Staff Dashboard: StaffSidebar.tsx | Shared sidebar untuk Show & Profile ✅ |

---

## Pending / In Progress ⚠️

### 1. Admin Dashboard — Phase 3 (Belum Dibangun)
**Next setelah test Staff Dashboard.**
File yang perlu dibangun:
- Backend: `Admin/ProfileController.php`, `Admin/CandidateController.php`, `Admin/WaveController.php`, `Admin/StaffController.php`
- Frontend (Pages): `Admin/Index.tsx`, `Admin/Candidates.tsx`, `Admin/Waves.tsx`, `Admin/Staff.tsx`, `Admin/Profile.tsx`
- Frontend (Components): pecah sesuai pattern Staff Dashboard
- Accent color: **rose-500**

### 2. Staff Dashboard — Belum Tested di Browser
Build selesai, belum dicoba login staff@spmb.com dan test flow lengkap.
**Action:** `npm install recharts` → `build` → login → test semua halaman staff.

### 3. Document Upload — Needs Full Test
Fix committed but not fully tested (composer dump-autoload pending).
**Action:** Restart container + `art-clear`, then test upload end-to-end.

### 4. File Preview Private Storage
Files in `storage/app/private/` can't be accessed via direct URL.
**Solution:** Build dedicated auth-protected route + controller method.
**Pattern reference:** `WelcomeController::serveGallery()` — adapt with auth middleware.

### 5. useIdleLogout — Production Values Belum Diset
Sekarang masih 300s/300s (testing).
**Action setelah admin dashboard tested:** ganti ke `timeoutSeconds: 1200, warningSeconds: 300`
di `DashboardLayout.tsx` + `DashboardSplitLayout.tsx`.

---

## Next Priorities (in order)

```
1. npm install recharts → build → test Staff Dashboard di browser ← SEKARANG
2. Execute Phase 3 — Admin Dashboard (Index, Candidates, Waves, Staff, Profile)
3. Build Halaman Status kandidat            (observer sudah ready)
4. Fix & verify document upload             (composer dump / restart test)
5. Fix file preview private storage        (dedicated serve route)
6. Decide Tab 5 Data Diri content
7. Auth pages final review & polish        (forgot/reset password)
8. Fine-tune global tone, contrast, colors (after all pages done)
9. Kalender SPMB
10. Informasi page
11. Set useIdleLogout ke production values (1200/300)
12. Full audit & polish pass
```

---

## Pending Decisions — Ask Silvia Before Building

| Item | Status |
|---|---|
| Tab 5 Data Diri | Content not yet decided |
| Halaman Status | What content? Timeline? Result announcement? |
| CinematicShowcase | Photos & videos are placeholder — needs real school content |
| Surat Pernyataan template | `public/assets/surat-pernyataan-template.docx` exists — needs real content from school |
| Growth % stat cards | Sekarang mock static — real growth butuh historical snapshot table, decide kapan build |

---

## Auth System — Final Decisions

| Item | Value |
|---|---|
| Candidate login | `GET/POST /login` → `AuthenticatedSessionController@create/store` |
| Staff/Admin login | `GET/POST /staff/login` → `AuthenticatedSessionController@createStaff/storeStaff` |
| Wrong portal | `Inertia::render('Errors/WrongPortal')` langsung dari controller |
| Remember me | Kandidat: ada · Staff/Admin: tidak ada (dihapus) |
| Idle logout | 1 timer, modal countdown mm:ss, visibilitychange check |
| Idle timeout (testing) | 300s idle + 300s countdown |
| Idle timeout (production) | 1200s idle + 300s countdown |
| Session destroy | `router.post(route('logout'))` — bukan redirect biasa |

---

## Staff & Admin Dashboard — Final Decisions

| Item | Value |
|---|---|
| Arsitektur | Opsi B — URL & pages terpisah per role |
| Staff URL prefix | `/dashboard/staff/*` |
| Admin URL prefix | `/dashboard/admin/*` |
| Layout | Reuse DashboardLayout + DashboardSplitLayout — zero layout baru |
| Staff scope kandidat | Semua gelombang (filter UI ada, bukan pembatas akses) |
| Menu Verifikasi Staff | Dihapus — jadi filter di halaman Kandidat |
| Profile page | Terpisah per role — konten berbeda |
| Accent color Staff | emerald-500 |
| Accent color Admin | rose-500 |
| Staff edit data kandidat | Diizinkan (teks) |
| Verifikasi dokumen | Per dokumen individual: verified / rejected + rejection_reason |
| Notifikasi kandidat | In-app bell icon · urgent via WA manual staff |
| WA notifikasi otomatis | Future feature v2 (Fonnte) |
| Auto-hitung kuota gelombang | Future feature v2 |
| Chart library | Recharts (bukan Chart.js) — lebih smooth & modern |
| Component architecture | Pages = thin orchestrator · Logic & UI di Components/ |

---

## Staff Dashboard — File Structure (Completed)

```
app/Http/Controllers/Dashboard/Staff/
├── IndexController.php    ← index(), candidates(), show(), verifyDocument(), updateStatus()
│                             + submission_trend real data query
└── ProfileController.php  ← show(), update(), updateAvatar()

resources/js/
├── Pages/Dashboard/Staff/
│   ├── Index.tsx          ← Thin orchestrator
│   ├── Candidates.tsx     ← Thin orchestrator
│   ├── Show.tsx           ← Thin orchestrator (state + handlers)
│   └── Profile.tsx        ← Thin orchestrator
│
└── Components/Dashboard/Staff/
    ├── Index/
    │   ├── StatsGrid.tsx               ← 4 premium gradient cards + animations
    │   ├── StatusDistributionChart.tsx ← Bar chart (lazy)
    │   ├── SubmissionTrendChart.tsx    ← Area chart (lazy)
    │   └── RecentSubmissionsList.tsx   ← List dengan gradient avatars
    ├── Candidates/
    │   ├── CandidateFilters.tsx        ← Search + status + wave filter + reset
    │   ├── CandidateTable.tsx          ← Table rows + empty state
    │   └── CandidatePagination.tsx     ← Pagination controls
    ├── Show/
    │   ├── TabIdentitas.tsx            ← Grid info kandidat
    │   ├── TabDokumen.tsx              ← Doc list + verify form + status form (lazy)
    │   ├── TabWali.tsx                 ← Grid info wali (ayah/ibu/wali)
    │   └── TabKesehatan.tsx            ← Grid info kesehatan + BMI computed
    ├── Profile/
    │   ├── AvatarSection.tsx           ← Avatar upload + badges
    │   └── ProfileEditForm.tsx         ← Form nama/WA/password
    └── Shared/
        └── StaffSidebar.tsx            ← Sidebar untuk Show & Profile
```

---

## Document Feature — Required Level Policy

| Group | Doc Types | Required Level |
|---|---|---|
| identity | photo_formal, birth_certificate, family_card, parent_id_card | Required |
| academic | graduation_certificate, report_card | Required |
| academic | academic_transcript | Optional |
| academic | transfer_letter | Required if `is_transfer = true` |
| achievement | all | Optional (bonus) |
| welfare | kip_card, welfare_card, poverty_letter | Choose one (if applicable) |
| boarding | parent_statement | Required (UI label only, not enforced in backend) |
| boarding | recommendation_letter | Optional |

> `requiredLevel` is a UI label only — no hard backend block. Candidates can submit without uploading.

---

## Future Features (v2)

```
- WA notifikasi otomatis via Fonnte
- Auto-hitung & alert kuota gelombang mendekati penuh
- Halaman Reports/Laporan Admin (grafik, export PDF/Excel)
- Halaman Settings Admin (konfigurasi payment, gelombang baru)
- Kandidat re-upload dokumen setelah rejected
- Real growth % di stat cards (butuh historical snapshot table)
```

---

## Page Template Reference (Follow for all candidate dashboard pages)

```
┌─ Header (not sticky) ──────────────────────────────────────────┐
│  Icon w-9 h-9 rounded-xl + Title text-xl + Subtitle text-xs    │
└────────────────────────────────────────────────────────────────┘
┌─ Tab Bar (STICKY top-0 z-10) ──────────────────────────────────┐
│  Pill style, overflow-x-auto, dark bg rounded-2xl              │
└────────────────────────────────────────────────────────────────┘
┌─ Content (full width, no max-w-3xl) ───────────────────────────┐
│  Section headers: icon container w-9 h-9 + bold + subtitle     │
└────────────────────────────────────────────────────────────────┘
┌─ Bottom Navigation ─────────────────────────────────────────────┐
│  [← Kembali]                         [Simpan & Lanjut →]       │
│  Last tab right button: [Kirim & Selesaikan] with 2-step confirm│
└────────────────────────────────────────────────────────────────┘
```

**Never use:** `max-w-3xl mx-auto` in main content · progress bar inside content (sidebar only) · nested cards inside cards.