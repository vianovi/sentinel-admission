# Audit Handoff

## 2026-11-13 legacy public exam retirement — code verified, review pending

- Owner authorized removal of the former guest public-exam flow that shared `exam_*` tables with internal candidate exams. The current separate public exam implementation remains intact: `public-exam.*` participant routes and `exam_public_*` tables. Candidate flow remains `dashboard/seleksi/*` and its authenticated assignment model.
- Removed legacy `/exam/*` guest routes, retired middleware, guest controller/service path, shared-table token model/command, obsolete admin public-session controller/pages/components, and old public tests. Internal admin sessions no longer expose or generate public guest-token links.
- The current `PublicSessionV2Controller` API remains because the active public admin pages use it against `exam_public_*`; only its obsolete page endpoint and deleted duplicate React page were removed.
- Regression coverage now asserts legacy routes are unregistered while replacement public and candidate routes remain registered. Verification: focused legacy/public/candidate tests 42 passed / 441 assertions; candidate security, participant registration, and public admin-page tests 11 passed / 155 assertions; `npx tsc --noEmit`, Pint and `git diff --check` passed. `php artisan route:list --name=exam.public` has no matches.
- No schema, migration, live data, build, browser, commit, or deployment action occurred in this retirement task. Owner requested no recurring asset builds because Vite dev mode is running.

## 2026-11-13 package configuration UI polish — code verified, visual review pending

- Owner scoped the task to Admin → Ujian Publik → Paket Soal configuration and requested Hallmark + Google Stitch with both light/dark themes. Baseline remains `1bf2ff9` on `feature/public-exam-rebuild`; prior uncommitted backend/package controls are preserved.
- Stitch project `6664061836704842508` generated light/dark concepts. Implementation uses existing Sentinel fonts and amber/slate tokens, promotes configuration above import, separates publication/revert actions, and moves import history/session references below question review. Only the public package detail page is changed by this UI task.
- Added local unsaved-state feedback, action-specific pending labels, inline save errors, and form values derived from refreshed props when no draft exists. Settings remain wired to existing guarded endpoints. No schema, dependency, live-data, commit or deployment changes.
- Verification: focused `PublicExamAdminPagesTest.php` + `PublicBankManagementTest.php`: 16 passed / 295 assertions / 1 skipped (2.33s). `npx tsc --noEmit`, editor diagnostics, `npx vite build` (12.83s), and diff check passed. Node/esbuild/React SSR with mocked Inertia navigation, layout and toast boundaries: four initial fixture states (configured draft, incomplete/empty draft, published, zero threshold), 15 assertions passed. Palette calculation: 12 primary/helper/button/warning/error/success pairs pass WCAG 4.5:1, lowest 5.72:1. Final active-state styling rebuild passed (13.14s); final diff check passed.
- Verification harness issues resolved without application changes: omitted CSS loader for KaTeX, then missing CommonJS filename; contrast script corrected to expand shorthand white. These were tooling errors, not application regressions. No browser or event interaction coverage is claimed by SSR.
- Context7 React 18 and Tailwind v3 documentation used; Graphify graph returned older/internal package nodes, so current public page/imports and dirty controller diff were read directly. Boost search-docs is unavailable in this session.
- Preserve the owner’s previous request to avoid Playwright due to token cost; live browser interaction, mobile widths 320/375/414/768 and human visual approval remain UNVERIFIED / HUMAN VISUAL REVIEW REQUIRED. No production readiness sign-off.

## 2026-11-13 package management controls checkpoint

- Owner requested package editing controls and explicitly asked not to use Playwright due to token cost.
- Added guarded package settings editing, package revert-to-draft, question activate/deactivate, soft-delete question, and existing package deletion controls to the public package detail page. Reverting a package resets related sessions to draft and revokes their tokens; all mutations reject packages/sessions with participant attempts.
- Dynamic 1–5 package support remains active: publish/join require every assigned package to be configured and ready; result completion and average use the assigned package count.
- Verification: full suite 193 passed / 1740 assertions with 9 legacy skips; focused package/admin tests 17 passed / 302 assertions; isolated MariaDB dynamic tests 43 passed / 450 assertions; Pint, TypeScript, build (9.75s), and diff check passed. Playwright intentionally not used.

## 2026-11-13 dynamic public session package count — in progress

- Owner authorized production-oriented support for 1–5 packages per session (D-012). No deployment or commit authorized.
- Baseline retains all previous dirty force-close/token changes at HEAD `1bf2ff9`.
- New regression first reproduced the fixed-four restriction: 8 failed / 2 passed for counts 1–5 in free/sequential order. After implementation, focused public flow/session/result tests passed: 35 tests / 413 assertions. Further boundary tests and browser verification are in progress.
- No schema or dependency changes. Existing per-package remedial policy is preserved.

## 2026-11-12 force-close implementation checkpoint

- Resumed from clean commit `1bf2ff9` on `feature/public-exam-rebuild`; the configuration hardening previously described as uncommitted was already committed after the prior handoff.
- Owner clarified D-010: closing a public session must auto-submit active attempts and score their saved answers. Completed attempts/results remain unchanged.
- Uncommitted implementation introduces one shared submission/scoring service used by participant submit and admin force-close. Close is transactional and idempotent, locks the session and active attempts in deterministic order, and start now locks the session before the participant so a concurrent close cannot admit a new attempt after closure.
- Owner also settled D-011: issuing a new room token revokes all older tokens for that session. Issuance now validates and locks the published session, deletes predecessors and inserts the replacement atomically. The admin Sessions UI warns about revocation before issuance and reports the revoked-token count.
- Regression covers saved-answer scoring, `auto_submitted`, preservation of a prior submitted attempt, repeat close, and rejection of answer/submit/start/token access after close.
- Verification: focused `PublicSessionV2Test.php` + `PublicExamFlowTest.php` 16 passed / 186 assertions; full suite 173 passed / 1499 assertions with 9 existing legacy skips; Pint, TypeScript, production build (10.70s) and `git diff --check` passed. No schema, dependency, production/demo data or Hasil Ujian changes.
- Browser check was attempted but `127.0.0.1:8000` had no running server. Remaining: verify real row-lock races on an isolated MariaDB fixture and browser-check force-close plus token-rotation feedback on an isolated UI fixture. Do not commit without owner instruction.

## 2026-11-12 FINAL HANDOFF — owner paused the chat

This is the latest checkpoint and supersedes older statements that both policy questions are unanswered.

### Owner decision and scope

- **Closing a public session must forcibly stop ongoing attempts.** Recorded as D-010 in [DECISIONS.md](DECISIONS.md). This is decided but NOT implemented; current runtime still has the old close behavior.
- A similar module/action under **Hasil Ujian** was mentioned as a possible future task. No implementation, schema, UI, individual/bulk scope, or detailed policy has been agreed for it.
- Room-token policy is still unanswered: keep old tokens valid until expiry, or revoke old tokens when creating a new one. Do not infer an answer from the force-close decision.
- Owner explicitly ended this chat and requested documentation/state only. No further coding, test suite runs, commit, or push in this closing turn.

### Preserved work and verified baseline

- Branch: `feature/public-exam-rebuild`; HEAD `571f91c` (audit documentation), preceding implementation commit `4c7b659`. Neither was pushed by this session.
- Uncommitted application changes: `PublicSessionV2Controller.php`, `PublicExamPagesController.php`, public `Sessions.tsx`, `routes/exam.php`, and `PublicSessionV2Test.php`. Preserve them; do not reset or recreate them.
- Implemented: guarded atomic draft edit, publication readiness checks, explicit-offset timestamps/timezone guidance, roster pagination, and clipboard error feedback.
- Last checks: 172 passed / 1480 assertions / 9 existing legacy skips; focused 8 passed / 189 assertions; Pint and diff check passed; TypeScript/build passed (22.81s). Isolated browser verified participant 51 on roster page 2 and draft form prefill. No tests rerun for this documentation-only checkpoint.
- Documentation changes are also uncommitted, including this handoff, current state, readiness report and D-010. No live/demo data or schema changes. Temporary browser server was stopped; `/tmp/sentinel-public-parity-pA7MN0/` is synthetic disposable fixture data only and may not survive a restart.

### Remaining work, in resume order

1. Reconcile Git/state and preserve the uncommitted configuration fixes. Obtain human review of these latest UI changes; previous acceptance covered the earlier milestone only.
2. Implement public force-close after tracing existing scoring/finalization. Retain saved answers and finished results; test rejection of further answers/start/join, finalization behavior, repeated close and concurrent close/answer/submit. Do not invent policy for unstarted subjects or overall result completion.
3. Ask the outstanding token-policy question, then implement the selected issuance/revocation behavior and accurate token status feedback.
4. Finish browser coverage: full draft save with four categories, free/sequential participant flow, force-close, results/export, cross-timezone display and denied clipboard permission.
5. Verify integrity/concurrency on an isolated MariaDB fixture; SQLite success is not proof of row-lock behavior. Re-run affected regression/build after new changes.
6. Scope the proposed Hasil Ujian module with the owner in a later task; it is deferred, not partially implemented.
7. Update readiness report/state and commit only when instructed. Production readiness remains NOT signed off.

## 2026-11-12 session configuration fixes; policy questions pending

- Owner authorized applying agreed audit corrections and stopping to ask about policy gaps. Two questions were sent: whether closing allows active attempts to finish or finalizes them, and whether new room tokens revoke predecessors. No answers received at this checkpoint; neither behavior changed.
- Implemented full draft editor (title, schedule, description, participant instructions, ordering, four packages) via new PUT session endpoint. Existing package-update guards and revocation run in the same outer transaction as configuration updates. Started participants/attempts and non-draft sessions cannot be edited.
- Publish requires active categories and active non-deleted questions as well as configured published packages. Existing publication fixtures were corrected to contain real questions; new regression covers failed atomic update, successful configuration/reordering, timezone props, missing questions, inactive categories, participant-entry guard and staff authorization.
- Session page timestamps now include explicit offsets, display the configured exam timezone, and explain browser-local datetime input. Roster consumes total/current/last-page metadata with navigation and retry. Clipboard toast waits for success and handles rejection.
- Verification: full suite 172 passed / 1480 assertions, 9 existing legacy skips (8.05s); focused 8 passed / 189 assertions; Pint, TypeScript/build (22.81s), diff check passed. Initial focused failures were expected old fixtures without active questions and resolved by realistic fixtures, not weakening production checks.
- Isolated SQLite fixture only: Playwright verified page 2 contains participant 51, counts show 1 of 51, and draft edit shows prefilled dates with Asia/Jakarta guidance. Full browser save/four-subject lifecycle, denied-clipboard and cross-timezone-browser scenarios not yet verified. Production/demo data and schema unchanged. Changes uncommitted; current UI changes require owner review.

## 2026-11-12 session configuration readiness audit

- Committed all reviewed implementation/state changes as `4c7b659` (`feat(exam): align public package and session detail workflows`) after owner acceptance and explicit commit instruction. No push requested or performed.
- Continued with read-only audit of session configuration, assignments, publication, tokens, roster, join/start/answer/submit, and close. Report: [Public session configuration readiness](../reports/public-session-configuration-readiness.md).
- Findings: missing full draft edit, publish/start readiness mismatch, ambiguous close semantics for active attempts, incomplete token lifecycle UI, missing roster pagination, timezone-less session timestamps, unverified MariaDB concurrency, and optimistic clipboard feedback. Source observations are separated from runtime evidence; no new security exploit or race was claimed.
- Full suite 171 passed / 1453 assertions, 9 pre-existing legacy skips (7.03s); eight public-v2 routes listed; diff check passed. No application code changed during audit. Existing UI acceptance does not cover production readiness or future session changes.
- Next: follow the ordered remediation plan; clarify close/token semantics before altering business behavior. Keep production/demo data and internal retired paths untouched.

## 2026-11-12 owner acceptance and commit authorization

- Owner reviewed the current changes, reported them acceptable, and explicitly authorized committing all repository changes with updated documentation.
- Pre-commit full regression: `php artisan test --compact` passed, 171 tests / 1453 assertions, 9 skipped (7.03s); SQLite in-memory configuration verified. `git diff --check` passed. Latest frontend build remains the verified 10.23s build from the preceding checkpoint.
- Next authorized task: audit and map public session configuration relationships and production readiness before implementing further session changes. No production data or schema changes authorized by this checkpoint.

## 2026-11-12 public package and session detail parity

- Continued existing dirty work on `feature/public-exam-rebuild`, baseline `428b3ccb25e436450b3517c8a2270d6b99092f30`; no commits, production/demo writes, schema changes, or dependencies.
- Added public package detail route/page; create redirects there and Kelola Soal replaces the old import modal. Detail includes configuration, XLSX workflow, all answer options/key/active flags, publication, and related sessions. Public imports remain atomic and cannot overwrite existing questions.
- Persisted successful imports and validation failures in existing `SystemActivityLog`, scoped by public module/type/package ID. Successful report and question writes share a transaction. Package page displays expandable history; historical imports cannot be backfilled. No internal bank/import records are used. No batch-level delete or partial-row success semantics added.
- Session detail route reuses the existing session component in scoped detail mode, exposing inline participant management and package links. Custom dropdowns can select four distinct subjects beyond the first four categories; only four distinct available subjects enable creation. Internal retired routes remain retired.
- Verification: focused public admin/bank/session tests 19 passed, 326 assertions; Pint passed; build including TypeScript passed (7.96s), with final build after two small display/history-refresh changes pending. Diff check passed before final checkpoint.
- Playwright MCP now works. Isolated SQLite `/tmp/sentinel-public-parity-pA7MN0/database.sqlite`, temporary HTTP server port 18767. Browser verified package create redirect, empty state/disabled import, successful XLSX import with full answer options, publish (also confirmed in fixture DB), wrong-package import rejected with no questions, persistent rejected report after reload, inline roster without dialog on session detail, desktop/mobile 390px layout and dark mode. No uncaught page errors observed; expected 422 console entry on rejected import. Server must be stopped at end. Synthetic workbook in ignored `.playwright-mcp/` only.
- HUMAN VISUAL REVIEW REQUIRED; full four-subject session/participant end-to-end browser scenario and full regression suite were not run in this checkpoint.
- Final verification: build including TypeScript passed (10.23s) after history refresh/display adjustments; `git diff --check` passed. Temporary server processes stopped; fixture retained outside the repository. No live/demo data was changed.

## 2026-11-12 public Packages layout checkpoint

- Branch `feature/public-exam-rebuild` at baseline `428b3ccb25e436450b3517c8a2270d6b99092f30`. Continued the existing uncommitted `Packages.tsx` work without resetting it. Public Packages now follows the internal page hierarchy: header, six-step workflow rail, one full-width filtered list, compact package metadata and actions. No route, backend, schema, dependency, or live database changes.
- Verification after layout edit: `npx tsc --noEmit` exited 0; `php artisan test --compact tests/Feature/PublicExamAdminPagesTest.php` passed (3 tests, 80 assertions); `npm run build` exited 0 (Vite 12.06s); `git diff --check` exited 0. This is code/build verification, not visual approval. The previous full-suite and isolated-SQLite browser results predate this edit.
- MCP: Graphify query and Context7 Tailwind v3 docs returned successfully. Playwright MCP `browser_tabs` failed to initialize headless Firefox after its 180-second timeout; current-layout desktop/mobile, theme, and interactions remain UNVERIFIED. Codex Playwright configuration was then aligned with Cline's installed Chromium executable; the running MCP server did not reload within a bounded recheck, so a session restart/reload is still needed. Stitch was not used because no new screen concept or theme was generated. Laravel Boost is not exposed in this session.
- Next: restore Playwright MCP, inspect the current layout on isolated fixture at mobile/desktop and light/dark themes, get HUMAN VISUAL REVIEW REQUIRED approval from owner, then continue four-subject/session/participant flow. Do not commit without explicit owner instruction or mutate demo data.

## 2026-11-12 public XLSX template checkpoint

- Added the public package template download route and a Template XLSX action to the public Packages list. The endpoint reuses ExamPackageTemplateService and the existing master workbook, injecting the public package subject, title, code, and status; no public schema or import contract changed.
- Verification: focused public bank/admin tests 15 passed, 210 assertions; Pint passed; TypeScript passed; npm run build passed in 9.76s; route list and git diff check passed. Current browser visual verification remains UNVERIFIED because Playwright MCP initialization is unavailable.
- Follow-up: public download filename changed from `template-soal-...xlsx` to `paket-soal-{code}-{title}.xlsx`; internal exam filename remains unchanged. Focused filename regression passed (1 test, 3 assertions), Pint and diff check passed.

## 2026-11-10 package UI review checkpoint

- Branch `feature/public-exam-rebuild`, baseline `428b3cc`; only `resources/js/Pages/Dashboard/Admin/PublicExam/Packages.tsx` has an uncommitted code change. TypeScript (`npx tsc --noEmit`), frontend build (`npm run build`, 9.00s), `git diff --check`, focused public admin/bank tests (14 passed, 207 assertions), and full suite (170 passed, 9 skipped, 1372 assertions) passed.
- Authenticated Playwright against isolated temporary SQLite on port 18766 verified creating a subject and draft package, status/search/subject/sort filters, light/dark theme, import dialog and disabled upload without file, and no horizontal overflow at 390px in both themes. This is functional smoke, not visual approval. Console reports refused connections to the absent local Reverb WebSocket on port 8085; no page-specific exception observed. No real XLSX import or production/demo data mutation. HUMAN VISUAL REVIEW REQUIRED.
- Browser XLSX completion on the same isolated SQLite fixture: the owner workbook was uploaded and rejected with HTTP 422 plus the expected category-mismatch response; question count remained zero. A fresh, test-format-compatible temporary XLSX was then uploaded successfully (HTTP 200: `imported: 2`, `active: 1`), and fixture persistence confirmed duration 30, passing score 55, retry/result flags false, and two questions/one active. The temporary compatible workbook was created outside the repository; neither it nor the owner workbook was modified.
- Final regression after this checkpoint: `php artisan test --compact` passed (170 passed, 9 skipped, 1372 assertions; 9.41s), `npm run build` passed (8.81s), `npx tsc --noEmit` and `git diff --check` passed. Working tree remains intentionally uncommitted: `Packages.tsx`, this handoff, and `CURRENT.md`. HUMAN VISUAL REVIEW REQUIRED; do not claim full production readiness.

## Autonomous readiness work — approved scope

- Browser progress: isolated SQLite `/tmp/sentinel-exam-browser/database.sqlite`, server port 18765, fixture admin `sentinel-browser-admin@example.test` (credentials are ephemeral; do not copy to repository). Playwright logged in via `/staff/login`, visited public Categories, Packages, Sessions, Results; created MTK mapel and `TA01-MTK` draft package in fixture only; confirmed import modal and no console errors. No demo MariaDB changes. Actual XLSX upload/full exam scenario still UNVERIFIED.
- After `62b3db5`, found joined-but-not-yet-attempted participant could lose access if package deleted; guarded both delete and draft package replacement when any participant `started_at` exists. Focused bank/session tests 15 passed (165 assertions) before final full verification. Current modifications uncommitted; commit only after regression. Full release readiness must not be claimed.

- Return-point baseline is `781822c43ac579bab0535a63718514b9e7d711ee` on `feature/public-exam-rebuild` (166 passed, 9 skipped, 1350 assertions; build passed). This commit preserves pre-autonomous XLSX import changes. A Git return point does not undo database migrations; no migration or demo data mutation is authorized in this task.
- Owner permits permanent public package deletion before any attempt, including assignments to published sessions: affected sessions return draft, room tokens must be revoked, roster and participant codes retained. Admin must select four distinct-subject published packages again and publish, then issue a new room token. If any attempt exists in a related session, block destructive operation to protect its history.
- Implemented package-delete endpoint/UI and draft session package-replacement endpoint/UI; fixed nested response assumptions for room token and participant code. Verification: full SQLite suite 169 passed, 9 skipped (1368 assertions), focused bank/session/flow tests 24 passed (263 assertions), TypeScript, Pint, build (10.89s), diff checks passed. No live data deleted/imported. Authenticated Playwright, concurrency stress and complete UI redesign remain pending; do not label full readiness complete.

## Public XLSX flow in progress (uncommitted)

- 2026-11-08 menu discoverability follow-up: changed admin public submenu labels to `Paket Soal` and `Sesi Ujian`; added visible explanation above list and renamed per-package action to `Import XLSX & Review Soal`. Frontend build passed (11.26s), focused public bank/admin tests 11 passed (194 assertions), diff check passed. Container volume sees updated source and build manifest, `public/hot` absent. Playwright against local port 8080 returned `ERR_SSL_PROTOCOL_ERROR`; do not claim authenticated UI visual verification. Existing workbook category remains incompatible with MTK until owner edits XLSX.

- Workbook inspected read-only: `/home/silinux/Desktop/Paket Ujian PSB/Soal/MTK/Soal-ta01-mtk-mtk-paket-1.xlsx`; 11 active rows, category `Tes Akademik (Tulis)`, title `MTK-PAKET 1`, code `TA01-MTK`, duration 30, threshold 55, result/retry disabled. Import for public packages now reads XLSX settings, refuses mismatched mapel/title/code and invalid rows without writes, no fixed 10-question publish rule. Do not copy backup or edit workbook automatically.
- Verification: `php artisan test --compact` 166 passed / 9 skipped (1350 assertions); focused public tests 23 passed (231 assertions); `npm run build`, Pint and `git diff --check` passed. Admin authenticated browser and actual XLSX acceptance after user edits category remain UNVERIFIED. No live DB import performed. Working tree has uncommitted changes; review before any commit.

## 2026-11-07 public-only exam scoring checkpoint

- Resume reconciliation: frontend milestone committed as `313e1b0`. User approved migration on MariaDB `sentinel_admission_db`; `2026_11_07_101904_add_scoring_options_to_exam_public_packages_table` completed, status `[4] Ran`, three nullable columns confirmed via `db:table`. Existing package rows retain NULL settings and require admin configuration before publish/use. No rollback. Browser authenticated admin remains UNVERIFIED (route redirects to login). Recheck menus after migration, keep HUMAN VISUAL REVIEW REQUIRED.
- Backend commit `2f9f158`; frontend suite 162 passed / 9 skipped (1316 assertions), Pint and npm run build passed. Playwright public landing rendered on temporary HTTP-local server with zero console errors; admin result route redirected to login, so authenticated UI flow is UNVERIFIED. Temporary server stopped. Frontend milestone is not committed yet at this checkpoint.

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

