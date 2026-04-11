# Sentinel Admission — Current Status & Progress
> This file changes frequently. Update manually after every completed feature or decision.
> Last updated: Auth Staff-Admin session — StaffLogin, WrongPortal, useIdleLogout, mobile dark view

---

## ⚡ Last Session Summary
> This section is overwritten every session. AI reads this first to restore context instantly.

```
Date     : 2026-04-11
Branch   : feat/staff-admin-dashboard (baru, dari develop)

Did      :
  - Backend: tambah route staff.login + staff.login.post di auth.php
  - Backend: modif AuthenticatedSessionController — createStaff(), storeStaff(),
             store() diupdate dengan WrongPortal redirect untuk salah role
  - Frontend: StaffLogin.tsx — Command Center vibe, navy + blue/cyan orbs,
              mobile dark view (identik pattern Login kandidat), no "Ingat saya"
  - Frontend: Login.tsx — tambah mobile dark view (amber/gold orbs), brand header mobile,
              tombol beranda flow normal (tidak absolute di mobile)
  - Frontend: WrongPortal.tsx — standalone dark page, konten dinamis dari prop `from`
  - Frontend: useIdleLogout.ts — satu timer, countdown di modal, visibilitychange check
  - Frontend: DashboardLayout + DashboardSplitLayout — mount useIdleLogout (300s/300s testing)
  - Git: merge feat/dashboard-polish-v2 → develop, push develop
         rename feat/dashboard-dev → archive/dashboard-dev
         buat branch feat/staff-admin-dashboard

Next     :
  - Build Staff Dashboard (feat/staff-admin-dashboard)
  - Setelah staff dashboard selesai & tested: ganti useIdleLogout ke 1200/300 (production)

Decisions:
  - Opsi B dipilih: login terpisah /login (kandidat) vs /staff/login (staff+admin)
  - WrongPortal di-render via Inertia::render() langsung — tidak pakai route /wrong-portal
  - remember=false di StaffLogin — tidak ada "Ingat saya" untuk keamanan
  - Auto-logout: 1 timer saja, logout dari dalam modal countdown
  - visibilitychange: cek elapsed time saat user balik ke tab/app
  - SESSION_LIFETIME server-side: skip — terlalu general
  - Merge strategy ke depan: pakai --no-ff biar graph bercabang
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

---

## Pending / In Progress ⚠️

### 1. Document Upload — Needs Full Test
Fix committed but not fully tested (composer dump-autoload pending).
**Action:** Restart container + `art-clear`, then test upload end-to-end.

### 2. File Preview Private Storage
Files in `storage/app/private/` can't be accessed via direct URL.
`temporaryUrl()` unreliable on local Docker disk.
**Solution:** Build dedicated auth-protected route + controller method.
**Pattern reference:** `WelcomeController::serveGallery()` — adapt with auth middleware.
Preview button already exists in `DocumentCard` (placeholder).

### 3. useIdleLogout — Production Values Belum Diset
Sekarang masih 300s/300s (testing).
**Action setelah staff dashboard tested:** ganti ke `timeoutSeconds: 1200, warningSeconds: 300`
di `DashboardLayout.tsx` + `DashboardSplitLayout.tsx`.

---

## Next Priorities (in order)

```
1. Build Staff Dashboard                    (branch: feat/staff-admin-dashboard) ← SEKARANG
2. Build Halaman Status kandidat            (observer sudah ready)
3. Fix & verify document upload             (composer dump / restart test)
4. Fix file preview private storage        (dedicated serve route)
5. Decide Tab 5 Data Diri content
6. Auth pages final review & polish        (forgot/reset password)
7. Fine-tune global tone, contrast, colors (after all pages done)
8. Kalender SPMB
9. Informasi page
10. Admin Dashboard
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
| Staff Dashboard fitur | Belum di-blueprint — perlu diskusi sebelum build |

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