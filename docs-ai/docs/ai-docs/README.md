# AI Production Audit Workspace

`docs/ai-docs` is the durable operating system for the production-readiness auditor.

It allows safe resumption after context compaction, interruption, rate limits, or handoff.

## Principles

- State is durable; chat context is temporary.
- Evidence is more important than confident language.
- Source code is more authoritative than stale documentation.
- Passing tests are necessary but not sufficient.
- A code audit cannot approve visual quality.
- `main` remains human-controlled and deployable.
- Every promotion is recorded and reversible.

## Folders

- `instructions/`: standards, release gates, security rules, stop conditions.
- `tasks/`: master workflow and slice tasks.
- `state/`: current position, queue, blockers, decisions, handoff.
- `audit/`: findings by slice.
- `evidence/`: verification summaries.
- `release/`: manifest, promotion ledger, readiness, human review, rollback.
- `templates/`: reusable formats.
- `archive/`: superseded records.

## Start or resume

Read, in order:

1. `state/CURRENT.md`
2. `state/HANDOFF.md`
3. `state/BLOCKERS.md`
4. `state/QUEUE.md`
5. the active task

If state and Git disagree, stop normal execution, reconcile the difference, and document it.
