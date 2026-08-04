# Staff Candidate V2 Progress

## Stage 1 - Audit and Planning

Status: complete.

Branch:

- Created `ui/staff-candidate-v2-task-7` from `feat/dashboard-polish-settings-monitoring`.

Findings:

- Staff candidate routes and controllers already exist.
- `Semua Kandidat` has a table foundation but lacks operational readiness and action summaries.
- Detail pages include useful drill-down tabs but need a staff-first overview.
- `Perlu Tindakan` currently covers change requests only.
- `StatusPendaftaranService` already contains most lifecycle/readiness logic needed by Task-7.
- Staff candidate search has a likely OR grouping issue when combined with filters.

Files changed:

- `docs-ai/audit/staff-candidate-v2-audit.md`
- `docs-ai/features/staff-candidate-v2.md`
- `docs-ai/state/staff-candidate-v2-progress.md`
- `docs-ai/state/staff-candidate-v2-next-actions.md`

Checks:

- Documentation stage only; code checks will run after implementation stages.

Limitations:

- The user-provided task file is untracked and intentionally left untouched.

## Stage 2 - Staff Candidate List V2

Status: complete.

What changed:

- Added a backend operational summary service for staff candidate rows and queues.
- Fixed staff candidate search grouping so search terms do not bypass active status filters.
- Added staff list summary counts, program options, action options, and operational row props.
- Upgraded `Semua Kandidat` with KPI cards, program/action filters, readiness strip, lifecycle badge, action-needed badge, completion/verification meters, quick row actions, and disabled Export Excel placement.
- Added a focused feature test for grouped search behavior.

Files changed:

- `app/Services/StaffCandidate/StaffCandidateOperationalService.php`
- `app/Http/Controllers/Dashboard/Staff/IndexController.php`
- `resources/js/Pages/Dashboard/Staff/Candidates.tsx`
- `resources/js/Components/Dashboard/Staff/Candidates/CandidateFilters.tsx`
- `resources/js/Components/Dashboard/Staff/Candidates/CandidateTable.tsx`
- `resources/js/Components/Dashboard/Staff/Candidates/OperationalBadges.tsx`
- `tests/Feature/StaffCandidateV2Test.php`

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php`
- `npm run build`
- `git diff --check`

Limitations:

- Export Excel is placement only and intentionally disabled.
- Action filtering uses available data only; broader report/export behavior remains out of scope.

## Stage 3 - Staff Candidate Detail Overview

Status: complete.

What changed:

- Added a staff-first operational overview above the existing candidate detail tabs.
- The overview shows lifecycle status, action-needed badge, completion/verification meters, wave/program metadata, waiting side, readiness strip, primary blocker, operational shortcuts, and recent activity.
- Existing read-only field tabs remain available as drill-down sections instead of being the first and only staff experience.
- Added a feature assertion that the staff candidate detail page receives the operational overview prop.

Files changed:

- `resources/js/Components/Dashboard/Staff/Show/OperationalOverview.tsx`
- `resources/js/Pages/Dashboard/Staff/Show.tsx`
- `tests/Feature/StaffCandidateV2Test.php`

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php`
- `npm run build`
- `git diff --check`

Limitations:

- Timeline is limited to existing status-pendaftaran events.
- Final decision automation remains out of scope.

## Stage 4 - Perlu Tindakan Foundation

Status: complete.

What changed:

- Extended the existing change-request route with an operational queue generated from real candidate summary data.
- Staff page title now presents the surface as `Perlu Tindakan`.
- Existing data/email approval tabs remain intact below the broader queue.
- Added bucket filters for supported queues: incomplete data, document review, payment review, change requests, rejected follow-up, and verified candidates without exam sessions.
- Added a feature test for the exam-unassigned queue bucket.

Files changed:

- `app/Http/Controllers/Dashboard/ChangeRequestController.php`
- `resources/js/Components/Dashboard/ChangeRequests/OperationalQueuePanel.tsx`
- `resources/js/Pages/Dashboard/Operations/ChangeRequests.tsx`
- `tests/Feature/StaffCandidateV2Test.php`

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php`
- `npm run build`
- `git diff --check`

Limitations:

- Queue items are derived from the first 120 latest candidates to keep the foundation safe without adding pagination or new reporting backend.
- No unsupported queue is faked; broader reporting and export should be separate backend work.

## Stage 5 - Final Audit, Cleanup, and Docs

Status: complete.

What changed:

- Updated the feature blueprint from planned language to implemented Task-7 behavior.
- Captured final implementation limits and next recommended backend/reporting tasks.
- Kept the user-provided task file untracked and out of commits.

Files changed:

- `docs-ai/features/staff-candidate-v2.md`
- `docs-ai/state/staff-candidate-v2-progress.md`
- `docs-ai/state/staff-candidate-v2-next-actions.md`

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php`
- `php artisan test --testsuite=Feature`
- `php artisan route:list --path=dashboard/staff`
- `npm run build`
- `git diff --check`

Limitations:

- No browser screenshot pass was added because the verified scope was feature tests, route checks, TypeScript, and production build.
- The operational queue remains a safe foundation rather than a full reporting backend.
