# Sentinel Admission — Skills: UI Standards, Security & Engineering Notes
> Load when working on UI, animation, security, or debugging. Contains patterns and hard-learned lessons.

---

## UI & Animation Standards

### 4 Mandatory States (every page and component)

| State | What to show |
|---|---|
| Loading | Skeleton shimmer or spinner — never blank screen |
| Empty | Illustration + informative text — never blank page |
| Error | Clear message + retry button — never raw error code to user |
| Success | Visual confirmation (toast/checkmark) — never silent |

**File upload has 5 states:**

| State | Color/Visual |
|---|---|
| `empty` | Neutral/muted gray — NOT red, not alarming |
| `uploading` | Blue + spinner + progress bar |
| `pending` | Gold/amber — uploaded, awaiting staff review |
| `verified` | Green — verified by staff |
| `rejected` | Red + rejection reason (polite language) |

---

### Mandatory Animation Patterns

#### Entrance (every page/tab mount)
```tsx
animate('.item', {
    opacity: [0, 1], translateY: [20, 0],
    duration: 500, delay: stagger(80), ease: 'outExpo'
})
```

#### Tab / Step Transition (exit → enter, always 2 phases)
```tsx
// Phase 1 — Exit (fast, inQuad)
animate(ref.current, { opacity:[1,0], translateX:[0, dir*-20], duration:180, ease:'inQuad' })
// Phase 2 — Enter (after 190ms, slower, outExpo)
setTimeout(() => {
    setActiveTab(newTab)
    animate(ref.current, { opacity:[0,1], translateX:[dir*20,0], duration:350, ease:'outExpo' })
}, 190)
```

#### Error Shake
```tsx
animate('.input-error', { translateX:[0,-6,6,-4,4,0], duration:380, ease:'outExpo' })
```

#### Button Loading State
```tsx
<button disabled={isSubmitting}>
    {isSubmitting
        ? <><i className="fa-solid fa-spinner fa-spin mr-2"/>Memproses...</>
        : <><i className="fa-solid fa-arrow-right mr-2"/>Simpan</>
    }
</button>
```

#### Upload Progress
```tsx
const [uploadProgress, setUploadProgress] = useState(0)
axios.post(url, formData, {
    onUploadProgress: (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total))
    }
})
```

---

### Progress Bar — Dynamic Color (inline style, NOT Tailwind arbitrary)
```tsx
const getProgressGradient = (pct: number): string => {
    if (pct < 50)  return 'linear-gradient(to right, #c0392b, #e74c3c)'  // red
    if (pct < 75)  return 'linear-gradient(to right, #d35400, #f39c12)'  // orange
    if (pct < 100) return 'linear-gradient(to right, #2980b9, #7aa2f7)'  // blue
    return 'linear-gradient(to right, #1e8449, #27ae60)'                 // green (100%)
}
// Usage: style={{ width: `${pct}%`, background: getProgressGradient(pct) }}
```

---

### SweetAlert2 — swalDark Config
```tsx
import Swal from 'sweetalert2'
const swalDark = Swal.mixin({
    background: '#0f172a', color: '#e2e8f0',
    confirmButtonColor: '#d4a017', cancelButtonColor: '#334155',
    customClass: {
        popup: '!rounded-2xl !border !border-white/10',
        confirmButton: '!rounded-xl !px-6',
        cancelButton: '!rounded-xl !px-6',
    }
})
// Toast (light notification):
swalDark.fire({ toast:true, position:'top-end', icon:'success',
    title:'Tersimpan!', showConfirmButton:false, timer:2000, timerProgressBar:true })
// Confirm (destructive action):
const result = await swalDark.fire({
    title:'Hapus?', icon:'warning', showCancelButton:true,
    confirmButtonText:'Ya, hapus', cancelButtonText:'Batal'
})
```

---

### react-select — makeSelectStyles()
```tsx
// CORRECT export name: makeSelectStyles (not selectStyles)
// ALWAYS call inside component, ALWAYS pass isDark from useTheme()
import { makeSelectStyles } from '@/Components/UI/selectStyles'
import { useTheme } from '@/context/ThemeContext'

// Inside the component:
const { theme } = useTheme()
const isDark = theme === 'dark'
const portalProps = (hasError = false) => ({
    styles: makeSelectStyles(hasError, isDark),
    menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
    menuPosition: 'fixed' as const,
    menuPlacement: 'auto' as const,
})
```

---

### Wizard-Style Navigation Pattern
```
← Kembali (left)     → switch tab only, NO save
Simpan & Lanjut → (right) → POST → toast success → auto handleTabChange(nextTab)
Last tab right button → "Kirim & Selesaikan" with 2-step confirmation
```

### Glow Ambient Effects (dark pages only)
```tsx
// Landing, FormWizard, Register — NOT dashboard professional pages
<div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full
               bg-amber-500/10 blur-3xl"
     style={{ animation: 'glow-move 14s ease-in-out infinite alternate' }} />
// Top-right: amber/rose/sky | Bottom-left: emerald/cyan/amber
```

---

## Security Architecture (Sentinel Layers)

### File Upload — 4 Layers (never skip any)

```
Layer 1 — Browser     type check + size check + SHA-256 hash (UX only, can be bypassed)
Layer 2 — Network     auth + CSRF + rate limit (10 uploads/min/user) + HTTPS
Layer 3 — Backend     3A: Laravel mimes+mimetypes → 3B: magic bytes → 3C: polyglot scan
Layer 4 — Storage     UUID rename + private storage + signed URL + force download
```

#### Layer 3B — Magic Bytes Check
```php
$handle = fopen($file->getRealPath(), 'rb');
$header = bin2hex(fread($handle, 8));
fclose($handle);
$signatures = [
    'image/jpeg' => ['ffd8ff'], 'image/png' => ['89504e47'], 'application/pdf' => ['25504446']
];
// Match header against claimed MIME — reject if mismatch
```
> Do NOT rely on `$file->getMimeType()` — unreliable in Docker. Always read magic bytes directly.

#### Layer 3C — Polyglot Scan
```php
$dangerousPatterns = ['<?php','<?=','eval(','system(','exec(','passthru(',
                      'shell_exec(','base64_decode(','popen(','proc_open('];
foreach ($dangerousPatterns as $pattern) {
    if (stripos($content, $pattern) !== false) {
        return ['clean' => false, 'detail' => "Pattern '{$pattern}' found at offset X"];
    }
}
```

#### Layer 4 — Storage
```php
$extension  = $this->getExtensionFromMagicBytes($detectedMime); // NOT from user input
$storedName = Str::uuid() . '.' . $extension;
$file->storeAs("candidates/{$candidate->candidate_code}", $storedName, 'private');
// Serve via: Storage::disk('private')->temporaryUrl($path, now()->addMinutes(30))
// Always set Content-Disposition: attachment — force download, never render in browser
```

### Error Handling Pattern (all critical controllers)
```php
DB::beginTransaction();
try {
    // ... DB operations
    DB::commit();
    return back()->with('success', 'Berhasil');
} catch (ValidationException $e) {
    DB::rollBack(); throw $e;
} catch (\Exception $e) {
    DB::rollBack();
    Log::error('Controller@method failed', ['user_id' => $request->user()->id, 'error' => $e->getMessage()]);
    return back()->withErrors(['file' => 'Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.']);
}
```

### RBAC — Never Query Candidate by Request ID
```php
// ✅ Correct — load from authenticated user
$candidate = $request->user()->candidate;
// ❌ Wrong — opens IDOR vulnerability
$candidate = Candidate::find($request->candidate_id);
```

### wantsJson() Pattern (Axios + Inertia dual support)
```php
$isJson = $request->wantsJson();
if ($isJson) return response()->json(['message' => 'Success'], 200);
return back()->with('success', 'Berhasil');
// Frontend: always add header 'Accept': 'application/json' in axios requests
```

### Sentinel Toggle (lab-hack branch ONLY)
```
config/sentinel.php → MUST NOT exist in main or develop
Flags: SENTINEL_LAYER_VALIDATION, SENTINEL_LAYER_MAGIC_BYTES, SENTINEL_LAYER_POLYGLOT,
       SENTINEL_LAYER_UUID, SENTINEL_LAYER_RATE_LIMIT, SENTINEL_LAYER_HASH,
       SENTINEL_LAYER_PRIVATE_STORAGE, SENTINEL_LAYER_FORCE_DOWNLOAD
All [LAB-HACK] log warnings must be cleaned before code enters develop.
```

---

## Document Feature — Schema & Architecture

### 16 Document Types, 5 Groups

| Group | Doc Types | Multi-upload |
|---|---|---|
| `identity` | photo_formal, birth_certificate, family_card, parent_id_card | ❌ |
| `academic` | graduation_certificate, report_card, academic_transcript | ❌ |
| `achievement` | achievement_academic, achievement_nonacademic, achievement_religious | ✅ |
| `welfare` | kip_card, welfare_card, poverty_letter | ❌ (choose one) |
| `boarding` | parent_statement, recommendation_letter, transfer_letter* | ❌ |

*`transfer_letter` is conditional — only shows when `candidates.is_transfer = true`

### candidate_documents Schema
```
id, candidate_id (FK), candidate_code (denormalized)
doc_type (varchar 50), doc_group (enum: identity|academic|achievement|welfare|boarding)
original_filename, stored_filename (UUID), file_path (private storage)
mime_type, file_size_kb
status (enum: pending|verified|rejected), rejection_reason
verified_by (FK users, nullOnDelete), verified_at
timestamps, softDeletes
Indexes: [candidate_id, doc_type] · [candidate_id, doc_group] · [candidate_id, status] · [status]
```

### candidate_document_security Schema
```
id, document_id (FK unique — 1-to-1)
magic_bytes_result (enum: passed|suspicious|rejected)
polyglot_clean (bool), polyglot_detail (string|null)
detected_mime, file_hash (SHA-256)
upload_ip, user_agent, scanned_at
Indexes: [magic_bytes_result] · [polyglot_clean]
```

### Frontend Tab Structure
```
DataDokumen/
├── TabIdentitas.tsx    → Group A (4 docs)
├── TabAkademik.tsx     → Group B (3 docs)
├── TabPrestasi.tsx     → Group C (multi-upload, 3 categories)
├── TabBantuan.tsx      → Group D (welfare, choose-one UI)
└── TabBoarding.tsx     → Group E (transfer_letter conditional)
```

---

## Engineering Notes & Gotchas

### Livi's Mindset Rules (from Silvia — mandatory)
- **Do not over-bias.** Know Silvia well but never idolize. Always be willing to challenge decisions with solid reasoning. A critical AI is more valuable than an agreeable one.
- **Don't become narrow.** Each new session needs fresh critical thinking — not just blindly continuing previous session's momentum.
- **"Working" ≠ "Correct."** Never propose "just make it work for now" without explicitly stating trade-offs.
- **Respect when Silvia pulls the brake.** "Let's simplify" = long-term maintenance thinking. Honor it.
- **Challenge > Agree.** If an architectural decision seems wrong, say so — with reasons.

### Before Building Any Feature
1. **Dependency mapping first** — ask: "what does this feature depend on?" Finish dependencies first.
   - Example: don't build Halaman Status before auto-submitted observer is done — status never changes from `draft` without it.
2. **Polish vs Feature rule** — if >3 "TODO" or "fix later" items are accumulating, do a polish pass before adding new features.
3. **Schema = Contract** — changing schema = changing contract between system components. Always: get Silvia's confirmation → check all dependents → update migration + model + seeder.

### Debugging Protocol — 500 Errors
```
1. Check log FIRST: docker compose exec app grep -E "Exception|Error|message" storage/logs/laravel.log | tail -20
2. If log empty: enable APP_DEBUG=true in .env
3. Check Network tab in DevTools — full error in response JSON, may be truncated in frontend
4. Never assume root cause before reading actual error message
5. "class not found" ≠ code bug — first check if model file was accidentally overwritten
   → verify: grep -n "^class " ModelName.php
```

### Third-Party Integration Protocol
```
Before integrating any external service:
1. Read official documentation first
2. Test simplest connection first (e.g. curl)
3. Wrap ALL external API calls in try-catch
4. Store raw response for audit trail
5. If service fails: check credentials → test via curl → check dashboard onboarding → then check code

Silent fail for non-critical external calls:
try { $result = ExternalService::call($params); }
catch (\Exception $e) { Log::warning("Service failed: " . $e->getMessage()); }
```

### Observer Pattern — Best Practices
```php
// Anti-loop: always updateQuietly() when observer updates same model
$model->updateQuietly(['field' => $value]);

// Early exit for performance — check lightest condition first
public function updated(Candidate $candidate): void {
    if ($candidate->status === 'submitted') return;  // already done
    if (empty($candidate->religion)) return;          // lightweight check
    // ... then query other tables
}
```

### Partial Save Pattern (Multi-Tab Forms)
```
Backend:  all fields nullable, format validation still present (min, max, in)
Frontend: required validation per tab still present for UX
Access gate: delegate to Observer/Model, not controller
⚠️ Frontend vs backend validation inconsistency = hidden bug — always audit both sides
```

### DocumentCard — Design Decisions
```
Row style (list item), NOT card boxes — documents are a list, not standalone objects.
Card boxes make the page "boxy" and heavy. DocList wrapper with border-b per item.

Drag & Drop: native HTML5 drag events (onDragOver, onDragLeave, onDrop) — no library.
State isDragOver → visual feedback (amber subtle bg, hint text changes).
Guard: if isLocked or isUploading → ignore drop.

Upload button: auto-changes to "Replace" after upload.
Preview auto-shows after upload.
Verified documents: locked — only preview & download + lock icon.
```

### Warning Dot Per Tab (frontend-only)
```tsx
const REQUIRED_BY_TAB: Record<string, string[]> = {
    identity:       ['photo_formal', 'birth_certificate', 'family_card', 'parent_id_card'],
    academic:       ['graduation_certificate', 'report_card'],
    achievement:    [],
    welfare:        [],
    administration: ['parent_statement'],
}
// Dot also shows for transfer_letter if isTransfer === true
// Status 'rejected' also counts as warning (needs re-upload)
```

### Surat Pernyataan — Hybrid Policy
```
Can be submitted offline (come to school, fill by hand)
OR online (download template, fill digitally, upload with e-materai)
Template: public/assets/surat-pernyataan-template.docx
Button already in DocumentCard via props: showTemplate + templateUrl
Content needs to be filled with official text from school admin.
```

### GalleryCard — Shimmer Effect
```
One global @keyframes CSS (injected once, not per card)
Triggered via JavaScript setTimeout with different stagger delay per card
Stop on hover, resume on mouse leave
Interval: random (4.5s + random 0-2s) — prevents all cards shimmering simultaneously
No JS loop, no setInterval — very lightweight
```

### Origin-Based Lightbox Animation
```tsx
// Lightbox opens from clicked card position — feels premium vs always-from-center
const dx = originCX - window.innerWidth / 2;
const dy = originCY - window.innerHeight / 2;
// Open: animate from card position (small scale + offset) to center (scale 1)
animate(panel, { translateX:[dx,0], translateY:[dy,0], scale:[initScale,1] });
// Close: reverse
animate(panel, { translateX:[0,dx], translateY:[0,dy], scale:[1,0.08] });

// Lightbox left panel blurred backdrop:
filter: 'blur(32px) saturate(0.6) brightness(0.3)' + transform: scale(1.1) (prevent blur edges)
+ dark overlay rgba(4,8,20,0.75)
// Video: no blur backdrop (can't get static frame) — use solid dark gradient instead
```

### Z-Index Layering in Card Components
```
Always define explicit z-index and document the hierarchy:
z-5  → loading placeholder (only while not loaded)
z-6  → permanent gradient overlay
z-7  → hover panel + title
z-8  → badge + corner accents
z-9  → custom cursor
z-99 → ripple (temporary, removed immediately)
```

### Laravel / Eloquent Specifics
- `scope` cannot be called via `hasMany` relation — use `.where()` directly
- Always `Schema::dropIfExists()` at top of `up()` — orphan protection
- Circular FK: use `unsignedBigInteger` (no constraint) first, add FK in separate migration
- `updateQuietly()` in observers — prevents infinite loop when observer updates same model
- `exists()` + `withTrashed()` for SoftDeletes relations in observers
- Seeder: always request migration first before writing — never assume column names from memory

### Frontend / TypeScript
- Dark mode: never dynamic `dark:${variable}` — always hardcode literal classes
- react-select dark mode: never detect from DOM — pass `isDark` from `useTheme()` inside component
- `portalProps` must be defined inside the component function, not at module level
- Prop name shadowing: never name props `document`, `window`, `location`, `status`, `name`
- For dynamic property access use `type` with index signature, not `interface`
- Route ordering: static segments MUST come before wildcards in Laravel routes file
- `navigation.ts` href: always update when adding new routes — exact match required

### Infrastructure
- Docker on Fedora: use `.:/var/www/html:Z` (`:Z` for SELinux) + `user: "1000:1000"` in docker-compose
- `chmod` often fails on Fedora due to SELinux — use `sudo restorecon -Rv <path>` or `sudo chown`
- `storage/framework/views` can disappear — if `tempnam()` error: `mkdir -p storage/framework/{views,cache/data,sessions}`
- Controller namespace must match folder — two controllers with same name in different folders = `Call to undefined method`
- `composer` not in PATH: full path is `docker compose exec app php /usr/local/bin/composer dump-autoload`

### Private Storage Serving
- `temporaryUrl()` unreliable on local Docker disk — use dedicated controller route instead
- Pattern from `WelcomeController::serveGallery()`:
```php
// Whitelist regex — block path traversal
if (!preg_match('/^(images|videos)\/[\w\-]+\.(webp|jpg|jpeg|png|mp4)$/i', $filename)) abort(404);
// Route must use .+ where clause so slashes in parameter are not stripped
Route::get('/media/gallery/{filename}', [...])->where('filename', '.+');
// Video MP4 needs: Accept-Ranges: bytes header for browser scrubbing
```

### When to Rebuild vs Patch
- More than 2-3 patches on same file without seeing the result → **rebuild from scratch**
- Never patch on top of patch blindly — unknown state = unpredictable bugs
- Always tell Silvia: *"Livi wants to rebuild this file from scratch to keep it clean."*

### CinematicShowcase
- Pure CSS `@keyframes translateX(-50%)` on `width: max-content` — NOT ResizeObserver (timing bugs)
- Video cards: `preload="metadata"`, no poster, `controls={false}`, `disablePictureInPicture`
- Gap between set-A and set-B must equal gap between cards: `marginLeft: ${gap}px`
- On mouse leave: `pause()` + `currentTime = 0` to restore first frame naturally

### Media Conversion Scripts
- JPG → WebP: Python + Pillow. Settings: `quality=90, method=6, exact=True`
- Video → MP4: Python + subprocess calling FFmpeg. Settings: `crf=18, preset=veryslow, -movflags +faststart`
- Output naming: `photo-01.webp`, `video-01.mp4` — clean sequential names
- Delete originals after successful conversion — no duplicates
