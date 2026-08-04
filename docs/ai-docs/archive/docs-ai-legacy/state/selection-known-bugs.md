# Selection Online Exam — Known Bugs

## Known Bugs

- Unrelated existing issue observed: `resources/js/Layouts/DashboardLayout.tsx` default function is named `DashboardSplitLayout`. Default imports still work, and this does not block the exam feature, so it is documented but not fixed due to scope firewall.
- No known critical or high-risk exam-engine bugs remain after the final Phase 5 audit.
- No critical or high-risk issue was found during the UX polish checkpoint.
- No schema blocker was found during Task 2. Existing package fields support the teacher-filled XLSX configuration.
- Task 3 resolved the live XLSX template download crash `Class "ZipArchive" not found` by making `ext-zip` explicit in Composer/Docker and adding safe controller handling.
- Runtime zip support checkpoint resolved the confirmed app-container check `class_exists(ZipArchive::class) === false` by rebuilding/recreating the Docker app container from the PHP image that installs `libzip-dev` and `docker-php-ext-install zip`.
- No known critical or high-risk exam-engine bugs remain after Task 3 verification.
- Task 4 resolved the rejected admin exam UI structure by removing the inner exam workspace sidebar and keeping the main admin sidebar as the only global navigation for `Ujian Seleksi`.
- No known critical or high-risk admin exam UI issue remains after Task 4 static/build/test audit.
- Task 5 resolved the critical candidate lifecycle risk where status rules were scattered across observers, document/payment review flows, webhook handling, and dashboard helpers. No known critical or high-risk lifecycle/gate issue remains after the focused Task 5 test pass.
- Task 6 completed the dashboard shell/navigation V2 without changing backend routes or business logic. No known critical/high dashboard shell issue remains after static audit, TypeScript no-emit, production build, dashboard route list, and diff checks.
- Status Pendaftaran Center is implemented without schema changes or lifecycle semantic changes. No known critical/high issue remains after focused feature tests and production frontend build.
- Candidate Panel Gold activated the remaining candidate sidebar pages without schema changes, lifecycle semantic changes, payment processing changes, document logic changes, or exam engine changes. No known critical/high issue remains after focused candidate panel route/privacy tests and production frontend build.
- Dashboard Polish, Settings, and Exam Monitoring completed on 2026-07-05. No known critical/high issue remains after TypeScript no-emit, PHP lint, dashboard route list, production frontend build, full feature test suite, diff whitespace check, and cache clear.

## Build or Test Failures

- Phase 1 verification passed: PHP syntax, route list, migration pretend, frontend build, and feature tests.
- Phase 2 verification passed: PHP syntax, route list, migration pretend, frontend build, Composer audit, and feature tests.
- Task 4 verification passed for `npm run build`, `php artisan route:list --path=dashboard/admin/exams`, `php artisan test tests/Feature/OnlineSelectionExamImportTest.php`, `php artisan test tests/Feature/OnlineSelectionExamSecurityTest.php`, and `git diff --check`.
- Task 6 verification passed for `npx tsc --noEmit`, `npm run build`, `php artisan route:list --path=dashboard`, and `git diff --check`.
- Status Pendaftaran verification passed for `php artisan test tests/Feature/StatusPendaftaranFeatureTest.php`, `php artisan test tests/Feature/CandidateStatusFlowTest.php`, `php artisan test tests/Feature/CandidateFeatureGateTest.php`, `npm run build`, `php artisan route:list --path=dashboard`, and `git diff --check`.
- Candidate Panel Gold verification passed for `php artisan test tests/Feature/CandidatePanelGoldFeatureTest.php`, `php artisan test tests/Feature/CandidateFeatureGateTest.php`, `php artisan test tests/Feature/CandidateStatusFlowTest.php`, `npm run build`, `php artisan route:list --path=dashboard`, and `git diff --check`.
- Dashboard Polish, Settings, and Exam Monitoring verification passed for `npx tsc --noEmit --pretty false`, PHP lint on touched backend files/routes, `php artisan route:list --path=dashboard`, `npm run build`, `php artisan test` (47 passed, 215 assertions), `git diff --check`, and `php artisan optimize:clear`.
- Runtime zip support verification passed inside Docker: `php -m | grep -i zip`, `php -r "var_dump(class_exists(ZipArchive::class));"`, `php artisan test tests/Feature/OnlineSelectionExamImportTest.php`, and `php artisan test tests/Feature/OnlineSelectionExamSecurityTest.php`.
- Dependency investigation failure intentionally handled:
  - `composer require maatwebsite/excel:^3.1.69 phpoffice/phpspreadsheet:^1.30.5 --with-all-dependencies` failed because patched PhpSpreadsheet 1.30.5 requires PHP `<8.5` while the local runtime is PHP 8.5.7.
  - Laravel Excel was removed and replaced with OpenSpout.
- Non-project failure from Phase 0: `composer show maatwebsite/excel phpoffice/phpspreadsheet` was run with invalid syntax and Composer treated the second package as a version constraint. Correct follow-up check used `composer show | rg 'excel|spreadsheet|zip|xml' || true`.

## Risks

- Large feature scope. Continue phase by phase.
- Candidate final acceptance should not be automated from exam results until the broader selection/status product flow is explicitly designed.
- Need careful route ordering because existing staff/admin candidate detail routes use `{candidate}/{section}` dynamic segments. Current exam routes are under `/exams` and route listing is valid.
- Staff sidebar exam entry is active after Phase 4.
- Candidate answer-key leakage grep passed after Phase 3, but final audit should repeat after any later candidate changes.
- Final Phase 5 candidate answer-key leakage grep passed after all candidate changes.
- Admin/staff result filters now include search, session, status, and pass/fail.
- Option randomization is configured at package level but not yet implemented in candidate option rendering. Question randomization is implemented through stable `question_order`; option randomization should be documented as a known limitation unless implemented later.
- XLSX generation/import requires PHP `ext-zip` / `ZipArchive` in every runtime. The project Docker image now installs it; non-Docker deployments must also provide it.

## Deferred Non-Critical Issues

- Do not fix unrelated layout function-name mismatch unless it later blocks TypeScript/build.
- Do not directly integrate pass/fail with accepted/rejected admission status in this mission unless a safe, explicit selection-status flow is added later.
- Implementing a background scheduler/command for untouched expired attempts is deferred. Current safe behavior auto-submits expired in-progress attempts on show/sync/save/submit touch.
- Import supports XLSX via OpenSpout only; legacy XLS support is intentionally not included.
- The old static public template remains as a legacy asset, but the admin workflow now uses the package-specific dynamic template.
- Dynamic Task 2 template reads `izinkan_ujian_ulang` into `max_attempts` using a simple 1-or-2 attempt mapping. More granular retake policy would require a future product/schema decision.
- Admin Exam V2 still uses existing backend package/session fields. A richer future teacher/retake policy would need a separate product/schema decision, not a Task 3 hotfix.
- Playwright browser screenshot audit for Task 4 was attempted but blocked because Chrome/Chromium is not installed in this environment and `npx playwright install chrome` requires interactive sudo. Static UI audit, route list, build, and focused tests passed.
- Playwright MCP browser audit for Task 6 was attempted after starting a local Laravel server on `127.0.0.1:8096`, but the MCP browser launch timed out twice while starting headless Firefox. Static UI audit, TypeScript no-emit, route list, build, and diff checks passed; manual browser review is still recommended.
- Candidate lifecycle Task 5 intentionally keeps `accepted` and `rejected` as final manual statuses. Automatic sync will not overwrite them, even if a document/payment is later changed.
- Health completion now follows the broader backend/model/dashboard requirement set: physical fields plus health-history responses. This is stricter than the old observer-only physical-field check and is documented in `docs-ai/features/candidate-status-flow.md`.
- Status Pendaftaran timeline is assembled from currently available records only. A true immutable audit timeline would require explicit future approval and likely a new table.
- `Daftar Ulang` remains unavailable/future in Status Pendaftaran because no real daftar ulang workflow exists.
- Candidate Panel Gold does not add live support/chat/ticketing. `Bantuan` is a contextual self-service help center that links to existing workflows.
- Candidate selection result visibility remains controlled by existing session/package `show_result_to_candidate` flags. Hidden results intentionally show waiting states.
- Exam monitoring is polling-based, not websocket-based. Query volume should be reviewed with realistic exam concurrency before high-scale production use.
- `RichExamText` handles common superscript/degree notation only. Full TeX-style math should use a proper math renderer if required later.
- Admin settings now exposes programs, extracurriculars, and payment configs, but dedicated per-setting audit-log views are not included yet.
