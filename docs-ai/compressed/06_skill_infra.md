# Livi — Infrastructure Skill
> Load this file for infrastructure, deployment, debugging, and environment work sessions.
> Covers: Docker + Fedora + SELinux, Fish shell, dev/demo mode, debug protocol.

---

## Dev vs Demo Mode — ASK AT START OF EVERY SESSION

**Before giving ANY instruction involving frontend build or server — always ask:**
> *"Silvia, are we in dev-mode or demo-mode right now?"*

| | Dev Mode | Demo Mode |
|---|---|---|
| Switch alias | `dev-mode` | `demo-mode` |
| Access | `localhost:8080` | `https://spmb.playground-ku.my.id` |
| Frontend | `npm run dev` (already running) | `build` or `deploy` |
| Tunnel | OFF | ON |
| HTTPS | ❌ | ✅ |
| Midtrans | ❌ | ✅ required |

### Common Mistakes to Avoid
```
❌ Telling Silvia to run `build` when in dev-mode → already hot-reloading, build not needed
❌ Telling Silvia to run `npm run dev` in demo-mode → Cloudflare Tunnel doesn't support dev server
❌ Assuming mode without asking → wrong instructions = wasted time
```

### What Each Mode Needs After Changes
```
Dev mode:
  frontend changes → already reflected via hot-reload (no action needed)
  config/route changes → art-clear

Demo mode:
  frontend changes → build
  route/config/.env changes → deploy
  Midtrans webhook → only testable in demo-mode (requires HTTPS + public domain)
```

---

## Fish Aliases Reference

| Alias | Command |
|---|---|
| `sentinel` | cd to project path |
| `build` | `npm run build && docker compose restart` |
| `deploy` | build + restart + config:clear + route:clear + view:clear + cache:clear |
| `db-reset` | `docker compose exec app php artisan migrate:fresh --seed` |
| `art-clear` | config + route + view + cache clear (all via docker exec) |
| `tinker` | `docker compose exec app php artisan tinker` |
| `log` | `docker compose exec app tail -f storage/logs/laravel.log` |
| `app` | `docker compose exec app bash` |
| `dcup` | `docker compose up -d` |
| `dcdwn` | `docker compose down` |
| `tunnel-on` | `sudo systemctl start cloudflared` |
| `tunnel-off` | `sudo systemctl stop cloudflared` |
| `dev-mode` | swap .env.local → .env + tunnel-off + art-clear |
| `demo-mode` | swap .env.tunnel → .env + tunnel-on + art-clear |

**Shell is FISH — NEVER write Bash syntax:**
```fish
# ✅ Fish
set -gx APP_ENV local

# ❌ Bash (never use)
export APP_ENV=local
```

---

## Docker + Fedora + SELinux

### Volume Mount (SELinux fix)
```yaml
# docker-compose.yml
services:
  app:
    volumes:
      - .:/var/www/html:Z    # :Z is mandatory on Fedora for SELinux
    user: "1000:1000"        # must match host user ID — prevents storage permission conflicts
                             # without this, Apache cannot create directories in storage/
```

### chmod Often Fails on Fedora
```fish
# SELinux blocks chmod — alternatives:
sudo restorecon -Rv storage/
# or
sudo chown -R $USER:$USER storage/

# DO NOT use: chown -R www-data:www-data
# www-data user does not exist on Fedora — container user is ID 1000
```

### Private Storage Permissions
```fish
# From host (most reliable):
sudo chmod -R 755 storage/app/private/
# or
sudo chown -R $USER:$USER storage/
```

### storage/framework/views Can Disappear
```fish
# If error: tempnam(): file created in the system's temporary directory
mkdir -p storage/framework/views
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
```

### composer Not in PATH
```fish
# Full path in container:
docker compose exec app php /usr/local/bin/composer dump-autoload

# Alternative (no composer needed):
docker compose exec app php artisan optimize:clear

# Container restart also works (Laravel reloads autoload on boot):
dcdwn && dcup
```

### MariaDB Location
```
NOT inside container — runs on host machine
Host: 172.17.0.1:3306
DB:   sentinel_admission_db
User: sentinel_core
```

---

## Debugging Protocol

### 500 Error — Correct Order
```
1. Check log FIRST (before assuming anything):
   docker compose exec app grep -E "Exception|Error|message" storage/logs/laravel.log | tail -20

2. If log is empty → enable APP_DEBUG=true in .env + art-clear

3. Check Network tab in DevTools:
   full error is in response JSON body — may be truncated in frontend UI

4. Never assume root cause before reading actual error message

5. "class not found" error:
   → First check if model file was accidentally overwritten (not a code bug)
   → Verify: docker compose exec app grep -n "^class " app/Models/ModelName.php

6. After fixing class issues → always run composer dump-autoload
```

### Fish + sed = Painful
```fish
# sed in Fish has escaping issues for complex replacements
# Use Python instead:
python3 -c "
content = open('file.php').read()
content = content.replace('old', 'new')
open('file.php', 'w').write(content)
"
```

### Controller Namespace Must Match Folder
```
Laravel resolves classes by namespace, not disk location.
If two controllers share a name in different folders (Public/ vs landing/),
namespace in the file MUST match the folder registered in routes.
Mismatch → "Call to undefined method" even if file exists and looks correct.
```

---

## Media Conversion Scripts

### JPG → WebP (Python + Pillow)
```bash
pip install Pillow --break-system-packages
python3 convert_images.py
# Settings: quality=90, method=6, exact=True
# Output naming: photo-01.webp, photo-02.webp
# Delete originals after successful conversion
```

### Video → MP4 (Python + FFmpeg subprocess)
```bash
# No pip needed — calls FFmpeg directly via subprocess
python3 convert_videos.py
# Settings: crf=18, preset=veryslow, -movflags +faststart
# Output naming: video-01.mp4, video-02.mp4
# +faststart = stream-ready, loads faster in browser
```

---

## ENV Files Reference

```
.env        → active file read by Laravel (overwritten when switching modes)
.env.local  → dev mode config (localhost, no HTTPS)
.env.tunnel → demo mode config (public domain, HTTPS, secure cookies)
.env.bak    → original backup — not read by system

All in .gitignore — never push to GitHub
```

### Key Differences Per Mode
| Key | .env.local (dev) | .env.tunnel (demo) |
|---|---|---|
| `APP_URL` | `http://localhost:8080` | `https://spmb.playground-ku.my.id` |
| `SESSION_DOMAIN` | `localhost` | `spmb.playground-ku.my.id` |
| `SESSION_SECURE_COOKIE` | `false` | `true` |
| `FORCE_HTTPS` | `false` | `true` |

---

## Git Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready only — no unverified code |
| `develop` | Integration hub — all feat/* merge here first, audit before main |
| `lab-hack` | Security experiments — intentional vulnerabilities. NEVER merge or push to GitHub |
| `feat/*` | Daily work. Flow: feat/* → develop → audit → main |

**Before schema changes, new features, or merges — always confirm branch with Silvia:**
> *"Silvia, which branch are we on right now?"*

---

## Private Storage Serving Pattern

```php
// temporaryUrl() unreliable on local Docker disk
// Robust solution: dedicated controller route with auth + whitelist regex

// Whitelist regex — block path traversal attacks
if (!preg_match('/^(images|videos)\/[\w\-]+\.(webp|jpg|jpeg|png|mp4)$/i', $filename)) {
    abort(404);
}

// Route must use .+ where clause — slashes in path parameter must not be stripped
Route::get('/media/gallery/{filename}', [WelcomeController::class, 'serveGallery'])
    ->where('filename', '.+');

// Video MP4: must add Accept-Ranges: bytes header for browser scrubbing to work
return response()->file($path, [
    'Accept-Ranges'  => 'bytes',
    'Content-Type'   => 'video/mp4',
]);
```
