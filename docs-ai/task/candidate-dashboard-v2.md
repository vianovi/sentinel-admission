# Candidate Dashboard V2 — Admission Journey Center

Use model: GPT-5.5 High Thinking.

## Mission

Build and upgrade the Candidate Dashboard into a production-usable **Admission Journey Center**.

The Candidate Dashboard must become the candidate’s main control center after login.

It should clearly answer:

* What is my current admission status?
* What data is complete?
* What is still missing?
* What should I do next?
* Are my documents verified?
* Is my payment complete?
* Am I ready for review/selection?
* Where should I go next?

This task is not only UI polish.
This is a functional dashboard upgrade.

The first priority is to build features that should already exist in a proper SPMB candidate dashboard, then update the project progress/documentation after the implementation is stable.

---

## Role

Act as:

* senior Laravel engineer
* senior Inertia React engineer
* dashboard product architect
* UX designer for admission systems
* security-aware fullstack engineer
* maintainability-focused code auditor

Think like a professional human engineer, but execute with machine-level consistency.

No careless edits.
No fake completion.
No broken route.
No hidden security regression.
No unrelated refactor.

---

## Language Rule

* Internal reasoning/planning may use any language.
* Final user-facing report must be written in Bahasa Indonesia.
* Application UI text should follow the existing project language and style.
* Code comments should follow the existing project style.

---

## Before Starting

1. Check current Git branch.
2. Check working tree status.
3. If there are uncommitted changes, inspect them first.
4. If they belong to the previous dashboard/admin task and are stable, commit them with a clear message before starting this task.
5. Create or switch to a new branch:

```txt
feat/candidate-dashboard-v2
```

6. Do not merge.
7. Do not push.
8. Do not start implementation before reading the required documents and auditing the current source.

---

## Required Documents to Read First

Read these files before editing anything:

```txt
docs-ai/compressed/00_core.md
docs-ai/compressed/01_project.final.md
docs-ai/compressed/02_status.final.md
docs-ai/compressed/06_skill_infra.md
docs-ai/compressed/build_rules.md
docs-ai/compressed/intruction_system.md
```

If a file does not exist, report it and continue only with the available documents.

Documentation gives direction.
Actual source code is the final truth.

If documentation and source code conflict:

* trust source code for implementation reality
* report the conflict in the final report
* do not blindly follow outdated documentation

---

## Approved Scope

Only Candidate Dashboard and directly related candidate dashboard data preparation.

Allowed:

* Candidate dashboard index page
* Candidate dashboard components
* Candidate admission progress summary
* Candidate status overview
* Candidate next-action cards
* Candidate document/payment/health/data completion summary
* Candidate dashboard charts/visual indicators using existing dependencies
* Candidate dashboard mobile layout
* Candidate dashboard links to existing active candidate pages
* Candidate dashboard ComingSoon links for future pages
* Backend props/data required by the candidate dashboard
* Status/progress calculation service/helper if needed
* Updating project status documentation after successful build

Out of scope:

* Staff dashboard feature work
* Admin dashboard feature work
* Landing page
* Registration draft lifecycle
* Auth redesign
* Payment gateway redesign
* Document upload security redesign
* New global roles
* New dependencies
* New database schema unless explicitly approved
* Large security architecture rewrite
* Full selection/exam system
* Full report/export system

Do not touch Staff/Admin pages unless a shared component must be adjusted safely and minimally.

---

## Product Direction

Candidate Dashboard should feel like:

```txt
Admission Journey Center
```

Not just a welcome page.

It should be practical, visual, and action-oriented.

The candidate should immediately understand:

```txt
1. Current status
2. Completion progress
3. Missing requirements
4. Next action
5. Verification result
6. Payment status
7. Important admission identity
```

This dashboard is for candidates, not administrators.

Do not overload it with admin-style analytics.

Use simple, meaningful visualizations.

---

## Core Features to Discover and Build

Do not blindly build this exact list without checking source first.

Use this as the intended product direction, then inspect the current code and implement the safest complete version.

### 1. Admission Progress Overview

Show candidate progress across key admission areas:

* Data Diri
* Data Wali
* Data Kesehatan
* Dokumen
* Pembayaran
* Status Seleksi / Status Kandidat

Expected UI:

* progress percentage
* step/timeline/section completion
* clear completed/incomplete/warning states
* links to fix incomplete sections

### 2. Candidate Identity Summary

Show important candidate identity data:

* candidate name
* candidate code
* registration code if relevant
* current status
* admission wave
* selected program
* selected major if applicable
* email/phone summary if already available

Keep it concise.

### 3. Next Action Panel

The dashboard must tell the candidate what to do next.

Examples:

* Complete Data Diri
* Complete Data Wali
* Complete Data Kesehatan
* Upload required documents
* Complete payment
* Wait for staff verification
* Check rejected documents/payment
* Review approved/rejected change request
* Wait for selection result

Only show actions that make sense based on actual data.

### 4. Document Status Summary

Show document status summary if data exists:

* total required documents
* uploaded documents
* pending verification
* verified
* rejected
* missing required documents

Link to:

```txt
/dashboard/data-dokumen
```

Do not expose direct file URLs.

### 5. Payment Status Summary

Show payment status summary if data exists:

* payment status
* proof upload status
* amount if available
* latest payment method/status if available
* CTA to payment page

Link to:

```txt
/dashboard/pembayaran
```

### 6. Health/Data Completion Summary

Show whether candidate health data and guardian data are complete enough for submitted status.

Use existing observer/completion logic if available.

Do not create new business rules that conflict with current source.

### 7. Visual Components

Use existing dependencies only.

Recharts is already available and may be used for:

* progress ring
* compact bar summary
* small completion chart
* document verification summary

Do not make the candidate dashboard look like admin analytics.

Visuals must help the candidate understand progress.

### 8. Status / Timeline Section

If a dedicated candidate status page is not built yet, the dashboard should still provide a simple status timeline/summary.

Do not build the full dedicated `/dashboard/status` page unless it is clearly safe and within scope.

If sidebar status route is future-only, keep it ComingSoon.

### 9. Mobile UX

The candidate dashboard must be excellent on mobile.

Requirements:

* mobile-first layout
* card-based structure
* touch targets minimum 44px
* input text minimum 16px where inputs exist
* no horizontal overflow
* CTA buttons visible and not cramped
* readable status badges
* dashboard usable around 390px width

### 10. Empty / Partial State

Dashboard must handle incomplete candidate data gracefully.

No crash if:

* candidate has no payment yet
* candidate has no documents yet
* candidate has no health record yet
* candidate has incomplete guardian data
* candidate status is still draft/submitted
* candidate has rejected document/payment
* candidate has pending data/email request

---

## Security Requirements

Security is non-negotiable.

Preserve:

* candidate-only access
* candidate can only access their own data
* no `Candidate::find($request->id)` for candidate-owned data
* no direct private file URL exposure
* no storage path exposure
* no token/secret exposure
* no technical error details shown to users
* no role boundary regression
* no staff/admin data leak into candidate props
* no unsafe ID-based access

All dashboard data must come from the authenticated user’s candidate relationship.

Use existing secure routes for document/payment preview if needed.

Do not create new file access routes in this task unless absolutely necessary.

---

## Architecture Rules

Follow the existing project architecture.

Pages should be thin orchestrators.

Prefer:

```txt
resources/js/Pages/Dashboard/Candidate/Index.tsx
resources/js/Components/Dashboard/Candidate/Index/*
```

or the closest existing structure.

Keep logic inside reusable candidate dashboard components/helpers.

Do not put all UI logic into one giant page.

Do not create a new dashboard layout.

Use existing:

```txt
DashboardLayout
DashboardSplitLayout
shared dashboard components
```

where appropriate.

Dark mode classes must be literal/static.

Never generate dynamic classes like:

```txt
dark:${variable}
```

Do not install new dependencies.

Do not remove existing libraries:

* animejs
* react-select
* sweetalert2
* flatpickr
* Recharts

---

## Backend/Data Rules

Before changing backend props, inspect current controller first.

Likely files to inspect:

```txt
app/Http/Controllers/Dashboard/Candidate/IndexController.php
app/Http/Controllers/Dashboard/Candidate/DataDiriController.php
app/Http/Controllers/Dashboard/Candidate/GuardianController.php
app/Http/Controllers/Dashboard/Candidate/HealthRecordController.php
app/Http/Controllers/Dashboard/Candidate/DocumentController.php
app/Http/Controllers/Dashboard/Candidate/PaymentController.php
app/Support/CandidateRequestPresenter.php
app/Models/Candidate.php
app/Models/Guardian.php
app/Models/HealthRecord.php
app/Models/CandidateDocument.php
app/Models/Payment.php
resources/js/Pages/Dashboard/Index.tsx
resources/js/Pages/Dashboard/Candidate/*
resources/js/Components/Dashboard/Candidate/*
resources/js/config/navigation.ts
routes/web.php
```

Backend props should be clear, minimal, and dashboard-oriented.

Avoid sending unnecessary sensitive data to the frontend.

If progress calculation becomes complex, create a small service/helper rather than bloating the controller.

Do not change database schema.

If a schema change seems needed, stop and report.

---

## Autonomous Workflow

You must work using this loop:

### Phase 1 — Source Audit

Inspect the current candidate dashboard implementation.

Find:

* current route
* current controller
* current props
* current page/components
* active candidate sidebar links
* existing completion/status logic
* existing document/payment status logic
* gaps and broken UX

Create an internal work queue.

Rank each task by:

* candidate impact
* security risk
* implementation risk
* dependency readiness
* effort
* whether it is safe within scope

### Phase 2 — Build

Implement the highest-impact safe improvements first.

Do not stop after one small card if obvious dashboard gaps remain and are safe to solve.

Build until the Candidate Dashboard becomes coherent and usable.

### Phase 3 — Self-Audit

Check:

* candidate data isolation
* route correctness
* Inertia props correctness
* TypeScript correctness
* mobile layout
* dark mode classes
* no broken links
* no direct file URL
* no over-fetching sensitive data
* no unrelated Staff/Admin changes

### Phase 4 — Fix Loop

If critical/build/security bugs are found:

* fix them
* self-audit again

Repeat up to 3 fix loops.

If critical issues remain after 3 loops, stop and report honestly.

---

## Stop Conditions

Stop when one of these is true:

1. Candidate Dashboard V2 is coherent, useful, and safe within current scope.
2. Further work requires schema/product decision approval.
3. Further work risks touching Staff/Admin/Landing/Auth/Form Wizard too much.
4. Source uncertainty makes further autonomous edits unsafe.
5. Critical issues remain after 3 fix loops and need human review.

---

## Allowed Checks

You may run:

```txt
php -l
php artisan route:list
npm run build
git diff --check
lightweight static inspection commands
```

You may run relevant PHP tests if they already exist and are safe.

Do not fake check results.

If a check cannot be run, report it.

---

## Do Not Run

Do not run:

```txt
npm install
npm run dev
migrate:fresh
database reset
destructive commands
push
merge
browser automation unless clearly configured and necessary
```

---

## Documentation Update Requirement

After successful implementation, update the project progress/status documentation if appropriate.

Prefer updating:

```txt
docs-ai/compressed/02_status.final.md
```

or the current active project status document if source shows another file is the real tracker.

Update only factual completed/pending status.

Do not rewrite the whole documentation unnecessarily.

Document:

* Candidate Dashboard V2 status
* completed dashboard features
* remaining deferred items
* manual validation checklist if relevant

---

## Acceptance Criteria

The task is accepted only if:

* Candidate dashboard opens successfully
* candidate sees meaningful progress/status
* candidate sees clear next action
* document/payment/data completion is summarized
* links go to real active pages or ComingSoon
* no Staff/Admin regression
* no direct private file URL exposure
* no candidate data ownership regression
* build/check passes if run
* mobile layout is usable around 390px
* project status documentation is updated if implementation is successful

---

## Final Report

Final report must be written in Bahasa Indonesia.

Include:

1. Branch checked
2. Pre-task commit status
3. Active branch used
4. Documents read
5. Source audit summary
6. Work queue discovered
7. Features built
8. Backend/data changes
9. Frontend/UI changes
10. Security protections confirmed
11. Files changed
12. Documentation updated
13. Checks/build results
14. Self-audit result
15. Remaining limitations/deferred items
16. Manual validation checklist

Manual validation checklist must include:

* login as candidate
* open candidate dashboard
* check progress summary
* check next-action card
* open Data Diri link
* open Data Wali link
* open Data Kesehatan link
* open Dokumen link
* open Pembayaran link
* check pending/approved/rejected request banner if available
* check mobile width around 390px
* confirm Staff/Admin dashboard still opens
* confirm no direct private file URL is exposed

Stop after final report.
