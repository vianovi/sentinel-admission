# Candidate Panel Gold

## Scope

Candidate Panel Gold completes the candidate sidebar items that previously had no real page or only placeholder behavior.

This is not a dashboard redesign and does not change candidate lifecycle, document verification, payment processing, exam engine, authorization rules, database schema, or final accepted/rejected semantics.

## Candidate Menu Map

All visible candidate sidebar entries now point to real candidate pages:

- Dashboard: `/dashboard`
- Status Pendaftaran: `/dashboard/status-pendaftaran`
- Kalender SPMB: `/dashboard/calendar`
- Bantuan: `/dashboard/bantuan`
- Data Diri: `/dashboard/data-diri`
- Data Wali: `/dashboard/data-wali`
- Data Kesehatan: `/dashboard/data-kesehatan`
- Dokumen: `/dashboard/data-dokumen`
- Pembayaran: `/dashboard/pembayaran`
- Riwayat Pembayaran: `/dashboard/pembayaran/riwayat`
- Ujian Seleksi: `/dashboard/seleksi`
- Status Seleksi: `/dashboard/seleksi/status`
- Hasil Seleksi: `/dashboard/seleksi/hasil`
- Profil: `/dashboard/profile`

## Newly Activated Pages

The previously missing candidate menu pages are now implemented as real Inertia pages:

- `Bantuan`
  - candidate-facing help center
  - reads candidate gate summary for context-aware primary action
  - links to existing status, profile, calendar, registration, document, payment, and selection pages

- `Riwayat Pembayaran`
  - safe payment ledger for candidates
  - shows transaction status, manual review status, proof status, rejection reason, and totals
  - intentionally does not expose raw gateway metadata, snap token, or internal transaction identifiers

- `Status Seleksi`
  - shows exam gate state, assigned sessions, schedule state, attempts, remaining attempt quota, and the current selection action
  - links to existing exam session or active attempt routes only when the backend says they exist

- `Hasil Seleksi`
  - shows candidate-visible exam results only when session/package visibility allows it
  - does not expose answers, answer keys, explanations, raw scoring internals, or internal audit metadata
  - final admission status remains manual through existing lifecycle semantics

## Latest Candidate Polish

The 2026-07-05 polish checkpoint extends the candidate panel without changing admission lifecycle semantics.

- Payment success copy now tells candidates to monitor `Status Pendaftaran` and `Seleksi` because selection access can activate automatically from backend gates.
- Gateway payment history and sidebar copy no longer ask candidates for manual proof upload.
- Data Diri, Data Wali, and Data Kesehatan summary tabs now show a right-aligned `Halaman Selanjutnya` CTA only when required fields are complete.
- Data Kesehatan final confirmation reminds candidates to check Dokumen and Pembayaran.
- Data Kesehatan physical eye fields now display Mata Kiri and Mata Kanan in the same order as their saved backend fields.
- Data Wali now uses the tab order Ibu -> Ayah -> Wali -> Profil Keluarga -> Rangkuman.
- Data Wali supports the `Tidak Ingin Memberitahu` income option and conditional requirements for parent status, combined/separate income, shared/different address, and guardian need.
- Minat & Bakat now reads active extracurricular options from the database and displays them in a searchable multi-select.

## Backend Structure

The new candidate pages use read-model services under `app/Services/CandidatePanel`.

- `CandidateHelpCenterService`
  - composes help content from the authenticated user, candidate record, and `CandidateGateService`

- `CandidatePaymentHistoryService`
  - uses selected columns only
  - paginates payment history
  - scopes all records by the authenticated candidate

- `CandidateSelectionCenterService`
  - reuses `CandidateGateService`
  - reads `ExamSessionCandidate`, session, package, subject, and attempts with constrained eager loading
  - respects `show_result_to_candidate` before returning score fields

Controllers remain thin and only resolve the authenticated candidate before delegating to the services.

## Frontend Structure

Shared candidate panel UI components live in `resources/js/Components/Dashboard/Candidate/Panel`:

- `GoldPageHeader`
- `GoldStatCard`
- `StatusPill`
- `EmptyState`

The pages use the existing dashboard layout, Tailwind classes, dark navy + gold accents, mobile-first grids, clear empty states, and subtle entry animation through the existing `animejs` dependency.

## Security Decisions

- Candidate pages never accept a candidate ID from the URL.
- Candidate identity is resolved from the authenticated user.
- Locked feature reasoning still comes from backend gates.
- Payment metadata, gateway tokens, answer keys, explanations, and raw audit metadata are not exposed to candidate pages.
- Accepted/rejected status is not auto-mutated from these pages.
- Data Wali completion rules are owned by backend evaluator logic, not frontend-only checks.
- Extracurricular options come from active database records, not hardcoded frontend arrays.

## Verification

Required checks for this feature:

- `npm run build`
- `php artisan test tests/Feature/CandidatePanelGoldFeatureTest.php`
- `php artisan route:list --path=dashboard`
- `git diff --check`
