# AI Agent Workspace & Operating Index

## 1. Project Identity
Sentinel Admission is an integrated web-based student admission platform (SPMB) built with Laravel 12, React 18, Inertia.js v2, TypeScript, Tailwind CSS, MariaDB, and Laravel Reverb. For public architectural specifications and business domain models, see [`docs/architecture/core-context.md`](../docs/architecture/core-context.md) and [`docs/reference/tech-stack.md`](../docs/reference/tech-stack.md).

## 2. Cold Start Sequence
Every AI session starting fresh must read files in this exact sequence:
1. `ai-docs/state/CURRENT.md` — active slice, git coordinates, and immediate next action.
2. `ai-docs/state/HANDOFF.md` — latest context handoff, completed work, and test results.
3. `ai-docs/state/BLOCKERS.md` — open escalations requiring user authority.
4. `ai-docs/state/QUEUE.md` — remaining slice backlog and dependency sequence.
5. `ai-docs/state/DECISIONS.md` — architecturally binding decisions (D-001 to D-009).
6. Active slice task under `ai-docs/tasks/` matching `CURRENT.md`.

## 3. Re-anchor Sequence
If session context degrades or confusion arises, stop and re-anchor immediately:
1. Re-read `ai-docs/state/CONTEXT-SUMMARY.md` for baseline verified stack and limits.
2. Re-read `ai-docs/state/DECISIONS.md` to prevent reversing durable rulings.
3. Re-read `ai-docs/guide/execution-runbook.md` to restore operational discipline.
4. Summarize understanding in 5–10 lines before touching any code.

## 4. Directory & File Index

| Path | Description | When to Read |
|---|---|---|
| `ai-docs/state/CURRENT.md` | Active slice, commit SHA, and next action | Every session start & task transition |
| `ai-docs/state/HANDOFF.md` | Context transfer notes across sessions | Every session start |
| `ai-docs/state/BLOCKERS.md` | Open issues blocking autonomous work | When starting or raising an escalation |
| `ai-docs/state/DECISIONS.md` | Binding architectural rulings | Before architectural or policy changes |
| `ai-docs/state/QUEUE.md` | Remaining audit slice sequence | When completing a slice and picking next |
| `ai-docs/state/CONTEXT-SUMMARY.md` | Compact snapshot of verified system state | Cold start & re-anchoring |
| `ai-docs/guide/execution-runbook.md` | Step-by-step audit & verification SOP | Before modifying code or auditing slices |
| `ai-docs/guide/release-gates.md` | Release criteria G0 through G7 | Before slice classification & promotion |
| `ai-docs/guide/branching-and-promotion.md` | Candidate branch promotion workflows | When preparing a release candidate |
| `ai-docs/guide/production-readiness.md` | Production deployment checklist | Final regression & pre-release checks |
| `ai-docs/tasks/master-production-audit.task.md` | Master audit loop orchestrator | Slicing and prioritizing tasks |
| `ai-docs/reports/production-manifest.md` | Feature slice release status ledger | After verifying and promoting a slice |
| `ai-docs/reports/promotion-ledger.md` | Append-only promotion event log | Whenever code is promoted to RC |

## 5. Inter-Session Protocol
- **Updating `HANDOFF.md`:** Always record what was completed, verified test commands with counts (`X passed, Y assertions`), current git commit SHA, active branch, and the exact next step.
- **Recording `DECISIONS.md`:** When an architectural choice, policy clarification, or bug resolution pattern is settled, assign a durable ID (`D-XXX`), rationale, and date. Never reverse a decision silently.
- **Updating `CURRENT.md`:** Keep `active_slice`, `phase`, and `next_exact_action` strictly synchronized with git status.

## 6. Critical Stop Conditions
Halt autonomous execution immediately and write an entry in `ai-docs/state/BLOCKERS.md` when:
1. Critical security vulnerability is discovered (RCE, SQLi, auth bypass, IDOR).
2. Schema or migration change is required without prior user approval.
3. Test suite regression fails after 2 bounded fix attempts.
4. Ambiguous business policy requires human decision.
5. Context budget is nearly exhausted (checkpoint to `HANDOFF.md` before stopping).
