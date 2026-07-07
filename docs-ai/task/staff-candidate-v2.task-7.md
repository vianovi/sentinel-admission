# TASK 7 — Staff Candidate V2 Operational Layout

## 0. Mission

Build Staff Candidate V2 as a serious operational staff interface, not a readonly copy of the candidate dashboard.

This task is not just “make the requested UI appear”.

The agent must think like a product-minded human engineer:

- understand the real staff workflow
- inspect the current source code
- challenge weak assumptions
- avoid narrow implementation
- avoid duplicated UI and business logic
- prefer reusable structure over repeated code
- improve the system in a way that still fits the current project
- document every important decision

The goal is to make staff pages feel like an operational SPMB control panel for monitoring, reviewing, prioritizing, and preparing data, while still keeping the scope safe.

Do not rush.

Do not overbuild blindly.

Do not copy candidate pages as readonly staff pages.

---

## 1. Branch Preparation

Before implementation, create a dedicated Task-7 branch from the safest current dashboard/staff-related branch.

Do not hard-code the base branch without checking the repository first.

Required branch workflow:

1. Check current branch.
2. Check working tree.
3. If the working tree is dirty, stop and report.
4. Inspect available local branches related to dashboard/staff/navigation.
5. Choose the safest base branch that contains the latest dashboard/staff work.
6. Create a new Task-7 implementation branch.
7. Do not merge old branches without clear reason.
8. Do not delete old branches.
9. Report the chosen base branch and why it was chosen.

Suggested branch name:

```txt
ui/staff-candidate-v2-task-7
```

If the branch already exists, stop and report instead of overwriting it.

---

## 2. Context

Current staff menu roughly includes:

```txt
MENU
- Dashboard
- Staff Kalender
- Kandidat
  - Semua Kandidat
  - Data Diri
  - Data Wali
  - Data Kesehatan
  - Perlu Tindakan
- Verifikasi
  - Review Dokumen
  - Review Pembayaran
- Seleksi
  - Hasil Ujian
  - Sesi Ujian
- Rekap / Laporan

AKUN
- Profil
```

Current concern:

The staff candidate pages feel too much like readonly candidate pages.

That is not enough for a professional SPMB staff panel.

Candidate pages are for self-service data entry.

Staff pages should support:

- monitoring
- searching
- comparing
- verification
- action queues
- readiness scanning
- operational decision making
- export/report preparation

---

## 3. Main Goal

Upgrade Staff Candidate V2 around three primary surfaces:

1. `Semua Kandidat`
2. Staff candidate detail overview
3. `Perlu Tindakan`

The implementation may improve adjacent staff pages only when necessary, but the main focus must remain Staff Candidate V2.

---

## 4. Product Principles

### 4.1 Staff Panel Is Not Candidate Panel

Do not mirror candidate forms.

Staff needs scan-first and action-first UI.

Use:

- overview cards
- readiness badges
- compact operational summaries
- data tables
- action shortcuts
- drill-down detail sections

Candidate-style field grids can remain as secondary drill-down content, not the main experience.

### 4.2 Backend Is The Source Of Truth

Do not duplicate lifecycle, gate, completion, verification, or readiness logic in React.

Use existing backend services where possible.

Likely relevant services include:

- `StatusPendaftaranService`
- `CandidateStatusService`
- `CandidateGateService`
- completion evaluator
- verification evaluator

If backend props are insufficient, improve them carefully.

Do not recreate the old problem where logic is scattered across UI, controllers, observers, and services.

### 4.3 Operational Over “Just Works”

The agent must not stop at “the requested component exists”.

Ask:

- Does this help staff find candidates faster?
- Does this help staff see who needs action?
- Does this reduce clicks?
- Does this avoid duplicated logic?
- Does this fit the existing dashboard style?
- Does this remain maintainable?
- Does this prepare for future export/report features without implementing them now?

### 4.4 Safe Expansion

The agent may propose or implement a better approach if the source code shows a better path.

But do not expand into unrelated modules without reason.

Do not implement actual Excel export in this task.

Do not build a full report center in this task.

Do not rebuild all staff modules in this task.

---

## 5. Implementation Scope

### 5.1 Semua Kandidat V2

Upgrade `Semua Kandidat` into the staff candidate data center.

Consider implementing:

- compact KPI summary cards
- improved filter/search toolbar
- lifecycle status visibility
- data completion indicator
- document readiness indicator
- payment readiness indicator
- exam/selection readiness indicator
- action-needed badge
- better row actions
- clearer empty state
- clearer loading/processing state if applicable
- Export Excel placement as disabled/coming-soon only

The table should help staff:

- find candidate records
- compare candidates
- see status quickly
- open operational detail
- jump to verification/action pages

If current backend query has a search/filter grouping issue, fix it and add/update a focused test.

### 5.2 Staff Candidate Detail Overview

Create or improve a staff-specific overview before the existing detailed tabs.

The overview should help staff understand a candidate in seconds.

Consider:

- candidate identity header
- lifecycle status
- wave/program
- primary blocker
- readiness strip:
  - Data Diri
  - Wali
  - Kesehatan
  - Dokumen
  - Pembayaran
  - Seleksi
- action shortcuts:
  - Review Dokumen
  - Review Pembayaran
  - Status Pendaftaran
  - Hasil Ujian
  - Perlu Tindakan if relevant
- timeline or recent activity if already available from existing services

Keep existing detailed tabs as drill-down content when useful.

Do not make field grids the main experience.

### 5.3 Perlu Tindakan V2

Improve `Perlu Tindakan` from a narrow change-request page into a clearer operational queue foundation.

Use only data that is actually available.

Possible buckets:

- pending data/email changes
- incomplete core data
- document waiting review
- payment waiting review
- rejected document/payment follow-up
- submitted but not verified
- verified but not assigned to exam/session if existing data supports it
- exam completed but needs final decision if existing data supports it

Do not fake unsupported queues.

If a useful queue requires future backend work, document it instead of pretending it works.

---

## 6. Export Excel Boundary

This task may place the export button in the correct UI location.

This task must not implement actual Excel export.

Allowed:

- disabled button
- coming-soon badge
- tooltip/copy
- documentation of future export scope

Not allowed:

- new export library
- actual XLSX generation
- export endpoints
- payment recap export
- selection result export
- report center export

Future export should be handled in a separate backend/reporting task.

---

## 7. Backend Boundary

Allowed backend changes:

- improve staff candidate list props
- improve staff candidate detail props
- add focused readiness/action summaries using existing services
- fix confirmed query grouping issue
- add focused tests for query/filter behavior
- add small DTO/resource-like structures if they reduce duplication

Not allowed:

- database schema changes
- actual Excel export backend
- payment recap backend
- full reporting module
- unrelated authentication changes
- unrelated payment/document/exam rewrites
- global dashboard redesign

---

## 8. UI Boundary

Allowed UI changes:

- staff candidate list layout
- staff candidate table
- staff candidate filters/toolbar
- staff candidate detail overview
- staff action-needed page foundation
- small reusable staff candidate components
- locked/coming-soon export placement

Not allowed:

- redesign candidate dashboard
- redesign admin dashboard
- redesign exam admin pages
- global navigation rewrite unless required and justified
- new visual language unrelated to the existing dashboard

Use existing dashboard design patterns where possible.

---

## 9. Engineering Quality Rules

Avoid repeated code.

Prefer reusable components for:

- readiness badge
- lifecycle badge
- action-needed badge
- candidate identity cell/card
- section summary card
- operational shortcut

Avoid huge components.

Avoid controllers with duplicated formatting logic.

Keep backend and frontend responsibilities clear.

If the implementation becomes too large, split it into focused commits.

---

## 10. Stage And Commit Strategy

This task should produce multiple focused commits when meaningful.

Each commit should represent a stable milestone.

Suggested milestone order:

### Stage 1 — Audit and Planning Docs

Document the real state and implementation plan.

### Stage 2 — Staff Candidate List V2

Upgrade `Semua Kandidat`.

### Stage 3 — Staff Candidate Detail Overview

Add operational overview above existing detail tabs.

### Stage 4 — Perlu Tindakan Foundation

Improve or clarify action-needed queue.

### Stage 5 — Final Audit, Cleanup, and Docs

Finalize docs, run checks, and report remaining limitations.

The agent may adjust the stage order if the repository structure suggests a better path.

After each meaningful stage:

- run relevant checks
- update docs
- commit focused changes

---

## 11. Documentation Required

Document findings and decisions in the docs-ai folders.

Required docs:

```txt
docs-ai/audit/staff-candidate-v2-audit.md
docs-ai/features/staff-candidate-v2.md
docs-ai/state/staff-candidate-v2-progress.md
docs-ai/state/staff-candidate-v2-next-actions.md
```

Each stage should document:

- what changed
- why it changed
- files touched
- tests/checks run
- limitations
- next action

If the agent finds a better architecture than expected, document the reasoning.

---

## 12. Testing And Verification

Run checks relevant to the changed files.

Expected checks may include:

```txt
php artisan test --testsuite=Feature
php artisan route:list --path=dashboard/staff
npm run build
git diff --check
```

If backend query/filter logic changes, add/update focused tests.

If only frontend changes, at minimum run:

```txt
npm run build
git diff --check
```

Do not commit broken code.

Do not hide failing tests.

If a test cannot be run because of environment limitations, document the limitation honestly.

---

## 13. Final Report

Final report must be in Indonesian.

Include:

- branch used
- base branch chosen and why
- commits created
- staff UI problems fixed
- final Staff Candidate V2 layout
- backend changes if any
- search/filter query fix status
- docs updated
- tests/checks run
- remaining limitations
- recommended next task

---

## 14. Strict Non-Goals

This task is not:

- actual Excel export implementation
- payment recap system
- full report center
- full staff dashboard rewrite
- admin dashboard rewrite
- candidate dashboard rewrite
- schema migration task
- final admission decision automation
- exam engine rewrite

Keep the task ambitious, but controlled.
