# Audit Handoff

## 2026-11-07 public-only exam scoring checkpoint

- Baseline committed as `91f83b9` on `feature/public-exam-rebuild` after 154 passed / 9 skipped (1250 assertions), frontend build and route/diff checks. Removed unsupported package/question delete and edit controls before checkpoint.
- Owner policy: four actual effective subject scores averaged; overall pass only >65; each subject passes only > its package threshold. A below-threshold subject is noted even when overall passes. At most two attempts total; repeat enabled per public package, hidden scores permit repeat regardless of first score, visible scores prevent repeat once score exceeds package threshold. Participant aggregate never shown; individual scores only when package flag enabled. Disabled repeats yield admin recommendation only, no approval workflow. No configuration copied from internal exam packages.
- Backend milestone tests after change: `php artisan test --compact` 160 passed / 9 skipped (1302 assertions); `vendor/bin/pint --dirty --format agent` and `git diff --check` passed. Frontend milestone and browser checks pending. New migration adds nullable package settings so old packages need explicit admin configuration before publish/use.

## Current position

Exam Engine audit is active on `feature/exam-panel-focus-layout`. The media trash/audit checkpoint is committed at `c815e59`. Public attempt resume security and automatic room-token rotation changes are verified and ready for a follow-up commit.

## Completed

- **Milestone 1:** Made `health.bpjs_card_path` explicitly optional across verification evaluators and checklist calculators.
- **Milestone 2:** Unlocked the Payment menu based on completion of mandatory document uploads rather than waiting for manual staff approval. Added UX hints to `Pembayaran` page.
- **Milestone 3:** Updated `exam()` gate logic to allow access if payment status is `paid`. Built Exam Readiness Checklist in frontend.
- **Testing:** 92/92 feature tests passed (738 assertions). All code formatted with Pint.
- **Commit:** Merged via `6bbc950` on `feature/candidate-lifecycle-gate-refactor`.

## In progress

- Continue audit of the public attempt UI and admin package/question-management behavior.
- `B-003` public resume takeover is resolved: resume requires the browser-held 40-character attempt token and rotates it after successful recovery.
- Public room tokens automatically rotate every 15 minutes via `exam:rotate-tokens`; manual rotate route/controller/UI were removed.
- `B-002` ZIP Bank Media support remains disabled and documented as a deferred TODO.

## Important decisions

See `DECISIONS.md`.

## Known blockers

None.

## Git state

- Current branch: `feature/demo-traffic-injector`.
- Current worktree: `/home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission`.
- Parent branch: `feature/candidate-lifecycle-gate-refactor` (`6bbc950`).

## Last verification

`121 passed, 942 assertions`; focused public exam/token tests `10 passed, 95 assertions`; `npx tsc --noEmit` passed; Vite production build passed in `13.32s`; Pint and `git diff --check` passed.

## Completed in this slice

1. Installed and configured Laravel Reverb WebSocket broadcaster on port 8085 (`.env` and `config/reverb.php`).
2. Added Reverb to `composer dev` concurrently script.
3. Created `App\Events\DashboardMetricsUpdated` with safe broadcast fallback.
4. Hooked `CandidateObserver`, `PaymentObserver`, and `UserObserver` to dispatch real-time events on create/update/delete.
5. Replaced aggressive timer polling (`usePoll(10000)`) in `Admin/Index.tsx` and `Staff/Index.tsx` with event-driven `echo.channel('dashboard.metrics')`.
6. Suppressed global progress bar and chart re-animations on background partial updates, preserving animations strictly for initial/manual page loads.
7. Enhanced Admin Dashboard with 5 KPI Stat Cards ([`AdminStatCards.tsx`](../../resources/js/Components/Dashboard/Admin/Index/AdminStatCards.tsx)) featuring SVG sparklines, trend up/down pills, ambient gradient hover glow, and micro-elevation.
8. Enhanced Staff Dashboard with operational queue cards, `StatsGrid` with pending transfer proofs and exam-ready metrics, and quick action buttons.
9. Built [`TrafficSimulatorService.php`](../../app/Services/Demo/TrafficSimulatorService.php) supporting full lifecycle progression (draft -> submitted -> verified -> paid -> exam_ready), target status capping (`--status=...`), preset weight distributions (`--preset=backlog|financial|balanced`), and sample fixtures storage.
10. Implemented [`SimulateTrafficCommand.php`](../../app/Console/Commands/SimulateTrafficCommand.php) (`php artisan demo:simulate-traffic`) with `stream`, `burst`, and `benchmark` modes.
11. Implemented [`WipeDemoDataCommand.php`](../../app/Console/Commands/WipeDemoDataCommand.php) (`php artisan demo:wipe`) to safely wipe all `@demo.spmb.com` records and purge candidate storage files.
12. Added automated feature tests in [`SimulateTrafficCommandTest.php`](../../tests/Feature/Console/SimulateTrafficCommandTest.php) covering all flags, modes, and wipe lifecycle.

## Next exact action

Commit the verified public resume/token-rotation fix, then continue from public attempt UI and package/question-management audit. Run Playwright/browser verification when the browser driver is available.

## Resume warning


Do not trust this file if its Git state differs from the repository. Reconcile and update first.

## Public exam rebuild backup checkpoint (2026-10-30)

- Working branch: `feature/public-exam-rebuild` at baseline `b4fb0c7`; do not bring commits from `feature/exam-panel-focus-layout`.
- Moved the three Desktop SQL files into ignored `database/backups/`, preserving their original SHA-256 digests. This directory must never be committed because dumps can contain personal data and secrets.
- Fresh full MariaDB dump: `database/backups/sentinel_admission_db_20261030_pre_public_rebuild.sql`, SHA-256 `b3b8e41dc35f653748b4f8555eabc7264bc405e0b496891b155e4d6f66cf500e`, 6,181,957 bytes, 44 `CREATE TABLE` statements, including six `exam_public_*` tables and a normal `Dump completed` footer. It has not been restore-tested.
- The older 2026-10-29 full dump has only 38 tables; `exam_bank_data.sql` contains subject/package/question data and `exam_packages.sql` only packages.
- **Do not reset yet:** the live DB reports migration `2026_10_29_000001_create_exam_public_tables` in batch 2, but that migration is absent from the active branch and `git log --all` for its path. Reconcile this schema/code mismatch and settle public scoring/remedial policy before destructive migration or feature work.
- `docker compose exec -T app php artisan db:show --database=mariadb` identified the expected host and database but exited nonzero because the app container lacks PHP `intl`; database table count was confirmed separately through read-only SQL.
- Reset authorized by owner and completed with `docker compose exec -T app php artisan migrate:fresh --seed --no-interaction` against `sentinel_admission_db` at `172.17.0.1:3306`. Command exited 0: 36 migrations and four seeders ran. Verified afterward: 38 base tables, 36 migration records, two seeded users, zero exam packages, and zero `exam_public_*` tables; `migrate:status` reports the latest migrations ran.
- Post-reset backup digest still matches the pre-reset checkpoint (`b3b8e41dc35f653748b4f8555eabc7264bc405e0b496891b155e4d6f66cf500e`). No SQL backup is tracked by Git. Do not restore full dump into the reset DB without a separate explicit decision, since it would undo the clean state.
- Next: obtain owner decision on the public-exam passing/remedial policy (boundary at exactly 65, subject floor at 50, which attempts replace original scores, and remedial eligibility) before implementing a new public schema and routes. Existing internal exam schema remains untouched.
- Owner settled public policy: pass only when the average of all four effective subject scores is **strictly greater than 65**; effective subject score is the maximum of primary and remedial; remedial is eligible only after all four subjects are completed, average is at most 65, and that subject scored below 50. No qualifying subject means no automatic remedial and remains not passed.
- Owner chose a completely separate public question bank (`exam_public_subjects`, `exam_public_packages`, `exam_public_questions`), alongside public session, token, participant, per-subject attempt, and answer tables. Internal tables remain intact.
- Public schema milestone: migration `2026_10_31_232459_create_exam_public_tables` creates nine independent public tables; migrated successfully on MariaDB after shortening one FK name (MariaDB's 64-character identifier limit). Public schema tests: 2 passed, 14 assertions; focused old-public exam regression: 3 passed, 58 assertions; exam security/import tests: 13 passed, 83 assertions; Pint passed. No public routes, UI, scoring, or exports have been switched to these new tables yet. SQLite tests are in-memory; MariaDB migration was separately verified. A failed initial MariaDB migration left nine empty partial tables; their counts were verified as zero and only those tables were removed via this migration's `down()` before retry.
- Public scoring milestone: `PublicExamResultService` computes the result only after four primary mapel scores are present. A mapel contributes the higher of primary/remedial; pass requires an exact unrounded aggregate greater than 65; remedial is available only for primary score below 50 while the aggregate does not pass, including a slot already in progress in the remedial limit. Six focused result tests plus schema/legacy-public tests: 11 passed, 93 assertions; Pint passed. No participant flow calls this service yet; do not claim a working public exam until registration, attempt, answer, submit, menu, and report paths are wired and verified.
- Isolated public participant JSON flow milestone: `public-exam.*` routes now cover session token join, participant dashboard, package start in free/sequential order, frozen-question answering and submission, and remedial; `PublicExamResultService` is called after scoring. Guest secret is hashed in database and returned in an HttpOnly cookie; `bootstrap/app.php` excepts that cookie from framework encryption to match header-based recovery. Six feature tests cover four subjects, remedial, order locking and foreign-question rejection. Full suite `php artisan test --compact`: 135 passed, 1045 assertions; Pint and `php artisan route:list --path=public-exam --except-vendor` passed. No public UI or admin management is wired to this flow yet; legacy `/exam` and internal candidate routes remain unchanged. Do not present this as production-ready until identity uniqueness, real-browser behavior, admin management and exports are completed and verified.
- Follow-up expiry guard: after a timed-out attempt, saving answers is denied and starting another mapel requires explicit submission of the timed-out attempt (which is marked `auto_submitted`). Seven public flow tests: 7 passed, 72 assertions; Pint passed. Randomizing options is not implemented for the new flow; do not claim this package setting works on the new path.
- Owner chose admin/school-issued unique participant codes; identical names must be supported without creating duplicate result identities. `PublicParticipantController::store` (admin-only) pre-registers a child with a random 16-character code and optional address. New migration makes `started_at` and hashed `session_secret` nullable until the code is first claimed. Public `join` now requires the pre-registered code; the row is locked and claimed once, and room-token use increments only on successful claim. Verified 139 tests / 1061 assertions, Pint pass, MariaDB migration ran (batch 3) and participant schema inspected: nullable columns as expected. No admin page yet presents the code, no recovery/reset flow exists, and old public route remains live; do not promise operational readiness.
- Admin-only participant list and CSV export added for a selected public session: code, child name, school, address, three scores per configured mapel (primary, remedial, effective), stored average and outcome. Paginated roster; CSV streamed in 100-row chunks and user-provided text/headers escaped against spreadsheet formula injection. Focused export and authorization tests added. Full suite 141 passed / 1071 assertions, Pint passed. CSV is spreadsheet-compatible, not an XLSX workbook; no new admin navigation yet. Incomplete scores remain blank; no email required.
- **B-004 contained with owner approval:** legacy `exam.public.*` and legacy admin public-session routes return HTTP 410, admin old menu entry and scheduled token rotation removed. Internal session store/update force `is_public = false`, and internal legacy token issuance routes are disabled. Kept named legacy routes for old links, but they no longer execute controller actions (unresolved implicit model IDs may 404 first). New `public-exam.*` and admin new participant/CSV endpoints remain available. Old-behavior tests preserved and skipped; dedicated retirement regression tests added. Full Pest suite: 135 passed, 9 skipped, 996 assertions; `npx tsc --noEmit`, Pint and diff check passed. `app/Services/Exam/ExamAttemptService.php` still contains dormant insecure auto-resume logic: never re-enable old routes without a fix. New public admin session/bank UI and participant UI remain unfinished; not production ready.
- Public bank backend milestone: admin-only `admin.exams.public-bank.*` JSON routes create separate subjects/packages/questions; publish requires exactly 10 active questions and rejects post-publish question creation. Tests cover four mapel, malformed answers, authorization, internal table isolation: focused 2 passed/73 assertions; full 137 passed, 9 skipped/1069 assertions; Pint, TypeScript and `git diff --check` passed. Next: admin session/paket UI and participant UI; no public bank UI yet.
- **STOP — B-005 functional blocker:** new public-session backend (`PublicSessionV2Controller.php`, `PublicSessionV2Test.php`, eight routes in `routes/exam.php`) is uncommitted and its focused publish test fails after two bounded retries. Latest failure at test line 24: expected JSON status `published`, received null; earlier failure was guest session lookup returning 404. Root cause not verified. Last good commit `93f135c`. Do not start UI or commit this milestone until response/status and persisted session dates are examined, root cause fixed, focused/full tests passing. Existing public participant flow remains isolated; new bank backend previously verified.
- **2026-11-01 Public Exam Restructure & Submenu 1 (Bank Media) Milestone:**
  1. Submenu Ujian Internal: Seluruh sub menu pada menu "Seleksi / Ujian" ditutup di `navigation.ts`. Akses GET ke `/dashboard/admin/exams` dan seluruh sub menu internal (`/media`, `/subjects`, `/packages`, `/sessions`, `/results`, `/monitoring`) dialihkan ke `abort(404)`, sehingga memicu halaman custom `Errors/NotFound.tsx`.
  2. Menu "Ujian Publik": Disiapkan dengan 5 sub menu: 1. Bank Media (`/dashboard/admin/public-exams/media`), 2. Kategori (`/dashboard/admin/public-exams/categories`), 3. Paket (`/dashboard/admin/public-exams/packages`), 4. Sesi (`/dashboard/admin/public-exams/sessions`), 5. Hasil Ujian (`/dashboard/admin/public-exams/results`).
  3. Submenu 1 (Bank Media Ujian Publik) Selesai Dibangun:
     - Controller `PublicExamMediaController`: upload multi-file (JPG, PNG, GIF, SVG, WEBP maks 50MB, menolak zip/php), rename sinkron ke `exam_public_questions`, hapus media dan bersihkan tag di butir soal publik, API daftar paket & butir soal publik, serta fitur sisipkan `[GAMBAR: ...]` di awal/akhir soal.
     - Storage terisolasi di `exam-public/images/` pada disk `public` (tidak tercampur dengan `exam/images`).
     - Serving route `/exam-media/{filename}` mencari di `exam-public/images/` terlebih dahulu sebelum fallback ke internal.
     - Halaman Inertia `Dashboard/Admin/PublicExam/MediaManager` dengan layout Sentinel Exam Workspace (PageHeader, WorkflowRail, 4 Stat Cards, Drag & Drop upload box, Gallery Grid, Lightbox Modal, dan Modal Hubungkan ke Soal).
     - Tes komprehensif `PublicExamMediaTest.php`: 8 passed (47 assertions). Full suite: 148 passed, 9 skipped (1154 assertions). `npm run build` dan Pint lulus.

- **2026-11-01 Public Exam Submenu 2 (Kategori) milestone:** Public category CRUD now uses `exam_public_subjects` only; list query counts packages and active questions exclusively via `exam_public_*` tables. Unique public category code, edit/active toggle, delete guard while public packages exist, Inertia category page/table/modal added. Added tests to `PublicExamMediaTest.php`; combined category + media file: 12 passed (88 assertions). Pint passed. Frontend TypeScript/build timed out at the 30-second command limit (previous TypeScript check before this addition passed, not proof for current code). Next: resolve/observe build verification then user review; do not start package submenu until requested/reviewed.

- **2026-11-05 Admin public exam submenus 3–5 (uncommitted, branch `feature/public-exam-rebuild`, baseline `93f135c`):** routes `/dashboard/admin/public-exams/packages`, `/sessions`, `/results` now render independent Inertia pages and read only `exam_public_*` tables via `PublicExamPagesController`. Package page uses existing public-bank create/question/publish endpoints; session page uses existing public-v2 create/publish/close/token and participant register/list endpoints; results page paginates the public participant roster with existing public CSV export. Focused tests 2 passed / 55 assertions; full suite 154 passed, 9 skipped / 1250 assertions; final build passed in 9.65 seconds after last package-count refresh adjustment. No migrations or commits; `HUMAN VISUAL REVIEW REQUIRED`. The legacy combined `/dashboard/admin/exams/public-v2` page remains reachable but unlinked. Playwright navigation to localhost:8000 returned connection refused; authenticated UI behavior is not verified.

- **2026-11-01 B-005 resolution checkpoint (`feature/public-exam-rebuild`, uncommitted):** admin/public Inertia pages and routes now available; date input sent as ISO with explicit offset; expired attempts remain accessible for submission. Focused tests: 11 passed / 115 assertions; full `php artisan test --compact`: 140 passed, 9 skipped / 1107 assertions; `npm run build`, `vendor/bin/pint --dirty --format agent` and `git diff --check` passed. Browser interaction and visual approval remain unverified. Next: human end-to-end review and fix reported findings. No commit without approval.

## Parallel scoped email-design task

- Completed presentation-only Email Design System work on `feature/email-design-system`.
- Verification: full suite 76 tests/615 assertions, focused email, mail delivery, and domain tests 22/119 assertions, frontend build passed, Blade cache passed, PHP lint, Pint, and diff check passed.
- Audit report: `ai-docs/reports/email-design-system-audit.md`.
- Evidence: `ai-docs/reports/evidence/email-design-system/2026-07-28/`.
- Status: code `PASS WITH NOTES`; `HUMAN VISUAL REVIEW REQUIRED` in Gmail and Outlook.
- Changes are committed at `e9300bb`; do not conflate them with the blocked Task 01 public-content work.

## Parallel scoped sidebar collapsed menu task

- Completed Sidebar Collapsed Menu behavior fixes and localStorage state persistence on the current branch.
- Verification: full suite 76 tests/615 assertions passed, frontend production build compiled without errors.
- Audit report: `ai-docs/reports/sidebar-collapsed-menu-audit.md`.
- Evidence: `ai-docs/reports/evidence/sidebar-collapsed-menu/2026-07-30/`.
- Status: code `PASS WITH NOTES`; `HUMAN VISUAL REVIEW REQUIRED` for visual alignment and feel. Committed at `8b23544`.

## Resume warning

Do not trust this file if its Git state differs from the repository. Reconcile and update first.

