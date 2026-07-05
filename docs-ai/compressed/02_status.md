# Sentinel Admission — Project Status, Roadmap & Build Checklist
> Update this file after major feature decisions or completed build phases.
> This is not a real-time runtime status file. It is a project memory, roadmap, and execution checklist.

---

## How To Read This File

This file records:
- completed features,
- current source-truth from the latest audit,
- roadmap priorities,
- final decisions,
- pending risks and build notes.

It does not replace source inspection. Before execution, Codex/Livi must still check the current repository state.

---

## Execution Reminder

Before executing any code change:

```txt
1. Make sure the Git branch is correct.
2. Read 00_core.md, 01_project.md, 02_status.md, and the relevant audit/blueprint file.
3. Audit actual source files before changing them.
4. Do not change database schema without explicit confirmation from Silvia.
```

Environment note:
- Fedora KDE Plasma + Fish shell.
- Use Fish syntax, not Bash syntax.
- `dev-mode` is for active coding / many local changes.
- `demo-mode` is for public testing, friend testing, tunnel/domain access.

---

## Current Strategic Direction

The project is in **Dashboard polish, admin settings, and exam monitoring hardening**.

Main focus:

```txt
1. Keep role sidebars/menu grouping by operational domain.
2. Keep future menu items routed to real pages or ComingSoon instead of 404.
3. Harden candidate registration/payment UX and admin operational settings without expanding into ERP/finance scope.
4. Continue production audit, manual browser QA, and merge readiness.
```

The system remains intentionally simple:
- It is an SPMB/admission dashboard.
- It is not a full finance, accounting, or institution-management system.
- Payment features only validate registration/initial admission payments.

---

## Role & Domain Decision

Global auth roles are fixed:

```txt
candidate
staff
admin
```

Work labels like bendahara, administrasi, operator, verifikator, or panitia are **menu/domain groupings**, not auth roles.

| Role | Meaning |
|---|---|
| Candidate | Fills data, uploads documents, pays/registers, requests data/email changes |
| Staff | Daily operator: candidate checking, document/payment validation, change-request review |
| Admin | Highest authority: all staff domains + admin-only system control |

---

## Latest Source Audit Summary

### Candidate Dashboard

| Feature | Status | Notes |
|---|---|---|
| Dashboard | ✅ Active | Candidate Dashboard V2 active as Admission Journey Center: identity summary, progress overview, next action, document/payment summary, and status timeline |
| Profile | ✅ Active | Profile + email change request UI exists |
| Data Diri | ✅ Active | Show/update + data change request active |
| Data Wali | ✅ Active | Form save active; guardian auto `firstOrCreate` |
| Data Kesehatan | ✅ Active | Show/save + upload/delete health documents active |
| Data Dokumen | ✅ Active | Upload, preview, download, delete active |
| Pembayaran | ✅ Active | Gateway/manual/cash flow, proof upload, cancel active |
| Status Pendaftaran | ✅ Active | Dedicated `/dashboard/status-pendaftaran`; `/dashboard/status` redirects |
| Kalender SPMB | ✅ Active | Candidate calendar page active |
| Bantuan | ✅ Active | Context-aware help center |
| Riwayat Pembayaran | ✅ Active | Candidate-safe payment ledger |
| Status Seleksi | ✅ Active | Selection/exam status center |
| Hasil Seleksi | ✅ Active | Candidate-visible result view based on existing visibility flags |

Important correction:
- `/dashboard/data-wali` is active.
- `/dashboard/data-dokumen` is active.
- `/dashboard/pembayaran` is active.
- `/dashboard/status-pendaftaran` is active.
- `/dashboard/status` redirects to the real Status Pendaftaran page.

### Staff Dashboard

| Feature | Status | Notes |
|---|---|---|
| Dashboard index | ✅ Active | Real stats, trend, recent submissions |
| Candidate list | ✅ Active | List candidate data |
| Candidate search/filter/pagination | ✅ Active | Search, status filter, wave filter, pagination active |
| Candidate detail/show | ✅ Active | Readonly sections for validation/checking |
| Staff profile | ✅ Active | Show/update/avatar active |
| Staff document area | ✅ Active | Preview + verify/reject active |
| Staff payment area | ✅ Active | Proof preview + verify/reject active |
| Permintaan Perubahan | ✅ Active | Staff/admin inbox + approve/reject data/email requests active |
| Staff Kalender | 🔜 ComingSoon | `/dashboard/staff/calendar` opens role-aware ComingSoon |
| Staff Sesi Ujian | 🔜 ComingSoon | `/dashboard/staff/exams/sessions` opens role-aware ComingSoon |
| Staff Rekap / Laporan | 🔜 ComingSoon | `/dashboard/staff/reports` opens role-aware ComingSoon |

### Admin Dashboard

| Feature | Status | Notes |
|---|---|---|
| Admin dashboard index | ✅ Active | Functional, uses DB data |
| Admin candidates | ✅ Active | List, filters, pagination, detail/review access active |
| Admin candidate detail | ✅ Active | Reuses operational candidate review screen with admin-scoped routes |
| Admin document area | ✅ Active | Preview + verify/reject active through admin routes |
| Admin payment area | ✅ Active | Proof preview + verify/reject active through admin routes |
| Admin change requests | ✅ Active | Same operational inbox as staff, admin-scoped |
| Admin waves/gelombang | ✅ Active | Create/edit/activate/guarded delete page implemented |
| Admin Pengaturan Sistem | ✅ Active | Programs, extracurriculars, and payment configs |
| Admin Monitoring Ujian | ✅ Active | Polling-based monitoring page/feed/display |
| Admin staff management | ✅ Active | Staff list + activate/suspend implemented |
| Admin profile | ✅ Active | Show/update/avatar active |
| Admin Kalender SPMB | 🔜 ComingSoon | `/dashboard/admin/calendar` opens role-aware ComingSoon |
| Admin Perlu Tindakan | ✅ Active | Reuses `/dashboard/admin/change-requests` as the admin-safe action inbox |
| Admin Pengguna | 🔜 ComingSoon | `/dashboard/admin/users` opens role-aware ComingSoon |
| Admin Rekap / Laporan | 🔜 ComingSoon | `/dashboard/admin/reports` opens role-aware ComingSoon |

---

## Completed ✅

| Page / Feature | Notes |
|---|---|
| Landing Page v2.0 | Merged to develop previously |
| CinematicShowcase | Double marquee, GalleryCard 3D parallax, lightbox, private media storage |
| Auth: Candidate Login | Mobile dark view, amber/gold brand header |
| Auth: Staff/Admin Login | StaffLogin.tsx command center, no remember me |
| Auth: WrongPortal | Standalone dark page, dynamic content per role |
| Auth: Register | Via wizard draft token |
| Form Wizard | 3-step pre-registration, resume modal, duplicate check, localStorage |
| Candidate Dashboard Index | Active |
| Candidate Profile | Active, includes email change request UI |
| Candidate Data Diri | Active, includes data change request UI |
| Candidate Data Kesehatan V2 | Wizard-style nav, partial save, health document upload/delete |
| Candidate Data Wali V2 | Wizard-style nav, guardian save active |
| Candidate Data Dokumen V2 | Upload, preview, download, delete active |
| Candidate Pembayaran V2 | Gateway/manual/cash, proof upload, cancel active |
| Candidate Dashboard V2 | Admission Journey Center active with dashboard-oriented backend props, reusable React components, progress/next-action/status summaries |
| Candidate Status Pendaftaran | Detailed checklist/status/timeline center active |
| Candidate Panel Gold | Bantuan, Riwayat Pembayaran, Status Seleksi, and Hasil Seleksi active |
| Candidate Registration Polish | Summary next-page CTAs, Data Wali tab/rules polish, database extracurricular options |
| Error Pages | 404 NotFound + comingSoon mode exists |
| Auto-Submitted Observer | CandidateObserver + GuardianObserver + HealthRecordObserver |
| Backend Document Security | DocumentSecurityService, magic bytes, polyglot scan, security model |
| Infrastructure | Docker, private disk setup, Cloudflare tunnel environment |
| Security: useIdleLogout | Single timer, modal countdown, visibilitychange, session destroy |
| Recharts dependency | Installed successfully |
| Staff Dashboard: Index | Real data stats/trend/recent submissions |
| Staff Dashboard: Candidates | Search/filter/pagination active |
| Staff Dashboard: Show | Readonly candidate detail, sections/tabs active |
| Staff Dashboard: Profile | Show/update/avatar active |
| Staff Document Validation | Preview + verify/reject active |
| Staff Payment Validation | Proof preview + verify/reject active |
| Admin Dashboard Index | Functional and uses DB data |
| Staff/Admin Change Requests | Operational inbox for candidate data/email requests with approve/reject |
| Staff/Admin ComingSoon Routes | Future sidebar links route to role-aware ComingSoon, not 404 |
| Admin Candidates | Candidate list + operational detail/review access |
| Admin Waves | Gelombang create/edit/activate/guarded delete |
| Admin System Settings | Programs, extracurriculars, and payment configs |
| Admin Exam Monitoring | Monitoring Ujian page/feed/display |
| Admin Staff Management | Staff account list + activate/suspend toggle |
| Admin Profile | Show/update/avatar active |

---

## Current Gaps / Pending Build ⚠️

### 1. Candidate Email Finalization

Current state:
- Candidate can request and cancel email change.
- Staff/admin can approve/reject pending email requests.
- Approved request is manually verified by staff/admin.
- Candidate-side apply-approved-email endpoint exists from profile flow.

Still needs final product decision:
- Whether to keep manual approval + candidate apply flow.
- Whether to add/restore email-token verification as a required final step.

### 2. Manual Browser QA

Current state:
- Candidate Status Pendaftaran is active as a detailed status/checklist center.
- Candidate Panel Gold pages are active.
- Admin Gelombang, Pengaturan Sistem, and Monitoring Ujian are active.
- Browser automation was intentionally skipped for the latest polish checkpoint because the task forbade browser tools.

Build/check later:
- Manual browser QA with realistic candidate, staff, and admin accounts.

### 3. Reports / Exports / Standalone Queues

Current state:
- Candidate document/payment review is active inside candidate detail for staff/admin.
- Reports and payment recap routes open ComingSoon.

Build later:
- Staff/Admin report pages when data shape is stable.
- Payment recap/export if it remains SPMB-payment scope only.
- Optional standalone Dokumen/Pembayaran queue pages if useful operationally.

### 4. ComingSoon Routing for Future Menus

Candidate sidebar items that were previously ComingSoon have been activated where real pages exist:
- Bantuan
- Riwayat Pembayaran
- Status Seleksi
- Hasil Seleksi

Active for existing non-sidebar/fallback routes:
- Staff/Admin Seleksi & Status
- Staff/Admin Laporan Umum
- Staff/Admin Rekap Pembayaran
- Staff Kalender
- Staff Sesi Ujian
- Admin Kalender SPMB
- Admin Pengguna

Rule:
- Sidebar future items may be visible.
- They must not produce 404.
- Use role-aware ComingSoon.

Note:
- Candidate Kalender SPMB is currently an active calendar page, not ComingSoon.

### 5. UI Maturity / Polish

Staff basic features exist, but UI is not final.
Polish should happen after domain/menu routing and priority workflows are stable.

---

## Staff/Admin Sidebar Plan

### Staff Domain Menu

```txt
MENU
- Dashboard                 active
- Staff Kalender            ComingSoon
- Kandidat
  - Semua Kandidat          active
  - Data Diri               active candidate detail section
  - Data Wali               active candidate detail section
  - Data Kesehatan          active candidate detail section
  - Perlu Tindakan          active change requests
- Verifikasi
  - Review Dokumen          active candidate detail section
  - Review Pembayaran       active candidate detail section
- Seleksi
  - Hasil Ujian             active
  - Sesi Ujian              ComingSoon
- Rekap / Laporan           ComingSoon

AKUN
- Profil                    active
```

Staff candidate status filtering stays inside the Semua Kandidat page, not as sidebar submenu items.

### Admin Domain Menu

```txt
MENU
- Dashboard                 active
- Kalender SPMB             ComingSoon
- Kandidat
  - Semua Kandidat          active
  - Data Diri               active candidate detail section
  - Data Wali               active candidate detail section
  - Data Kesehatan          active candidate detail section
  - Permintaan Perubahan    active change requests
  - Perlu Tindakan          active change requests
- Verifikasi
  - Review Dokumen          active candidate detail section
  - Review Pembayaran       active candidate detail section
- Seleksi
  - Paket Soal              active
  - Sesi Ujian              active
  - Hasil Ujian             active
  - Monitoring Ujian        active
- Rekap / Laporan           ComingSoon

MANAJEMEN
- Staff                     active
- Pengguna                  ComingSoon

KONFIGURASI SPMB
- Gelombang                 active
- Program / Jalur           active
- Pengaturan Sistem         active
- Pengumuman                ComingSoon

AKUN
- Profil                    active
```

Important direction:
- Candidate status filtering stays inside the Semua Kandidat page, not as sidebar submenu items.
- Pengumuman, Pengguna, Kalender SPMB, and Rekap/Laporan use ComingSoon until real pages exist.
- Payment and document sections currently exist inside staff/admin candidate detail.
- Future standalone `Pembayaran` and `Dokumen` menus are allowed if they serve as queue/list pages, not duplicated detail pages.

---

## Priority Roadmap

```txt
PHASE 1 — Documentation & Routing Cleanup
[x] Update 01_project.md with current route truth
[x] Update 02_status.md into roadmap/checklist format
[ ] Update audit_staff_dashboard.md focusing on current real gaps
[x] Clean sidebar future links → ComingSoon
[ ] Remove outdated route notes that mark active candidate pages as pending

PHASE 2 — Staff/Admin V2: Permintaan Perubahan
[x] Audit actual data/email request source before coding
[x] Build request inbox page
[x] Build approve/reject data change request
[x] Fix address_detail old_value display bug
[x] Build approve/reject email change request
[ ] Decide and implement email token finalization flow
[x] Show clear badges/counts for pending requests

PHASE 3 — Admin Subpages
[x] Build Admin Candidates page
[x] Build Admin Waves/Gelombang page
[x] Build Admin Staff management page
[x] Build Admin Profile page
[x] Make admin pages functional, not static placeholders

PHASE 4 — Candidate Status & Future Pages
[x] Build candidate Status Pendaftaran as detailed checklist/status center
[x] Kalender SPMB
[ ] Pengumuman page
[x] Bantuan page
[x] Candidate payment history page
[x] Candidate selection status/result pages
[ ] Reports/exports when data shape is stable

PHASE 5 — Dashboard Polish / Settings / Monitoring
[x] Candidate payment success copy and gateway proof UX polish
[x] Data Wali tab order and conditional validation/completion alignment
[x] Database-driven extracurricular options for Minat & Bakat
[x] Admin Gelombang create/edit/activate/delete management
[x] Admin Pengaturan Sistem for programs, extracurriculars, and payment configs
[x] Admin Monitoring Ujian page/feed/display
[x] Common math superscript/degree rendering in exam pages

## Candidate Dashboard V2 Manual Validation Checklist

```txt
[ ] Login as candidate
[ ] Open /dashboard
[ ] Check identity summary, admission wave, program, and contact summary
[ ] Check progress summary and each linked progress card
[ ] Check next-action card changes based on missing/rejected data
[ ] Open Data Diri link
[ ] Open Data Wali link
[ ] Open Data Kesehatan link
[ ] Open Dokumen link
[ ] Open Pembayaran link
[ ] Check pending/approved/rejected data or email request banner if available
[ ] Check mobile width around 390px
[ ] Confirm Staff dashboard still opens
[ ] Confirm Admin dashboard still opens
[ ] Confirm no direct private file URL/path is exposed in dashboard props
```

PHASE 5 — Final Polish & Production
[ ] Staff/Admin UI polish
[ ] Auth forgot/reset final review
[ ] Contrast/color tuning
[ ] Set useIdleLogout production values: 1200/300
[ ] Full audit pass before merge
```

---

## Permintaan Perubahan — Source Truth

### Data Change Request

| Item | Value |
|---|---|
| UI | `resources/js/Components/Dashboard/Candidate/DataDiri/TabIdentitas.tsx` |
| Submit page | `resources/js/Pages/Dashboard/Candidate/DataDiri.tsx` |
| Controller | `app/Http/Controllers/Dashboard/Candidate/DataDiriController.php` |
| Route | `POST /dashboard/data-diri/change-request` |
| Cancel route | `DELETE /dashboard/data-diri/change-request` |
| Storage | `candidates.data_change_request` JSON |
| Staff/admin approval | Active via `Dashboard/Operations/ChangeRequests` |

Current JSON format:

```json
{
  "field": "full_name",
  "old_value": "lama",
  "new_value": "baru",
  "reason": "alasan minimal 10 karakter",
  "status": "pending",
  "requested_at": "2026-06-05T..."
}
```

Allowed fields:

```txt
full_name, nisn, nik, gender, place_of_birth, date_of_birth, address_detail, school_origin
```

Risk handled:
- `address_detail.old_value` display is normalized in `ChangeRequestService` so `"Array"` is not shown to staff/admin reviewers.

### Email Change Request

| Item | Value |
|---|---|
| UI | `resources/js/Pages/Dashboard/Candidate/Profile.tsx` |
| Controller | `app/Http/Controllers/Dashboard/Candidate/ProfileController.php` |
| Request route | `POST /dashboard/profile/email` |
| Cancel route | `DELETE /dashboard/profile/email` |
| Storage | `users.pending_email`, `pending_email_token`, `pending_email_requested_at` |
| Staff/admin approval | Active |
| Token finalization route | Pending decision |

Current direction:
- Staff/admin approval is active.
- Candidate can apply approved email from profile.
- A stricter email-token finalization step is still a product/security decision.

---

## Pending Decisions — Ask Silvia Before Building

| Item | Decision Needed |
|---|---|
| Email change flow | Confirm final 2-stage flow: staff/admin approval → email-token verification |
| Data change audit fields | Reviewer/reviewed_at metadata currently stored inside JSON |
| Candidate Status page | Timeline/result announcement/simple badge page? |
| Reports/export scope | Staff-visible report vs admin-only report |
| Growth % stat cards | Keep mock/static or later add historical snapshot table |
| useIdleLogout production | Set to 1200/300 only after dashboard flow is tested |

---

## Outdated Documentation To Remove / Replace

Known outdated notes:
- Any note saying `/dashboard/data-wali` is pending.
- Any note saying `/dashboard/data-dokumen` or `/dokumen` is pending.
- Any note saying `/dashboard/pembayaran` is pending.
- Any note saying Staff payment verification is missing.
- Any note saying Staff document preview/verify/reject is missing.
- Any note saying Staff/Admin change request approval is missing.
- Any note saying Admin candidates/waves/staff/profile pages are missing.
- Any note implying bendahara/operator/verifikator are auth roles.
- Any note treating Admin dashboard as completely unbuilt; admin operational pages are now usable.

Still accurate:
- Dedicated candidate Status page content is not built; route opens ComingSoon.
- Email-token finalization remains undecided/not implemented as strict final step.
- Reports/export/payment recap remain future scope.

---

## Future Features / V2+

```txt
- WA notification via Fonnte
- Auto alert when wave quota is nearly full
- Reports/export PDF/Excel after data shape is stable
- Admin settings for payment/configuration
- Candidate re-upload documents after rejected, if not already complete
- Real growth % stat cards via historical snapshot table
- Better audit trail / activity log if system grows
```

---

## Page Template Reference

```txt
Header:
- Icon w-9 h-9 rounded-xl
- Title text-xl
- Subtitle text-xs

Tab Bar:
- Sticky top-0 z-10
- Pill style
- overflow-x-auto

Content:
- Full width
- No max-w-3xl in main content
- No nested cards inside cards

Mobile:
- Touch targets minimum 44px
- Input font-size minimum 16px
- Mobile-first, then sm/md/lg breakpoints
```
