# Task 02 — Authentication and Registration

## Scope

Audit registration, login, logout, email verification, password reset/change, gateway redirects, role assignment, and post-registration candidate creation.

## Audit focus

- account enumeration;
- rate limits/lockout;
- session lifecycle;
- CSRF/state-changing routes;
- redirect safety;
- exact role assignment;
- duplicate registration;
- partial-registration rollback;
- email verification;
- password/reset token handling;
- error disclosure;
- post-login authorization;
- alternative orderings/failures.

Do not redefine account or admission policy without approval.

## General constraints

- Verify actual source before relying on task hints.
- No schema, production dependency, business-policy, or production-operation change without authority.
- No visual approval claim.
- Store detailed evidence and update durable state.
- Apply all relevant release gates.
