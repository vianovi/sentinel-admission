# Master Production Audit Task

## Mission

Prepare a production release candidate through evidence-driven, slice-by-slice audit and repair.

The auditor may work autonomously within repository instructions.

Never merge to `main`. Never deploy.

## Startup

1. Read mandatory instructions (`ai-docs/guide/`) and state (`ai-docs/state/`).
2. Reconcile state with actual Git tree.
3. Select the next eligible item from `ai-docs/state/QUEUE.md`.
4. Use its slice task as the checklist.

## State machine

For each slice:

1. `queued`
2. `mapping`
3. `auditing`
4. `fixing`
5. `verifying`
6. `self_review`
7. `classified`
8. `promoted_to_release_candidate` or `blocked`
9. `human_review_pending` where applicable
10: `complete`

Update `ai-docs/state/CURRENT.md` at every transition.

## Slice procedure

### Establish scope
- Record baseline source commit.
- Map routes, controllers, services, models, migrations, frontend entry points, tests, integrations, and shared dependencies.
- Define out-of-scope.
- Confirm promotion strategy.

### Audit
- Trace critical happy and failure paths.
- Review architecture, state transitions, validation, authorization, data exposure, storage, async behavior, and errors.
- Inspect test quality and gaps.
- Record findings with severity and evidence.

### Fix
- Fix confirmed findings within authority.
- Keep changes focused and minimal.
- Add/update tests.
- Avoid unrelated redesign.
- Stop for schema/dependency/policy decisions needing approval.

### Verify
- Apply all relevant release gates (`../release-gates.md`).
- Run focused checks, then broader regression (`php artisan test --compact`, `npm run build`).
- Review the diff after tests pass.

### Classify
Use:
- `PASS`
- `PASS WITH NOTES`
- `BLOCKED`
- `FAILED`

Only `PASS` may be promoted.

### Commit & Evidence
- Commit coherent milestones.
- Update `../reports/` and `../reports/evidence/`.
- Update `../state/CURRENT.md` and `../state/HANDOFF.md`.
- Update `../reports/production-manifest.md`.

### Promote
- Follow `../guide/branching-and-promotion.md`.
- Stop on non-trivial conflict.
- Never promote to `main`.

## Master completion

Complete only when:
- All required slices pass;
- Integration regression passes;
- Release candidate is reproducible;
- Readiness and rollback docs are complete in `ai-docs/guide/production-readiness.md` and `docs/operations/emergency-rollback.md`;
- Human review is approved in `docs/reference/human-review-checklist.md`;
- `main` remains untouched.

