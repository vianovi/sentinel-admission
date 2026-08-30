# Release Gates

Every slice is evaluated independently and again during integration.

## G0 — Scope and dependency

Required:

- scope statement;
- source commit;
- dependency map;
- entry points;
- affected data/integrations;
- out-of-scope list.

Fail if the boundary is unreliable.

## G1 — Architecture and correctness

Required:

- critical flows traced;
- state transitions verified;
- duplicated business rules reviewed;
- error and edge paths reviewed;
- no unexplained dead actions;
- no unresolved critical/high correctness issue.

## G2 — Test and build

Required as applicable:

- focused tests pass;
- broader feature/regression tests pass;
- frontend production build passes;
- route/config checks pass;
- diff check passes;
- failures are not hidden or skipped without justification.

## G3 — Security

Required:

- authentication, authorization, and ownership reviewed;
- validation and output exposure reviewed;
- CSRF/session/rate-limit context reviewed;
- sensitive data and logging reviewed;
- uploads/storage reviewed when relevant;
- integration signatures/idempotency reviewed when relevant;
- dependency advisories reviewed;
- no unresolved critical/high security finding.

## G4 — Data integrity

Required:

- schema assumptions verified;
- writes/deletes/status transitions reviewed;
- concurrency/idempotency considered;
- migration behavior tested safely if relevant;
- no production data touched;
- rollback/data recovery implications recorded.

## G5 — Production configuration

Required as applicable:

- runtime/extensions inventoried;
- production debug expectation recorded;
- web root points to `public`;
- storage/cache permissions documented;
- cache/optimize compatibility tested safely;
- workers/scheduler/reload needs documented;
- health-check readiness reviewed;
- environment assumptions recorded without secrets.

## G6 — Evidence and documentation

Required:

- audit report;
- evidence index;
- commands/outcomes;
- changed files/commits;
- residual risks;
- state/handoff updated;
- release manifest updated.

## G7 — Human review

Required before `main`:

- visual review for affected UI;
- critical business-flow review;
- release candidate smoke test;
- production environment checklist;
- rollback plan;
- explicit human approval.

## Classification

- `PASS`: all applicable code gates pass; eligible for release candidate.
- `PASS WITH NOTES`: non-trivial unresolved note remains; not automatically promotable.
- `BLOCKED`: evidence, authority, environment, or decision missing.
- `FAILED`: critical/high issue or verification failure remains.

Human review is tracked separately and always required before `main`.
