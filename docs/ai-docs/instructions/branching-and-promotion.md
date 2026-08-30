# Branching and Promotion Policy

## Protected destination

`main` is human-controlled.

The auditor must never:

- commit directly to `main`;
- merge into `main`;
- push a production deployment;
- assume `main` may be rewritten.

## Expected branch roles

Branch names are hints and must be verified:

- `develop`: likely integrated development source.
- `main`: likely production-ready branch.
- `release/production-candidate`: audited staging branch for human review.
- `audit/<slice>`: isolated audit/fix branch.

## Promotion strategy must be discovered

Task 00 must inspect:

- ancestry among `main`, `develop`, and current branches;
- commit quality and feature boundaries;
- dependency coupling;
- whether `main` is outdated or already related;
- whether selective promotion is safe.

Choose one strategy and record it in `DECISIONS.md`.

### Strategy A — Full integrated release candidate

Use when `develop` is an inseparable integrated application.

- Create release candidate from a verified `develop` commit.
- Audit slices as gates over the integrated tree.
- Do not claim unaudited code is production-ready.
- Main promotion waits until all required slices and human review pass.

### Strategy B — Selective commit promotion

Use only when history has coherent, dependency-complete feature commits.

- Release candidate starts from `main`.
- Promote audited dependency closures through explicit cherry-picks.
- Record every source and promoted commit.
- Stop on non-trivial conflicts.

### Strategy C — Selective reconstructed slice

Use only when paths/dependencies can be mapped safely but history is not clean.

- Release candidate starts from `main`.
- Reconstruct a complete slice from `develop` with mapped dependencies.
- Commit the reconstructed slice explicitly.
- Require stronger regression evidence.
- Stop if shared dependencies make the boundary unreliable.

## Worktrees

Worktrees may isolate audit and release branches.

Rules:

- record every worktree path and branch;
- do not modify the same branch in two worktrees;
- do not create worktrees without a cleanup plan;
- stop if worktree state is unclear;
- never remove a worktree with uncommitted changes.

## Promotion

Only `PASS` may be promoted.

`PASS WITH NOTES`, `BLOCKED`, and `FAILED` are not automatically promotable.

A code-passed UI slice may enter the release candidate with `HUMAN VISUAL REVIEW REQUIRED`, but cannot enter `main` until human approval.

Every promotion updates:

- `PRODUCTION-MANIFEST.md`
- `PROMOTION-LEDGER.md`
- `CURRENT.md`
- evidence index
