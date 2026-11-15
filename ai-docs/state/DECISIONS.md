# Durable Audit Decisions

## D-013 — Public exam failure remains final, with an internal evaluation marker

- Date: 2026-11-15
- Status: owner-approved policy; implementation deferred until an explicit later instruction.
- Decision: After any permitted per-subject remedial is exhausted, a participant whose aggregate score remains below the session threshold remains `Tidak lulus`. The result requires an internal `Perlu Evaluasi` marker/note for the exam team; it does not create an automatic passing outcome or an additional remedial attempt.
- Scope: Public Exam → Hasil Ujian administration. Participant-facing score visibility remains governed by each package's existing `show_result_to_participant` setting.
- Pending implementation choice: the exact persisted representation of `Perlu Evaluasi` (derived display versus stored review state) must be selected when implementation is authorized.

## D-012 — Public sessions contain one to five distinct subjects

- Date: 2026-11-13
- Status: owner-approved and implemented locally; SQLite/MariaDB focused regression and build pass.
- Supersedes the fixed-four-subject count requirement only. Each selected package must belong to a different subject; sessions require 1–5 published, configured packages.
- The stored session assignments are the source of truth, with no duplicate count column. Publication requires every assigned package to be ready. Assignments remain immutable after publication or participant entry under the existing guards.
- Completion requires primary scores for every assigned subject. Average equals the sum of effective subject scores divided by the assigned package count. Passing remains strictly above the session threshold using the unrounded aggregate. Existing per-package retry and score-visibility rules remain unchanged.

## D-011 — Issuing a public room token revokes its predecessors

- Date: 2026-11-12
- Status: owner-approved and implemented locally; SQLite-backed regression and build pass, MariaDB concurrency pending.
- Decision: Creating a new room token for a public exam session revokes all older room tokens for that session. The newest token is the only valid room token.
- Reason: Token issuance is a security rotation boundary; a replacement must close access through previously distributed or leaked codes.
- Constraints: Already-joined participants keep their hashed participant session secret and may continue only while the session remains published. Token replacement must be atomic with session-status validation and report how many tokens were revoked.

## D-010 — Closing a public session forcibly stops ongoing attempts

- Date: 2026-11-12
- Status: owner-approved policy; implementation pending.
- Decision: Owner selected forced termination, not allowing already-active attempts to continue until their original time limit, when an administrator closes a public exam session.
- Scope: Public Exam session close. Do not alter internal exam behavior.
- Follow-up: Owner mentioned a similar feature/module under Hasil Ujian as a possible later addition. Its UI, per-participant/bulk scope and controls are not yet specified; do not treat this as authorization to build that module now.
- Implementation constraints: Preserve previously saved answers and existing completed results. Trace and test scoring, finalization, idempotency, and concurrent answer/submit requests before claiming completion. Exact status representation and handling of unstarted subjects are not specified by this decision; raise material policy gaps before implementing assumptions.
- Separate token choice: settled by D-011; new issuance revokes all predecessors.
- Scoring clarification (2026-11-12): Owner selected auto-submit and scoring from saved answers. Active attempts become `auto_submitted`, use the existing participant-submit scoring path, and refresh participant results. Already-finished attempts remain unchanged.
- Implementation status: Implemented locally after owner resumed work; focused and full SQLite-backed regressions pass. MariaDB concurrency verification remains pending.

## D-001 — Main is human-controlled

- Status: active
- Decision: Auditor never commits, merges, or deploys to `main`.
- Reason: `main` must remain the clean production branch.
- Human approval required before main promotion.

## D-002 — Visual approval is human-only

- Status: active
- Decision: Auditor may review frontend code and browser functionality when tools allow, but cannot approve visual quality.
- Required label: `HUMAN VISUAL REVIEW REQUIRED`.

## D-003 — No production data operations

- Status: active
- Decision: No production migrations, destructive data operations, or real sensitive records in tests.

## D-004 — Evidence before claims

- Status: active
- Decision: Every pass classification requires reproducible evidence.

## D-005 — Use Strategy A for the release candidate

- Status: active
- Decision: Use Strategy A — Full integrated release candidate — from verified `develop` commit `1113160ebee605ebad439f53f3322f9deb060711`.
- Evidence: `main` (`8d5efe5f910b324d0b7fd4b293256a0675af0f77`) is an ancestor of `develop`; `main...develop` has no main-only commits and 188 develop-only commits. The integrated delta spans 569 files across routes, schema, candidate lifecycle, documents, payment, exam, staff/admin operations, and shared frontend/runtime code.
- Reason: The history and source are cross-cutting enough that selective commit promotion or reconstructed slices would have an unreliable dependency boundary.
- Release candidate: `release/production-candidate`, initially pointing to the verified baseline commit.

## D-006 — Correct the audit workspace installation path

- Status: active
- Decision: Relocate the committed foundation from `docs-ai/docs/ai-docs/` to the mandated `docs/ai-docs/` path on the Task 00 audit branch.
- Evidence: `AGENTS.md`, `INSTALL.md`, and every internal workspace reference require `docs/ai-docs/`; commit `1113160` left the package nested under the pre-existing `docs-ai/` tree.
- Reason: Durable state cannot be reliably discovered or resumed at the committed location.

## D-007 — Preserve framework auth notifications and centralize email presentation

- Status: active for the email-design slice
- Decision: Keep Laravel's `VerifyEmail` and `ResetPassword` notification classes, token generation, and routes. Customize only their `toMailUsing` presentation callbacks and render both HTML/plain-text views from `EmailDesignSystem`.
- Reason: This preserves existing authentication behavior and test contracts while providing one reusable email design surface for future transactional notifications.

## D-008 — Sequential Admission Pipeline & Exam Readiness Gate Architecture

- Status: active
- Decision: Adopt the "Document-First, Pay-to-Validate" admission funnel.
  1. `health.bpjs_card_path` is strictly supplementary/optional (does not block `submitted` or `verified` status).
  2. Uploading all mandatory documents unlocks the Payment gateway.
  3. Candidate exam entry is strictly gated by `Payment::STATUS_PAID` + active admin session assignment (without waiting for manual staff document approval).
  4. Manual staff document verification serves as the final qualification gateway for `accepted` status.
- Reason: Eliminates friction for candidates without active BPJS, prevents premature exam blocking, and gives clear sequential progression from Form -> Documents -> Payment -> Exam -> Final Review.

## D-009 — Playwright Go / MCP Driver Local Cache Resolution

- Status: active
- Decision: Configured Playwright Go to use a locally packaged Playwright 1.57.0 driver in `~/.cache/ms-playwright-go/1.57.0/` pointing to Node and the system Chromium executable at `/usr/bin/chromium-browser`.
- Reason: Microsoft CDN deprecated `playwright-1.57.0-linux.zip` returning a 404 error during automatic download. Packaging the core driver and bypassing the network fetch allows local tests and subagents to run reliably without internet requests.
