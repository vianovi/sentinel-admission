# Staff Candidate V2 Audit

## Branch Decision

Task-7 implementation branch: `ui/staff-candidate-v2-task-7`.

Base branch: `feat/dashboard-polish-settings-monitoring`.

Reason:

- It points at the latest dashboard/staff work currently available locally.
- `audit/staff-candidate-v2-blueprint` points at the same commit and is an audit branch, not the right implementation base.
- `ui/dashboard-shell-navigation-v2` is an ancestor of the chosen base, so merging it would reintroduce older dashboard behavior.

The untracked task file `docs-ai/task/staff-candidate-v2.task-7.md` was treated as intentional user-provided task context and left untouched.

## Current Staff Candidate Surface

Routes live under `dashboard/staff` in `routes/web.php`.

Available staff candidate routes:

- `GET /dashboard/staff/candidates`
- `GET /dashboard/staff/candidates/{candidate}`
- `GET /dashboard/staff/candidates/{candidate}/status-pendaftaran`
- `GET /dashboard/staff/candidates/{candidate}/{section}`
- document preview/verify routes
- payment proof/verify routes
- change request routes
- exam result routes

The staff candidate controller is `App\Http\Controllers\Dashboard\Staff\IndexController`.

The main staff candidate React pages are:

- `resources/js/Pages/Dashboard/Staff/Candidates.tsx`
- `resources/js/Pages/Dashboard/Staff/Show.tsx`
- `resources/js/Pages/Dashboard/Operations/ChangeRequests.tsx`
- `resources/js/Pages/Dashboard/Staff/Exam/Results.tsx`

Reusable staff candidate components already exist under:

- `resources/js/Components/Dashboard/Staff/Candidates`
- `resources/js/Components/Dashboard/Staff/Show`

## Current Problems

`Semua Kandidat` is already a table, but the row data is too thin for operations. It shows candidate identity, wave, lifecycle status, document count, pending document count, date, and actions. It does not show data completion, payment readiness, exam readiness, action-needed buckets, or export placement.

The current search query uses `where(...)->orWhere(...)->orWhere(...)` inside a `when` callback without grouping. When status or wave filters are also active, the OR conditions can escape the intended search group.

Staff detail pages still feel like readonly candidate field pages. `TabDataDiri`, `TabWali`, and `TabKesehatan` are useful as drill-down content, but they should not be the primary staff overview.

`Review Dokumen` and `Review Pembayaran` are already operational and should be preserved.

`Perlu Tindakan` currently means only pending data/email change requests. The label is broader than the implementation. Task-7 should turn it into a queue foundation using real available data, without faking unsupported workflows.

## Existing Backend Data To Reuse

The best source of truth is `StatusPendaftaranService`. It already computes:

- candidate identity
- lifecycle status
- lifecycle steps
- completion checklist
- verification checklist
- document summary
- payment summary
- selection summary
- review blockers
- timeline
- quick links

Other relevant backend services:

- `CandidateStatusService`
- `CandidateGateService`
- `CandidateCompletionEvaluator`
- `CandidateVerificationEvaluator`
- `ChangeRequestService`

Task-7 should expose compact operational summaries from these services instead of duplicating status logic in React.

## Implementation Direction

Add a small backend presenter/service for staff candidate operational summaries. It should use the existing lifecycle/completion/verification services, return compact list/detail/action queue DTOs, and keep React focused on rendering.

Upgrade `Semua Kandidat` into a staff data center:

- KPI summary cards
- search/filter toolbar
- lifecycle status
- readiness indicators
- action-needed badges
- richer row actions
- disabled export placement

Add a candidate detail overview above existing tabs:

- identity header
- lifecycle/waiting-side summary
- primary blocker
- readiness strip
- action shortcuts
- recent activity if already available

Improve `Perlu Tindakan` into an operational queue foundation:

- pending data/email changes
- incomplete core data
- document waiting review
- payment waiting review
- rejected document/payment follow-up
- verified candidate without exam assignment if supported by existing relations

Do not implement actual Excel export, schema changes, payment recap, or report center.
