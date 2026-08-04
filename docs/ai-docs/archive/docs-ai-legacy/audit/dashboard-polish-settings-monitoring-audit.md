# Dashboard Polish, Settings, and Exam Monitoring — Audit

Date: 2026-07-05

Branch: `feat/dashboard-polish-settings-monitoring`

## Audit Scope

Audited the implementation checkpoint covering:

- candidate payment success copy
- candidate Data Kesehatan eye-field order
- candidate registration summary CTAs
- Data Wali tab order, conditional validation, and income option changes
- gateway payment proof UX in candidate/staff/admin surfaces
- admin Gelombang management rebuild
- admin Pengaturan Sistem pages
- candidate Minat & Bakat option source and multi-select UI
- exam math text rendering
- admin exam monitoring pages/feed/display
- route, build, test, and cache-clear results

## Source Truth Used

The audit is based on actual changed source files, not only prior docs.

Key backend files:

- `app/Http/Controllers/Dashboard/Admin/WaveController.php`
- `app/Http/Controllers/Dashboard/Admin/SystemSettingsController.php`
- `app/Http/Controllers/Dashboard/Admin/Exam/MonitoringController.php`
- `app/Http/Controllers/Dashboard/Candidate/GuardianController.php`
- `app/Http/Controllers/Dashboard/Candidate/DataDiriController.php`
- `app/Models/Guardian.php`
- `app/Services/CandidateStatus/CandidateCompletionEvaluator.php`
- `app/Services/Exam/ExamMonitoringService.php`
- `routes/web.php`

Key frontend files:

- `resources/js/Pages/Dashboard/Admin/Waves.tsx`
- `resources/js/Pages/Dashboard/Admin/SystemSettings.tsx`
- `resources/js/Pages/Dashboard/Admin/Exam/Monitoring.tsx`
- `resources/js/Pages/Dashboard/Admin/Exam/MonitoringDisplay.tsx`
- `resources/js/Components/Dashboard/Exam/RichExamText.tsx`
- candidate Data Diri/Data Wali/Data Kesehatan/Pembayaran pages and components
- `resources/js/Components/Dashboard/Staff/Show/TabPembayaran.tsx`
- `resources/js/config/navigation.ts`

## Findings

No critical or high-risk issue is known after this checkpoint.

### Candidate Panel

- Payment success messaging now matches the automated selection-menu flow better than the old manual-contact wording.
- Data Kesehatan left/right eye UI now matches the saved `eye_left_*` and `eye_right_*` fields.
- Summary CTAs are gated by local completeness checks and link only to existing candidate routes.
- Data Wali validation is now more accurate, but broader than before. Existing candidate fixtures/tests were updated to match the stricter realistic requirements.

### Data Wali and Lifecycle Completion

- Completion requirements now live in `CandidateCompletionEvaluator`.
- `Guardian` delegates required-field logic to the evaluator, reducing duplicate requirement drift.
- The `tidak_ingin_memberitahu` income option is represented in TypeScript labels, backend validation, model labels, evaluator logic, the ALTER migration, and the original guardians migration for fresh test databases.

Residual care point:

- Existing production data should be reviewed before deploying the enum migration if any database engine has stricter enum migration behavior than MySQL/MariaDB expected by the migration.

### Payment Gateway UX

- Gateway payments no longer show manual proof-upload or manual validation forms.
- Staff/admin detail still displays a read-only gateway confirmation state, so operators are not left with a blank section.
- This is a UI/read-model behavior change only; payment processing remains under the existing payment services/webhook flow.

### Admin Gelombang and Settings

- Gelombang management now supports actual create/edit/toggle/delete flows using existing `admission_waves` fields.
- Deleting a wave is guarded when candidates are attached.
- System settings expose existing configurable data:
  - programs
  - extracurriculars
  - payment configs
- No new role model or broad settings framework was introduced.

Residual care point:

- Admin settings are intentionally pragmatic. A future audit may decide whether each setting needs a richer audit log or staff assignment workflow.

### Exam Monitoring

- Monitoring is read-only and uses `ExamMonitoringService` as an assembler.
- The feed is polling-based and uses existing exam session/attempt state.
- Display mode attempts fullscreen from the page but remains usable if the browser blocks automatic fullscreen.
- No websocket, queue worker, proctoring, browser lockdown, webcam, screen capture, or new monitoring table was added.

Residual care point:

- Polling interval and query volume should be reviewed with realistic exam concurrency before production-scale use.

### Math Rendering

- `RichExamText` renders common superscript/degree notation without raw HTML injection.
- It is a formatting helper only; it does not become a LaTeX engine.

Residual care point:

- If future questions need fractions, roots, matrices, or full TeX, choose a proper math renderer instead of expanding ad hoc parsing too far.

## Verification Results

Passed:

- `npx tsc --noEmit --pretty false`
- PHP lint for touched backend files and `routes/web.php`
- `php artisan route:list --path=dashboard`
- `npm run build`
- `php artisan test` -> 47 passed, 215 assertions
- `git diff --check`
- `php artisan optimize:clear`

Browser verification:

- Not attempted. This checkpoint explicitly forbade browser-based verification tools.

## Known Limitations

- Exam monitoring is polling-based and not a true realtime websocket stream.
- Exam monitoring does not auto-proctor or detect cheating.
- `RichExamText` handles common notation only, not full mathematical typesetting.
- Admin settings do not yet include dedicated audit-log views for each setting change.
- Reports/Rekap and Kalender SPMB remain outside this checkpoint.

