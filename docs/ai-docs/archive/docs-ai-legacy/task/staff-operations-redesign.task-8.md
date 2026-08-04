# TASK 8 — Staff Operations Redesign

## 0. Mission

Redesign the Staff Operations UI into a professional desktop-first operational interface.

This task exists because Task-7 improved the backend presenter and added operational panels, but the UI still feels like stacked panels placed above old pages. The goal now is not to add more panels. The goal is to restructure the staff experience based on real database structure, actual services, actual workflow, and professional desktop UI patterns.

The final result must be proven through the UI, not through a long report.

Use the highest reasoning mode available.

Maximize reasoning for decision quality, not for verbose final reporting.

Do not guess.

Do not fake data.

Do not invent database fields.

Do not hardcode assumptions.

Do not blindly follow old UI if the source code proves a better structure is needed.

---

## 1. Required Reading Before Work

Before changing files, read:

- `docs-ai/compressed/04_skill_frontend.optimized.md`
- `docs-ai/compressed/intruction_system.md`
- `docs-ai/CORE_CONTEXT.md`
- latest relevant docs in:
  - `docs-ai/audit/`
  - `docs-ai/state/`
  - `docs-ai/features/`

Also inspect the actual source code.

Documentation may be stale. Source code and database structure are the source of truth.

If `docs-ai/CORE_CONTEXT.md` becomes outdated because of this task, update it carefully and only in relevant sections.

---

## 2. Branch Rule

Create a dedicated Task-8 branch from the safest current branch that already contains Task-7 work.

Do not hardcode the base branch without checking the repository.

Required:

1. Check current branch.
2. Check working tree.
3. If dirty, stop and report.
4. Inspect local branches.
5. Choose the safest base branch that contains the latest Staff Candidate V2 / dashboard work.
6. Create a new branch for this task.
7. Do not delete old branches.
8. Do not merge unrelated branches.
9. Report the chosen base branch and reason.

Suggested branch name:

```txt
ui/staff-operations-redesign-task-8
```

If the branch already exists, stop and report.

---

## 3. Core Problem

Current staff UI still behaves like:

```txt
old page
+ new panel
+ another panel
+ similar panel with different text
```

This is not enough.

The staff panel should become an operational workspace.

Candidate dashboard is for candidates to fill data.

Staff dashboard is for staff to:

- monitor candidates
- inspect readiness
- verify documents
- reconcile payments
- review selection progress
- identify blockers
- decide next action
- prepare future reporting/export workflows

Do not make staff pages a readonly version of candidate forms.

---

## 4. Main Scope

Redesign the staff operational surfaces around actual workflow and actual database.

Primary scope:

1. Staff Candidate List / `Semua Kandidat`
2. Staff Candidate Detail
3. Staff Payment Operations
4. Staff Action Queue / `Perlu Tindakan`

Secondary scope only if needed:

- Review Dokumen layout integration
- Staff dashboard links/shortcuts
- Staff navigation labels if the current labels no longer match the actual workflow

Do not redesign admin dashboard.

Do not redesign candidate dashboard.

Do not rewrite exam engine.

Do not implement Excel export in this task unless explicitly approved later.

---

## 5. Database-Aware Audit Requirement

Before redesigning UI, map the relevant database/model/service structure.

Audit actual migrations, models, controllers, services, and props related to:

### Candidate

- candidate identity
- admission status
- wave/gelombang
- program choice
- lifecycle/completion data
- verification data
- selection/exam relation

### Payment

Audit payment structure carefully.

Find actual fields and relationships for:

- payment records
- invoice/order ID
- Midtrans order ID
- Midtrans transaction ID if available
- payment method/type
- gross amount
- status
- settlement time
- expiry time
- fraud status if available
- payment proof/manual upload if it still exists
- wave-based fees
- dynamic fee components
- additional fees per wave
- payment total calculation
- payment status sync/webhook logic

Do not assume payment is manual proof based.

If Midtrans/payment gateway is the main flow, the staff payment UI must be transaction-oriented.

Manual proof review should only appear as fallback if the source code confirms it is still a real supported flow.

### Wave / Fee Structure

Audit how admin configures payment amounts and additional fees per wave.

The UI must respect dynamic fees.

Do not hardcode one static registration fee.

Map:

```txt
candidate -> wave/gelombang -> fee components -> invoice/payment -> transaction status
```

Use the real table and model names from the project.

### Exam / Selection

Audit only the parts needed to show staff candidate readiness and action queue:

- candidate assigned to session or not
- attempt status
- result status
- pass/fail if available
- final admission decision remains separate

---

## 6. Product Decision Requirement

After audit, decide the UI information architecture before implementing.

Document the decision briefly in docs.

The agent must decide:

- what pages should remain
- what pages should be replaced
- what old sections should be removed or reorganized
- which actions are real
- which buttons must be removed because they are not wired
- which buttons should become disabled/coming-soon
- which data must appear in the staff table
- which data belongs in detail view
- which data belongs in payment operations
- which data belongs in action queue

If a decision depends on missing business policy, stop and ask.

Examples of stop-worthy questions:

- whether manual payment proof is still officially supported
- whether staff may manually override gateway-paid status
- whether additional wave fees are mandatory or optional
- whether staff can change candidate final status from this redesign
- whether export must be implemented now or in a later reporting task

Do not proceed by guessing on critical business policy.

---

## 7. UI Quality Bar

The UI must be desktop-first and professional.

Target:

```txt
professional SPMB operations dashboard
```

Not:

```txt
developer admin page with stacked cards
```

Desktop-first means:

- use horizontal space intentionally
- table/workbench layouts are allowed
- avoid long vertical stacks of repeated panels
- keep important actions visible
- reduce unnecessary scrolling
- prioritize scanning and comparison

The UI should feel designed, not patched.

Use existing design tokens/components where possible, but reorganize layout when needed.

---

## 8. Staff Candidate List Redesign

Redesign `Semua Kandidat` as an operations table/workbench.

It should support:

- fast search
- filter by lifecycle
- filter by wave
- filter by program
- filter by readiness/action state
- scan candidate status quickly
- compare candidate readiness
- open detail quickly
- jump to relevant action

Recommended structure:

```txt
Page header
↓
Operational summary strip
↓
Toolbar: search, filters, export placement
↓
Main data table
↓
Optional side preview/drawer if feasible
```

Do not simply place more cards above the old table.

Columns should be chosen from real available data.

Possible columns:

- candidate identity
- candidate code / registration number if available
- wave
- program
- lifecycle status
- data readiness
- document readiness
- payment readiness
- selection readiness
- primary blocker
- last update
- row actions

Remove actions that are not real.

Do not keep buttons that do nothing.

Export Excel may be shown as disabled/coming-soon placement only, unless a later explicit instruction says to implement export.

---

## 9. Staff Candidate Detail Redesign

Redesign detail as a staff operations profile, not candidate form preview.

Recommended desktop layout:

```txt
Header: identity + lifecycle + primary blocker
↓
Main area:
  left/center: readiness, timeline, important data
  right: staff action rail / next actions
↓
Secondary detail sections:
  Data Diri
  Wali
  Kesehatan
  Dokumen
  Pembayaran
  Seleksi
```

Old field-grid sections may remain only as secondary detail content.

The first screen must answer:

- who is this candidate?
- what is their current stage?
- what is blocking them?
- what is complete?
- what should staff do next?
- where is the relevant action?

Do not make every tab look the same with only different text.

---

## 10. Staff Payment Operations Redesign

This is a critical part.

If the project uses Midtrans/payment gateway as the main payment flow, redesign staff payment around transactions and reconciliation.

Do not center the UI around manual proof upload unless the source code confirms manual proof is still a supported fallback.

Payment page should answer:

- who paid?
- which candidate/wave/program?
- what invoice/order is this?
- what fee components are included?
- what is the expected amount?
- what amount was paid?
- what is the Midtrans status?
- what method was used?
- when was it created?
- when was it settled?
- is it expired/cancelled/pending/failed?
- does it need staff action?
- is there a mismatch or anomaly?

Use real available fields only.

Potential UI:

```txt
Payment Operations Header
↓
Payment KPI strip
↓
Transaction/reconciliation toolbar
↓
Transaction table
↓
Transaction detail drawer/page
```

Possible transaction columns:

- candidate
- wave/program
- order ID
- transaction ID if available
- payment method/type
- expected amount
- paid amount/gross amount
- transaction status
- settlement/paid time
- expiry time
- action state

Actions should be real.

Examples:

- view transaction detail
- sync/check status if backend supports it
- open candidate detail
- open related documents only if relevant
- manual fallback review only if supported

Remove or demote proof-review UI if payment gateway is the primary system.

---

## 11. Perlu Tindakan Redesign

Redesign `Perlu Tindakan` as an operations queue/workbench.

Do not just show repeated cards.

Recommended desktop layout:

```txt
Bucket sidebar
↓
Queue list
↓
Detail/action panel
```

Supported buckets must come from real data.

Possible buckets:

- incomplete data
- document waiting review
- payment waiting/sync needed
- rejected document/payment follow-up
- verified but no exam session
- exam completed but needs decision
- pending data/email changes

Do not fake unsupported buckets.

If data is not available, document it and show it as future work only.

---

## 12. Backend Rules

Allowed backend changes:

- improve staff operational presenters
- improve payment operational presenter
- expose real payment/wave/fee data
- fix incorrect queries
- remove or stop sending unused props
- add focused tests for changed backend behavior
- improve route/controller props to support UI correctly

Not allowed without explicit approval:

- schema changes
- actual Excel export implementation
- new payment provider behavior
- major rewrite of Midtrans integration
- final admission decision automation
- destructive data changes

---

## 13. Frontend Rules

Allowed frontend changes:

- full layout restructure for scoped staff pages
- remove/replace old stacked panels
- remove dead buttons
- create reusable operational components
- create transaction/readiness/status badges
- create desktop-first table/workbench layouts
- improve empty states and disabled states

Not allowed:

- fake actions
- fake data
- repeated copy-paste panels
- new visual style unrelated to the current dashboard
- redesign unrelated modules

---

## 14. Documentation Required

Update or create:

- `docs-ai/audit/staff-operations-redesign-audit.md`
- `docs-ai/features/staff-operations-redesign.md`
- `docs-ai/state/staff-operations-redesign-progress.md`
- `docs-ai/state/staff-operations-redesign-next-actions.md`

Update `docs-ai/CORE_CONTEXT.md` if relevant.

Docs must include:

- source files audited
- database/model/service map
- payment structure decision
- wave/fee structure decision
- UI information architecture decision
- what old UI was removed/reorganized
- what actions are real
- what actions are disabled/future
- tests/checks run
- limitations

Keep final report concise.

Do not spend excessive tokens on report prose.

---

## 15. Testing And Verification

Run relevant checks.

Expected:

```txt
php artisan test --testsuite=Feature
php artisan route:list --path=dashboard/staff
npm run build
git diff --check
```

If backend payment/query logic changes, add or update focused feature tests.

If frontend changes are large, run build and inspect TypeScript errors carefully.

If browser visual QA is possible, do it.

If browser visual QA is not possible because of environment limits, document that honestly.

---

## 16. Commit Strategy

Use focused milestone commits.

Possible milestones:

1. audit/database/UI decision docs
2. staff candidate list redesign
3. staff candidate detail redesign
4. staff payment operations redesign
5. action queue redesign
6. final audit/docs

The agent may adjust milestones based on source reality.

After each meaningful stage:

- run relevant checks
- update docs
- commit focused changes

Do not make one huge uncontrolled commit.

Do not commit broken code.

---

## 17. Final Report

Final report must be in Indonesian and concise.

Include:

- branch used
- base branch chosen and why
- commits created
- database/payment/wave findings
- UI structure decisions
- pages redesigned
- old UI removed/reorganized
- real actions vs disabled/future actions
- tests/checks run
- docs updated
- remaining limitations
- recommended next task

The final proof should be the improved UI structure and working code, not a long explanation.

---

## 18. Non-Goals

This task is not:

- Excel export implementation
- full report center
- payment provider rewrite
- database migration task
- candidate dashboard redesign
- admin dashboard redesign
- exam engine rewrite
- final admission automation
