# Sentinel Admission — Current Status & Progress
> This file changes frequently. Update manually after every completed feature or decision.
> Last updated: Staff & Admin Dashboard — Blueprint session (April 2026)

---

## ⚡ Last Session Summary
> This section is overwritten every session. AI reads this first to restore context instantly.

```
Date     : 2026-04-12
Branch   : feat/staff-admin-dashboard

Did      :
  - Audit menyeluruh struktur project (tree 13 layer)
  - Temukan & catat semua inkonsistensi: field salah di Staff controller,
    navigation.ts tidak sinkron dengan web.php, Topbar profile link hardcoded
  - Diskusi & putuskan arsitektur Staff vs Admin dashboard (Opsi B — terpisah)
  - Putuskan Staff scope kandidat: semua gelombang (filter UI, bukan pembatas akses)
  - Putuskan menu Verifikasi dihapus dari navigation Staff — jadi filter di halaman Kandidat
  - Putuskan profile page terpisah per role
  - Putuskan accent color: Staff = emerald-500 · Admin = rose-500
  - Baca & audit: CandidateDocument migration, Staff/Admin DashboardController,
    web.php routes, navigation.ts, Sidebar, Topbar, DashboardLayout, index.d.ts,
    admission_waves migration
  - Buat blueprint lengkap: blueprint_staff_admin_dashboard.md (3 phase, 19 file)

Next     :
  - Execute Phase 1 (fixes wajib): fix Staff controller fields, Topbar, navigation.ts, routes
  - Execute Phase 2: Staff Dashboard pages (Index, Candidates, Show, Profile)
  - Execute Phase 3: Admin Dashboard pages (Index, Candidates, Waves, Staff, Profile)
  - Setelah staff dashboard selesai & tested: ganti useIdleLogout ke 1200/300 (production)

Decisions:
  - Staff & Admin dashboard: Opsi B — URL terpisah (/dashboard/staff/* vs /dashboard/admin/*)
  - Layout reuse: DashboardLayout & DashboardSplitLayout — zero layout baru
  - Staff scope kandidat: semua gelombang lintas wave
  - Menu Verifikasi Staff: dihapus, jadi filter "Menunggu Verifikasi" di halaman Kandidat
  - Profile page: terpisah per role (kandidat/staff/admin — konten berbeda)
  - Accent color Staff: emerald-500 · Accent color Admin: rose-500
  - WA notifikasi otomatis (Fonnte): ditunda → future feature v2
  - Auto-hitung kuota gelombang: ditunda → future feature v2
  - Staff bisa edit data kandidat (teks) — menghemat waktu operasional
  - Verifikasi dokumen: per dokumen individual (verified/rejected + rejection_reason)
  - Notifikasi kandidat: in-app bell icon dulu, urgent via WA manual oleh staff
```

> 💡 To update: tell Livi at end of session: **"Session done. Update 02_status.md."**

---

## Active Branch
`feat/staff-admin-dashboard`

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

---

## Pending / In Progress ⚠️

### 1. Staff & Admin Dashboard — Phase 1 (Fixes Wajib)
Blueprint sudah selesai. Belum dieksekusi.
**Action:** Execute Phase 1 dulu — fix controller fields, Topbar, navigation.ts, routes.
**File blueprint:** `docs-ai/blueprint_staff_admin_dashboard.md`

### 2. Document Upload — Needs Full Test
Fix committed but not fully tested (composer dump-autoload pending).
**Action:** Restart container + `art-clear`, then test upload end-to-end.

### 3. File Preview Private Storage
Files in `storage/app/private/` can't be accessed via direct URL.
`temporaryUrl()` unreliable on local Docker disk.
**Solution:** Build dedicated auth-protected route + controller method.
**Pattern reference:** `WelcomeController::serveGallery()` — adapt with auth middleware.
Preview button already exists in `DocumentCard` (placeholder).

### 4. useIdleLogout — Production Values Belum Diset
Sekarang masih 300s/300s (testing).
**Action setelah staff dashboard tested:** ganti ke `timeoutSeconds: 1200, warningSeconds: 300`
di `DashboardLayout.tsx` + `DashboardSplitLayout.tsx`.

---

## Next Priorities (in order)

```
1. Execute Phase 1 — fixes wajib (blueprint_staff_admin_dashboard.md) ← SEKARANG
2. Execute Phase 2 — Staff Dashboard pages (Index, Candidates, Show, Profile)
3. Execute Phase 3 — Admin Dashboard pages
4. Build Halaman Status kandidat            (observer sudah ready)
5. Fix & verify document upload             (composer dump / restart test)
6. Fix file preview private storage        (dedicated serve route)
7. Decide Tab 5 Data Diri content
8. Auth pages final review & polish        (forgot/reset password)
9. Fine-tune global tone, contrast, colors (after all pages done)
10. Kalender SPMB
11. Informasi page
12. Set useIdleLogout ke production values (1200/300)
13. Full audit & polish pass
```

---

## Pending Decisions — Ask Silvia Before Building

| Item | Status |
|---|---|
| Tab 5 Data Diri | Content not yet decided |
| Halaman Status | What content? Timeline? Result announcement? |
| CinematicShowcase | Photos & videos are placeholder — needs real school content |
| Surat Pernyataan template | `public/assets/surat-pernyataan-template.docx` exists — needs real content from school |

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