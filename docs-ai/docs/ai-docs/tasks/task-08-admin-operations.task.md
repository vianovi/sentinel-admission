# Task 08 — Admin Operations and Configuration

## Scope

Audit admin-only settings, waves, fees, user/role management if present, exam management, monitoring, and global configuration.

## Audit focus

- exact admin authorization;
- global setting validation;
- wave/fee effects on existing candidates;
- dangerous actions/confirmation;
- configuration cache/runtime behavior;
- audit logs;
- data exposure;
- file/import operations;
- irreversible changes;
- safe defaults;
- frontend/backend contracts;
- unauthorized/invalid-transition tests.

Global business-policy changes require explicit approval.

## General constraints

- Verify actual source before relying on task hints.
- No schema, production dependency, business-policy, or production-operation change without authority.
- No visual approval claim.
- Store detailed evidence and update durable state.
- Apply all relevant release gates.
