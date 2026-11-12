# Durable Audit Decisions

## D-010 — Closing a public session forcibly stops ongoing attempts

- Date: 2026-11-12
- Status: owner-approved policy; implementation pending.
- Decision: Owner selected forced termination, not allowing already-active attempts to continue until their original time limit, when an administrator closes a public exam session.
- Scope: Public Exam session close. Do not alter internal exam behavior.
- Follow-up: Owner mentioned a similar feature/module under Hasil Ujian as a possible later addition. Its UI, per-participant/bulk scope and controls are not yet specified; do not treat this as authorization to build that module now.
- Implementation constraints: Preserve previously saved answers and existing completed results. Trace and test scoring, finalization, idempotency, and concurrent answer/submit requests before claiming completion. Exact status representation and handling of unstarted subjects are not specified by this decision; raise material policy gaps before implementing assumptions.
- Separate unresolved choice: whether newly issued room tokens revoke older tokens. No decision was supplied.
- Pause: Owner requested ending the chat with documentation only. Do not implement this policy until work is resumed.

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
