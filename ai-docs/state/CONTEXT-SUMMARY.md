# Verified Compact Project Context

- Verified: 2026-10-14
- Baseline: `1113160ebee605ebad439f53f3322f9deb060711`
- Current Head: `ac81eb5` (TypeScript & Axios resolution)
- Strategy: A — full integrated release candidate
- Protected branch: `main` at `8d5efe5f910b324d0b7fd4b293256a0675af0f77`; never modify directly
- Release candidate: `release/production-candidate`

## Stack

- Laravel 12.62 / PHP `^8.2`; local runtime PHP 8.5.8
- Inertia 2.0 / React 18.2 / TypeScript 5.x / Tailwind CSS 3.2 / Vite 7.0
- MariaDB 10.11+ / 11.x database; isolated testing via SQLite/in-memory
- Laravel Reverb 1.11 WebSockets real-time broadcasting & Laravel Echo
- Midtrans Snap SDK & manual transfer proof verification
- OpenSpout XLSX streaming import/export, private filesystem disk storage
- Apache 2.4 Docker runtime environment

## Application boundaries

- 218 non-vendor application routes: public landing, admission wizard, candidate dashboard, staff operations, admin controls, CBT exam engine, and Midtrans webhook.
- 34 migrations / 32 tables covering authentication, admission waves/programs, drafts, candidates, guardians, health, documents, security audit, payments, calendar, and online selection exams.
- Active features: Dedicated candidate status checklist (`/dashboard/status-pendaftaran`), Admin system settings (`/dashboard/admin/settings`), Program configuration (`/dashboard/admin/programs`), Staff/Admin reporting (`/dashboard/admin/reports`), Real-time WebSockets event sync, and Demo Traffic Simulator CLI.
- Scheduled commands: `drafts:prune`.
- External services: Midtrans Snap payment gateway, Resend/Mailtrap SMTP mailer.

## Dependency order

1. Foundation
2. Public/shared runtime
3. Auth/registration
4. Candidate lifecycle/profile
5. Documents/storage, Payment/Midtrans, and Selection exam
6. Staff operations
7. Admin operations
8. Reporting/export
9. Infrastructure/deployment
10. Integration regression

## Baseline proof

- 114 tests / 866 assertions pass (`php artisan test --compact`).
- 218 application routes boot without error.
- TypeScript strict compilation: 0 errors (`npx tsc --noEmit`).
- Production Vite build passes (`✓ built in 15.30s`).
- Pint PHP code style: 100% formatted.

## Known release risks

- Local branch is ahead of origin; remote coordination required before push.
- Deployment Docker setup uses development bind mounts; production container hardening assigned to Task 10.
- `HUMAN VISUAL REVIEW REQUIRED` for UI and interactive design sign-off.

## Resume

Trust `ai-docs/state/CURRENT.md`, `ai-docs/state/HANDOFF.md`, `ai-docs/state/BLOCKERS.md`, and `ai-docs/state/QUEUE.md`, then compare them with Git before acting.
