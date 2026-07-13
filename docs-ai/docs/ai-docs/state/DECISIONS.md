# Durable Audit Decisions

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

## D-005 — Promotion strategy pending

- Status: pending
- Decision: Task 00 must choose Strategy A, B, or C from actual Git history/dependencies.
