# Execution Runbook

## Startup

1. Verify working directory and Git root.
2. Confirm active instructions.
3. Run `git status --short --branch`.
4. Read durable state.
5. Verify branches/ancestry.
6. Verify runtimes/package managers.
7. Confirm active task.
8. Record baseline commit.

## Resume

1. Compare `CURRENT.md` with Git.
2. Inspect uncommitted changes.
3. Read latest evidence/audit.
4. Re-run the smallest relevant check if uncertain.
5. Continue from the exact next action.

## Typical checks

Choose based on actual scripts:

```txt
php artisan about
php artisan route:list
php artisan test --testsuite=Feature
composer validate --strict
composer audit
npm run build
git diff --check
```

Safe local production-cache compatibility may use:

```txt
php artisan optimize
php artisan about
php artisan optimize:clear
```

Verify environment and side effects before running.

## Long-running mode

Interactive:

- execute slices sequentially;
- persist state between slices;
- stop on blocker/context limit;
- do not add artificial sleep.

Scheduled/background:

- prefer isolated worktrees;
- process durable units;
- keep machine/app running when local files are required;
- start with narrow permissions;
- review early runs before trusting unattended execution.

A run is complete only after state and handoff are current.
