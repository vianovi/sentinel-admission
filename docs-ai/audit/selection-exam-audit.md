# Selection Online Exam — Audit

## Audit Status

Final Phase 5 audit completed. UX polish checkpoint completed afterward. Task 2 admin workflow/template/import refinement completed without schema changes. Task 3 XLSX runtime stabilization and Admin Exam V2 redesign completed without schema changes. Task 4 Stitch-based admin exam UI recovery completed without schema changes. Admin import workflow/template handling checkpoint completed without schema changes. Runtime XLSX zip support checkpoint completed without schema changes. Task 5 candidate lifecycle gate checkpoint completed without schema changes. Task 6 dashboard shell/navigation V2 completed without schema changes or business-logic changes. No known critical or high-risk issue remains for the Online Selection Exam Engine at this checkpoint.

Task 5 lifecycle gate checkpoint completed on 2026-07-01. Candidate exam access is now guarded by `CandidateGateService::exam()` before session detail, start, attempt show, sync, autosave, and submit actions. The exam engine still does not change final admission accepted/rejected status automatically.

Task 6 dashboard shell/navigation checkpoint completed on 2026-07-02. Candidate, staff, and admin now share a role-aware one-sidebar shell with click-expanded submenus, minimized flyouts, query-aware active states, and a cleaner topbar. Backend routes and business logic were not changed.

## Phase Audit Notes

### Phase 0

- Branch: `feat/online-selection-exam`.
- Environment: local/dev-like, not demo-mode. `APP_ENV=local`, debug enabled, localhost URL, non-secure session cookie.
- Stack confirmed from source: Laravel 12, Inertia v2, React/TypeScript, Tailwind, Ziggy, MariaDB.
- Route structure confirmed:
  - Candidate dashboard: `/dashboard`, route name prefix `dashboard.`, exact candidate role middleware.
  - Staff dashboard: `/dashboard/staff`, route name prefix `staff.`, exact staff role middleware.
  - Admin dashboard: `/dashboard/admin`, route name prefix `admin.`, exact admin role middleware.
- Existing menu integration is centralized in `resources/js/config/navigation.ts`.
- Existing upload security pattern uses Laravel validation, magic bytes, polyglot scan, private storage, UUID filename, and safe user-facing errors.
- Existing candidate status flow is `draft -> submitted -> verified -> accepted/rejected`; exam result should support selection review but not force acceptance automatically.

### Phase 1

- Built 9 exam migrations.
- Built 9 exam models under `app/Models/Exam`.
- Built attempt/scoring/audit services and action wrappers.
- Added route skeletons for admin, candidate, and staff exam areas.
- Added safe placeholder controllers for unfinished pages.
- Added sidebar entry points, with unfinished entries marked `comingSoon`.
- Verification passed:
  - PHP syntax checks.
  - `php artisan route:list --path=dashboard`.
  - `php artisan migrate --pretend`.
  - `npm run build`.
  - `php artisan test --testsuite=Feature`.

### Phase 2

- Built admin exam control center and management pages.
- Built subject/package/session management.
- Built candidate assignment UI for sessions.
- Built XLSX question import with OpenSpout, private storage, required column checks, row validation, duplicate detection, sanitized failure reports, and import audit events.
- Built admin import batch failure report page.
- Built admin result index/detail pages with protected answer-key review.
- Activated admin exam sidebar entry.
- Dependency audit outcome:
  - Laravel Excel was rejected because it pinned vulnerable PhpSpreadsheet versions that could not be safely patched under PHP 8.5.
  - OpenSpout v5.7.2 was installed instead.
  - Laravel/Symfony/Guzzle/CommonMark related dependencies were updated to patched versions.
  - `composer audit` now reports no advisories.
- Verification passed:
  - PHP syntax checks for exam controllers, requests, services, imports, models, actions, exceptions, modified models, and routes.
  - `php artisan route:list --path=dashboard`.
  - `npm run build`.
  - `php artisan migrate --pretend`.
  - `composer audit`.
  - `php artisan test --testsuite=Feature`.

### Phase 3

- Built candidate exam dashboard at `/dashboard/seleksi`.
- Built candidate session instruction/start page.
- Built active attempt page with server-synced countdown display, question navigation, marked-for-review, debounced autosave, save state, and submit confirmation.
- Candidate controllers now enforce authenticated candidate ownership before session/attempt access.
- Candidate start delegates to `StartExamAttempt`/`ExamAttemptService`, preserving server-side schedule/max-attempt/timer checks.
- Candidate save delegates to `SaveExamAnswer`, preserving backend question membership, option, lock, and expiration checks.
- Candidate submit delegates to `SubmitExamAttempt`, preserving server-side scoring and lock behavior.
- Candidate menu entry activated.
- Verification passed:
  - Candidate controller PHP syntax checks.
  - `php artisan route:list --path=dashboard/seleksi`.
  - `npm run build`.
  - Candidate answer-key leakage grep against candidate controllers/pages/components.
  - Full `php artisan route:list --path=dashboard`.
  - `php artisan migrate --pretend`.
  - `php artisan test --testsuite=Feature`.
  - `composer audit`.

### Phase 4

- Hardened admin result review with search/session/status/pass filters.
- Added `result_reviewed` audit logging for admin and staff result detail views.
- Built staff result review pages under `/dashboard/staff/exams/results`.
- Staff result detail can review protected answer keys and explanations under the staff role route group.
- Activated staff result sidebar entry.
- Verification passed:
  - Admin/staff result controller PHP syntax checks.
  - Staff/admin result route lists.
  - `npm run build`.
  - Candidate answer-key leakage grep against candidate controllers/pages/components.
  - Full `php artisan route:list --path=dashboard`.
  - `php artisan migrate --pretend`.
  - `php artisan test --testsuite=Feature`.
  - `composer audit`.

### Phase 5

- Added `docs-ai/features/online-selection-exam.md` with feature overview, DB tables, admin/staff/candidate flows, XLSX format, validation, timer/autosave/scoring behavior, audit events, security notes, known limitations, and manual testing guide.
- Added `tests/Feature/OnlineSelectionExamSecurityTest.php` for the highest-risk backend behaviors:
  - candidate cannot open another candidate's attempt
  - candidate attempt page does not expose answer keys or explanations
  - expired autosave is rejected and auto-submits saved answers
  - scoring is calculated from server-side answer keys
- Completed final verification:
  - `git branch --show-current` -> `feat/online-selection-exam`
  - `php artisan test tests/Feature/OnlineSelectionExamSecurityTest.php` -> 4 tests, 12 assertions
  - `composer audit` -> no security vulnerability advisories found
  - `npm run build` -> passed
  - `php artisan test --testsuite=Feature` -> 15 tests, 60 assertions
  - `php artisan route:list --path=dashboard` -> passed, 124 dashboard routes
  - `php artisan migrate --pretend` -> passed, valid SQL for 9 exam migrations
  - Candidate answer-key leakage grep -> no matches
  - Exam PHP syntax sweep -> passed
  - Modified integration PHP syntax checks -> passed

### UX Polish Checkpoint

- Added `public/templates/exam-question-template.xlsx` as the official static XLSX template.
- Updated admin import panel with a visible template download action, step-by-step helper text, selected-file feedback, and clearer processing state.
- Updated import batch report with readable success/failure guidance and direct actions back to package/template.
- Updated candidate active attempt UI with clearer session back action, mobile-friendly timer/submit controls, focus states, and larger touch targets.
- Updated admin/staff result pages with clearer navigation, summary labels, and empty answer states.
- Updated documentation with template location and usage.
- Verification passed:
  - Template read check using `ExamQuestionWorkbookReader` confirmed the expected headings and example row.
  - `npm run build` passed.
  - `php artisan test tests/Feature/OnlineSelectionExamSecurityTest.php` passed: 4 tests, 12 assertions.
  - Candidate answer-key leakage grep returned no matches.

### Task 2

- Added package-specific XLSX template download from master template `resources/templates/exam/template-import-soal-ujian-seleksi-spmb.final.xlsx`.
- Added route `/dashboard/admin/exams/packages/{package}/template` named `admin.exams.packages.template.download`.
- Added `ExamPackageTemplateService` to copy the master XLSX, replace package placeholders, stream the generated file, and delete the temp file after response.
- Updated importer to read only `Data Soal`, ignore `Panduan`, parse package metadata and teacher-owned exam configuration, and support Indonesian question headers.
- Kept legacy English import headers compatible.
- Updated package configuration on import using existing fields only: duration, passing score, result visibility, and max attempts.
- Added focused import test for Indonesian template headers/config update.
- Refined admin exam pages with contextual section navigation, clearer package/session/import copy, dynamic template actions, import result summary, and visible back paths.
- Verification run for this checkpoint included PHP syntax, dynamic template read check, focused import test, focused exam security test, full feature suite, dashboard route list, and frontend build.

### Task 3

- Audited the failing dynamic XLSX template download route `/dashboard/admin/exams/packages/{package}/template`.
- Root cause: Docker runtime did not install PHP `ext-zip`, so `ZipArchive` was unavailable even though XLSX files and OpenSpout require ZIP support.
- Added `ext-zip` to `composer.json` so the runtime requirement is explicit during platform checks.
- Updated `Dockerfile` to install `libzip-dev` and compile PHP `zip` alongside `pdo_mysql`.
- Kept the Task 2 template/import design and made it production-aware instead of suppressing the error.
- Hardened `ExamPackageTemplateService`:
  - explicit `ZipArchive` availability guard
  - no orphan temp filename created by appending `.xlsx` after `tempnam`
  - worksheet-entry discovery instead of hard-coding only sheet1/sheet2
  - temp cleanup on generation failure
- Hardened `PackageController::downloadTemplate`:
  - technical detail is logged through Laravel logs
  - admin receives a safe flash message when template generation fails
  - no stack trace or internal runtime detail is intentionally exposed
- Hardened import reader:
  - `Panduan` is skipped and cannot become question data
  - legacy fallback remains available for older non-`Data Soal` workbooks
- Fixed code-less package metadata validation by accepting the generator fallback `PKG-{id}`.
- Added focused feature coverage for dynamic template download, filename, package data injection, and raw-placeholder removal.
- Replaced the rejected tab/horizontal admin exam structure with a desktop-first left contextual sidebar inside the exam admin workspace only. This Task 3 approach was superseded by Task 4, which removed the inner sidebar and kept the main admin sidebar as the only global navigation layer.
- Task 3 sidebar information architecture was split into:
  - `Pengaturan Paket`: Ringkasan Ujian, Kategori Ujian, Paket Ujian, Template Soal, Import Soal, Bank Soal
  - `Pengaturan Sesi`: Sesi Ujian, Peserta, Hasil Ujian
- Admin package form now emphasizes admin-owned metadata/status and keeps teacher-owned execution defaults in an advanced initial-values panel.
- No backend domain rewrite, candidate exam behavior change, or schema change was made.
- Verification passed:
  - PHP lint for touched backend files
  - `npm run build`
  - focused import/download test
  - focused exam security test
  - full Feature suite
  - dashboard route list
  - Composer validation/platform checks
  - host and container `ZipArchive` checks
  - Docker image build

### Task 4

- Read and executed `docs-ai/task/selection-online-exam.task-4.md`.
- Used Stitch MCP project `271540505065919969` titled `Al-Muntaha School Admin Dashboard` before changing code.
- Reviewed the existing Stitch project/screens and refined the admin exam direction through Stitch MCP for package, session, detail/import, participant assignment, and result review screens.
- Confirmed refined Stitch screens:
  - `Pengaturan Paket Ujian (Refined)` (`02a7e0cbe81549d5ac70a2d7a8d74628`)
  - `Hasil Ujian - Detail Review` (`ce11d339f85348a2a0c162056da14946`)
- Updated `docs-ai/design/admin-exam-v2-stitch-reference.md` with what was adopted, adapted, and intentionally not copied.
- Removed the rejected inner admin exam workspace sidebar from `ExamAdminUi.tsx`; the main dashboard sidebar is now the only global navigation layer.
- Kept the admin `Ujian Seleksi` sidebar children to the two real workflows only:
  - `Pengaturan Paket`
  - `Pengaturan Sesi`
- Updated the package page into a single workflow surface with the required sequence:
  - Buat Paket
  - Unduh Template
  - Guru Mengisi
  - Import Soal
  - Review Bank Soal
  - Siap Masuk Sesi
- Updated package row actions to real routes/anchors:
  - Detail
  - Unduh Template
  - Import Soal
  - Lihat Bank Soal
- Updated the session page into a single workflow surface with the required sequence:
  - Buat Sesi
  - Pilih Paket Aktif
  - Atur Peserta
  - Monitor Pengerjaan
  - Review Hasil
- Updated session row actions to real routes/anchors:
  - Detail
  - Atur Peserta
  - Lihat Hasil
- Updated detail-page back buttons to clear Indonesian labels.
- No backend domain behavior, database schema, import parser, XLSX generator, candidate exam behavior, or routes were changed in Task 4.
- Mandatory audit loop results:
  - Static UI grep found no inner exam workspace sidebar, no top-tab admin exam structure, no fake package/session submenu, and no stale ambiguous admin exam back/action labels.
  - `npm run build` passed.
  - `php artisan route:list --path=dashboard/admin/exams` passed and showed 28 admin exam routes.
  - `php artisan route:list --path=dashboard` passed and showed 125 dashboard routes.
  - `php artisan test tests/Feature/OnlineSelectionExamImportTest.php` passed: 3 tests, 28 assertions.
  - `php artisan test tests/Feature/OnlineSelectionExamSecurityTest.php` passed: 4 tests, 12 assertions.
  - `git diff --check` passed.
  - `git diff --stat` reviewed.
- Playwright browser visual audit was attempted with a temporary SQLite DB and local Laravel server, but screenshot capture was blocked because Chrome/Chromium is not installed in this environment and `npx playwright install chrome` required interactive sudo. This is recorded as an environment verification limitation, not an application finding.

### Task 5

- Audited candidate lifecycle dependencies before changing exam access:
  - `CandidateObserver`, `GuardianObserver`, `HealthRecordObserver`
  - candidate document and payment controllers
  - staff/admin document and payment verification actions
  - Midtrans webhook handling
  - candidate exam index/session/attempt controllers
  - dashboard summary helper
- Exam candidate routes now sync lifecycle and check the central exam gate.
- Candidate exam landing remains visible with a locked reason when not eligible.
- Direct session/attempt/start/autosave/submit routes reject when the exam gate fails.
- Existing exam security tests were updated so verified exam candidates are verified through real lifecycle prerequisites instead of direct status assignment.

### Task 6

- Read `docs-ai/task/dashboard-shell.task-6.md`, `docs-ai/CORE_CONTEXT.md`, and `docs-ai/compressed/intruction_system.md`.
- Created branch `ui/dashboard-shell-navigation-v2` from clean HEAD.
- Safe branch cleanup:
  - deleted fully merged local-only branches with `git branch -d`: `critical/candidate-lifecycle-gates`, `feat/candidate-dashboard`, `feat/dashboard`, `feat/online-selection-exam`, `feat/staf-dashboard`, `fix/audit-findings`, `style/layout-landing`
  - skipped `main`, `develop`, and remote-tracking local branches
- Used Stitch MCP project `271540505065919969`:
  - source screen: `Pengaturan Paket Ujian (Refined)` (`02a7e0cbe81549d5ac70a2d7a8d74628`)
  - generated role concepts: candidate, staff, and admin dashboard shells
- Updated `resources/js/config/navigation.ts` with role-specific workflow groups and active rules.
- Updated `resources/js/Components/Dashboard/Shared/Sidebar.tsx`:
  - removed full-sidebar hover-open submenu behavior
  - parent rows with children are accessible buttons, not fake links
  - submenus open downward by click with subtle transitions
  - active parent and active child states are distinct
  - minimized sidebar remains icon-only and exposes compact flyouts on hover/focus
- Updated `resources/js/Components/Dashboard/Shared/Topbar.tsx`:
  - replaced permanent desktop search input with search icon/popover
  - added English local-time greeting and current date
  - removed fake unread notification badge/content
  - preserved role-aware profile link and logout behavior
- Removed old hover-expanded sidebar state from `resources/js/context/SidebarContext.tsx`, `resources/js/Layouts/DashboardLayout.tsx`, and `resources/js/Layouts/DashboardSplitLayout.tsx`.
- Route decisions:
  - omitted candidate `Status Pendaftaran` because it is only a ComingSoon route
  - omitted staff `Sesi Ujian` and `Peserta Seleksi` because no staff routes exist
  - split final candidate status into `Diterima` and `Ditolak` because the backend supports one `status` query at a time
- Verification passed:
  - `npx tsc --noEmit`
  - `npm run build`
  - `php artisan route:list --path=dashboard`
  - `git diff --check`
- Playwright MCP was available, but browser inspection was blocked because headless Firefox launch timed out twice. Static UI audit passed and manual browser review remains recommended.

## Security Review Notes

- Implemented controls:
  - Admin-only exam management/import through existing admin route group and request authorization.
  - Candidate-only exam access route skeleton through existing candidate route group.
  - Staff/admin result review route skeletons through existing role groups.
  - Attempt start checks for candidate assignment, status, schedule, package status, active questions, and max attempts.
  - Server-owned `started_at` and `expires_at`.
  - Autosave guard rejects locked/expired attempts and invalid questions/options.
  - Submit path scores server-side and locks attempts.
  - Candidate question payload helper omits `correct_answer`.
  - Import request validates file extension/MIME/size.
  - Import service validates XLSX signature and stores files privately under a UUID path.
  - Import user-facing failures are sanitized; technical exception detail is logged.
- Phase 3 controls implemented:
  - Candidate props are built from `ExamQuestion::candidatePayload()` and do not include `correct_answer`.
  - Candidate controllers check candidate ownership for sessions and attempts.
  - Autosave UI only moves to saved state after backend response.
  - Expiration is synchronized through backend `syncExpired`; frontend timer is display-only.
- Phase 4 controls implemented:
  - Staff result pages are under exact staff role middleware route group.
  - Result filters include search, session, status, and pass/fail.
  - Result detail uses server-side scoring snapshots and stored answer correctness.
  - Admin/staff answer-key review is protected; candidate grep remained clean.
- Final Phase 5 audit confirmed:
  - Documentation completeness.
  - Manual test guide completeness.
  - Scope firewall review.
  - Final route/build/test/security checks.
  - No known critical or high-risk exam issue remains.
- UX polish security check confirmed:
  - No backend timer/scoring/ownership behavior was changed.
  - Candidate exam UI changes did not introduce answer-key references.
  - Official template matches importer headings and contains only a safe example row.
- Task 3 security check confirmed:
  - Template generation failures are logged but sanitized for admins.
  - Import failures remain sanitized.
  - `Panduan` is not imported as question data.
  - Candidate timer/autosave/scoring/ownership logic was not changed.
- Task 4 security check confirmed:
  - No backend route, auth, import, timer, scoring, ownership, or schema behavior was changed.
  - Import/download focused tests still pass after the UI recovery.
  - Candidate answer-key leakage coverage still passes after the UI recovery.
- Admin import workflow/template checkpoint confirmed:
  - Scope stayed inside Admin Exam package import UI and XLSX download/import handling.
  - `Workflow Import Soal` is now the primary wide panel; `Riwayat Import` is a compact secondary panel.
  - Required 7-step Indonesian import workflow is visible on the package detail/import page.
  - Master template remains `resources/templates/exam/template-import-soal-ujian-seleksi-spmb.final.xlsx`.
  - Template download preserves the master workbook structure and fails safely if `ZipArchive` or the master template is unavailable.
  - Download test verifies a real PK/XLSX workbook with `Data Soal` and `Panduan`, not HTML.
  - Importer reads only `Data Soal`, ignores `Panduan`, supports Indonesian headers, and keeps legacy English header compatibility.
  - Value validation now treats `opsi_e`, `tingkat_kesulitan`, and `pembahasan` as optional values; `aktif` is required and accepts Indonesian/boolean-like values.
- Runtime XLSX zip support checkpoint confirmed:
  - Scope stayed inside PHP Docker/runtime support for XLSX template download/import.
  - App image is Debian-based `php:8.4-apache`.
  - Dockerfile installs `libzip-dev` and compiles PHP `zip` with `docker-php-ext-install pdo_mysql zip`.
  - Dockerfile now includes a build-time smoke check for `php -m | grep -i '^zip$'` and `class_exists(ZipArchive::class)`.
  - Running app container was rebuilt/recreated; `ZipArchive::class` now returns `true` inside the container.
  - Focused import/download and exam security tests passed inside the Docker app container.
- Task 6 dashboard shell security/scope check confirmed:
  - No backend route, auth, payment, document verification, exam engine, lifecycle, or schema behavior was changed.
  - Sidebar candidate locked/gate behavior remains server-owned; no frontend gate rules were added.
  - Navigation links only use existing real routes or documented existing ComingSoon routes.
  - Fake candidate status, staff session, and staff participant links were not rendered.

## Out-of-Scope File Touches

- `app/Models/Candidate.php`: added exam-specific relationships only.
- `app/Models/User.php`: added exam-specific creator/uploader/audit relationships only.
- `app/Support/SentinelStoragePaths.php`: added exam import private storage directory helper only.
- `routes/web.php`: added protected exam route groups.
- `resources/js/config/navigation.ts`: added exam menu entries and activated the admin exam menu after Phase 2 pages were completed.
- `resources/js/config/navigation.ts`: activated the candidate exam menu after Phase 3 pages were completed.
- `resources/js/config/navigation.ts`: activated the staff result menu after Phase 4 pages were completed.
- `composer.json` and `composer.lock`: changed to install OpenSpout and update vulnerable dependencies. This was necessary to avoid introducing known critical/high security advisories for the import feature and to clear existing Composer audit advisories discovered during Phase 2.
- `public/templates/exam-question-template.xlsx`: added official static import template for admin UX. This is an exam asset, not a global public feature rewrite.
- `Dockerfile`: changed only to add the PHP ZIP runtime needed by XLSX generation/import.
- `composer.json`: Task 3 added explicit `ext-zip` platform requirement; no package architecture rewrite.
- Task 4 frontend changes stayed inside `resources/js/Components/Dashboard/Admin/Exam` and `resources/js/Pages/Dashboard/Admin/Exam`, plus durable docs. No non-exam dashboard shell rewrite was performed.
- Task 6 intentionally touched the shared dashboard shell: `resources/js/config/navigation.ts`, `resources/js/Components/Dashboard/Shared/Sidebar.tsx`, `resources/js/Components/Dashboard/Shared/Topbar.tsx`, `resources/js/context/SidebarContext.tsx`, `resources/js/Layouts/DashboardLayout.tsx`, and `resources/js/Layouts/DashboardSplitLayout.tsx`.

## External References Consulted

- Laravel 12 validation documentation: https://laravel.com/docs/12.x/validation
- Laravel Excel documentation: https://docs.laravel-excel.com/
- Laravel Excel package metadata: https://packagist.org/packages/maatwebsite/excel
- OpenSpout package/source metadata: https://github.com/openspout/openspout
- OpenSpout v5.7.2 Composer requirement for `ext-zip`: https://github.com/openspout/openspout/blob/v5.7.2/composer.json
- PHP Zip installation documentation: https://www.php.net/manual/en/zip.installation.php
- PHP ZipArchive class documentation: https://www.php.net/manual/en/class.ziparchive.php
- Laravel 12 response downloads documentation: https://laravel.com/docs/12.x/responses#file-downloads
- Material Design navigation drawer guidance: https://m3.material.io/components/navigation-drawer/overview
- Nielsen Norman Group guidance on navigation IA: https://www.nngroup.com/articles/navigation-cognitive-strain/
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP Input Validation Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- Moodle quiz settings/timing behavior: https://docs.moodle.org/en/Quiz_settings
- Stitch MCP project `271540505065919969`: `Al-Muntaha School Admin Dashboard`
- Stitch MCP generated Task 6 dashboard shell concepts for candidate, staff, and admin from project `271540505065919969`.

## Final Self-Audit

- Backend: pass. Exam schema, models, services/actions, request validation, routes, import parsing, template generation, attempt lifecycle, scoring, and audit logging are implemented within the exam domain. Syntax, route list, feature tests, Composer platform checks, Docker image build, and `ZipArchive` checks pass.
- Frontend: pass. Admin, candidate, and staff exam pages are built in exam-specific page/component folders, integrate existing dashboard layout/menu patterns, and `npm run build` passes. Admin Exam V2 now uses the main admin sidebar as the only global navigation layer and keeps package/session workflows inside the page body. Task 6 updates the shared dashboard shell only and keeps one main sidebar for candidate, staff, and admin.
- Security: pass for target medium-risk scope. Candidate ownership, role route groups, server timer, autosave lock, server-side scoring, import validation/private storage, and candidate answer-key non-disclosure are implemented and covered by focused checks. No known critical/high issue remains.
- Product flow: pass. Admin can manage subjects/packages/sessions/imports/assignments/results; candidates can enter assigned exams, answer, autosave, submit, and expire safely; staff/admin can review results.
- Scope firewall: pass with documented integration touches only. No auth, payment, document, profile, registration, dashboard layout, global role, or global theme rewrite was performed.
- Residual limitations: option randomization is configured but not rendered yet; pass/fail does not automatically change admission accepted/rejected status; XLSX only, no XLS; untouched expired attempts finalize on next exam request rather than via scheduler; richer retake policy would need a future schema/product decision.
- UX polish residual limitations: no browser/E2E screenshot pass was completed for Task 4 because the local Playwright runtime has no Chrome/Chromium and the installer required interactive sudo. Static UI audit, frontend build, route list, and focused tests passed.
