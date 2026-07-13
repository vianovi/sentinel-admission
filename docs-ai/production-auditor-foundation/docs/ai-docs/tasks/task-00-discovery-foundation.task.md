# Task 00 — Discovery, Git Strategy, and Foundation Baseline

## Goal

Understand the repository as it actually exists and establish a safe, reproducible audit pipeline.

Do not rush into feature fixes.

## Git discovery

Audit:

- current branch/clean state;
- `main` and `develop`;
- ancestry/divergence;
- release/audit branches;
- recent graph/feature boundaries;
- remotes/upstreams;
- worktrees;
- ignored/untracked files;
- whether selective promotion is safe.

Choose Strategy A, B, or C from the branching policy and document it.

## Project discovery

Inspect:

- root instructions/docs;
- Composer/package manifests and locks;
- Laravel/PHP requirements;
- frontend stack/build scripts;
- database/migrations;
- routes/middleware;
- authentication/authorization;
- file storage;
- queues/scheduler;
- payment;
- exam;
- Docker/server files;
- test config;
- deployment scripts/workflows;
- environment examples without reading secrets.

## Baseline verification

Run safe applicable checks:

- Git status/diff;
- runtime versions;
- dependency validation/advisories;
- Laravel application overview;
- route inventory;
- full feature tests;
- frontend production build;
- diff check;
- migration pretend/test behavior when safe;
- production cache/optimization compatibility when safe.

Never use production data or secrets.

## Outputs

Create/update:

- `audit/00-foundation/discovery-audit.md`
- `evidence/00-foundation/<date>/...`
- verified `CONTEXT-SUMMARY.md`
- finalized `QUEUE.md`
- initial `PRODUCTION-MANIFEST.md`
- promotion strategy in `DECISIONS.md`
- release candidate branch/worktree only if safe
- `CURRENT.md` and `HANDOFF.md`

## Stop conditions

Stop if:

- ancestry makes safe promotion unclear;
- baseline failures prevent reliable auditing;
- production data/environment is connected;
- secrets are exposed;
- required runtime is absent and installation changes the system;
- release strategy needs owner policy.

## Classification

Pass only when auditing is reproducible and release strategy is documented.
