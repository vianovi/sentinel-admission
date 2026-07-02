# Dashboard Shell Navigation V2 — Design Notes

## Branch

- `ui/dashboard-shell-navigation-v2`

## Stitch Usage

- Stitch MCP project: `271540505065919969`
- Existing source project: `Al-Muntaha School Admin Dashboard`
- Existing source screen used as baseline: `Pengaturan Paket Ujian (Refined)` (`02a7e0cbe81549d5ac70a2d7a8d74628`)
- Generated concept screens from Stitch variant run:
  - `Candidate Dashboard Shell` (`b9604cd6c3404bae80dcb6f35d0e2cfd`)
  - `Staff Dashboard Shell` (generated in the same Stitch run; the list response did not persist the generated variant ID)
  - `Admin Dashboard Shell` (`3d09f37fc89a40a5a4d2af6aabb0d258`)

Stitch was used for shell structure, spacing, and behavior direction only. The implementation keeps the existing project theme, Font Awesome icons, Tailwind tokens, Inertia links, and current dashboard layout architecture.

## Adopted Behavior

- One fixed main sidebar remains the global navigation layer.
- Full sidebar submenus expand downward by click, not hover.
- Expandable parents are rendered as `button` controls with `aria-expanded`, `aria-controls`, visible chevrons, and focus rings.
- Active parent rows stay expanded.
- Active children use a separate gold-accent child state.
- Minimized sidebar is icon-only.
- Minimized parent items show compact right-side flyout previews on hover/focus.
- Sidebar does not auto-expand on hover; only the toggle button changes the sidebar width.
- Topbar shows sidebar toggle, English time-based greeting, current date, search icon, notification control, theme control, and profile dropdown.
- Search is a compact popover/input only; no global search behavior was added.

## Not Copied

- No Star Admin source code, assets, colors, or markup were copied.
- Stitch color tokens were not copied blindly; existing `navy`, `gold`, slate, and dark mode classes remain the implementation base.
- No fake module cards, fake notification count, or second/inner global sidebar was added.
- No business workflow logic, candidate lifecycle rules, exam engine logic, payment logic, document verification logic, auth logic, or database schema was changed.

## Candidate Menu Map

```txt
MENU
- Dashboard -> /dashboard
- Kalender SPMB -> /dashboard/calendar
- Informasi -> /dashboard/info (existing ComingSoon route)

PENDAFTARAN
- Data Pendaftaran
  - Data Diri -> /dashboard/data-diri
  - Data Wali -> /dashboard/data-wali
  - Data Kesehatan -> /dashboard/data-kesehatan
- Verifikasi Berkas
  - Dokumen -> /dashboard/data-dokumen
  - Pembayaran -> /dashboard/pembayaran
- Seleksi
  - Ujian Seleksi -> /dashboard/seleksi

AKUN
- Profil -> /dashboard/profile
```

Omitted: `Status Pendaftaran`. The project only has `/dashboard/status` as a ComingSoon route, and the task explicitly said not to create a fake clickable status route.

## Staff Menu Map

```txt
MENU
- Dashboard -> /dashboard/staff
- Kandidat
  - Semua Kandidat -> /dashboard/staff/candidates
  - Draft -> /dashboard/staff/candidates?status=draft
  - Submitted -> /dashboard/staff/candidates?status=submitted
  - Verified -> /dashboard/staff/candidates?status=verified
  - Diterima -> /dashboard/staff/candidates?status=accepted
  - Ditolak -> /dashboard/staff/candidates?status=rejected
- Verifikasi
  - Review Dokumen -> selected candidate dokumen section, fallback /dashboard/staff/candidates
  - Review Pembayaran -> selected candidate pembayaran section, fallback /dashboard/staff/candidates
  - Perlu Tindakan -> /dashboard/staff/change-requests
- Seleksi
  - Hasil Ujian -> /dashboard/staff/exams/results
- Laporan -> /dashboard/staff/reports (existing ComingSoon route)

ADMINISTRASI
- Dokumen -> selected candidate dokumen section, fallback /dashboard/staff/candidates
- Pembayaran -> selected candidate pembayaran section, fallback /dashboard/staff/candidates

AKUN
- Profil -> /dashboard/staff/profile
```

Omitted: staff `Sesi Ujian` and `Peserta Seleksi` because no staff top-level routes exist for those workflows. `Diterima / Ditolak` is split into two real status-filter links because the backend supports one `status` query at a time.

## Admin Menu Map

```txt
MENU
- Dashboard -> /dashboard/admin
- Kandidat
  - Semua Kandidat -> /dashboard/admin/candidates
  - Draft -> /dashboard/admin/candidates?status=draft
  - Submitted -> /dashboard/admin/candidates?status=submitted
  - Verified -> /dashboard/admin/candidates?status=verified
  - Diterima -> /dashboard/admin/candidates?status=accepted
  - Ditolak -> /dashboard/admin/candidates?status=rejected
  - Permintaan Perubahan -> /dashboard/admin/change-requests
- Verifikasi
  - Review Dokumen -> selected candidate dokumen section, fallback /dashboard/admin/candidates
  - Review Pembayaran -> selected candidate pembayaran section, fallback /dashboard/admin/candidates
  - Perlu Tindakan -> /dashboard/admin/change-requests
- Ujian Seleksi
  - Pengaturan Paket -> /dashboard/admin/exams/packages
  - Pengaturan Sesi -> /dashboard/admin/exams/sessions
  - Hasil Ujian -> /dashboard/admin/exams/results
- Laporan -> /dashboard/admin/reports (existing ComingSoon route)

ADMINISTRASI
- Dokumen -> selected candidate dokumen section, fallback /dashboard/admin/candidates
- Pembayaran -> selected candidate pembayaran section, fallback /dashboard/admin/candidates

PENGATURAN
- Gelombang -> /dashboard/admin/waves
- Program / Jalur -> /dashboard/admin/programs (existing ComingSoon route)
- Staff -> /dashboard/admin/staff-list
- Sistem -> /dashboard/admin/settings (existing ComingSoon route)

AKUN
- Profil -> /dashboard/admin/profile
```

Admin `Final` is represented as separate `Diterima` and `Ditolak` real filters for the same reason as staff final status.

## Implementation Plan

1. Update `resources/js/config/navigation.ts` to support optional parent hrefs, active rules, query-aware active matching, and grouped role IA.
2. Rewrite the shared sidebar behavior in `resources/js/Components/Dashboard/Shared/Sidebar.tsx`.
3. Update `resources/js/Components/Dashboard/Shared/Topbar.tsx` with greeting/date/search popover and cleaner actions.
4. Keep `DashboardLayout` and `DashboardSplitLayout` consuming the same shared sidebar/topbar so candidate, staff, and admin inherit one shell.
5. Remove the old hover-expanded sidebar context state so sidebar width is controlled by the toggle only.
6. Run build, route list, diff checks, and browser/static audit.

## Manual Review Checklist

- Candidate sidebar expands `Data Pendaftaran`, `Verifikasi Berkas`, and `Seleksi` only on click.
- Staff sidebar expands `Kandidat`, `Verifikasi`, and `Seleksi` only on click.
- Admin sidebar expands `Kandidat`, `Verifikasi`, and `Ujian Seleksi` only on click.
- Active parent and active child are both visible.
- Minimized sidebar shows icons only and does not auto-expand on hover.
- Minimized parent hover/focus shows a compact flyout.
- Topbar greeting and date render correctly.
- Search icon opens and closes a compact input.
- Profile dropdown still links to the role-specific profile route.
- No fake status/session/participant routes are rendered.
