# Selection Online Exam — Progress

## Status

Phase 0 through Phase 5 completed. The Online Selection Exam Engine mission is complete.

UX polish checkpoint completed after the WIP exam engine commit.

## Completed Phases

- Phase 0 — Project audit and implementation plan
- Phase 1 — Database, models, routes skeleton, and core domain
- Phase 2 — Admin exam management and XLSX question import
- Phase 3 — Candidate exam access, attempt lifecycle, timer, and autosave
- Phase 4 — Scoring, results, and staff/admin review
- Phase 5 — UI polish, documentation, manual testing guide, focused tests, final verification, and self-audit

## Phase 2 Completed Work

- Rejected Laravel Excel after Composer audit showed it pinned vulnerable PhpSpreadsheet versions under PHP 8.5.
- Installed `openspout/openspout` v5.7.2 for streaming XLSX parsing.
- Updated vulnerable framework/transitive dependencies until `composer audit` was clean.
- Added admin request validation for subjects, packages, sessions, candidate assignment, and imports.
- Added OpenSpout workbook reader and question import service with private storage, XLSX signature validation, heading checks, row validation, duplicate detection, sanitized failures, and audit events.
- Added admin control-center, subject, package, session, import batch, and result pages.
- Activated admin exam menu.

## Phase 3 Completed Work

- Replaced candidate exam placeholder controllers with real logic:
  - authenticated candidate resolution
  - assignment/ownership checks
  - schedule state and start eligibility
  - in-progress attempt continuation
  - server `remaining_seconds`/expiration sync
  - autosave endpoint using `ExamAttemptService`
  - submit endpoint using server-side scoring path
- Added candidate exam pages:
  - `resources/js/Pages/Dashboard/Candidate/Exam/Index.tsx`
  - `resources/js/Pages/Dashboard/Candidate/Exam/SessionShow.tsx`
  - `resources/js/Pages/Dashboard/Candidate/Exam/AttemptShow.tsx`
- Added shared candidate exam UI helpers in `resources/js/Components/Dashboard/Candidate/Exam/ExamCandidateUi.tsx`.
- Candidate active attempt UI includes:
  - server-synced countdown display
  - question workspace
  - question navigation
  - answered/unanswered/marked indicators
  - debounced autosave
  - save/saved/failed/locked state
  - final submit confirmation
  - locked/completed state without answer-key disclosure
- Activated the candidate sidebar entry for `/dashboard/seleksi`.
- Grep confirmed candidate controllers/pages do not reference `correct_answer`, `explanation`, `is_correct`, or `point_awarded`.

## Phase 4 Completed Work

- Hardened admin result index with search, session, status, and pass/fail filters.
- Added admin result review audit logging (`result_reviewed`).
- Replaced staff result placeholder controller with real read-only result list/detail pages.
- Staff result review supports search, session, status, and pass/fail filters.
- Staff result detail can review candidate answers and answer keys under staff-only routes.
- Added staff result pages:
  - `resources/js/Pages/Dashboard/Staff/Exam/Results.tsx`
  - `resources/js/Pages/Dashboard/Staff/Exam/ResultShow.tsx`
- Activated staff `Hasil Ujian` sidebar entry.
- Re-ran candidate answer-key leakage grep; no candidate-side matches.

## Phase 5 Completed Work

- Added final feature documentation at `docs-ai/features/online-selection-exam.md`.
- Documented:
  - feature overview
  - database tables
  - admin flow
  - staff flow
  - candidate flow
  - official XLSX import headings and example row
  - import validation rules
  - timer/autosave/scoring behavior
  - audit events
  - security notes
  - known limitations
  - manual test guide
- Added focused feature tests in `tests/Feature/OnlineSelectionExamSecurityTest.php` for:
  - candidate attempt ownership
  - candidate payload answer-key/explanation leakage
  - expired autosave rejection and auto-submit
  - server-side scoring from stored answer keys
- Completed final route/build/migration/test/dependency/security checks.
- Completed final self-audit and documented residual limitations.

## UX Polish Checkpoint

- Added official XLSX question template asset at `public/templates/exam-question-template.xlsx`.
- Added template download button and short import instructions to the admin package import panel.
- Improved import report status copy, next-action guidance, and template/package actions.
- Improved candidate active attempt header for narrow screens with clearer session back action, timer placement, autosave status visibility, and larger touch targets.
- Improved result detail readability for admin/staff with clearer summary heading and empty answer state.
- Added clearer back/navigation actions to admin result list and staff result list/detail pages.
- Updated feature documentation with the official template location and usage notes.

## Files Created or Modified

- app/Actions/Exam/SaveExamAnswer.php
- app/Actions/Exam/StartExamAttempt.php
- app/Actions/Exam/SubmitExamAttempt.php
- app/Exceptions/Exam/ExamAccessException.php
- app/Http/Controllers/Dashboard/Admin/Exam/IndexController.php
- app/Http/Controllers/Dashboard/Admin/Exam/PackageController.php
- app/Http/Controllers/Dashboard/Admin/Exam/QuestionImportController.php
- app/Http/Controllers/Dashboard/Admin/Exam/ResultController.php
- app/Http/Controllers/Dashboard/Admin/Exam/SessionController.php
- app/Http/Controllers/Dashboard/Admin/Exam/SubjectController.php
- app/Http/Controllers/Dashboard/Candidate/Exam/AttemptController.php
- app/Http/Controllers/Dashboard/Candidate/Exam/ExamController.php
- app/Http/Controllers/Dashboard/Staff/Exam/ResultController.php
- app/Http/Requests/Exam/AssignExamCandidatesRequest.php
- app/Http/Requests/Exam/ImportExamQuestionsRequest.php
- app/Http/Requests/Exam/StoreExamPackageRequest.php
- app/Http/Requests/Exam/StoreExamSessionRequest.php
- app/Http/Requests/Exam/StoreExamSubjectRequest.php
- app/Imports/Exam/ExamQuestionWorkbookReader.php
- app/Models/Candidate.php
- app/Models/Exam/ExamAttempt.php
- app/Models/Exam/ExamAttemptAnswer.php
- app/Models/Exam/ExamAuditLog.php
- app/Models/Exam/ExamImportBatch.php
- app/Models/Exam/ExamPackage.php
- app/Models/Exam/ExamQuestion.php
- app/Models/Exam/ExamSession.php
- app/Models/Exam/ExamSessionCandidate.php
- app/Models/Exam/ExamSubject.php
- app/Models/User.php
- app/Services/Exam/ExamAttemptService.php
- app/Services/Exam/ExamAuditLogger.php
- app/Services/Exam/ExamQuestionImportService.php
- app/Services/Exam/ExamScoringService.php
- app/Support/SentinelStoragePaths.php
- composer.json
- composer.lock
- database/migrations/2026_06_29_000001_create_exam_subjects_table.php
- database/migrations/2026_06_29_000002_create_exam_packages_table.php
- database/migrations/2026_06_29_000003_create_exam_import_batches_table.php
- database/migrations/2026_06_29_000004_create_exam_questions_table.php
- database/migrations/2026_06_29_000005_create_exam_sessions_table.php
- database/migrations/2026_06_29_000006_create_exam_session_candidates_table.php
- database/migrations/2026_06_29_000007_create_exam_attempts_table.php
- database/migrations/2026_06_29_000008_create_exam_attempt_answers_table.php
- database/migrations/2026_06_29_000009_create_exam_audit_logs_table.php
- resources/js/Components/Dashboard/Admin/Exam/ExamAdminUi.tsx
- resources/js/Components/Dashboard/Candidate/Exam/ExamCandidateUi.tsx
- resources/js/Pages/Dashboard/Admin/Exam/Index.tsx
- resources/js/Pages/Dashboard/Admin/Exam/ImportBatchShow.tsx
- resources/js/Pages/Dashboard/Admin/Exam/PackageShow.tsx
- resources/js/Pages/Dashboard/Admin/Exam/Packages.tsx
- resources/js/Pages/Dashboard/Admin/Exam/ResultShow.tsx
- resources/js/Pages/Dashboard/Admin/Exam/Results.tsx
- resources/js/Pages/Dashboard/Admin/Exam/SessionShow.tsx
- resources/js/Pages/Dashboard/Admin/Exam/Sessions.tsx
- resources/js/Pages/Dashboard/Admin/Exam/Subjects.tsx
- resources/js/Pages/Dashboard/Candidate/Exam/AttemptShow.tsx
- resources/js/Pages/Dashboard/Candidate/Exam/Index.tsx
- resources/js/Pages/Dashboard/Candidate/Exam/SessionShow.tsx
- resources/js/Pages/Dashboard/Staff/Exam/ResultShow.tsx
- resources/js/Pages/Dashboard/Staff/Exam/Results.tsx
- resources/js/config/navigation.ts
- routes/web.php
- docs-ai/state/selection-current-phase.md
- docs-ai/state/selection-progress.md
- docs-ai/state/selection-decisions.md
- docs-ai/state/selection-known-bugs.md
- docs-ai/state/selection-next-actions.md
- docs-ai/audit/selection-exam-audit.md
- docs-ai/features/online-selection-exam.md
- tests/Feature/OnlineSelectionExamSecurityTest.php
- public/templates/exam-question-template.xlsx

## Commands Run

- Phase 2 commands listed in the previous checkpoint remain valid, including dependency install/remove/update, PHP syntax, route, build, migration, audit, and feature tests.
- Phase 3 commands:
  - `sed -n ...` on candidate placeholder controllers, attempt service, exam attempt/question/answer models, candidate dashboard pages/components, actions, and exceptions.
  - `php -l app/Http/Controllers/Dashboard/Candidate/Exam/ExamController.php`
  - `php -l app/Http/Controllers/Dashboard/Candidate/Exam/AttemptController.php`
  - `php artisan route:list --path=dashboard/seleksi`
  - `npm run build`
  - `rg -n "correct_answer|explanation|is_correct|point_awarded" app/Http/Controllers/Dashboard/Candidate resources/js/Pages/Dashboard/Candidate/Exam resources/js/Components/Dashboard/Candidate/Exam -S`
  - `php artisan route:list --path=dashboard`
  - `php artisan migrate --pretend`
  - `php artisan test --testsuite=Feature`
  - `composer audit`
  - `git status --short`
- Phase 4 commands:
  - `sed -n ...` on staff result placeholder, staff pages, admin result controller, and navigation.
  - `php -l app/Http/Controllers/Dashboard/Admin/Exam/ResultController.php`
  - `php -l app/Http/Controllers/Dashboard/Staff/Exam/ResultController.php`
  - `php artisan route:list --path=dashboard/staff/exams`
  - `php artisan route:list --path=dashboard/admin/exams/results`
  - `npm run build`
  - `rg -n "correct_answer|explanation|is_correct|point_awarded" app/Http/Controllers/Dashboard/Candidate resources/js/Pages/Dashboard/Candidate/Exam resources/js/Components/Dashboard/Candidate/Exam -S`
  - `php artisan route:list --path=dashboard`
  - `php artisan migrate --pretend`
  - `php artisan test --testsuite=Feature`
  - `composer audit`
  - `git status --short`
- Phase 5 commands:
  - `sed -n ...` on directive, state files, audit file, feature documentation, and focused security test.
  - `git branch --show-current`
  - `php artisan test tests/Feature/OnlineSelectionExamSecurityTest.php`
  - `composer audit`
  - `npm run build`
  - `php artisan test --testsuite=Feature`
  - `php artisan route:list --path=dashboard`
  - `php artisan migrate --pretend`
  - `rg -n "correct_answer|explanation|is_correct|point_awarded" app/Http/Controllers/Dashboard/Candidate resources/js/Pages/Dashboard/Candidate/Exam resources/js/Components/Dashboard/Candidate/Exam -S`
  - `find app/Actions/Exam app/Exceptions/Exam app/Http/Controllers/Dashboard/Admin/Exam app/Http/Controllers/Dashboard/Candidate/Exam app/Http/Controllers/Dashboard/Staff/Exam app/Http/Requests/Exam app/Imports/Exam app/Models/Exam app/Services/Exam -name '*.php' -print0 | xargs -0 -n1 php -l`
  - `php -l app/Models/Candidate.php && php -l app/Models/User.php && php -l app/Support/SentinelStoragePaths.php && php -l routes/web.php`
  - `wc -l docs-ai/task/selection-online-exam.directive.md`
  - `git status --short`
  - `git diff --stat`
- UX polish checkpoint commands:
  - `sed -n ...` on admin/candidate/staff exam pages and exam UI components.
  - `rg -n "class Writer|WriterEntityFactory|OpenSpout..." vendor/openspout -S`
  - `mkdir -p public/templates && php -r ...` to generate `public/templates/exam-question-template.xlsx`
  - `php -r ... ExamQuestionWorkbookReader ...` to confirm template headings/example row
  - `npm run build`
  - `php artisan test tests/Feature/OnlineSelectionExamSecurityTest.php`
  - `rg -n "correct_answer|explanation|is_correct|point_awarded" app/Http/Controllers/Dashboard/Candidate resources/js/Pages/Dashboard/Candidate/Exam resources/js/Components/Dashboard/Candidate/Exam -S`
  - `git status --short`
  - `git diff --stat`

## Verification Notes

- Current branch remained `feat/online-selection-exam`.
- Phase 2 PHP syntax checks passed.
- Phase 3 candidate controller syntax checks passed.
- `php artisan route:list --path=dashboard/seleksi` passed and shows 7 candidate exam routes.
- Full `php artisan route:list --path=dashboard` passed and shows 124 dashboard routes.
- `npm run build` passed after admin and candidate pages.
- `php artisan migrate --pretend` generated valid SQL for the 9 exam migrations.
- `composer audit` reports no advisories.
- `php artisan test --testsuite=Feature` passed: 11 tests, 48 assertions.
- Candidate answer-key leakage grep returned no matches.
- Phase 4 staff/admin result controller syntax checks passed.
- Staff/admin exam result route lists passed.
- `npm run build` passed after staff result pages and admin result filter changes.
- Phase 5 focused exam security test passed: 4 tests, 12 assertions.
- Final `composer audit` passed: no security vulnerability advisories found.
- Final `npm run build` passed.
- Final `php artisan test --testsuite=Feature` passed: 15 tests, 60 assertions.
- Final full dashboard route list passed and shows 124 dashboard routes.
- Final `php artisan migrate --pretend` passed and generated valid SQL for the 9 exam migrations.
- Final exam PHP syntax sweep passed.
- Final integration PHP syntax checks for modified models, storage path helper, and routes passed.
- Final candidate answer-key leakage grep returned no matches.
- UX polish build passed.
- UX polish focused exam security test passed: 4 tests, 12 assertions.
- UX polish template read check confirmed the expected import headings and one safe example row.
- UX polish candidate answer-key leakage grep returned no matches.

## Task 2 — Admin Workflow and Dynamic XLSX Template

- Added package-specific XLSX template download using master template `resources/templates/exam/template-import-soal-ujian-seleksi-spmb.final.xlsx`.
- Added admin download route `admin.exams.packages.template.download` at `/dashboard/admin/exams/packages/{package}/template`.
- Replaced static import-template emphasis with a package workflow: create package, download generated template, teacher fills configuration/questions, admin imports, admin reviews result.
- Updated import reader to target sheet `Data Soal`, ignore `Panduan`, read package metadata/configuration sections, and find the question header row even when it is not the first non-empty row.
- Added Indonesian header mapping:
  - `teks_soal`, `opsi_a`, `opsi_b`, `opsi_c`, `opsi_d`, `opsi_e`, `jawaban_benar`, `poin`, `tingkat_kesulitan`, `pembahasan`, `aktif`.
- Kept legacy English header compatibility for existing imports.
- Added teacher-filled configuration parsing:
  - `durasi_menit` -> `duration_minutes`
  - `ambang_lulus_persen` -> `passing_score`
  - `tampilkan_hasil` -> `show_result_to_candidate`
  - `izinkan_ujian_ulang` -> `max_attempts` of 2 when `ya`, otherwise 1
- Added a focused import feature test for Indonesian template headers and package configuration updates.
- Added contextual exam section navigation to admin exam pages without changing the global dashboard layout.
- Refined package/session/import/result admin copy and navigation for desktop-first workflow clarity.
