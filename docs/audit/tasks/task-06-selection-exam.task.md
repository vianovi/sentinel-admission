# Task 06 — Online Selection Exam

## Scope

Audit subjects, packages, XLSX import, sessions, assignments, attempts, timer, autosave, submission, scoring, results, and audit events.

## Audit focus

- role boundaries;
- candidate ownership/eligibility;
- session timing/max attempts;
- server-owned timer/expiration;
- answer membership/option validation;
- answer-key/explanation leakage;
- autosave idempotency/locking;
- server-side scoring;
- expired-attempt finalization;
- result visibility;
- XLSX validation/private storage;
- duplicate/metadata checks;
- safe errors;
- runtime requirements;
- separation from final admission status.

Use synthetic exam data.

## General constraints

- Verify actual source before relying on task hints.
- No schema, production dependency, business-policy, or production-operation change without authority.
- No visual approval claim.
- Store detailed evidence and update durable state.
- Apply all relevant release gates.
