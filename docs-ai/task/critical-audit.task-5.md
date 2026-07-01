# CRITICAL AUDIT TASK 5 — Candidate Lifecycle, Gates, Validation, and Architecture Restructure

## 0. Mission Severity

This is a critical architecture task.

Do not treat this as a quick bugfix.

The current candidate lifecycle has a serious structural problem: candidate status transition logic is scattered across observers, controllers, document/payment verification flows, and webhook/checklist services.

A candidate can remain stuck in `draft` even after required data appears complete, documents are uploaded/verified, and payment is completed.

This task must not patch only one field or one observer.

The mission is to audit, restructure, and harden the candidate lifecycle system so it becomes reliable, centralized, testable, efficient, and safe.

The agent must think critically.

Do not blindly preserve flawed existing structure.

Do not blindly obey old local logic if the audit proves it is wrong.

Do not work narrowly.

Do not rush to finish.

The goal is a clean, serious, production-grade lifecycle and gate system.

---

## 1. Required Branch Safety

Before modifying code, create a dedicated branch from the current branch and latest current commit.

Expected branch name:

`critical/candidate-lifecycle-gates`

Required behavior:

1. Check current branch.
2. Check working tree.
3. If working tree is dirty, stop and report.
4. If working tree is clean, create and switch to the dedicated branch from current HEAD.
5. Continue only after branch switch succeeds.

Do not push.

Do not merge.

Do not rebase.

Do not reset.

Do not amend previous commits.

The purpose is to preserve the latest current branch state while isolating this critical restructure.

---

## 2. Read Before Acting

Before making decisions or code changes, read local project references and actual source code.

Read relevant docs if present:

* `docs-ai/00_core.md`
* `docs-ai/01_project.final.md`
* `docs-ai/07_skill_deep_discussion.md`
* `docs-ai/compressed/*`
* `docs-ai/state/*`
* `docs-ai/audit/*`
* `docs-ai/features/*`
* any existing status/progress docs

Then inspect actual code.

Trust actual source code over stale documentation.

Do not assume the earlier audit is complete.

Use it as a starting point only.

The agent must re-audit based on the latest repository state.

---

## 3. Critical Problem Statement

The current system has at least these known risks:

* `draft -> submitted` logic is fragmented.
* `submitted/draft -> verified` logic is not guarded strongly enough.
* candidate completion requirements are not centralized.
* document/payment verification can happen while candidate remains `draft`.
* email verification and candidate status are not clearly separated.
* payment menu and exam menu are fatal gates but may not be centrally enforced.
* observer watched fields may not match the actual required fields.
* some lifecycle logic is duplicated or scattered.
* frontend and backend may not share the same source of truth.
* routes may allow access based on role only instead of candidate lifecycle gate.
* candidate dashboard may calculate progress/gates independently from backend lifecycle service.

This task must fix the architecture, not only the symptom.

---

## 4. Core Domain Decisions

Use these domain meanings unless the actual source code proves a critical contradiction that must be reported.

### Candidate Status

`draft`

Required core registration data is incomplete.

`submitted`

Required core registration data is complete. Candidate is now eligible to proceed to documents and payment if account gate also passes.

`verified`

Required documents are verified and required payment is paid. Candidate is now eligible to proceed to online selection/exam if account gate also passes.

`accepted`

Final manual decision: candidate is accepted.

`rejected`

Final manual decision: candidate is rejected.

Final statuses must never be automatically overwritten.

### Email Verification

Email verification is account security state.

It must stay separate from candidate admission status.

Use:

* `users.email_verified_at` for account verification.
* `candidates.status` for registration/admission lifecycle.

Do not keep candidate in `draft` only because email is not verified.

Email verification should act as an access gate for serious features.

---

## 5. Feature Gate Decisions

Use central gates.

Frontend must not decide feature access by itself.

Controllers/routes must not duplicate gate logic manually.

A central gate service must decide access and provide human-readable locked reasons.

### Core Data Gate

Core data pages should be accessible when candidate belongs to authenticated user:

* Data Diri
* Data Wali
* Data Kesehatan

These may remain accessible even if email is not verified.

### Document Gate

Documents are visible but locked until requirements pass.

Allowed only if:

* candidate status is at least `submitted`
* user email is verified

Locked reasons:

* if candidate is `draft`: “Lengkapi Data Diri, Data Wali, dan Data Kesehatan terlebih dahulu.”
* if email is not verified: “Verifikasi email terlebih dahulu untuk mengunggah dokumen.”

### Payment Gate

Payment is visible but locked until requirements pass.

Allowed only if:

* candidate status is at least `submitted`
* user email is verified

Locked reasons:

* if candidate is `draft`: “Lengkapi data pendaftaran terlebih dahulu sebelum melakukan pembayaran.”
* if email is not verified: “Verifikasi email terlebih dahulu sebelum melakukan pembayaran.”

### Exam Gate

Online selection/exam is visible but locked until requirements pass.

Allowed only if:

* candidate status is at least `verified`
* user email is verified

Locked reasons:

* if candidate is `draft`: “Lengkapi data pendaftaran terlebih dahulu.”
* if candidate is `submitted`: “Dokumen dan pembayaran harus diverifikasi terlebih dahulu.”
* if email is not verified: “Verifikasi email terlebih dahulu untuk mengakses ujian seleksi.”

---

## 6. Required Architecture Direction

Create a central candidate lifecycle architecture.

Suggested structure:

```txt
app/Services/CandidateStatus/
├── CandidateCompletionEvaluator.php
├── CandidateVerificationEvaluator.php
├── CandidateStatusService.php
├── CandidateGateService.php
├── CandidateRequirement.php
└── CandidateStatusResult.php
```

The exact class names may be adapted to the existing project convention.

The separation of responsibility must remain clear.

### CandidateCompletionEvaluator

Responsible for core registration completion.

It must evaluate:

* candidate core fields
* guardian fields
* conditional guardian fields
* health fields according to audited backend rule

It must return:

* complete or incomplete
* missing requirements
* human-readable labels
* machine-readable keys

### CandidateVerificationEvaluator

Responsible for verification completion.

It must evaluate:

* required documents
* conditional transfer document
* required payment status
* existing BPJS/health document requirement if part of current policy

It must return:

* complete or incomplete
* missing requirements
* human-readable labels
* machine-readable keys

### CandidateStatusService

Responsible for lifecycle synchronization.

It must expose a method similar to:

```php
syncAfterEvent(Candidate $candidate, string $event): CandidateStatusResult
```

It must:

* be idempotent
* use `updateQuietly()` where needed to prevent observer loops
* never overwrite `accepted` or `rejected`
* move `draft -> submitted` only when core completion passes
* move `submitted -> verified` only when verification completion passes
* avoid unsafe `draft -> verified` transitions
* return/log missing requirements when status cannot advance
* allow repeated calls from different events safely

### CandidateGateService

Responsible for central feature access gates.

It must decide:

* can access core data
* can access documents
* can access payment
* can access exam
* locked reason
* next recommended action

It must combine:

* candidate status
* user email verification state
* final status state where relevant

It should be usable by controllers, middleware/policies, and frontend props.

---

## 7. Code Efficiency and Structure Rules

Do not write repeated lifecycle logic.

Do not duplicate required field checks across observers, controllers, frontend props, and services.

Do not repeat the same status rules in multiple places.

Do not create long controller methods full of lifecycle conditions.

Do not make frontend calculate admission lifecycle.

The central service layer must be the single source of truth.

Allowed pattern:

```php
$statusService->syncAfterEvent($candidate, 'guardian.updated');
```

Rejected pattern:

```php
if ($candidate->phone_number && $guardian->mother_name && ...) {
    $candidate->status = 'submitted';
}
```

Controllers, observers, webhooks, and staff/admin actions should trigger the service, not own the business rules.

If repeated code is found, consolidate it.

If old duplicated logic remains, document why it remains or remove/refactor it safely.

---

## 8. Critical Audit Scope

Before implementing, audit these critical points:

### Candidate Status Flow

Find all places that read/write candidate status.

Map:

* `draft -> submitted`
* `submitted -> verified`
* final status changes
* any hidden direct status updates

### Observers

Audit:

* CandidateObserver
* GuardianObserver
* HealthRecordObserver
* any document/payment observers if present

Identify:

* duplicated rules
* missed fields
* observer loop risks
* updateQuietly usage
* unsafe status changes

### Candidate Forms

Audit backend validation for:

* Data Diri
* Data Wali
* Data Kesehatan

Identify mismatch between:

* controller validation
* model `isComplete()`
* observer logic
* frontend progress indicators

### Documents

Audit:

* upload flow
* delete flow
* staff/admin verify/reject flow
* required document list
* transfer letter logic
* candidate status sync triggers

### Payment

Audit:

* upload/create flow
* manual verify/reject
* gateway callback/webhook
* paid status sync
* candidate status sync triggers

### Exam

Audit:

* candidate exam routes
* assignment access
* attempt start access
* whether exam is blocked until candidate is `verified`
* whether email verification is respected

### Dashboard/Menu

Audit:

* sidebar locked/unlocked behavior
* dashboard props
* progress cards
* hidden/visible menu policy
* whether frontend duplicates lifecycle logic

---

## 9. Events That Must Trigger Sync

Status sync must be called after relevant events, including when safe:

* candidate data updated
* guardian data updated
* health record updated
* document uploaded
* document deleted
* document verified/rejected
* payment created/uploaded
* payment manually verified/rejected
* payment gateway/webhook marks payment paid
* transfer status changes if applicable
* email verified event may refresh gate-related state, but must not be required for `draft -> submitted`

Adapt trigger points to actual code.

Do not call service blindly if candidate relation may be null.

Do not create observer loops.

---

## 10. Data Rule Audit

Use actual backend source as the final reference.

Do not invent requirements without evidence.

Known candidate core fields likely include:

* phone_number
* religion
* family_card_number
* postal_code
* school_npsn
* program_choice

Known guardian fields likely include:

* no_kk
* income_type
* father_status
* mother_status
* mother_name
* marital_status

Conditional guardian fields likely apply when `marital_status != nikah_tercatat`.

Health completion currently may have inconsistent rules.

The agent must resolve this carefully:

* identify current backend validation
* identify model `isComplete()`
* identify observer-required fields
* choose the safest consistent rule
* document the decision

Verification requirements likely include:

* required documents verified
* transfer letter verified if `is_transfer = true`
* payment paid
* BPJS/health document if currently required by existing checklist

Do not change document policy casually.

If a requirement is unclear, document it and choose the least destructive behavior.

---

## 11. Gate Enforcement

Backend must enforce gates.

Frontend locked state is not enough.

Document upload routes must reject access when document gate fails.

Payment routes must reject access when payment gate fails.

Exam routes must reject access when exam gate fails.

Use the project’s existing architecture where possible:

* service checks
* middleware
* policy
* controller guard

But all checks must call the central gate service.

Do not duplicate gate rules manually in every controller.

---

## 12. UI Impact

Do not redesign UI in this task.

Only make minimal UI changes necessary to display locked states and gate reasons.

The menu should show locked features, not hide them completely.

Candidate should understand the roadmap:

* Data Diri
* Data Wali
* Data Kesehatan
* Dokumen
* Pembayaran
* Ujian Seleksi

Locked pages should show clear reasons.

Do not make large visual changes.

Do not work on admin exam UI.

Do not work on XLSX UI.

---

## 13. Documentation Output

Every important finding must be written to the proper docs folder.

Use:

* `docs-ai/audit/`
* `docs-ai/state/`
* `docs-ai/features/`

Required docs:

1. Update durable state:

```txt
docs-ai/state/selection-progress.md
docs-ai/state/selection-known-bugs.md
docs-ai/state/selection-next-actions.md
```

2. Update audit:

```txt
docs-ai/audit/selection-exam-audit.md
```

3. Create or update feature documentation:

```txt
docs-ai/features/candidate-status-flow.md
```

4. Create a critical audit report:

```txt
docs-ai/audit/candidate-lifecycle-critical-audit.md
```

The critical audit report must include:

* source files audited
* root cause
* lifecycle decision
* gate decision
* repeated logic found
* logic consolidated
* remaining risks
* tests added
* known limitations
* future recommendations

---

## 14. Tests Required

Add or update tests extensively.

Suggested coverage:

1. Candidate moves from `draft` to `submitted` when core requirements are complete.
2. Candidate does not remain stuck when the last completed field is `marital_status`.
3. Candidate does not remain stuck when the last completed field is a conditional guardian field.
4. Candidate does not move to `submitted` when conditional guardian fields are missing.
5. Candidate does not move to `submitted` when health requirement is incomplete.
6. Candidate does not jump unsafely from `draft` to `verified`.
7. Candidate moves to `verified` only after required documents are verified and payment is paid.
8. Accepted candidate is not overwritten by automatic sync.
9. Rejected candidate is not overwritten by automatic sync.
10. Document upload is locked while candidate is `draft`.
11. Document upload is locked while email is unverified.
12. Document upload is allowed when candidate is `submitted` and email verified.
13. Payment is locked while candidate is `draft`.
14. Payment is locked while email is unverified.
15. Payment is allowed when candidate is `submitted` and email verified.
16. Exam is locked until candidate is `verified`.
17. Exam is locked if email is unverified.
18. Document verification triggers status sync.
19. Payment manual verification triggers status sync.
20. Gateway/webhook paid event triggers status sync.
21. Transfer candidate requires transfer letter if applicable.
22. Gate summary returns human-readable locked reasons.
23. Repeated sync calls are idempotent.
24. No observer loop occurs during status update.

Use existing testing patterns.

If any test is impossible due to missing factory/data setup, document why and add the closest meaningful coverage.

---

## 15. Verification Commands

Run:

```txt
php artisan test --testsuite=Feature
php artisan test tests/Feature/CandidateStatusFlowTest.php
php artisan test tests/Feature/CandidateFeatureGateTest.php
git diff --check
```

Run `npm run build` if frontend files are touched.

Run:

```txt
php artisan route:list --path=dashboard
```

if routes or middleware are touched.

Do not commit broken code.

---

## 16. Mandatory Critical Audit Loop

This task requires repeated audit.

Do not commit after the first working implementation.

Loop:

1. Implement candidate lifecycle services.
2. Refactor triggers.
3. Add tests.
4. Run tests.
5. Audit repeated logic.
6. Audit gate enforcement.
7. Audit observer loop risk.
8. Audit final status protection.
9. Audit missing requirement output.
10. Audit payment and exam gates.
11. Fix critical/high issues.
12. Repeat until stable.

Commit only when:

* all relevant tests pass
* lifecycle logic is centralized
* repeated status rules are removed or justified
* gates use central service
* no unsafe final status overwrite exists
* no known critical/high issue remains
* docs are updated
* working tree contains only relevant changes

If the agent cannot reach this standard, do not commit.

Stop and report blockers instead.

---

## 17. Commit Rule

If verification passes and audit loop is clean, create one commit:

```txt
fix(candidate): centralize lifecycle and gates
```

Do not push.

Do not merge.

Do not rebase.

Do not reset.

Do not amend previous commits unless explicitly instructed.

---

## 18. Final Report

Final report must be in Indonesian.

Include:

* branch created
* root cause
* critical findings
* services/classes created
* repeated logic consolidated
* status transition rules
* feature gate rules
* email verification decision
* files changed
* tests added/updated
* docs created/updated
* verification commands and results
* audit loop result
* commit hash if created
* remaining limitations
* recommended next task
