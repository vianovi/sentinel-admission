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

## Workspace Directory Tree & File Map

Use this tree map to jump directly to the relevant file instead of reading files sequentially:

```text
docs/
├── 📘 panduan-ai/                     # Core AI guidelines, SOPs, release gates & engineering skills
│   ├── README.md                     # [Entry Point] System philosophy, map & startup protocol
│   ├── INDEX.md                      # [Master Index] Clickable links to every document
│   ├── auditor-charter.md            # [Role & Boundaries] Mission, autonomy rules & stop conditions
│   ├── operating-rules.md            # [Execution SOP] Pre-audit rules, minimal patching & verification
│   ├── release-gates.md              # [Release Criteria] G0 to G7 mandatory gates before promotion
│   ├── security-standard.md          # [Security Matrix] 9-domain OWASP controls & severity standards
│   ├── branching-and-promotion.md    # [Git Workflow] Strategy A/B/C release candidate management
│   ├── documentation-policy.md       # [Evidence Policy] State persistence & log sanitization rules
│   ├── execution-runbook.md          # [Runbook] Step-by-step procedure for auditing a slice
│   ├── CORE_CONTEXT.md               # [Domain Model] Fallback re-anchor for business logic & architecture
│   ├── PACKAGE-MANIFEST.md           # [Dependencies] Production packages and runtime versions
│   ├── INSTALL.md                    # [Environment] System prerequisites & setup instructions
│   ├── OFFICIAL-REFERENCES.md        # [External Docs] Upstream framework documentation links
│   └── skills/                       # [Engineering Skills] Domain-specific technical blueprints
│       ├── ui-animation-standards.md # UI standards, Anime.js motion rules, 4 UI states, 5 upload states
│       ├── frontend-development.md   # React, Inertia.js v2 SPA patterns, Tailwind & form wizards
│       ├── backend-development.md    # Laravel 12, Eloquent, Service layer, atomic transactions & auth
│       ├── infrastructure-deployment.md # Docker, Nginx, MariaDB, queue workers & production tuning
│       ├── architectural-lessons.md  # Architectural retrospectives & deep discussion notes
│       └── build-rules.md            # Vite bundling, code splitting & dynamic chart imports
│
├── 🚀 persiapan-deploy/                # Production readiness, manifest, rollback & human review checklists
│   ├── HUMAN-REVIEW-CHECKLIST.md     # [ID / Human Sign-off] Visual UI/UX & E2E manual walkthrough checklist
│   ├── PRODUCTION-READINESS.md       # [Technical Checklist] Code, migrations, runtime & security checks
│   ├── PRODUCTION-MANIFEST.md        # [Release Manifest] Feature slice ledger & commit promotion status
│   ├── ROLLBACK-NOTES.md             # [Emergency SOP] Rollback procedures & disaster recovery steps
│   └── PROMOTION-LEDGER.md           # [Promotion Log] History of audited release candidate promotions
│
├── ⚡ state-aktif/                    # Real-time operational audit state
│   ├── CURRENT.md                    # [Active Coordinates] Current slice, phase, commit SHA & next action
│   ├── QUEUE.md                      # [Audit Queue] Remaining slices & dependency-ordered sequence
│   ├── BLOCKERS.md                   # [Open Escalations] Critical issues requiring owner decisions
│   ├── DECISIONS.md                  # [Durable Rulings] Architecturally binding decisions & precedents
│   ├── HANDOFF.md                    # [Continuity Notes] Inter-session context handoff notes
│   └── CONTEXT-SUMMARY.md            # [Context Snapshot] High-level snapshot of project state
│
├── 📋 task-audit/                      # Master audit loop & individual slice task definitions
│   ├── master-production-audit.task.md # [Master Task] Master audit loop orchestrating slice audits
│   ├── task-01-public-shared-runtime.task.md      # Slice 01: Public landing & shared runtime
│   ├── task-02-auth-registration.task.md          # Slice 02: Candidate & staff auth flows
│   ├── task-03-candidate-lifecycle-profile.task.md # Slice 03: Profile, biodata & guardian forms
│   ├── task-04-documents-storage.task.md          # Slice 04: Document uploads & private storage
│   ├── task-05-payment-midtrans.task.md           # Slice 05: Midtrans payment gateway & webhooks
│   ├── task-06-selection-exam.task.md             # Slice 06: Online selection exam engine (CBT)
│   ├── task-07-staff-operations.task.md           # Slice 07: Staff verification & data review
│   ├── task-08-admin-operations.task.md           # Slice 08: Wave config, quotas & staff management
│   ├── task-09-reporting-export.task.md           # Slice 09: Data recap, exports & analytics
│   ├── task-10-infrastructure-deployment.task.md  # Slice 10: Environment, security headers & configs
│   ├── task-11-integration-regression.task.md     # Slice 11: Full integration regression testing
│   ├── task.template.md              # Reusable template for creating new slice tasks
│   └── templates/                    # Standardized report, blocker & decision templates
│
└── 📊 laporan-audit/                  # Verifiable audit reports & command execution evidence
    ├── 01-public-shared-runtime/     # Audit findings for Slice 01
    │   └── public-shared-runtime-audit.md
    └── evidence/                     # Raw test logs, route inventories & build outputs
        └── 01-public-shared-runtime/
```

## Startup & Resume Protocol

Every audit session must read in order:
1. `docs/state-aktif/CURRENT.md`
2. `docs/state-aktif/HANDOFF.md`
3. `docs/state-aktif/BLOCKERS.md`
4. `docs/state-aktif/QUEUE.md`
5. The active slice task in `docs/audit/tasks/`
