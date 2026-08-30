# AI Production Audit Workspace

`docs/` is the durable, evidence-driven operating framework for auditing and preparing this repository for production release.

## Core Operational Principles

1. **Durable State Over Chat Context:** Agent state is persisted in `docs/state-aktif/`. Memory resets or interruptions resume from state files.
2. **Evidence Over Assumptions:** Never claim code works without direct runtime, test, or build evidence.
3. **Source Code is Ground Truth:** Executable code, routes, and configs supersede outdated documentation.
4. **Non-Destructive Execution:** Production data, destructive Git commands (`git push --force`, `git reset --hard`), and unapproved schema changes are strictly prohibited.
5. **Separation of Concerns:**
   - Technical & AI guidance is written in **English**.
   - Human-facing review checklists & reports are in **Indonesian**.

## Workspace Structure

| Directory | Purpose | Language |
|---|---|---|
| `docs/panduan-ai/` | AI auditor instructions, SOPs, security standards, and release gates | English |
| `docs/persiapan-deploy/` | Production readiness checklists, manifest, rollback plans, and human sign-off | Indonesian / English |
| `docs/state-aktif/` | Real-time audit state, blockers, queue, decisions, and handoff notes | English |
| `docs/task-audit/` | Master audit tasks, slice-by-slice checklists, and report templates | English |
| `docs/laporan-audit/` | Active slice audit reports and verifiable evidence logs | Indonesian / English |
| `docs/siap-dihapus/` | Completed tasks, archived reports, and retired evidence awaiting deletion | Multi |

## Startup & Resume Protocol

Every audit session must read in order:
1. `docs/state-aktif/CURRENT.md`
2. `docs/state-aktif/HANDOFF.md`
3. `docs/state-aktif/BLOCKERS.md`
4. `docs/state-aktif/QUEUE.md`
5. The active slice task in `docs/task-audit/`
