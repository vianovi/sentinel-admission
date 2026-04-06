# Livi — Backend Skill
> Load this file for backend, security, Laravel, and API work sessions.
> Covers: file security layers, RBAC, observer patterns, error handling, Laravel gotchas.

---

## File Upload — 4 Security Layers (Never Skip Any)

```
Layer 1 — Browser     type check + size check + SHA-256 hash (UX only, bypassable)
Layer 2 — Network     auth + CSRF + rate limit (10 uploads/min/user) + HTTPS
Layer 3 — Backend     3A: Laravel mimes+mimetypes → 3B: magic bytes → 3C: polyglot scan
Layer 4 — Storage     UUID rename + private storage + signed URL + force download
```

### Layer 3A — Laravel Validation
```php
$request->validate([
    'file' => 'required|file|mimes:jpeg,png,pdf|mimetypes:image/jpeg,image/png,application/pdf|max:5120'
]);
```

### Layer 3B — Magic Bytes Check
```php
// DO NOT rely on $file->getMimeType() — unreliable in Docker (returns application/octet-stream)
// Always read magic bytes directly:
$handle = fopen($file->getRealPath(), 'rb');
$header = bin2hex(fread($handle, 8));
fclose($handle);

$signatures = [
    'image/jpeg'      => ['ffd8ff'],
    'image/png'       => ['89504e47'],
    'application/pdf' => ['25504446'],
];
// Match $header against claimed MIME — reject if mismatch
```

### Layer 3C — Polyglot Scan
```php
$content = file_get_contents($file->getRealPath());
$dangerousPatterns = [
    '<?php', '<?=', 'eval(', 'system(', 'exec(',
    'passthru(', 'shell_exec(', 'base64_decode(', 'popen(', 'proc_open('
];
foreach ($dangerousPatterns as $pattern) {
    if (stripos($content, $pattern) !== false) {
        return ['clean' => false, 'detail' => "Pattern '{$pattern}' found"];
    }
}
```

### Layer 4 — Storage
```php
$extension  = $this->getExtensionFromMagicBytes($detectedMime); // NOT from user input
$storedName = Str::uuid() . '.' . $extension;
$file->storeAs("candidates/{$candidate->candidate_code}", $storedName, 'private');

// Serve via dedicated controller route — NOT temporaryUrl() (unreliable on local Docker)
// Always set: Content-Disposition: attachment — force download, never render in browser
```

---

## RBAC — Never Query Candidate by Request ID

```php
// ✅ Correct — load from authenticated user (prevents IDOR)
$candidate = $request->user()->candidate;

// ❌ Wrong — opens IDOR vulnerability
$candidate = Candidate::find($request->candidate_id);
```

---

## Error Handling Pattern

```php
DB::beginTransaction();
try {
    // ... DB operations
    DB::commit();
    return back()->with('success', 'Berhasil disimpan.');
} catch (ValidationException $e) {
    DB::rollBack();
    throw $e; // let Laravel handle validation errors normally
} catch (\Exception $e) {
    DB::rollBack();
    Log::error('ControllerName@method failed', [
        'user_id' => $request->user()->id,
        'error'   => $e->getMessage(),
        'trace'   => $e->getTraceAsString(),
    ]);
    // SILENT to user — no technical details exposed
    return back()->withErrors(['file' => 'Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.']);
}
```

**Rule: Errors are SILENT to users — technical details only in Laravel logs.**

---

## wantsJson() Pattern (Axios + Inertia Dual Support)

```php
// When one controller must serve both axios (JSON) and Inertia clients:
$isJson = $request->wantsJson();
if ($isJson) return response()->json(['message' => 'Success', 'data' => $data], 200);
return back()->with('success', 'Berhasil');

// Frontend axios side: always add header:
// 'Accept': 'application/json'
// Without this header, wantsJson() always returns false
```

---

## Observer Patterns

### Anti-Loop — updateQuietly()
```php
// Always use updateQuietly() when observer updates the same model
// Without this → infinite observer loop
$candidate->updateQuietly(['status' => 'submitted']);
```

### Early Exit for Performance
```php
public function updated(Candidate $candidate): void
{
    // Check lightest condition first before any DB query
    if ($candidate->status === 'submitted') return;
    if (empty($candidate->religion)) return;
    // ... only then query other tables
}
```

### SoftDeletes in Observers
```php
// Always use withTrashed() when checking relations with SoftDeletes
$exists = $candidate->documents()->withTrashed()->exists();
```

### checkAndSubmit() Pattern
```php
// Auto-submitted criteria — 13 fields across 3 tables
// candidates:     religion, program_choice
// guardians:      mother_name, income_type, father_status, mother_status, no_kk
// health_records: blood_type, rhesus, height_cm, weight_kg,
//                 general_health_condition, eye_right_type, eye_left_type
// All 13 must be non-null → status changes to 'submitted'
```

---

## Partial Save Pattern (Multi-Tab Forms)

```
Backend:  all fields nullable — format validation still present (min, max, in rules)
Frontend: required validation per tab still present for UX
Access gate: delegate to Observer/Model logic, NOT controller
⚠️ Frontend required ≠ backend required is a HIDDEN BUG — always audit both sides
```

---

## Private Storage Serving

```php
// temporaryUrl() unreliable on local Docker disk — use dedicated controller route
// Pattern from WelcomeController::serveGallery():

// Whitelist regex — block path traversal
if (!preg_match('/^candidates\/[\w\-]+\/[\w\-]+\.(pdf|jpg|jpeg|png|webp)$/i', $path)) {
    abort(404);
}

// Check auth before serving
abort_unless(auth()->check(), 403);

// Force download — never render in browser
return Storage::disk('private')->download($path, $originalName, [
    'Content-Type'        => $mimeType,
    'Content-Disposition' => 'attachment; filename="' . $originalName . '"',
]);

// Route must use .+ where clause — slashes in parameter must not be stripped
Route::get('/dashboard/dokumen/preview/{path}', [DocumentController::class, 'preview'])
    ->where('path', '.+')
    ->middleware(['auth', 'verified']);
```

---

## Migration Policy

```
No new migration for adding columns if table has no data → edit existing migration
Exception: table already has data → create add_* migration for ALTER TABLE

Always add at top of up():
Schema::dropIfExists('table_name'); // orphan protection

Circular FK dependency:
1. Use unsignedBigInteger (no constraint) in initial migration
2. Add FK constraint in separate migration after both tables exist
```

---

## Candidate Code System

```php
// registration_code format: REG-{random4}-{yy}-G{wave}  e.g. REG-A3X9-26-G2
// candidate_code:           CDT-{random4}-{yy}-G{wave}  (same suffix, prefix only changes)

$candidateCode = str_replace('REG-', 'CDT-', $draft->registration_code);

// Generated ONCE at step3 init — skip if already exists
// Loop uniqueness check with withTrashed() to include soft-deleted records
// CandidateObserver propagates candidate_code to:
//   guardians, health_records, candidate_documents, payments
```

---

## Sentinel Toggle (lab-hack branch ONLY)

```
config/sentinel.php MUST NOT exist in main or develop branches

Flags:
  SENTINEL_LAYER_VALIDATION, SENTINEL_LAYER_MAGIC_BYTES, SENTINEL_LAYER_POLYGLOT,
  SENTINEL_LAYER_UUID, SENTINEL_LAYER_RATE_LIMIT, SENTINEL_LAYER_HASH,
  SENTINEL_LAYER_PRIVATE_STORAGE, SENTINEL_LAYER_FORCE_DOWNLOAD

All [LAB-HACK] log warnings must be removed before any code enters develop.
```

---

## Laravel Gotchas

```
scope() cannot be called via hasMany relation → use .where() directly
  ❌ $model->relation()->scopeName()->get()
  ✅ $model->relation()->where('column', 'value')->get()

getMimeType() unreliable in Docker → always read magic bytes directly (fread 8 bytes)

composer not in PATH in container:
  full path: docker compose exec app php /usr/local/bin/composer dump-autoload
  alternative: docker compose exec app php artisan optimize:clear

bootstrap/app.php 404 handler → use Symfony\Component\HttpFoundation\Response

Seeder: always read actual migration before writing → never assume column names

navigation.ts href: always update after adding new routes — exact match required
```

---

## Document Feature — Backend Schema

### candidate_documents
```
id, candidate_id (FK), candidate_code (denormalized)
doc_type (varchar 50), doc_group (enum: identity|academic|achievement|welfare|boarding)
original_filename, stored_filename (UUID), file_path (private storage)
mime_type, file_size_kb
status (enum: pending|verified|rejected), rejection_reason
verified_by (FK users nullOnDelete), verified_at
timestamps, softDeletes
Indexes: [candidate_id, doc_type] · [candidate_id, doc_group] · [candidate_id, status]
```

### candidate_document_security
```
id, document_id (FK unique — 1-to-1 with candidate_documents)
magic_bytes_result (enum: passed|suspicious|rejected)
polyglot_clean (bool), polyglot_detail (string|null)
detected_mime, file_hash (SHA-256)
upload_ip, user_agent, scanned_at
Indexes: [magic_bytes_result] · [polyglot_clean]
```

### Multi-Upload Policy
```
allow_multiple = TRUE  → achievement_academic, achievement_nonacademic, achievement_religious
allow_multiple = FALSE → all other doc_types (replace, not append)
transfer_letter        → conditional, only shows when candidates.is_transfer = true
```

### Required Level Policy (UI label only — no backend enforcement)
```
identity:  photo_formal, birth_certificate, family_card, parent_id_card → Required
academic:  graduation_certificate, report_card → Required
           academic_transcript → Optional
           transfer_letter → Required if is_transfer = true
achievement: all → Optional (bonus)
welfare:   kip_card, welfare_card, poverty_letter → Choose one (if applicable)
boarding:  parent_statement → Required (UI label only)
           recommendation_letter → Optional
```
