# Task 10 — Infrastructure and Deployment Readiness

## Scope

Audit deployment/runtime files and document production requirements without deploying.

## Audit focus

- supported PHP/Node/runtime versions;
- required PHP extensions;
- Composer platform requirements;
- production frontend build;
- web root points to `public`;
- storage/cache permissions;
- `APP_DEBUG=false`;
- config/route/event/view cache compatibility;
- queue workers/scheduler;
- service reload/restart;
- health route;
- logs/rotation;
- migration plan/backup prerequisite;
- secrets injection;
- TLS/proxy/cookie assumptions;
- Docker/server configuration;
- rollback/release commands.

No production access, secret change, migration execution, or deployment.

## General constraints

- Verify actual source before relying on task hints.
- No schema, production dependency, business-policy, or production-operation change without authority.
- No visual approval claim.
- Store detailed evidence and update durable state.
- Apply all relevant release gates.
