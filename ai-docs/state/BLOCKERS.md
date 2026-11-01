# Audit Blockers

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
