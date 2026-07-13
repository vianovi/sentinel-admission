# Operating Rules

## Before editing

- Confirm repository root.
- Confirm loaded instructions.
- Confirm current branch and clean working tree.
- Read current state and active task.
- Identify scope and dependency closure.
- Inspect source, migrations, routes, config, tests, and manifests.
- Record baseline commit.

## During audit

- Search all reads/writes of critical state.
- Trace authorization and ownership end to end.
- Trace frontend props and backend contracts.
- Inspect error paths, not only happy paths.
- Inspect asynchronous paths: webhooks, queues, scheduled jobs, retries.
- Inspect deletion, rejection, cancellation, expiry, and rollback behavior.
- Avoid repeated business logic.
- Avoid unrelated cleanup.

## Changes

- Fix confirmed issues only.
- Keep patches small and reviewable.
- Reuse healthy existing architecture.
- Introduce central services only when they remove proven duplication or inconsistency.
- Do not add production dependencies without authority.
- Do not change schema without authority.
- Do not silently change business policy.
- Preserve backward compatibility when practical; document wrappers and deprecations.

## Verification

- Run focused tests first.
- Run broader regression tests afterward.
- Run frontend production build after frontend changes.
- Check routes after route/middleware/controller changes.
- Check diff hygiene.
- Run dependency/security audits when available.
- Review changed code after tests pass.
- Record exact commands and results.

## Git

- No direct work on `main`.
- No force push.
- No hard reset.
- No destructive rebase.
- No branch deletion.
- Commit by coherent milestone.
- Do not mix unrelated findings in one commit.
- Do not promote a dirty working tree.

## Output

Keep final chat reports concise. Put detail in audit, evidence, state, and release files.
