# Candidate Lifecycle Critical Audit

Date: 2026-07-01  
Branch: `critical/candidate-lifecycle-gates`

## Source Files Audited

- `app/Observers/CandidateObserver.php`
- `app/Observers/GuardianObserver.php`
- `app/Observers/HealthRecordObserver.php`
- `app/Models/Candidate.php`
- `app/Models/Guardian.php`
- `app/Models/HealthRecord.php`
- `app/Services/CandidateVerificationChecklist.php`
- `app/Support/CandidateDashboardData.php`
- `app/Http/Controllers/Dashboard/Candidate/DocumentController.php`
- `app/Http/Controllers/Dashboard/Candidate/PaymentController.php`
- `app/Http/Controllers/Dashboard/Candidate/Exam/ExamController.php`
- `app/Http/Controllers/Dashboard/Candidate/Exam/AttemptController.php`
- `app/Http/Controllers/Dashboard/Staff/IndexController.php`
- `app/Http/Controllers/Webhook/MidtransController.php`
- `routes/web.php`
- candidate document/payment/exam React pages
- existing feature tests for verification and online selection exam

## Root Cause

Candidate lifecycle rules were duplicated and incomplete:

- Observers owned `draft -> submitted` rules and missed fields such as `marital_status` and conditional guardian fields.
- `HealthRecord::isComplete()` and dashboard health progress required more fields than the observer.
- `CandidateVerificationChecklist` could update a `draft` candidate directly to `verified` when documents/payment/BPJS were complete.
- Document/payment review and Midtrans webhook flows did not share one lifecycle sync path.
- Document, payment, and exam routes relied mostly on role/ownership and frontend state, not central lifecycle gates.

## Lifecycle Decision

The central lifecycle is:

```txt
draft -> submitted -> verified -> accepted / rejected
```

Automatic sync:

- moves `draft -> submitted` only when core completion passes
- moves `submitted -> verified` only when verification completion passes
- can pass through `submitted` in one sync if a previously stuck draft already satisfies all requirements
- demotes non-final `verified -> submitted` when verification requirements become incomplete
- demotes non-final `submitted/verified -> draft` when core completion becomes incomplete
- never overwrites `accepted` or `rejected`

## Gate Decision

Email verification remains separate from candidate status.

Documents and payment are allowed only when:

- candidate is at least `submitted`
- account email is verified

Exam is allowed only when:

- candidate is at least `verified`
- account email is verified

The frontend can show locked states, but backend routes enforce the same central gates.

## Repeated Logic Found

- Candidate required fields existed in observer comments/code, model helpers, and dashboard support code.
- Guardian conditional field logic existed in controller validation, model progress logic, and observer logic.
- Health required fields differed between observer, model, and dashboard.
- Required document lists existed in checklist/dashboard/controller contexts.
- Payment and exam page access logic was inferred locally rather than centrally gated.

## Logic Consolidated

New central services:

- `CandidateCompletionEvaluator`
- `CandidateVerificationEvaluator`
- `CandidateStatusService`
- `CandidateGateService`
- `CandidateRequirement`
- `CandidateEvaluationResult`
- `CandidateStatusResult`

Refactors:

- Observers now trigger `CandidateStatusService` only.
- Models reuse central evaluator constants for completion helpers.
- Dashboard data uses central completion, verification, and gate services.
- Staff/admin review actions call central status sync.
- Payment service syncs lifecycle after proof upload, manual verification/rejection, gateway polling, and webhook handling.
- Candidate document/payment/exam controllers enforce central gates.
- Candidate secure-file document/payment preview routes check central gates.

## Tests Added

- `tests/Feature/CandidateStatusFlowTest.php`
  - draft to submitted
  - last field `marital_status`
  - last conditional guardian field
  - conditional guardian missing
  - health incomplete
  - no unsafe draft to verified
  - submitted to verified after docs/BPJS/payment
  - final status protection
  - transfer letter requirement
  - verified demotion after document rejection
  - idempotent repeated sync

- `tests/Feature/CandidateFeatureGateTest.php`
  - document gate for draft/unverified/allowed states
  - payment gate for draft/unverified/allowed states
  - exam locked for submitted/unverified states
  - gate summary human-readable reasons
  - Midtrans webhook paid event triggers candidate verification

Updated existing tests:

- `tests/Feature/CandidateVerificationChecklistTest.php`
- `tests/Feature/OnlineSelectionExamSecurityTest.php`

## Remaining Risks

- No browser screenshot pass was run for the locked document/payment/exam pages.
- Existing seeded/demo candidates may need a one-time lifecycle sync if their status predates this restructure.
- `CandidateVerificationChecklist` remains as a compatibility wrapper; future code should use `App\Services\CandidateStatus` directly.

## Known Limitations

- `accepted` and `rejected` remain manual decisions and are not tied to exam result pass/fail.
- Email verification gates serious features but does not change candidate lifecycle status.
- BPJS/JKN remains part of verification because it was already part of the existing checklist/staff health-document policy.

## Future Recommendations

- Add an artisan command to resync all non-final candidates after deployment.
- Add browser/E2E checks for locked document, payment, and exam pages at mobile widths.
- Consider a dedicated staff/admin audit log for automatic lifecycle transitions if operational traceability becomes important.
