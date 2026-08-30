# Infrastructure Skill — Laravel 12 + Docker
> Load this file for deployment, environment management, debugging,
> and infrastructure work on any Laravel 12 + Docker project.

---

## Environment Strategy — Confirm Before Every Session

Before giving any instruction involving a build, deploy, or server command — always ask:
> *"Which environment are we working in right now — local, staging, or production?"*

| | Local | Staging | Production |
|---|---|---|---|
| Purpose | Feature dev & hot-reload | QA & integration test | Live user traffic |
| Frontend | `npm run dev` (hot-reload) | `npm run build` | `npm run build` |
| APP_DEBUG | `true` | `false` | `false` |
| HTTPS | ❌ optional | ✅ required | ✅ required |
| External services | Sandbox / mocked | Sandbox | Live |
| DB | Local seed data | Seeded clone | Real data |

### Common Mistakes to Avoid
```
❌ Running `npm run build` in local → hot-reload is already active, build is not needed
❌ Running `npm run dev` in staging/production → dev server must never serve public traffic
❌ Assuming which environment is active → always confirm before giving instructions
❌ Running migrate:fresh on staging/production → destroys real data
```

### What Needs to Run After Each Change Type
```
Local:
  frontend changes     → reflected automatically via hot-reload
  .env / config change → php artisan config:clear (or full art-clear alias)
  route change         → php artisan route:clear
  new migration        → php artisan migrate

Staging / Production:
  frontend changes     → npm run build + restart app container
  .env / config change → deploy (build + clear + restart)
  new migration        → php artisan migrate (before restarting app)
  queue changes        → restart queue worker after deploy
```

---

## Artisan & Composer Aliases (adapt to your shell)

| Alias | Full Command |
|---|---|
| `build` | `npm run build && docker compose restart app` |
| `deploy` | build → migrate → config:clear → route:clear → view:clear → cache:clear → restart |
| `art-clear` | `config:clear` + `route:clear` + `view:clear` + `cache:clear` via docker exec |
| `db-reset` | `docker compose exec app php artisan migrate:fresh --seed` |
| `log` | `docker compose exec app tail -f storage/logs/laravel.log` |
| `app` | `docker compose exec app bash` |
| `tinker` | `docker compose exec app php artisan tinker` |
| `dcup` | `docker compose up -d` |
| `dcdwn` | `docker compose down` |

> If using Fish shell: use `set -gx KEY value` — never `export KEY=value` (Bash syntax).

---

## Docker Standards for Laravel

### Volume Mount
```yaml
# docker-compose.yml
services:
  app:
    volumes:
      - .:/var/www/html:Z      # :Z required on SELinux hosts (Fedora/RHEL)
    user: "1000:1000"          # match host UID — prevents storage permission errors
```

### Required Storage Directories
```bash
# If missing, Laravel throws: "tempnam(): file created in system's temp directory"
mkdir -p storage/framework/views
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/logs
```

### Permission Fixes
```bash
# SELinux hosts — chmod may fail, use restorecon instead:
sudo restorecon -Rv storage/

# Standard Linux hosts:
sudo chown -R $USER:$USER storage/ bootstrap/cache/

# DO NOT use www-data on hosts where that user does not exist.
# Container user is UID 1000 — use that consistently.
```

### Composer Not in PATH
```bash
# Run via full path inside container:
docker compose exec app php /usr/local/bin/composer dump-autoload

# Or skip composer entirely:
docker compose exec app php artisan optimize:clear

# Container restart also reloads autoload on boot:
docker compose down && docker compose up -d
```

### Database Running on Host (not in container)
```
Host IP from inside container: 172.17.0.1 (default Docker bridge)
Set DB_HOST=172.17.0.1 in .env
Ensure DB port is accessible from the container network
Never hardcode DB credentials in code — always use .env
```

---

## ENV File Management

```
.env          → active file read by Laravel (never commit this)
.env.example  → template with placeholder values (commit this — no real secrets)
.env.local    → local dev overrides
.env.staging  → staging config
.env.production → production config (managed by server/CI, not git)

All .env.* files except .env.example must be in .gitignore.
Never push real credentials to any git remote.
```

### Key Config Differences Per Environment
| Key | Local | Staging | Production |
|---|---|---|---|
| `APP_ENV` | `local` | `staging` | `production` |
| `APP_DEBUG` | `true` | `false` | `false` |
| `APP_URL` | `http://localhost:8080` | `https://staging.yourdomain.com` | `https://yourdomain.com` |
| `SESSION_SECURE_COOKIE` | `false` | `true` | `true` |
| `LOG_LEVEL` | `debug` | `warning` | `error` |
| `QUEUE_CONNECTION` | `sync` | `redis` | `redis` |

---

## Debugging Protocol

### 500 Error — Correct Order
```
1. Read the actual error log first — never assume root cause:
   docker compose exec app grep -E "Exception|Error" storage/logs/laravel.log | tail -30

2. Log is empty → enable APP_DEBUG=true + art-clear, then reproduce

3. Check browser DevTools → Network tab → response body
   (frontend may truncate the message; full error is in the raw JSON response)

4. Never guess a fix without reading the actual error message

5. "Class not found" error:
   a. Check if the file was accidentally overwritten or emptied
   b. Verify namespace matches folder: grep -n "^namespace\|^class" app/Path/File.php
   c. Run: docker compose exec app php /usr/local/bin/composer dump-autoload

6. After any namespace or class fix → always run composer dump-autoload
```

### Laravel-Specific Gotchas
```
Controller namespace must exactly match its folder path.
Laravel resolves classes by namespace — not by disk location.
Two controllers with the same name in different folders will conflict if namespaces are wrong.

Queue jobs not running:
  → Check QUEUE_CONNECTION in .env (must be redis/database, not sync, for background jobs)
  → Restart worker: docker compose exec app php artisan queue:restart

Config not updating after .env change:
  → Always run art-clear after any .env modification
  → Cached config is stored in bootstrap/cache/config.php

Migration failing:
  → Read the full error — usually a column type mismatch or missing table
  → Never edit migration files that have already run in production
  → Create a new migration to fix — never alter the existing one
```

### File String Replacement (avoid sed for complex patterns)
```bash
# Use Python for reliable multi-line or complex replacements:
python3 -c "
content = open('file.php').read()
content = content.replace('OldString', 'NewString')
open('file.php', 'w').write(content)
"
```

---

## Git Branch Strategy

| Branch | Purpose | Deploy Target |
|---|---|---|
| `main` | Production-ready only | Production |
| `develop` | Integration hub — merge all features here first | Staging |
| `feat/*` | Individual feature work | Local only |
| `fix/*` | Bug fixes | Local → develop → main |
| `hotfix/*` | Emergency production patch | main (then backport to develop) |

Rules:
```
main and develop are protected — no direct push, require PR.
Flow: feat/* → develop (PR) → staging test → main (PR) → production.
Hotfix flow: branch from main → fix → PR to main → backport PR to develop.
All production releases must be tagged: git tag v1.2.3
Never merge untested code into main.
Before any schema change, new feature, or merge — confirm the current branch.
```

---

## Private File Serving Pattern (Laravel)

```php
// Never expose storage paths directly to the browser.
// Serve private files through an authenticated controller route.

// Route definition — .+ where clause preserves slashes in filename param
Route::get('/files/{filename}', [FileController::class, 'serve'])
    ->where('filename', '.+')
    ->middleware('auth');

// Controller — whitelist extensions and block path traversal
public function serve(string $filename): Response
{
    // Block path traversal and restrict to allowed types
    if (!preg_match('/^[\w\-\/]+\.(webp|jpg|jpeg|png|pdf|mp4)$/i', $filename)) {
        abort(404);
    }

    $path = storage_path('app/private/' . $filename);

    if (!file_exists($path)) {
        abort(404);
    }

    // MP4: requires Accept-Ranges for browser seek/scrub to work
    if (str_ends_with($filename, '.mp4')) {
        return response()->file($path, [
            'Accept-Ranges' => 'bytes',
            'Content-Type'  => 'video/mp4',
        ]);
    }

    return response()->file($path);
}
```

---

## Media Optimization Scripts

### JPG/PNG → WebP
```bash
pip install Pillow --break-system-packages
# Script settings: quality=90, method=6, exact=True
# Naming: asset-01.webp, asset-02.webp
# Delete originals only after confirming successful output
```

### Video → MP4
```bash
# Uses FFmpeg via subprocess — no pip needed
# Settings: crf=18, preset=veryslow, -movflags +faststart
# +faststart enables browser streaming before full download completes
```

---

## Health Check Endpoint (Laravel)

```php
// routes/web.php or routes/api.php
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'db'     => DB::connection()->getPdo() ? 'ok' : 'fail',
        'cache'  => Cache::store()->getStore() ? 'ok' : 'fail',
    ]);
});
```

```yaml
# docker-compose.yml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```