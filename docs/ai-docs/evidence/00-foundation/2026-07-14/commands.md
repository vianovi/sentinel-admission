# Foundation Commands

All commands ran from the repository root. Output below is summarized; failures are not rewritten as successes.

| Command or check | Exit/result | Summary |
|---|---:|---|
| `pwd`; repository file inventory | 0 | Verified requested Git root; detected misplaced audit workspace |
| `git status --short --branch`; `git diff --check`; worktree inventory | 0 | Clean baseline on `develop`; one worktree |
| Branch/ref/log/ancestry and `main...develop` comparisons | 0 | Main is baseline ancestor; local develop is integrated and remote-ahead |
| Ignored/untracked inventory | 0 | No untracked non-ignored baseline files; environment/dependency/build/log paths ignored |
| Manifest, route, config, migration, test, deployment, storage, integration inventories | 0 | Project dependency map established |
| `composer validate --strict --no-interaction` | 0 | Valid manifest/lock |
| `composer audit --locked --no-interaction --format=plain` | 0 | No advisories reported |
| `npm audit --audit-level=low` | 0 | No vulnerabilities reported |
| `composer check-platform-reqs --no-dev` | 0 | Local production package platform requirements satisfied |
| `php artisan about` | 0 | Laravel application booted; only safe environment/driver metadata retained |
| `php artisan route:list --except-vendor` | 0 | 183 application routes |
| `php artisan test` | 0 | 71 tests, 580 assertions |
| `npm run build` | 0 | TypeScript and Vite production build passed |
| `migrate:fresh` with a `/tmp` SQLite database | 0 | 28 migrations completed; temporary database removed by trap |
| Synthetic `php artisan optimize` and `about` | 0 | Production config/events/routes/views cached successfully |
| `php artisan route:list --except-vendor --compact` | 1 | Audit-command error: Laravel 12 has no `--compact` option; optimization itself had passed |
| Corrected synthetic optimize + `route:list --except-vendor` + `optimize:clear` | 0 | Rerun passed; generated caches cleared; real environment file restored |
| Heuristic tracked-secret/private-key/certificate filename scan | 0 | Only known example/config/documentation files matched assignment text; no tracked private-key/certificate file found |

The optimization check temporarily moved the ignored real `.env` to an ignored hold name without reading or copying it. A shell trap restored it and cleared caches on every exit path. All runtime inputs during the check were synthetic and non-secret.
