# Admin Online Selection Exam V2 Stitch Reference

Source Stitch project: `271540505065919969` - "Al-Muntaha School Admin Dashboard"

Read on: 2026-06-30

## Screens Reviewed

- `Pengaturan Paket Ujian` (`5a5116167aa0454fbe8c02dd39e11c57`)
- `Buat Paket Ujian - Step 1` (`afe00a5cb3ee4755957c9e8e1da04fcc`)
- `Pengaturan Sesi Ujian` (`8d39c59fd0d64703b159c5a4d2b567ae`)
- `Detail & Import Paket Soal` (`fb10d2b8f53843e7ba878283a801289a`)
- `Detail & Atur Peserta Sesi` (`335b26d8d84449e3afc656255d9342b2`, hidden screen instance)

## Task 4 Stitch Refinement

Stitch MCP was used before implementation to refine the existing project screens for the rejected Admin Online Selection Exam UI. The refinement prompt asked Stitch to keep the Al-Muntaha dashboard direction, remove top-tab and fake-menu patterns, use only two real admin workflows under `Ujian Seleksi`, and generate/refine package, session, detail/import, participant assignment, and result-review screens.

Refined Stitch screens confirmed after the edit:

- `Pengaturan Paket Ujian (Refined)` (`02a7e0cbe81549d5ac70a2d7a8d74628`)
- `Hasil Ujian - Detail Review` (`ce11d339f85348a2a0c162056da14946`)
- Stitch also reported successful refinement for `Pengaturan Sesi`, `Detail & Import Paket`, and `Detail & Atur Peserta`.

## Design Direction To Adopt

- Desktop-first admin shell with one persistent left sidebar and a wide, information-dense content area.
- Dark institutional palette: deep navy app background, darker sidebar, slate card surfaces, restrained gold for active states and primary actions.
- Fixed-fluid hierarchy: sidebar remains stable; page content uses a constrained max width with 24px desktop spacing and 16px inner gutters.
- Compact Inter-based typography with clear page titles, small uppercase metadata labels, and muted secondary descriptions.
- Cards use low-contrast borders, 8px radius, 20px-ish padding, no heavy shadows, and subtle border changes on hover.
- Workflow structure is expressed through ordered readiness rails, operational forms, and data cards rather than separate top tabs or a second global sidebar.
- Tables remain clean and utilitarian: clear header row, thin dividers, compact row actions, no decorative zebra striping.
- Buttons pair icon plus label for important actions; destructive/secondary actions stay visually quieter than gold primary actions.
- Detail screens need a prominent back action near the page heading before contextual metadata.

## Design Direction To Adapt

- Stitch's generated screens are a visual reference, not a component source. Existing Laravel, Inertia, React, Tailwind, and local component patterns remain the implementation base.
- The exam module should keep the current admin layout and navigation system, but adjust the Ujian Seleksi section to expose only the real workflows:
  - Pengaturan Paket
  - Pengaturan Sesi
- The package page becomes one workflow surface covering package management, template download, import entry points, and bank soal readiness.
- The session page becomes one workflow surface covering session scheduling, candidate assignment, monitoring, and result access.
- The main package workflow should read as: Buat Paket, Unduh Template, Guru Mengisi, Import Soal, Review Bank Soal, Siap Masuk Sesi.
- The main session workflow should read as: Buat Sesi, Pilih Paket Aktif, Atur Peserta, Monitor Pengerjaan, Review Hasil.
- Existing light/dark tokens in the codebase should be used where possible, with navy/slate/gold styling scoped to the exam workflow when the existing app does not already provide matching tokens.
- Existing data and route contracts should be preserved unless implementation inspection proves a narrow change is required.
- Empty, loading, and disabled states should explain operational status concisely in Indonesian without adding non-functional menu items.

## Design Direction Not To Copy

- Do not copy Stitch HTML, generated layout code, or exact mock data.
- Do not introduce a separate top tab navigation for packages/sessions.
- Do not add fake sidebar items or placeholder actions that do not navigate or execute.
- Do not add an inner exam workspace sidebar that competes with the admin dashboard sidebar.
- Do not redesign the whole admin dashboard shell from scratch.
- Do not force every screen into the exact Stitch composition when current routes require different density or data relationships.
- Do not add schema changes for visual parity.
- Do not use excessive decorative gradients, large marketing-style hero areas, or nested cards inside cards.

## Adopted vs Adapted vs Not Copied

Adopted:

- Single global admin sidebar as the only persistent navigation layer.
- Compact workflow rail at the top of package/session pages.
- Low-radius, low-shadow cards with slate surfaces, gold primary actions, and utilitarian row actions.
- Clear detail-page back buttons with text labels.

Adapted:

- Stitch's dark navy/gold feel is mapped to existing Tailwind tokens and existing dashboard layout.
- Stitch's screen-level workflow composition is mapped to the existing Laravel routes and Inertia pages instead of new routes.
- Import header compatibility, template download, and result review remain driven by the current backend contracts.

Not copied:

- No Stitch-generated markup or static mock data.
- No top-tab main navigation.
- No non-working menu entries.
- No raw column-chip block as the main import experience.
- No schema changes.

## Implementation Notes

- Main admin sidebar should keep `Ujian Seleksi` active for all package, import, session, participant, monitoring, and result routes.
- Package detail/import pages should include clear back buttons to `Pengaturan Paket`.
- Session detail/participant pages should include clear back buttons to `Pengaturan Sesi`.
- Template download must return a real `.xlsx` response with the correct content type and filename.
- Import compatibility must preserve Indonesian headers while accepting existing English headers.
- If `ext-zip` is unavailable, the template/download/import path must not crash. Prefer a safe fallback response or a dependency path that avoids runtime fatal errors.

## Implementation Plan From Stitch Review

1. Keep `resources/js/config/navigation.ts` as the source of the two visible admin submenus under `Ujian Seleksi`.
2. Remove the inner exam workspace sidebar from `ExamAdminUi.tsx`; pages should use the global admin sidebar only.
3. Update package/session workflow rails to the exact task workflow labels.
4. Ensure package row actions expose real routes for Detail, Unduh Template, Import Soal, and Lihat Bank Soal.
5. Ensure session row actions expose real routes for Detail, Atur Peserta, and Lihat Hasil.
6. Update detail-page back buttons to explicit Indonesian labels.
7. Run the mandatory UI/static audit loop, build/tests/checks, and update durable state/audit docs before commit.
