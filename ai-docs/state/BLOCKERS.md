# Audit Blockers

## B-007 — Local public exam attempt panel failed on unapplied security migration

- Date: 2026-11-14
- State: resolved locally on 2026-11-14 with explicit owner approval
- Severity: medium — participants may be unable to open a newly started attempt in local/dev mode
- Evidence: `php artisan migrate:status --no-ansi` reports `2026_11_14_135419_add_security_tracking_to_exam_public_subject_attempts_table` as `Pending`. `PublicExamFlowController::attempt()` reads `$record->violations_count`, and the frontend loads that endpoint immediately after `POST public-exam.start` returns an attempt ID. The pending migration adds `violations_count` and `metadata` to `exam_public_subject_attempts`.
- Root-cause assessment: without the column, Laravel can fail while serializing the attempt response after the start endpoint has created the attempt. The browser console/network could not be inspected in this turn because the available browser session was `about:blank`; this exact runtime exception is therefore strongly indicated, not directly observed.
- Resolution: after owner approval, applied only `2026_11_14_135419_add_security_tracking_to_exam_public_subject_attempts_table.php` to environment `local`, database `sentinel_admission_db`. `php artisan migrate:status --no-ansi` now reports it as `[6] Ran`. `PublicExamFlowTest.php` passes (25 tests / 327 assertions), and `/public-exam` renders in the local browser.
- Remaining verification: opening a real attempt in the browser was not exercised because no valid participant/token session was available. The migration mismatch is fixed; do not claim a complete end-to-end start until tested with a valid session.
- No participant or exam rows were created or modified.

## B-006 — Public session automatic token interval requires schema approval

- Date: 2026-11-14
- State: awaiting owner approval; implementation not started
- Requested behavior: public session administration has no participant registration, token creation, or manual rotation controls; share portal URL, token-prefilled URL, or token text; maintain one current token and rotate automatically at a configurable minute interval.
- Evidence from source inspection: `PublicSessionV2Controller::token` currently replaces tokens manually; `PublicExamFlowController::join` requires an existing participant code; the public session schema has no rotation interval column. No runtime verification has been performed in this continuation.
- Concrete proposal: add `exam_public_sessions.token_rotation_minutes` as an unsigned integer with default 5; expose a positive minute interval in session settings; issue the token when publishing and rotate atomically on the server, rejecting expired tokens without interrupting participant sessions already authenticated. Remove manual token controls and provide the three requested sharing values.
- Approval boundary: repository AGENTS instructions prohibit schema changes without explicit approval. Obtain approval for the new interval column before implementation. Separately confirm whether participants should enter their own name and school at the public portal instead of receiving an administrator-issued participant code.
- Existing uncommitted changes to the public Sessions page and HANDOFF were preserved.

## B-001 — Public production content is unverified and contradictory

- ID: B-001
- Date: 2026-07-14
- Slice: 01 Public/shared runtime
- Severity: release-blocking business/content integrity
- State: open
- Evidence: `../reports/01-public-shared-runtime/public-shared-runtime-audit.md` and `../reports/evidence/01-public-shared-runtime/2026-07-14/public-contract.md`
- Why autonomous progress is unsafe: The landing page is explicitly configured to publish placeholder third-party media and unrelated claims. Footer address/map/legal/brochure contracts conflict. The repository contains no authoritative approved values, and the auditor must not invent production data or silently remove owner-required content.
- Question requiring owner decision: Should the release candidate use an owner-supplied verified public-content manifest, or should all unverified showcase/contact/map/legal elements be removed/disabled until verified content is available?
- Safe options: (A) provide/identify approved address, map, contacts, social/legal URLs, brochure format, showcase assets, and claims; (B) authorize temporary removal/disabled states for every unverified element.
- Temporary containment: Do not promote Task 01 and do not deploy the current public landing surface.
- Next action after decision: Implement the chosen content boundary, fix the confirmed technical findings, add focused public tests, run build/regression, and reclassify Task 01.

## B-002 — Exam Media ZIP upload permits unsafe archive extraction

- ID: B-002
- Date: 2026-10-18
- Slice: Exam Engine / Bank Media
- Severity: high security — ZIP Slip / arbitrary file write
- State: deferred / contained by disabling ZIP upload
- Original evidence: `app/Http/Controllers/Dashboard/Admin/Exam/AdminExamMediaController.php` previously passed admin-uploaded archives directly to `ZipArchive::extractTo()` before validating archive entries.
- Impact if reintroduced unsafely: A compromised admin account could write outside the intended temporary directory, overwrite writable files, or exhaust storage through an archive bomb.
- Temporary containment: ZIP support was removed from backend validation, upload execution, and the admin file picker. Individual or multiple image upload remains available.
- TODO if ZIP support is needed later: Implement bounded entry-by-entry extraction; reject absolute/traversal paths and symlinks; limit entry count and total uncompressed bytes; verify actual image MIME/content; always clean temporary files in `finally`; add malicious ZIP regression tests.
- Next action: Keep ZIP support disabled while prioritizing the public exam experience and question management.

## B-003 — Public exam resume can reissue an attempt session token from low-entropy identity data

- ID: B-003
- Date: 2026-10-18
- Slice: Exam Engine / Public Exam
- Severity: high security — session takeover / authentication bypass
- State: resolved on `feature/exam-panel-focus-layout`
- Evidence: `app/Http/Controllers/Exam/PublicExamController.php` and public route `POST /exam/attempts/{attempt}/resume`.
- Confirmed behavior: A caller who supplies an in-progress attempt ID plus matching participant name and school receives a fresh `guest_exam_token` cookie. The endpoint does not require the original room/session token, an existing guest session secret, email/phone verification, or a dedicated high-entropy recovery secret.
- Impact: Anyone who learns or guesses an attempt ID and knows a participant's name/school can take over the active attempt, read its questions and saved answers, change answers, or submit it. Sequential numeric attempt IDs and commonly known school rosters increase practical exposure.
- Resolution: Resume now requires the 40-character high-entropy attempt-bound recovery token stored by the originating browser in addition to participant identity. A successful resume rotates the token, invalidating replay of the old recovery credential.
- Verification: Identity-only resume is rejected, valid recovery succeeds, old-token replay is rejected, and the full suite passes.
- Next action: Continue auditing public exam UI and question-management behavior.

## B-004 — Legacy public start reissues an active attempt cookie using a shared room token and name

- ID: B-004
- Date: 2026-11-01
- Slice: Exam Engine / Public Exam Rebuild
- Severity: high security — active attempt takeover / authentication bypass
- State: contained on `feature/public-exam-rebuild` (legacy public routes return HTTP 410; admin legacy session routes and token issuance disabled)
- Static evidence: `app/Services/Exam/ExamAttemptService.php` lines 91–113 selects an existing in-progress attempt by session ID, package ID, and case-insensitive guest name, then returns it without checking the original `guest_session_token`. `app/Http/Controllers/Exam/PublicExamController.php` lines 74–113 exposes this path through `POST /exam/p/{token}/start` and returns that attempt's `guest_exam_token` cookie. The separate resume endpoint requires a high-entropy recovery token, but the start path bypasses it.
- Impact before containment: anyone with the shared room token and a participant's name could receive the participant's active attempt cookie; the school field was not checked in the existing-attempt lookup.
- Containment authorized by owner: `RetireLegacyPublicExam` returns HTTP 410 for the legacy participant routes and legacy admin session/token routes; the old admin menu entry and scheduled legacy token rotation were removed. Internal session store/update force `is_public = false`, and legacy token issuance through internal session routes is blocked. New `public-exam.*` routes and the new admin participant/CSV routes remain available. An unresolved ID may return 404 at model binding before middleware; no legacy attempt is exposed.
- Verification: focused retirement + new-flow tests `15 passed, 112 assertions`; full Pest suite `135 passed, 9 skipped, 996 assertions`; `npx tsc --noEmit`, Pint and `git diff --check` passed. Nine old-behavior tests were preserved but skipped explicitly because the endpoints are retired. The legacy service still contains the original logic but has no reachable HTTP entry in the tested routes; do not re-enable these routes without fixing that logic and restoring regression coverage.
- Next action: build and verify the new admin public-session/bank and participant UI before exposing the replacement in navigation.

## B-005 — New public session publish flow fails focused test

- ID: B-005
- Date: 2026-11-01
- Slice: Exam Engine / Public Exam Rebuild
- Severity: release-blocking functional regression (new work not committed)
- State: resolved locally on `feature/public-exam-rebuild`; human visual review remains pending
- Evidence: `php artisan test --compact tests/Feature/PublicSessionV2Test.php` failed twice after attempts to identify the 404 and adjust timestamp serialization. Latest failure: `tests/Feature/PublicSessionV2Test.php:24`, `assertJsonPath('status', 'published')` received null on `POST admin.exams.public-v2.sessions.publish`. Earlier test reached `public-exam.session` and received 404 after an apparently successful publish response; exact root cause is not verified. `php -l app/Http/Controllers/Dashboard/Admin/Exam/PublicSessionV2Controller.php` passes; route list confirms publish route exists.
- Impact: cannot publish or trust newly configured public sessions. Admin UI and public release must remain disabled.
- Safe next step: inspect response status/body for publish and stored `opens_at`/`closes_at` in isolated SQLite test without secrets; confirm whether `abort_unless` rejects the timestamp or four published package relation, then fix and re-run focused/full tests. Do not claim successful publication or commit this milestone while failing.
- Resolution evidence (2026-11-01): UTC-offset input normalized to application timezone before storage; session publish and participant token lookup verified by `PublicSessionV2Test.php`. Focused tests: 11 passed / 115 assertions; full suite: 140 passed, 9 skipped / 1107 assertions; `npm run build`, Pint, and `git diff --check` passed. Browser/manual visual verification still pending; do not classify visual design as approved.
