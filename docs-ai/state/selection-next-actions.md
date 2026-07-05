# Selection Online Exam — Next Actions

## Next Action

Mission complete. UX polish checkpoint, Task 3 Admin Exam V2 stabilization, and Task 4 Stitch-based admin exam UI recovery are completed. No required continuation action remains for this directive.

Task 5 candidate lifecycle/gate restructure is completed. Task 6 dashboard shell/navigation V2 is completed. Status Pendaftaran Center is completed. Candidate Panel Gold is completed for the candidate sidebar pages that were previously missing. Dashboard Polish, Settings, and Exam Monitoring is completed. The next useful task is a manual browser QA pass with real candidate, staff, and admin accounts.

## Instructions for Next Agent Run

1. Treat this directive as completed unless the user opens a new task.
2. For future changes, read `docs-ai/features/online-selection-exam.md` first.
3. Keep future work scoped to a new feature/bugfix request.
4. Re-run route/build/test/audit checks after future exam changes.
5. For import UX questions, use the dynamic package template route `/dashboard/admin/exams/packages/{package}/template`; the master file is `resources/templates/exam/template-import-soal-ujian-seleksi-spmb.final.xlsx`.
6. Ensure every runtime has PHP `ext-zip` / `ZipArchive`; Docker installs it through `libzip-dev` + `docker-php-ext-install zip` and now fails the image build if `zip`/`ZipArchive` is not active.
7. For browser visual audits, ensure Chrome/Chromium is installed for Playwright. Task 4 could not complete screenshot capture because this runtime has no browser and the installer required interactive sudo.
8. For future candidate lifecycle work, start from `docs-ai/features/candidate-status-flow.md` and `docs-ai/audit/candidate-lifecycle-critical-audit.md`.
9. Do not reintroduce required-field checks into observers/controllers/frontend props; call `CandidateStatusService`, `CandidateCompletionEvaluator`, `CandidateVerificationEvaluator`, or `CandidateGateService`.
10. For future dashboard shell work, start from `docs-ai/features/dashboard-navigation-v2.md` and `docs-ai/design/dashboard-shell-navigation-v2.md`.
11. For future Status Pendaftaran work, start from `docs-ai/features/status-pendaftaran.md` and `docs-ai/audit/status-pendaftaran-audit.md`.
12. For future candidate panel/menu work, start from `docs-ai/features/candidate-panel-gold.md` and verify whether the sidebar entry already has a real page before adding a placeholder.
13. For future admin settings, wave management, candidate registration polish, or exam monitoring work, start from `docs-ai/features/dashboard-polish-settings-monitoring.md` and `docs-ai/audit/dashboard-polish-settings-monitoring-audit.md`.

## Do Not Touch

- Existing auth flow
- Existing payment flow
- Existing document verification flow
- Existing profile flow
- Existing registration wizard flow
- Existing dashboard layout/global theme
- Admission accepted/rejected status semantics

Task 5 exception already completed:
- Payment/document/exam flows were touched only to centralize lifecycle sync and enforce gates.
- Admission accepted/rejected semantics remain manual and final.

Task 6 exception already completed:
- Dashboard shell/sidebar/topbar/navigation config were changed only for navigation UX.
- Business logic, routes, schema, database, auth/session, payment, document verification, and exam engine behavior were not changed.

Status Pendaftaran exception already completed:
- Candidate/status routes, read-model service, React pages/components, and status entry links were added.
- Lifecycle semantics, schema, payment/document/exam business rules, and accepted/rejected behavior were not changed.

Candidate Panel Gold exception already completed:
- Candidate Bantuan, Riwayat Pembayaran, Status Seleksi, and Hasil Seleksi routes/pages were activated from the candidate sidebar.
- The work added read-only services/controllers/pages and focused tests only.
- Payment metadata, exam answer keys, lifecycle semantics, schema, and accepted/rejected behavior were not changed.

Dashboard Polish, Settings, and Exam Monitoring exception already completed:
- Candidate payment/registration UI was polished and Data Wali validation/completion rules were aligned.
- Admin Gelombang and Pengaturan Sistem were added using existing domain tables.
- Admin Monitoring Ujian was added as a read-only polling dashboard/display.
- Candidate lifecycle semantics, accepted/rejected behavior, payment processing, authorization roles, and exam scoring rules were not changed.

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

## Completed Task 6 Concrete Steps

1. Created `ui/dashboard-shell-navigation-v2` from clean HEAD.
2. Used Stitch MCP project `271540505065919969` to generate candidate, staff, and admin shell concepts.
3. Updated centralized role-based navigation maps in `resources/js/config/navigation.ts`.
4. Rebuilt the shared sidebar for click-expanded submenus and minimized flyout previews.
5. Rebuilt the shared topbar with greeting/date/search-icon behavior.
6. Created `docs-ai/design/dashboard-shell-navigation-v2.md` and `docs-ai/features/dashboard-navigation-v2.md`.
7. Ran `npx tsc --noEmit`, `npm run build`, `php artisan route:list --path=dashboard`, and `git diff --check`.
8. Attempted Playwright MCP browser inspection; blocked by headless Firefox launch timeout.

## Completed Status Pendaftaran Concrete Steps

1. Added `StatusPendaftaranService` as backend read-model assembler.
2. Added candidate route/page `/dashboard/status-pendaftaran`.
3. Redirected legacy `/dashboard/status` to the new page.
4. Added staff/admin per-candidate status routes and page.
5. Added candidate sidebar entry and staff/admin candidate table/detail actions.
6. Added focused feature tests for access, payload privacy, and gate reason behavior.
7. Ran targeted feature test, lifecycle/gate regression tests, production frontend build, dashboard route list, and diff whitespace check.

## Completed Candidate Panel Gold Concrete Steps

1. Audited the candidate sidebar and confirmed the missing/placeholder menu items.
2. Added real routes/controllers for Bantuan, Riwayat Pembayaran, Status Seleksi, and Hasil Seleksi.
3. Added `app/Services/CandidatePanel` read-model services with authenticated-candidate scoping and constrained selected columns/eager loading.
4. Added reusable candidate panel UI components with dark navy + gold visual language.
5. Updated candidate navigation so those items are no longer Coming Soon.
6. Added `tests/Feature/CandidatePanelGoldFeatureTest.php` for route/component coverage and payment metadata privacy.
7. Updated durable documentation in `docs-ai/features/candidate-panel-gold.md`.

## Completed Dashboard Polish, Settings, and Exam Monitoring Concrete Steps

1. Updated candidate payment success copy and gateway payment proof language.
2. Fixed Data Kesehatan eye field UI order while preserving `eye_left_*` and `eye_right_*` mapping.
3. Added summary-tab `Halaman Selanjutnya` CTAs for Data Diri, Data Wali, and Data Kesehatan.
4. Reordered Data Wali tabs and aligned conditional frontend/backend requirements.
5. Added `Tidak Ingin Memberitahu` as a guardian income option across UI, validation, model labels, evaluator rules, and migrations.
6. Replaced hardcoded Minat & Bakat extracurricular options with active database options and a searchable multi-select.
7. Rebuilt Admin Gelombang into create/edit/activate/delete management.
8. Added Admin Pengaturan Sistem for programs, extracurriculars, and payment configs.
9. Added `RichExamText` for common math notation in candidate attempt and admin result views.
10. Added Admin Monitoring Ujian route/page/feed/display backed by `ExamMonitoringService`.
11. Ran TypeScript no-emit, PHP lint, dashboard route list, frontend build, full feature tests, diff whitespace check, and Laravel cache clear.

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
- Re-run manual dashboard shell QA in a browser for candidate, staff, and admin: expanded sidebar, minimized sidebar flyouts, submenu click behavior, topbar search popover, and profile dropdown.
- Manually QA Status Pendaftaran in a browser for candidate, staff, and admin accounts, especially mobile checklist readability and internal quick-link flow.
- Manually QA Candidate Panel Gold pages in a browser with real candidate data, especially empty states, payment ledger pagination, selection-session states, and result visibility.
- Manually QA the new candidate registration polish, admin Gelombang/settings pages, and Monitoring Ujian display in a browser with realistic data because browser verification was intentionally not run for that checkpoint.
