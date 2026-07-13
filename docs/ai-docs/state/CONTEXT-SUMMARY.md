# Verified Compact Project Context

- Verified: 2026-07-14
- Baseline: `1113160ebee605ebad439f53f3322f9deb060711`
- Strategy: A — full integrated release candidate
- Protected branch: `main` at `8d5efe5f910b324d0b7fd4b293256a0675af0f77`; never modify directly
- Release candidate: `release/production-candidate`

## Stack

- Laravel 12.62 / PHP `^8.2`; local PHP 8.5.8
- Inertia 2 / React 18 / TypeScript / Tailwind / Vite 7
- MariaDB deployment intent; tests use isolated in-memory/temporary SQLite
- Midtrans, SMTP mail, OpenSpout XLSX, private local storage
- Apache Docker base with public web root; deployment image/process is incomplete and assigned Task 10

## Application boundaries

- 183 application routes: public/registration/auth, candidate, staff, admin, and Midtrans webhook.
- Exact role middleware counts: candidate 50, staff 30, admin 78.
- 28 migrations/29 tables cover user/session/queue/cache, admission, candidate/guardian/health, documents/security, payment/config, calendar, and exam.
- Daily scheduled command: `drafts:prune`. Application queues are currently synchronous in examples.
- External calls: Midtrans and national-holiday API; SMTP mail.

## Dependency order

1. Foundation
2. Public/shared runtime
3. Auth/registration
4. Candidate lifecycle/profile
5. Documents/storage and Payment/Midtrans and Selection exam
6. Staff operations
7. Admin operations
8. Reporting/export
9. Infrastructure/deployment
10. Integration regression

Admin configuration crosses waves/programs/payment/exam; each affected rule must be checked with its domain slice as well as Task 08.

## Baseline proof

- 71 tests / 580 assertions pass.
- 183-route boot passes.
- TypeScript/Vite production build passes.
- Composer/npm advisory scans report zero known vulnerabilities at the audit time.
- All migrations pass on a throwaway SQLite database.
- Synthetic production optimize/cache/route boot passes.

## Known release risks

- Local source is 70 commits ahead of tracked `origin/develop`; no push was performed.
- No CI/deployment pipeline; Docker/compose are not self-contained production artifacts.
- Production MariaDB migration/rollback, backup, permissions, scheduler, monitoring, proxy trust, and secret injection are unproven.
- Dormant document-security bypass hooks require Task 04 review, though all layers are active in the current config.
- Coming-soon routes and disabled report exports require explicit release acceptance.
- `HUMAN VISUAL REVIEW REQUIRED` for UI; no visual quality is approved.

## Resume

Trust `state/CURRENT.md`, `HANDOFF.md`, `BLOCKERS.md`, and `QUEUE.md`, then compare them with Git before acting.
