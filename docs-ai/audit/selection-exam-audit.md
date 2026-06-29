# Selection Online Exam — Audit

## Audit Status

Final Phase 5 audit completed. UX polish checkpoint completed afterward. Task 2 admin workflow/template/import refinement completed without schema changes. Task 3 XLSX runtime stabilization and Admin Exam V2 redesign completed without schema changes. No known critical or high-risk issue remains for the Online Selection Exam Engine at this checkpoint.

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
- Replaced the rejected tab/horizontal admin exam structure with a desktop-first left contextual sidebar inside the exam admin workspace only.
- Sidebar information architecture is split into:
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

## Final Self-Audit

- Backend: pass. Exam schema, models, services/actions, request validation, routes, import parsing, template generation, attempt lifecycle, scoring, and audit logging are implemented within the exam domain. Syntax, route list, feature tests, Composer platform checks, Docker image build, and `ZipArchive` checks pass.
- Frontend: pass. Admin, candidate, and staff exam pages are built in exam-specific page/component folders, integrate existing dashboard layout/menu patterns, and `npm run build` passes. Admin Exam V2 now uses an exam-only contextual sidebar rather than the rejected tab-like navigation.
- Security: pass for target medium-risk scope. Candidate ownership, role route groups, server timer, autosave lock, server-side scoring, import validation/private storage, and candidate answer-key non-disclosure are implemented and covered by focused checks. No known critical/high issue remains.
- Product flow: pass. Admin can manage subjects/packages/sessions/imports/assignments/results; candidates can enter assigned exams, answer, autosave, submit, and expire safely; staff/admin can review results.
- Scope firewall: pass with documented integration touches only. No auth, payment, document, profile, registration, dashboard layout, global role, or global theme rewrite was performed.
- Residual limitations: option randomization is configured but not rendered yet; pass/fail does not automatically change admission accepted/rejected status; XLSX only, no XLS; untouched expired attempts finalize on next exam request rather than via scheduler; richer retake policy would need a future schema/product decision.
- UX polish residual limitations: no browser/E2E screenshot pass was run for exact 375px/390px visual inspection in this checkpoint; Task 3 prioritized desktop admin workflow.
