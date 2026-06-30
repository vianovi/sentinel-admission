# Admin Online Selection Exam V2 Stitch Reference

Source Stitch project: `271540505065919969` - "Al-Muntaha School Admin Dashboard"

Read on: 2026-06-30

## Screens Reviewed

- `Pengaturan Paket Ujian` (`5a5116167aa0454fbe8c02dd39e11c57`)
- `Buat Paket Ujian - Step 1` (`afe00a5cb3ee4755957c9e8e1da04fcc`)
- `Pengaturan Sesi Ujian` (`8d39c59fd0d64703b159c5a4d2b567ae`)
- `Detail & Import Paket Soal` (`fb10d2b8f53843e7ba878283a801289a`)
- `Detail & Atur Peserta Sesi` (`335b26d8d84449e3afc656255d9342b2`, hidden screen instance)

## Design Direction To Adopt

- Desktop-first admin shell with a persistent left sidebar and a wide, information-dense content area.
- Dark institutional palette: deep navy app background, darker sidebar, slate card surfaces, restrained gold for active states and primary actions.
- Fixed-fluid hierarchy: sidebar remains stable; page content uses a constrained max width with 24px desktop spacing and 16px inner gutters.
- Compact Inter-based typography with clear page titles, small uppercase metadata labels, and muted secondary descriptions.
- Cards use low-contrast borders, 8px radius, 20px-ish padding, no heavy shadows, and subtle border changes on hover.
- Workflow structure is expressed through ordered sections, readiness summaries, and operational cards rather than separate top tabs.
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
- Existing light/dark tokens in the codebase should be used where possible, with navy/slate/gold styling scoped to the exam workflow when the existing app does not already provide matching tokens.
- Existing data and route contracts should be preserved unless implementation inspection proves a narrow change is required.
- Empty, loading, and disabled states should explain operational status concisely in Indonesian without adding non-functional menu items.

## Design Direction Not To Copy

- Do not copy Stitch HTML, generated layout code, or exact mock data.
- Do not introduce a separate top tab navigation for packages/sessions.
- Do not add fake sidebar items or placeholder actions that do not navigate or execute.
- Do not redesign the whole admin dashboard shell from scratch.
- Do not force every screen into the exact Stitch composition when current routes require different density or data relationships.
- Do not add schema changes for visual parity.
- Do not use excessive decorative gradients, large marketing-style hero areas, or nested cards inside cards.

## Implementation Notes

- Main admin sidebar should keep `Ujian Seleksi` active for all package, import, session, participant, monitoring, and result routes.
- Package detail/import pages should include clear back buttons to `Pengaturan Paket`.
- Session detail/participant pages should include clear back buttons to `Pengaturan Sesi`.
- Template download must return a real `.xlsx` response with the correct content type and filename.
- Import compatibility must preserve Indonesian headers while accepting existing English headers.
- If `ext-zip` is unavailable, the template/download/import path must not crash. Prefer a safe fallback response or a dependency path that avoids runtime fatal errors.
