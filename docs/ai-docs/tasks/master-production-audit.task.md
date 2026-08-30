# Master Production Audit Task

## Mission

Prepare a production release candidate through evidence-driven, slice-by-slice audit and repair.

The auditor may work autonomously within repository instructions.

Never merge to `main`. Never deploy.

## Startup

1. Read mandatory instructions/state.
2. Reconcile state with actual Git.
3. If first run, execute `task-00-discovery-foundation.task.md`.
4. Otherwise select the next eligible item from `state/QUEUE.md`.
5. Use its slice task as the checklist.

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
10. `complete`

Update `CURRENT.md` at every transition.

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
- Record findings with severity/evidence.

### Fix

- Fix confirmed findings within authority.
- Keep changes focused.
- Add/update tests.
- Avoid unrelated redesign.
- Stop for schema/dependency/policy decisions needing approval.

### Verify

Apply all relevant release gates.

Run focused checks, then broader regression.

Review the diff after tests pass.

### Classify

Use:

- `PASS`
- `PASS WITH NOTES`
- `BLOCKED`
- `FAILED`

Only `PASS` may be promoted.

### Commit/evidence

- Commit coherent milestones.
- Update audit/evidence.
- Update state/handoff.
- Update production manifest.

### Promote

Follow `instructions/branching-and-promotion.md`.

Stop on non-trivial conflict.

Never promote to `main`.

### Continue

If mode allows, select the next dependency-ready slice.

Stop on mandatory stop, context limit, exhausted queue, or required human approval.

## Master completion

Complete only when:

- required slices pass;
- integration regression passes;
- release candidate is reproducible;
- readiness/rollback docs are complete;
- human review is explicitly pending or approved;
- `main` remains untouched.
