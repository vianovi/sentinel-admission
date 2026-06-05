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

The project is entering **Staff/Admin Dashboard V2**.

Main focus:

```txt
1. Clean sidebar/menu grouping by operational domain.
2. Route future menu items to ComingSoon instead of 404.
3. Build Permintaan Perubahan as the next high-priority Staff/Admin feature.
4. Continue Admin Dashboard subpages after Staff/Admin V2 foundations are clean.
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
| Dashboard | ✅ Active | Main dashboard active |
| Profile | ✅ Active | Profile + email change request UI exists |
| Data Diri | ✅ Active | Show/update + data change request active |
| Data Wali | ✅ Active | Form save active; guardian auto `firstOrCreate` |
| Data Kesehatan | ✅ Active | Show/save + upload/delete health documents active |
| Data Dokumen | ✅ Active | Upload, preview, download, delete active |
| Pembayaran | ✅ Active | Gateway/manual/cash flow, proof upload, cancel active |
| Status Kandidat | ⚠️ Partial | Status visible in dashboard/profile, but no dedicated `/dashboard/status` route |

Important correction:
- `/dashboard/data-wali` is active.
- `/dashboard/data-dokumen` is active.
- `/dashboard/pembayaran` is active.
- Only `/dashboard/status` is still not a dedicated active route.

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
| Permintaan Perubahan | ⚠️ Partial | Candidate can request/cancel; staff/admin approval not built |

### Admin Dashboard

| Feature | Status | Notes |
|---|---|---|
| Admin dashboard index | ✅ Active | Functional, uses DB data |
| Admin candidates | ⚠️ Backend scaffold | Route + controller exist; React page missing |
| Admin waves/gelombang | ⚠️ Backend scaffold | Route + controller exist; React page missing |
| Admin staff management | ⚠️ Backend scaffold | Route + controller exist; React page missing |
| Admin profile | ⚠️ Backend scaffold | Route + controller exist; React page missing |

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

---

## Current Gaps / Pending Build ⚠️

### 1. Staff/Admin — Permintaan Perubahan

Highest priority next feature.

Candidate side exists:
- Candidate can request data change from Data Diri.
- Candidate can cancel data change request.
- Candidate can request email change from Profile.
- Candidate can cancel email change request.

Missing:
- Staff/admin list of pending requests.
- Staff/admin approve/reject data change request.
- Staff/admin approve/reject email change request.
- Email token finalization endpoint is not implemented.

Build direction:
- Add menu `Permintaan Perubahan`.
- Make it an operational inbox for data/email change requests.
- Admin can access the same domain as staff.

### 2. Candidate Status Page

Current state:
- Candidate status is visible in dashboard/profile.
- Dedicated sidebar route `/dashboard/status` does not exist yet.

Decision:
- Route Status to ComingSoon until a real status/timeline page is built.

### 3. Admin Subpages

Current state:
- Admin dashboard index exists and is functional.
- Admin candidates/waves/staff/profile controllers/routes exist.
- React pages are missing.

Build later:
- `resources/js/Pages/Dashboard/Admin/Candidates.tsx`
- `resources/js/Pages/Dashboard/Admin/Waves.tsx`
- `resources/js/Pages/Dashboard/Admin/Staff.tsx`
- `resources/js/Pages/Dashboard/Admin/Profile.tsx`

### 4. ComingSoon Routing for Future Menus

Needed for:
- Candidate Kalender SPMB
- Candidate Informasi
- Candidate Status
- Staff/Admin Seleksi & Status
- Staff/Admin Laporan Umum
- Staff/Admin Rekap Pembayaran
- Admin Pengaturan items not built yet

Rule:
- Sidebar future items may be visible.
- They must not produce 404.
- Use role-aware ComingSoon.

### 5. UI Maturity / Polish

Staff basic features exist, but UI is not final.
Polish should happen after domain/menu routing and priority workflows are stable.

---

## Staff/Admin Sidebar Plan

### Shared Staff/Admin Domain Menu

```txt
MENU
- Dashboard                 ✅ active
- Kandidat                  ✅ active for staff; admin page pending
- Permintaan Perubahan      🔜 next build priority
- Seleksi & Status          🔜 ComingSoon
- Laporan Umum              🔜 ComingSoon

ADMINISTRASI
- Dokumen                   ✅ active in staff candidate detail; may become standalone later

PEMBAYARAN
- Pembayaran                ✅ active in staff candidate detail; may become standalone later
- Rekap Pembayaran          🔜 ComingSoon

AKUN
- Profil                    ✅ active for staff; admin page pending
```

### Admin-Only Menu

```txt
PENGATURAN ADMIN
- Gelombang                 ⚠️ route/controller exists, page missing
- Program / Jalur           🔜 ComingSoon
- Staff                     ⚠️ route/controller exists, page missing
- Pengaturan Sistem         🔜 ComingSoon
```

Important direction:
- Payment and document sections currently exist inside staff candidate detail.
- Future standalone `Pembayaran` and `Dokumen` menus are allowed if they serve as queue/list pages, not duplicated detail pages.

---

## Priority Roadmap

```txt
PHASE 1 — Documentation & Routing Cleanup
[ ] Update 01_project.md with current route truth
[ ] Update 02_status.md into roadmap/checklist format
[ ] Update audit_staff_dashboard.md focusing on current real gaps
[ ] Clean sidebar future links → ComingSoon
[ ] Remove outdated route notes that mark active candidate pages as pending

PHASE 2 — Staff/Admin V2: Permintaan Perubahan
[ ] Audit actual data/email request source before coding
[ ] Build request inbox page
[ ] Build approve/reject data change request
[ ] Fix address_detail old_value display bug
[ ] Build approve/reject email change request
[ ] Decide and implement email token finalization flow
[ ] Show clear badges/counts for pending requests

PHASE 3 — Admin Subpages
[ ] Build Admin Candidates page
[ ] Build Admin Waves/Gelombang page
[ ] Build Admin Staff management page
[ ] Build Admin Profile page
[ ] Make admin pages functional, not static placeholders

PHASE 4 — Candidate Status & Future Pages
[ ] Build candidate Status page or keep ComingSoon
[ ] Kalender SPMB
[ ] Informasi page
[ ] Reports/exports when data shape is stable

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
| Staff/admin approval | Not implemented |

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

Risk:
- `address_detail.old_value` may become `"Array"`. Must be fixed during approval workflow.

### Email Change Request

| Item | Value |
|---|---|
| UI | `resources/js/Pages/Dashboard/Candidate/Profile.tsx` |
| Controller | `app/Http/Controllers/Dashboard/Candidate/ProfileController.php` |
| Request route | `POST /dashboard/profile/email` |
| Cancel route | `DELETE /dashboard/profile/email` |
| Storage | `users.pending_email`, `pending_email_token`, `pending_email_requested_at` |
| Staff/admin approval | Not implemented |
| Token finalization route | Not implemented |

Direction:
- Prefer two-stage flow: staff/admin approve first, then candidate verifies new email through token link.

---

## Pending Decisions — Ask Silvia Before Building

| Item | Decision Needed |
|---|---|
| Email change flow | Confirm final 2-stage flow: staff/admin approval → email-token verification |
| Data change audit fields | Whether to add reviewer/reviewed_at metadata now or keep inside JSON first |
| Candidate Status page | Timeline/result announcement/simple badge page? |
| Admin subpage order | Candidates first, then Waves, Staff, Profile? |
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
- Any note implying bendahara/operator/verifikator are auth roles.
- Any note treating Admin dashboard as completely unbuilt; index is already functional.

Still accurate:
- Dedicated `/dashboard/status` is not built.
- Staff/Admin approval for data/email change request is not built.
- Admin subpages after index are not usable because pages are missing.

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
