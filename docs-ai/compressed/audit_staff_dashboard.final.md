# Sentinel Admission — Staff/Admin Dashboard V2 Audit
> Current focus: Staff/Admin operational domains, especially `Permintaan Perubahan`.
> Use this before building new Staff/Admin dashboard features.

---

## Audit Scope

This document replaces the older Staff Dashboard audit notes that treated document/payment preview as missing.
Latest Codex read-only audit confirms:
- Staff dashboard basic features are active.
- Staff candidate list/detail/search/filter/pagination are active.
- Staff document preview + verify/reject are active.
- Staff payment proof preview + verify/reject are active.
- The highest-priority remaining staff/admin gap is `Permintaan Perubahan`.

This audit focuses on what remains strategically important for Staff/Admin Dashboard V2.

---

## Source Truth Summary

### Candidate

| Feature | Status | Notes |
|---|---|---|
| Data Diri | ✅ Active | Includes data change request UI |
| Data Wali | ✅ Active | Save active |
| Data Kesehatan | ✅ Active | Save + health document upload/delete active |
| Data Dokumen | ✅ Active | Upload, preview, download, delete active |
| Pembayaran | ✅ Active | Create payment, snap token, upload proof, cancel active |
| Status Kandidat | ⚠️ Partial | Status visible, no dedicated route/page |

### Staff

| Feature | Status | Notes |
|---|---|---|
| Dashboard | ✅ Active | Real stats/trend/recent data |
| Candidate list | ✅ Active | Includes search/filter/pagination |
| Candidate detail/show | ✅ Active | Readonly validation/checking structure |
| Staff profile | ✅ Active | Show/update/avatar active |
| Document workflow | ✅ Active | Preview + verify/reject active |
| Payment workflow | ✅ Active | Proof preview + verify/reject active |
| Data/email change approval | ❌ Missing | Main Staff/Admin V2 priority |

### Admin

| Feature | Status | Notes |
|---|---|---|
| Dashboard index | ✅ Active | Functional DB-backed dashboard |
| Candidates | ⚠️ Backend scaffold | Route/controller exist, React page missing |
| Waves/Gelombang | ⚠️ Backend scaffold | Route/controller exist, React page missing |
| Staff management | ⚠️ Backend scaffold | Route/controller exist, React page missing |
| Profile | ⚠️ Backend scaffold | Route/controller exist, React page missing |

---

## Domain Model Decision

Global auth roles remain only:

```txt
candidate
staff
admin
```

Operational labels are menu/domain groupings only:

| Grouping | Meaning |
|---|---|
| MENU | Dashboard, candidates, general operational pages |
| ADMINISTRASI | Documents, validation, administrative checks |
| PEMBAYARAN | Registration/initial payment verification and recap |
| PENGATURAN ADMIN | Admin-only system configuration |
| AKUN | Profile/account settings |

Do not add auth roles like bendahara/operator/verifikator unless Silvia explicitly reopens the role model.

Admin can perform all staff domains plus admin-only control.

---

## No Longer Main Gaps

These were previously treated as missing, but latest audit says they are active:

| Old Gap | Current Status |
|---|---|
| Staff payment verification | ✅ Active |
| Staff payment proof preview | ✅ Active |
| Staff document preview | ✅ Active |
| Staff document verify/reject | ✅ Active |

Do not rebuild these unless a fresh source audit finds bugs.

Possible edge audit later:
- Health document preview for staff/admin may still need deeper review if required. Do not treat it as a blocker for `Permintaan Perubahan`.

---

## GAP 1 — Data Change Request Approval

### Candidate-side status

Candidate can request data changes from Data Diri.

| Item | Value |
|---|---|
| UI | `resources/js/Components/Dashboard/Candidate/DataDiri/TabIdentitas.tsx` |
| Submit handling page | `resources/js/Pages/Dashboard/Candidate/DataDiri.tsx` |
| Controller | `app/Http/Controllers/Dashboard/Candidate/DataDiriController.php` |
| Request route | `POST /dashboard/data-diri/change-request` |
| Cancel route | `DELETE /dashboard/data-diri/change-request` |
| Storage | `candidates.data_change_request` JSON |
| Candidate cancel | ✅ Yes |
| Staff/admin approval | ❌ Missing |

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
full_name
nisn
nik
gender
place_of_birth
date_of_birth
address_detail
school_origin
```

### Critical risk

`address_detail.old_value` may become string `"Array"` because the source value is an array/cast but is converted to string in the current request builder.

This must be fixed or safely handled before approval UI shows old/new values.

### Required Staff/Admin build

```txt
- List pending data change requests.
- Show candidate identity, field requested, old value, new value, reason, requested_at.
- Approve request.
- Reject request with reason/note.
- On approve: validate field-specific value, apply new_value to target candidate field, then clear or archive request state.
- On reject: store rejection reason/status or clear with visible feedback strategy.
```

Recommended implementation:
- Create a dedicated service such as `CandidateDataChangeService` or `CandidateDataService`.
- Do not put all mutation logic directly inside controller.
- Validate by field type:
  - `gender` enum
  - `date_of_birth` date
  - `address_detail` structured value
  - `nisn`/`nik` expected digit formats

---

## GAP 2 — Email Change Request Approval & Finalization

### Candidate-side status

Candidate can request email change from Profile.

| Item | Value |
|---|---|
| UI | `resources/js/Pages/Dashboard/Candidate/Profile.tsx` |
| Controller | `app/Http/Controllers/Dashboard/Candidate/ProfileController.php` |
| Request route | `POST /dashboard/profile/email` |
| Cancel route | `DELETE /dashboard/profile/email` |
| Storage | `users.pending_email`, `pending_email_token`, `pending_email_requested_at` |
| Candidate cancel | ✅ Yes |
| Staff/admin approval | ❌ Missing |
| Token finalization endpoint | ❌ Missing |

Current behavior:
- Candidate submits a pending email.
- Token is generated.
- Candidate can cancel.
- No staff/admin approval action exists.
- No final route consumes token to move `pending_email` into `email`.

### Required Staff/Admin build

Recommended flow:

```txt
1. Candidate requests email change.
2. Staff/admin reviews request.
3. Staff/admin approves or rejects.
4. If approved, system sends verification link to pending_email.
5. Candidate verifies token.
6. System moves pending_email → email.
7. System clears pending_email, pending_email_token, pending_email_requested_at.
```

If email sending is not ready, build the approval state first but clearly mark final verification as pending.

Recommended implementation:
- Use a service for approval/finalization logic.
- Keep technical errors silent to users; log details in Laravel logs.
- Prevent direct email replacement without either staff/admin approval or token verification.

---

## Recommended Menu Build — Staff/Admin V2

### Staff

```txt
MENU
- Dashboard                 active
- Kandidat                  active
- Permintaan Perubahan      next build priority
- Seleksi & Status          ComingSoon
- Laporan Umum              ComingSoon

ADMINISTRASI
- Dokumen                   active inside candidate detail; standalone queue optional later

PEMBAYARAN
- Pembayaran                active inside candidate detail; standalone queue optional later
- Rekap Pembayaran          ComingSoon

AKUN
- Profil                    active
```

### Admin

```txt
MENU
- Dashboard                 active
- Kandidat                  page missing
- Permintaan Perubahan      next build after/with staff
- Seleksi & Status          ComingSoon
- Laporan Umum              ComingSoon

ADMINISTRASI
- Dokumen                   can share staff domain later

PEMBAYARAN
- Pembayaran                can share staff domain later
- Rekap Pembayaran          ComingSoon

PENGATURAN ADMIN
- Gelombang                 route/controller exists, page missing
- Program / Jalur           ComingSoon
- Staff                     route/controller exists, page missing
- Pengaturan Sistem         ComingSoon

AKUN
- Profil                    route/controller exists, page missing
```

---

## ComingSoon Requirement

Future sidebar items must not 404.

Build/route policy:
- Menu may be visible as roadmap.
- If feature is not active, route to ComingSoon.
- ComingSoon must be role-aware and should use the correct dashboard layout.

Current useful references:
- Error pages already support NotFound + comingSoon mode.
- `TabTimKesehatan.tsx` is useful only as in-tab placeholder reference, not as the main sidebar-page pattern.

---

## Suggested Routes for Permintaan Perubahan

Exact naming may follow existing project route conventions, but the domain should be clear.

### Staff

```txt
GET  /dashboard/staff/change-requests
POST /dashboard/staff/candidates/{candidate}/change-request/approve
POST /dashboard/staff/candidates/{candidate}/change-request/reject
POST /dashboard/staff/candidates/{candidate}/email-change/approve
POST /dashboard/staff/candidates/{candidate}/email-change/reject
```

### Admin

Option A: duplicate admin routes pointing to same service.

```txt
GET  /dashboard/admin/change-requests
POST /dashboard/admin/candidates/{candidate}/change-request/approve
POST /dashboard/admin/candidates/{candidate}/change-request/reject
POST /dashboard/admin/candidates/{candidate}/email-change/approve
POST /dashboard/admin/candidates/{candidate}/email-change/reject
```

Option B: shared internal controller with role-aware middleware.
Use only if it stays clean and does not blur URL structure.

Decision preference:
- Keep URL prefixes separate by role, reuse services underneath.

---

## Suggested Components

```txt
resources/js/Pages/Dashboard/Staff/ChangeRequests.tsx
resources/js/Components/Dashboard/Staff/ChangeRequests/
├── RequestStats.tsx
├── RequestFilters.tsx
├── DataChangeRequestTable.tsx
├── EmailChangeRequestTable.tsx
├── ReviewModal.tsx
└── RequestStatusBadge.tsx
```

Admin can later copy the same component pattern with admin accent or shared neutral components.

---

## Service Layer Recommendation

| Logic | Recommendation |
|---|---|
| Data change approval/rejection | `CandidateDataChangeService` or `CandidateDataService` |
| Email change approval/rejection | Same service or `CandidateEmailChangeService` if it grows |
| Email token finalization | Service method, not controller-only logic |
| Document/payment verification | Already active; do not refactor unless needed |

Avoid:
- giant controller methods,
- duplicate staff/admin mutation logic,
- direct `Candidate::find($request->id)` style access,
- exposing technical errors to users.

---

## UI/UX Requirements

For `Permintaan Perubahan`:

```txt
- Pending count cards
- Tabs or filters: Data Diri / Email / All
- Search by candidate name, code, email/NISN
- Show old vs new value clearly
- Show reason from candidate
- Approve button with confirmation
- Reject button with required reason
- Empty state when no pending request
- Mobile-first table/card fallback
```

Mobile requirements:
- Touch targets minimum 44px.
- Input font-size minimum 16px.
- Use literal dark mode classes, never dynamic `dark:${variable}`.

---

## High-Priority Build Order

```txt
1. Clean navigation and ComingSoon routes.
2. Build Staff Permintaan Perubahan list page.
3. Implement data change approve/reject with field-specific validation.
4. Fix address_detail old_value/new_value handling.
5. Implement email change approve/reject.
6. Implement or schedule email token finalization route.
7. Add admin access to same domain using separate admin URL prefix.
8. Update 02_status.md after feature completion.
```

---

## Internal Audit Checklist Before Execution

```txt
[ ] Confirm branch with git branch --show-current
[ ] Confirm current route names in routes/web.php
[ ] Confirm controller namespace paths are Dashboard/Staff and Dashboard/Admin
[ ] Confirm candidate data_change_request cast and fillable
[ ] Confirm User pending_email fields and fillable/hidden/casts
[ ] Confirm middleware blocks candidate/staff/admin correctly
[ ] Confirm admin can access staff-equivalent service through admin routes
[ ] Confirm ComingSoon route/page exists before pointing sidebar items to it
[ ] Confirm no database schema change is introduced without Silvia approval
```

---

## What Not To Build Yet

```txt
- New auth roles for bendahara/operator/verifikator
- Full accounting or treasury system
- Deep reports/export before data domains stabilize
- Activity log/audit trail unless approved as schema change
- Program/Jalur management unless admin phase is explicitly started
```

---

## Final Conclusion

Staff Dashboard V1 is no longer the main gap. The project has moved to Staff/Admin V2.

The next most valuable feature is:

```txt
Permintaan Perubahan
- approve/reject data diri changes
- approve/reject email changes
- prepare email verification finalization
```

This feature closes the biggest workflow gap between candidate self-service and staff/admin operational control.
