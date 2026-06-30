# Selection Online Exam — Next Actions

## Next Action

Mission complete. UX polish checkpoint, Task 3 Admin Exam V2 stabilization, and Task 4 Stitch-based admin exam UI recovery are completed. No required continuation action remains for this directive.

## Instructions for Next Agent Run

1. Treat this directive as completed unless the user opens a new task.
2. For future changes, read `docs-ai/features/online-selection-exam.md` first.
3. Keep future work scoped to a new feature/bugfix request.
4. Re-run route/build/test/audit checks after future exam changes.
5. For import UX questions, use the dynamic package template route `/dashboard/admin/exams/packages/{package}/template`; the master file is `resources/templates/exam/template-import-soal-ujian-seleksi-spmb.final.xlsx`.
6. Ensure every runtime has PHP `ext-zip` / `ZipArchive`; Docker now installs it through `libzip-dev` + `docker-php-ext-install zip`.
7. For browser visual audits, ensure Chrome/Chromium is installed for Playwright. Task 4 could not complete screenshot capture because this runtime has no browser and the installer required interactive sudo.

## Do Not Touch

- Existing auth flow
- Existing payment flow
- Existing document verification flow
- Existing profile flow
- Existing registration wizard flow
- Existing dashboard layout/global theme
- Admission accepted/rejected status semantics

## Completed Phase 5 Concrete Steps

1. Created `docs-ai/features/online-selection-exam.md`.
2. Added focused tests in `tests/Feature/OnlineSelectionExamSecurityTest.php`.
3. Ran final PHP syntax, route list, migration pretend, frontend build, feature tests, Composer audit, and answer-key leakage checks.
4. Updated `selection-exam-audit.md` with final self-audit.
5. Updated all durable state files to completed.

## Completed Task 3 Concrete Steps

1. Audited XLSX template generation/import code and external runtime requirements.
2. Fixed Docker/Composer runtime support for `ext-zip` / `ZipArchive`.
3. Added safe admin-facing handling for template generation failures.
4. Added focused template download verification.
5. Replaced the rejected tab-like admin exam navigation with a left contextual sidebar split into `Pengaturan Paket` and `Pengaturan Sesi`; this Task 3 approach was superseded by Task 4, which removed the inner sidebar and kept the main admin sidebar as the only global navigation layer.
6. Updated durable state and audit documentation.

## Completed Task 4 Concrete Steps

1. Used Stitch MCP project `271540505065919969` and refined the admin exam package/session/detail/result screens.
2. Updated `docs-ai/design/admin-exam-v2-stitch-reference.md` with adopted, adapted, and not-copied decisions.
3. Removed the inner admin exam workspace sidebar so the dashboard sidebar is the only global navigation layer.
4. Kept only the two visible admin exam submenus: `Pengaturan Paket` and `Pengaturan Sesi`.
5. Updated package workflow labels and real actions: Detail, Unduh Template, Import Soal, and Lihat Bank Soal.
6. Updated session workflow labels and real actions: Detail, Atur Peserta, and Lihat Hasil.
7. Updated detail-page back buttons to explicit Indonesian labels.
8. Ran static UI audit, frontend build, admin exam route list, focused import/download test, focused security test, and diff checks.

## Known Limitations to Document

- This is not a proctoring/browser-lockdown system.
- Option randomization is configured but not implemented in candidate rendering yet.
- Exam pass/fail does not automatically change final admission accepted/rejected status.
- Import supports XLSX only through OpenSpout, not legacy XLS.
- Dynamic XLSX generation/import requires PHP `ext-zip` / `ZipArchive` in host and deployed runtimes.

## Recommended Future UX Polish

- Add browser/E2E viewport checks for candidate exam at 375px and 390px.
- Consider option randomization rendering if the existing `randomize_options` flag should become active.
- Consider a dedicated retake policy schema if admins need more than the current `izinkan_ujian_ulang` -> `max_attempts` 1/2 mapping.
- Add an E2E/browser pass for the new admin exam workspace once demo data is ready, especially package detail/import and session participant workflows.
- Install Chrome/Chromium in the local Playwright runtime before the next screenshot-based admin exam audit.
