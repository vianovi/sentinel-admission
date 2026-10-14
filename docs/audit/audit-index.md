# Production Audit Documentation Index

## 1. Audit Framework & Runbooks (`docs/audit/`)

- [`audit-workspace-readme.md`](audit-workspace-readme.md) — System philosophy and workspace entry point
- [`auditor-charter.md`](auditor-charter.md) — Role mission, boundaries, autonomy, and stop triggers
- [`operating-rules.md`](operating-rules.md) — Code audit, patching, and verification rules
- [`release-gates.md`](release-gates.md) — Release gates G0 through G7 criteria
- [`branching-and-promotion.md`](branching-and-promotion.md) — Branch workflows & candidate promotion strategy
- [`documentation-policy.md`](documentation-policy.md) — Evidence gathering & state persistence policy
- [`execution-runbook.md`](execution-runbook.md) — Step-by-step audit runbook
- [`production-readiness.md`](production-readiness.md) — Master production readiness checklist
- [`production-manifest.md`](production-manifest.md) — Feature slice release ledger
- [`promotion-ledger.md`](promotion-ledger.md) — Version promotion log

## 2. Engineering Standards & Architecture (`docs/architecture/`)

- [`core-context.md`](../architecture/core-context.md) — Core application domain & business rules
- [`security-standard.md`](../architecture/security-standard.md) — Security audit matrix across 9 domains
- [`ui-animation-standards.md`](../architecture/ui-animation-standards.md) — UI standards, Anime.js motion rules, 4 UI states & 5 upload states
- [`frontend-development.md`](../architecture/frontend-development.md) — React, Inertia.js v2, Tailwind CSS guidelines
- [`backend-development.md`](../architecture/backend-development.md) — Laravel Eloquent, service layer & transaction safety
- [`architectural-lessons.md`](../architecture/architectural-lessons.md) — Key architectural insights & lessons learned
- [`build-rules.md`](../architecture/build-rules.md) — Frontend build rules & style specifications

## 3. Operations & Deployment (`docs/operations/`)

- [`traffic-simulator.md`](../operations/traffic-simulator.md) — Panduan lengkap simulasi traffic demo, live stream WebSockets, benchmark beban, dan pembersihan data demo (ID)
- [`deployment-and-docker.md`](../operations/deployment-and-docker.md) — Docker, Apache, MariaDB & deploy configs
- [`emergency-rollback.md`](../operations/emergency-rollback.md) — Emergency rollback procedures

## 4. Real-Time Active State (`docs/state-aktif/`)

- [`CURRENT.md`](../state-aktif/CURRENT.md) — Active slice & current audit coordinates
- [`QUEUE.md`](../state-aktif/QUEUE.md) — Remaining audit queue & dependency ordering
- [`BLOCKERS.md`](../state-aktif/BLOCKERS.md) — Open escalations needing human decisions
- [`DECISIONS.md`](../state-aktif/DECISIONS.md) — Durable rulings and architecture decisions
- [`HANDOFF.md`](../state-aktif/HANDOFF.md) — Inter-session continuity notes
- [`CONTEXT-SUMMARY.md`](../state-aktif/CONTEXT-SUMMARY.md) — System context snapshot

## 5. Audit Tasks & Checklists (`docs/audit/tasks/`)

- [`master-production-audit.task.md`](tasks/master-production-audit.task.md) — Master audit loop
- `task-01` to `task-11` — Deep-dive audit checklists per slice
- `templates/` — Standard templates (audit report, blocker, decision, evidence index)

## 6. Reports & Evidence (`docs/audit/reports/` & `docs/audit/evidence/`)

- `reports/01-public-shared-runtime/` — Active slice audit report & evidence
- `evidence/` — Raw test logs, route inventories & build outputs

## 7. Technical References (`docs/reference/`)

- [`human-review-checklist.md`](../reference/human-review-checklist.md) — Human manual verification & approval checklist (ID)
- [`official-references.md`](../reference/official-references.md) — External upstream framework documentation links

