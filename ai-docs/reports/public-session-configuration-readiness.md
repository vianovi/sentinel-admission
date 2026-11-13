# Public Session Configuration — Readiness Audit

Date: 2026-11-12
Source commit: `4c7b659` (`feature/public-exam-rebuild`)
Classification: **NOT READY FOR PRODUCTION SIGN-OFF** — operational gaps and unverified concurrency/end-to-end coverage.

## Implementation follow-up — 2026-11-12 (uncommitted)

- S-01: guarded atomic draft configuration editor implemented, with regression for configuration, reordered assignments, invalid-input rollback and started-participant/non-draft/staff guards.
- S-02: publish rechecks active categories and active non-deleted questions; rejection tests added and previous unrealistic fixtures corrected.
- S-05: roster pagination implemented; Playwright confirmed page 2 and participant 51 with accurate total.
- S-06: page timestamps serialized with offset; display uses configured exam timezone; browser-local input is explained. Cross-timezone browser coverage still pending.
- S-08: clipboard success now awaits the operation with failure feedback; denied-permission browser scenario pending.
- S-03: owner chose forced termination on session close (D-010); implementation pending. S-04 token policy still unanswered; current close/token lifecycle unchanged. S-07 remains unverified.
- Verification: 172 tests passed, 9 legacy skipped, 1480 assertions; Pint/build passed. Original findings below are retained as audit evidence; these updates do not constitute production approval.

### Session-end update

Owner resumed execution and clarified that force-close auto-submits active attempts and scores saved answers. This behavior is implemented locally with shared scoring, transactional/idempotent close, lock-order protection and focused/full SQLite-backed regression coverage. Owner also chose replacement-only room tokens: issuing a new token atomically revokes its predecessors, with an admin confirmation and accurate revoked-token feedback. MariaDB concurrency and browser behavior remain unverified because no isolated MariaDB/UI fixture was available. A comparable Hasil Ujian module is still deferred and requires scope. See [latest handoff](../state/HANDOFF.md) for current evidence and remaining tasks.

## Scope and evidence

Read-only review of public session creation, package assignment, publication, schedule, token issuance, roster, participant entry, and closing. No application fixes, schema changes, or live database mutations during this audit. Owner accepted the preceding UI milestone; that is not production approval.

- `php artisan test --compact`: **171 passed, 9 skipped, 1453 assertions**, exit 0, 7.03s. The nine legacy skips were already present; they are not passing tests.
- `php artisan route:list --path=public-v2 --except-vendor`: eight routes, exit 0.
- `git diff --check`: exit 0 before milestone commit.
- Latest frontend build from the implementation checkpoint: exit 0, 10.23s. No application changes since that build.
- Previous isolated Playwright smoke covers package import/review/publication and session detail/inline roster, not complete four-subject session operation.
- Graphify was queried, but returned mostly legacy nodes rather than current V2 symbols. Current source files and routes were inspected directly; graph results are not evidence of complete V2 coverage.

## Dependency map

```text
Public Categories -> Public Packages -> Public Questions
                           |
                    session_packages
                 (subject + sort_order)
                           |
                    Public Sessions
                     /           \
                 Tokens       Participants
                     \           |
                      join -> Subject Attempts -> Answers -> Results
```

All exam entities above use `exam_public_*` tables. Internal exam tables and retired entry points must remain separate.

| Responsibility | Implementation |
|---|---|
| Admin page/detail data | [PublicExamPagesController](../../app/Http/Controllers/Dashboard/Admin/PublicExam/PublicExamPagesController.php) |
| Admin UI and JSON requests | [Sessions.tsx](../../resources/js/Pages/Dashboard/Admin/PublicExam/Sessions.tsx) |
| Create, replace packages, publish, close, issue token | [PublicSessionV2Controller](../../app/Http/Controllers/Dashboard/Admin/Exam/PublicSessionV2Controller.php) |
| Roster, participant codes, CSV | [PublicParticipantController](../../app/Http/Controllers/Dashboard/Admin/Exam/PublicParticipantController.php) |
| Join, start, answer, submit | [PublicExamFlowController](../../app/Http/Controllers/Exam/PublicExamFlowController.php) |
| Scoring and repeat eligibility | [PublicExamResultService](../../app/Services/Exam/PublicExamResultService.php) |
| FK/unique constraints | [Public schema migration](../../database/migrations/2026_10_31_232459_create_exam_public_tables.php) |
| HTTP authorization/entry points | [Exam routes](../../routes/exam.php) |

## Implemented safeguards

- Creation requires exactly four published, configured packages from four distinct active subjects; order is persisted in the assignment pivot.
- Composite package/subject FK and unique session/subject and session/package constraints prevent mismatched assignments and duplicates.
- End time must follow start time. Input offsets are normalized to application timezone; an existing test verifies storage.
- Draft package replacement is blocked after a participant joins or an attempt exists, revokes room tokens, and preserves roster.
- Join checks published state, opening/closing window, token expiry/quota, and a one-time participant code. Participant secret is hashed and later requests require the secret.
- Starting a subject rechecks session window, package status, active subject, settings, and active questions. Sequential ordering and one active attempt are enforced.
- Attempt expiry is capped at session closing time. Existing tests cover free/sequential flows, foreign participant/question rejection, retry policy, and expired-attempt submission.

These are source/test-backed safeguards, not a claim of complete production hardening.

## Findings and verification limits

### S-01 — MEDIUM: draft configuration cannot be corrected fully

**Evidence:** admin routes expose only `PUT .../sessions/{session}/packages`. UI editing hides title, dates, and order controls; only package IDs are submitted. Description/instructions are accepted on creation by the backend but absent from the current UI.

**Verified:** source and route inventory. No runtime reproduction needed to establish missing controls/endpoints.

**Impact:** an administrator cannot correct a mistaken schedule/title/order through the normal flow.

**Next:** add a guarded draft configuration edit, expose instructions and schedule preview, preserve roster and already-started session restrictions. Do not silently enable post-start editing.

### S-02 — MEDIUM: publication readiness differs from start readiness

**Evidence:** `publish()` checks four published/configured packages and future closing time, but does not join active subjects or check active question availability. `start()` performs both checks. A subject can be disabled after draft creation via category update.

**Verified:** source. Disabled-category-after-create and empty-question publication scenarios are **not yet runtime-tested**. Existing session tests construct published packages without questions, so their successful publication does not prove an executable session.

**Next:** make publish-time readiness explicit and align it with the participant start requirements; add realistic fixtures and regression coverage.

### S-03 — MEDIUM: closing semantics conflict with UI wording

**Evidence:** UI says participants cannot work after close. `close()` only updates session status. `join()`/`start()` reject closed sessions, while `attempt()`, `answer()`, and `submit()` authenticate the participant and check attempt state/time without checking session closed state.

**Verified:** source path; close-during-active-attempt behavior not reproduced in this audit.

**Next:** decide whether close blocks only new entry or immediately stops ongoing attempts. Preserve submitted answers and explicitly define final submission/auto-submit behavior before changing policy.

### S-04 — MEDIUM: token lifecycle is not represented accurately

**Evidence:** token creation inserts another token without revoking predecessors and checks published status but not elapsed closing time. Page data selects the latest unexpired token without checking usage quota or session status/window. Participant validation checks all these conditions. UI does not provide full token history, quota configuration, or explicit revocation.

**Verified:** source. Multiple tokens are not automatically a security defect; intended issuance/rotation policy is not documented here.

**Next:** distinguish scheduled/usable/exhausted/expired/closed states. Decide whether multiple valid tokens are intentional and expose appropriate controls. Do not imply that issuing a token rotates earlier ones.

### S-05 — MEDIUM: roster UI exposes only the first page

**Evidence:** roster endpoint uses `paginate(50)`; UI stores only `response.data.data` and renders `participantsList.length` without pagination controls or total. Subsequent pages are inaccessible through this view.

**Verified:** source contract. Browser test with 51+ participants is pending.

**Next:** consume pagination metadata, support page navigation, distinguish total from visible count, retain registration feedback and refresh the correct page.

### S-06 — MEDIUM: session timestamp output omits timezone

**Evidence:** creation normalizes dates to application timezone. Page controller returns raw database timestamps; UI parses with `new Date(isoString)`, which interprets zone-less strings using client/browser conventions. Application default timezone is Asia/Jakarta but can be overridden.

**Verified:** source contract. Cross-timezone/browser rendering not tested.

**Next:** serialize explicit-offset/UTC timestamps and display the intended exam timezone. Test local input, server storage, and browser rendering together.

### S-07 — UNVERIFIED: concurrency and production database behavior

**Evidence:** publish/replacement lock session rows; join locks token and participant rows but reads session without a session lock; package eligibility queries do not consistently lock packages. Closing and token issuance use different transaction boundaries.

**Verified:** lock placement only, **not a demonstrated race**. SQLite tests do not establish MariaDB row-lock behavior.

**Next:** isolated MariaDB concurrency checks for join versus close/replacement, publish versus package deletion, and token quota exhaustion; then harmonize lock order where evidence requires it.

### S-08 — LOW: clipboard success is reported before completion

**Evidence:** UI calls `navigator.clipboard.writeText()` without awaiting/catching, then immediately shows success.

**Verified:** source. Permission-denied/insecure-context behavior not reproduced.

**Next:** await success and show actionable failure feedback.

## Production gate map

| Gate | Assessment |
|---|---|
| G0 scope/dependencies | Mapped for public session configuration |
| G1 correctness | Open: S-01 through S-06; close semantics require explicit policy |
| G2 tests/build | Existing suite/build pass; edge cases above remain uncovered |
| G3 security | Existing auth/ownership tests pass; not a complete security/advisory audit |
| G4 integrity | Constraints and guards mapped; MariaDB concurrency unverified |
| G5 runtime/config | Not evaluated for production deployment in this task |
| G6 evidence/docs | This report plus current state/handoff |
| G7 acceptance | Previous UI accepted; revised session flow and full E2E still pending |

## Recommended implementation order

1. Draft configuration editor and explicit timezone display; keep four-distinct-subject rules.
2. Publish-readiness summary consistent with participant start checks.
3. Resolve close/token lifecycle policy, then implement and test transitions.
4. Roster pagination and accurate token/participant feedback.
5. Isolated full admin-to-participant browser scenario: four packages, free/sequential sessions, token, registration, join, submit/retry, close, results/export; include 51+ roster and timezone cases.
6. MariaDB concurrency checks and remaining production release gates.

No session fixes were implemented as part of this audit.
