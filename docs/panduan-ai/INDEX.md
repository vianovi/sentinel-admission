# Production Audit Documentation Index

## 1. AI Instructions & Guidelines (`docs/panduan-ai/`)

- [`README.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/README.md) — System philosophy and workspace entry point
- [`auditor-charter.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/auditor-charter.md) — Role mission, boundaries, autonomy, and stop triggers
- [`operating-rules.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/operating-rules.md) — Code audit, patching, and verification rules
- [`release-gates.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/release-gates.md) — Release gates G0 through G7 criteria
- [`security-standard.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/security-standard.md) — Security audit matrix across 9 domains
- [`branching-and-promotion.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/branching-and-promotion.md) — Branch workflows & candidate promotion strategy
- [`documentation-policy.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/documentation-policy.md) — Evidence gathering & state persistence policy
- [`execution-runbook.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/execution-runbook.md) — Step-by-step audit runbook
- [`CORE_CONTEXT.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/CORE_CONTEXT.md) — Core application domain & business rules
- [`PACKAGE-MANIFEST.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/PACKAGE-MANIFEST.md) — Dependency and version inventory
- [`INSTALL.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/INSTALL.md) & [`OFFICIAL-REFERENCES.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/OFFICIAL-REFERENCES.md) — Setup & external references

### 1.1 AI Engineering Skills & Standards (`docs/panduan-ai/skills/`)
- [`ui-animation-standards.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/skills/ui-animation-standards.md) — UI standards, Anime.js motion rules, 4 UI states & 5 upload states
- [`frontend-development.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/skills/frontend-development.md) — React, Inertia.js v2, Tailwind CSS guidelines
- [`backend-development.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/skills/backend-development.md) — Laravel Eloquent, service layer & transaction safety
- [`infrastructure-deployment.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/skills/infrastructure-deployment.md) — Docker, Nginx, MariaDB & deploy configs
- [`architectural-lessons.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/skills/architectural-lessons.md) — Key architectural insights & lessons learned
- [`build-rules.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/panduan-ai/skills/build-rules.md) — Frontend build rules & style specifications

## 2. Deployment & Release Readiness (`docs/persiapan-deploy/`)

- [`PRODUCTION-READINESS.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/persiapan-deploy/PRODUCTION-READINESS.md) — Master production readiness checklist
- [`HUMAN-REVIEW-CHECKLIST.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/persiapan-deploy/HUMAN-REVIEW-CHECKLIST.md) — Human manual verification & approval checklist (ID)
- [`PRODUCTION-MANIFEST.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/persiapan-deploy/PRODUCTION-MANIFEST.md) — Feature slice release ledger
- [`ROLLBACK-NOTES.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/persiapan-deploy/ROLLBACK-NOTES.md) — Emergency rollback procedures
- [`PROMOTION-LEDGER.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/persiapan-deploy/PROMOTION-LEDGER.md) — Version promotion log

## 3. Real-Time Active State (`docs/state-aktif/`)

- [`CURRENT.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/state-aktif/CURRENT.md) — Active slice & current audit coordinates
- [`QUEUE.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/state-aktif/QUEUE.md) — Remaining audit queue & dependency ordering
- [`BLOCKERS.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/state-aktif/BLOCKERS.md) — Open escalations needing human decisions
- [`DECISIONS.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/state-aktif/DECISIONS.md) — Durable rulings and architecture decisions
- [`HANDOFF.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/state-aktif/HANDOFF.md) — Inter-session continuity notes
- [`CONTEXT-SUMMARY.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/state-aktif/CONTEXT-SUMMARY.md) — System context snapshot

## 4. Audit Tasks & Checklists (`docs/task-audit/`)

- [`master-production-audit.task.md`](file:///home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission/docs/task-audit/master-production-audit.task.md) — Master audit loop
- `task-01` to `task-11` — Deep-dive audit checklists per slice
- `templates/` — Standard templates (audit report, blocker, decision, evidence index)

## 5. Reports & Evidence (`docs/laporan-audit/`)

- `01-public-shared-runtime/` — Active slice audit report & evidence

## 6. Deprecation & Cleanup Staging (`docs/siap-dihapus/`)

- `task-done/`, `laporan-selesai/`, `evidence-selesai/` — Completed milestones staged for review before deletion
