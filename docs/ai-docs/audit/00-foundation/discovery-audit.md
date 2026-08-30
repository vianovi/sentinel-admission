# Foundation and Discovery Audit

- Date: 2026-07-14
- Auditor: Codex production-readiness auditor
- Branch/worktree: `audit/00-foundation` / `/home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission`
- Baseline commit: `1113160ebee605ebad439f53f3322f9deb060711`
- Final audit content commit: `24ee4bde991c78c7288654622460f984a62f40a6`
- Release candidate promotion commit: `0440d02092a78a87e24f3cc6ddc73bcb1575ec57`

## Scope

Task 00 verifies repository identity and Git ancestry, establishes the release strategy, maps production-critical application surfaces, and proves that safe local verification is reproducible. It does not claim feature-level correctness for the later slices.

Out of scope:

- production infrastructure access, deployment, or production data;
- real Midtrans, SMTP, holiday API, or browser end-to-end traffic;
- deep authorization, upload, payment, exam, reporting, and migration rollback review assigned to Tasks 01–11;
- visual approval (`HUMAN VISUAL REVIEW REQUIRED` for all UI slices).

## Git and promotion strategy

- Git root and only worktree were verified.
- The baseline worktree was clean on local `develop` before Task 00 edits.
- `main` and `origin/main` point to `8d5efe5f910b324d0b7fd4b293256a0675af0f77`.
- `main` is an ancestor of baseline `develop`; `main...develop` is `0 / 188` by reachable commit count.
- `origin/develop` points to `cc3ff9e9c059f3aa9495cfaf29faa97e84c9a900`; `origin/develop...develop` is `0 / 70`.
- The `main...develop` source delta is 569 files, 88,561 insertions, and 4,024 deletions across shared runtime, routes, schema, candidate data, documents, payments, exams, staff/admin operations, and frontend code.
- Strategy A — Full integrated release candidate — is selected in `state/DECISIONS.md`. Selective promotion cannot provide a trustworthy dependency closure.
- `release/production-candidate` and `audit/00-foundation` were created at the verified baseline. `main` was not changed.

## Dependency map

| Slice | Primary entry points | Data/integrations | Depends on |
|---|---|---|---|
| Public/shared runtime | `routes/web.php`, `WelcomeController`, Inertia bootstrap/layout, Vite entry points | private landing media, app/session/cache configuration | foundation |
| Auth/registration | `routes/auth.php`, admission wizard/register controllers, auth controllers, draft-token middleware | users, registration drafts, candidates, mail | public/shared runtime |
| Candidate lifecycle/profile | candidate dashboard/profile/data controllers and centralized candidate status services | candidates, guardians, health, waves/programs | auth/registration |
| Documents/storage | document/health upload controllers, `DocumentSecurityService`, `SecureFileAccessService` | private disk, document/security records | candidate lifecycle |
| Payment/Midtrans | candidate payment controller, `PaymentService`, Midtrans webhook | payments/config, private proof files, Midtrans | candidate lifecycle; documents for manual proofs |
| Selection exam | candidate/admin/staff exam controllers and exam services/actions | exam tables, private XLSX import files | candidate lifecycle |
| Staff operations | staff routes and dashboard/change-request controllers | candidate, document, payment, exam aggregate state | candidate/documents/payment/exam |
| Admin operations | admin routes, wave/settings/staff/exam controllers | users, waves, programs, payment config, exam config | foundation plus affected domain rules |
| Reporting/export | staff report endpoints and aggregate queries | candidate/payment/exam operational data | domain and staff slices |
| Infrastructure | `Dockerfile`, `docker-compose.yml`, examples, Laravel cache/health/scheduler | Apache/PHP, MariaDB, storage, mail, Midtrans, scheduler | foundation/shared runtime |
| Integration regression | all 183 non-vendor application routes and cross-domain state transitions | all above | every required slice |

## Verified project inventory

- Laravel 12.62.0, PHP requirement `^8.2`, local PHP 8.5.8, Composer 2.8.12.
- Inertia React 18 / TypeScript / Tailwind / Vite 7; local Node 22.22.2 and npm 10.9.7.
- Composer production integrations include Midtrans, OpenSpout, Sanctum, and Ziggy; `ext-zip` is explicit.
- 183 non-vendor routes: 97 GET/HEAD, 57 POST, 13 DELETE, 12 PUT, 3 PUT/PATCH, and 1 PATCH.
- Route middleware inventory includes 50 candidate-role, 30 staff-role, and 78 admin-role routes; 10 sensitive-file throttles and 3 upload throttles.
- 28 migrations create 29 tables/structures spanning framework state, users, admission, candidate records, private documents, payments, calendar, and exam data.
- Scheduled work is limited to daily `drafts:prune`; no application jobs implementing `ShouldQueue` were found.
- External runtime paths are Midtrans and the national-holiday HTTP service. Mail is SMTP-configurable. Examples use synchronous queues.
- Private user files are stored on the `private` disk and returned through authenticated controller/service paths; this remains subject to Task 04 ownership and content-validation audit.
- `/up` is configured as the Laravel health entry point.

## Findings

### Critical

None confirmed in the Task 00 scope.

### High

None confirmed in the Task 00 scope.

An initial search appeared to show disabled document security layers. Source/config tracing disproved that interpretation: `DocumentSecurityService` defaults every layer to enabled, `config/sentinel.php` is absent, and no runtime override was found.

### Medium

#### FND-001 — Audit workspace was committed at the wrong path — fixed

`AGENTS.md`, `INSTALL.md`, and internal links require `docs/ai-docs/`, but baseline commit `1113160` placed the workspace under `docs-ai/docs/ai-docs/`. Task 00 relocates it to the mandated path and records D-006.

#### FND-002 — Baseline is not yet available from the tracked remote

Local `develop` is 70 commits ahead of `origin/develop`. The source is precisely identified locally, but a fresh machine cannot reproduce the candidate from the tracked remote until the owner publishes or otherwise distributes an approved branch. No push was performed.

#### FND-003 — No self-contained release/deployment pipeline exists

No tracked CI workflow, deployment script, process manager configuration, or web-server deployment configuration was found. The Dockerfile sets the Apache public root and installs MySQL/ZIP support but does not install application dependencies, copy/build source, define a startup process, or document scheduler/reload/permissions behavior. The compose file bind-mounts the development checkout. This is assigned to Task 10 and does not prevent local source auditing.

### Low

#### FND-004 — Dormant upload-security bypass hooks remain in production source

`DocumentSecurityService` contains branches that would bypass magic-byte scanning, polyglot checks, hashing, and UUID naming if undocumented `sentinel.*` config keys were ever set false. They are not active in the verified tree. Task 04 must decide whether to remove the hooks or constrain/test them.

### Informational

- The current local application environment reports `demo`, debug off, MariaDB, SMTP, database cache/session, and synchronous queues. No database-dependent baseline command used that configured database.
- The local public storage link is absent. Private paths do not rely on it; Task 10 must determine whether public assets require `storage:link` in the deployment contract.
- Several explicit `ComingSoonController` routes and disabled report-export controls exist. Their release acceptance is a business/human review question for the relevant operations slices, not a hidden passing feature.
- `bootstrap/app.php` trusts all proxies. Task 10 must verify the actual reverse-proxy boundary before this can be accepted for production.

## Changes made

- Created the Task 00 audit and release-candidate branches without changing `main`.
- Relocated the production auditor workspace to `docs/ai-docs/`.
- Reconciled durable state, decisions, queue, context, evidence, and release manifest.
- No application source, schema, dependency, payment policy, security policy, or production environment was changed.

## Verification

- Composer manifest validation: pass.
- Composer locked dependency audit: pass, no advisories reported.
- npm dependency audit: pass, no vulnerabilities reported.
- Composer production platform requirements on the local runtime: pass.
- Laravel boot/about: pass.
- Route inventory: pass, 183 routes.
- Full test suite: pass, 71 tests and 580 assertions.
- TypeScript and Vite production build: pass.
- All migrations on a throwaway SQLite database: pass.
- Production config/event/route/view optimization under synthetic non-secret environment values: pass; caches were cleared afterward and the real environment file was restored without being read or copied.
- One audit invocation used an unsupported `route:list --compact` flag and failed after optimization succeeded; the command was corrected and rerun successfully. The failure is preserved in evidence.

## Security review

- OWASP ASVS 5.0.0 and stable WSTG 4.2 were recorded as the catalog baseline on 2026-07-14.
- Role middleware, public/webhook boundaries, sensitive-file throttles, private storage references, external integration entry points, and committed secret-like filenames were inventoried.
- Composer and npm advisory checks passed at the recorded time.
- `.env`, environment variants, dependencies, generated builds, and logs are ignored; no tracked private-key/certificate file was found by the recorded filename/content heuristic.
- Dedicated secret-scanning software was unavailable, and Git history was not exhaustively scanned. Later slice security reviews remain required.

## Data integrity review

- All 28 migrations completed in order against an isolated temporary SQLite database that was deleted immediately afterward.
- Tests use in-memory SQLite, array cache/session/mail, and synchronous queues.
- No configured application database and no production or demo data was read, migrated, seeded, or modified.
- Migration rollback semantics and MariaDB compatibility require Task 10 and Task 11 review; SQLite success is not claimed as production-database proof.

## Production considerations and residual risks

- Remote publication, deployment ownership, database backup/rollback, MariaDB migration behavior, file permissions, scheduler execution, log/monitoring, proxy trust, and secret injection are not yet proven.
- Existing feature tests cover important candidate, mail, draft, document gate, payment-webhook transition, exam ownership/scoring, staff, and status paths, but do not establish whole-application coverage.
- Generated chunks include several large frontend assets; performance acceptance and visual behavior require later technical and human review.
- `HUMAN VISUAL REVIEW REQUIRED` for every UI slice before `main`.

## Release gates

| Gate | Result | Evidence |
|---|---|---|
| G0 Scope/dependency | PASS | Git ancestry and dependency map above; Strategy A in D-005 |
| G1 Architecture/correctness | PASS for foundation scope | Entrypoints, domain boundaries, external paths, and later-slice risks mapped |
| G2 Test/build | PASS | `evidence/00-foundation/2026-07-14/tests.md` and `build.md` |
| G3 Security | PASS for foundation baseline | Advisory, route/middleware, secret-file, and OWASP baseline evidence; deep slices pending |
| G4 Data integrity | PASS for foundation baseline | Temporary SQLite migration run; production DB untouched |
| G5 Production configuration | PASS for discovery only | Requirements and gaps identified; Task 10 remains required |
| G6 Evidence/documentation | PASS | This report, evidence index, state, decisions, context, and manifest |
| G7 Human review | PENDING globally | Not applicable to foundation code; mandatory before `main` |

## Classification

`PASS` for Task 00. The pipeline is reproducible and Strategy A is documented. This is not a production-readiness pass for any feature slice or for the release candidate as a whole.
