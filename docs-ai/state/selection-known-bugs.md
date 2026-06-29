# Selection Online Exam — Known Bugs

## Known Bugs

- Unrelated existing issue observed: `resources/js/Layouts/DashboardLayout.tsx` default function is named `DashboardSplitLayout`. Default imports still work, and this does not block the exam feature, so it is documented but not fixed due to scope firewall.
- No known critical or high-risk exam-engine bugs remain after the final Phase 5 audit.
- No critical or high-risk issue was found during the UX polish checkpoint.
- No schema blocker was found during Task 2. Existing package fields support the teacher-filled XLSX configuration.
- Task 3 resolved the live XLSX template download crash `Class "ZipArchive" not found` by making `ext-zip` explicit in Composer/Docker and adding safe controller handling.
- No known critical or high-risk exam-engine bugs remain after Task 3 verification.

## Build or Test Failures

- Phase 1 verification passed: PHP syntax, route list, migration pretend, frontend build, and feature tests.
- Phase 2 verification passed: PHP syntax, route list, migration pretend, frontend build, Composer audit, and feature tests.
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
