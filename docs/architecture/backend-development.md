# Backend Architecture & Development Standards
> Technical standards for controllers, service layer, models, transactions, file storage, and RBAC security.

---

## Load Rules
Use this file when the task touches:
- Laravel controllers, services, models, observers, requests, policies, routes, migrations
- File upload, document storage, payment/status lifecycle, RBAC, API/axios/Inertia handling
- Backend audit or security-sensitive changes

Do **not** load for frontend-only visual tasks unless backend behavior/schema is involved.

---

## Priority Order
1. Security
2. Data integrity
3. Authorization / privacy
4. Existing project architecture
5. Maintainability
6. UX response quality

Never sacrifice security for convenience.

---

## Backend Work Protocol
1. Inspect actual migration/model/controller/request before editing.
2. Do not assume column names, enum values, route names, or relation names.
3. Prefer service classes for lifecycle/security logic.
4. Keep controllers thin.
5. Wrap multi-write operations in DB transactions.
6. Return friendly errors to users; log technical details.
7. Run relevant checks when possible: `php artisan test`, `php artisan route:list`, `php artisan optimize:clear`, targeted feature tests.

---

## File Upload Security
Seluruh implementasi upload berkas kandidat wajib mengikuti 4 lapisan validasi (Browser UX, Network Rate-limiting, Backend MIME/Magic-byte/Polyglot scan, Private UUID Storage).

> Rujukan lengkap dan spesifikasi implementasi: [File Upload Security Pipeline](security-and-uploads.md#1-file-upload-security-pipeline-4-layers).

---

## RBAC / IDOR Rules
Never trust candidate/user IDs from request payload for candidate-owned resources.

```php
// candidate area
$candidate = $request->user()->candidate;
```

For staff/admin access:
- Enforce role/permission/policy.
- Scope query by allowed domain/status when applicable.
- Log sensitive review actions.

---

## Error Handling
Use transaction for multi-step DB operations.

Pattern:
- `ValidationException` → rollback then rethrow.
- Other exceptions → rollback, log technical details, return friendly error.
- Never expose stack trace, SQL error, path, internal route, or raw exception to user.

User-facing fallback:
```txt
Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.
```

---

## Axios + Inertia Dual Response
When controller supports both axios JSON and Inertia redirect:

```php
$isJson = $request->wantsJson();
```

Frontend axios must send:
```txt
Accept: application/json
```

Without that header, Laravel may return redirect/session flow instead of JSON.

---

## Observer / Lifecycle Rules
- Use `updateQuietly()` when observer updates the same model.
- Put cheapest checks first; avoid unnecessary queries.
- Use `withTrashed()` when lifecycle checks must include soft-deleted related records.
- Do not let automatic lifecycle overwrite terminal statuses like `accepted` or `rejected`.
- Status transitions must go through centralized services/gates when available.

Candidate auto-submit rule:
- All required fields across candidate, guardian, and health record must be complete before `submitted`.
- Email verification remains separate from candidate status.

---

## Partial Save Multi-Tab Forms
- Backend fields may be nullable to support partial saves.
- Backend still validates format, length, enum, ownership, and authorization.
- Frontend required rules are UX guidance, not backend truth.
- Gate progression through model/service/observer logic, not scattered controller checks.

---

## Private Storage Serving
Dedicated route pattern:
```php
Route::get('/dashboard/dokumen/preview/{path}', ...)
    ->where('path', '.+')
    ->middleware(['auth', 'verified']);
```

Controller requirements:
- Reject path traversal with strict allowlist regex.
- Check auth and ownership/staff permission.
- Use private disk.
- Return `download()` with safe original filename.
- Never serve arbitrary paths from request.

---

## Migration Policy
- If table has no real data, edit existing migration instead of adding noisy migrations.
- If table has data, create `add_*` migration.
- Add `Schema::dropIfExists('table_name')` at top of `up()` only if project convention uses orphan protection.
- For circular FK: create nullable/unsigned ID first, add constraint later.
- Always read current migrations before writing seeder/model logic.

---

## Candidate Code System
```txt
registration_code: REG-{random4}-{yy}-G{wave}
candidate_code:    CDT-{random4}-{yy}-G{wave}
```

Rules:
- Candidate code is generated once.
- Use `withTrashed()` for uniqueness checks.
- Propagate `candidate_code` to guardian, health record, documents, payments only through approved observer/service flow.

---

## Document Backend Schema Summary
`candidate_documents`:
```txt
candidate_id, candidate_code, doc_type, doc_group,
original_filename, stored_filename, file_path,
mime_type, file_size_kb,
status: pending|verified|rejected,
rejection_reason, verified_by, verified_at,
timestamps, softDeletes
```

`candidate_document_security`:
```txt
document_id unique,
magic_bytes_result, polyglot_clean, polyglot_detail,
detected_mime, file_hash, upload_ip, user_agent, scanned_at
```

Multi-upload:
```txt
true: achievement_academic, achievement_nonacademic, achievement_religious
false: all other doc types; replace old active file
conditional: transfer_letter only when is_transfer = true
```

Required-level policy:
- UI label only unless product decision says backend must enforce.
- Backend must still enforce security and ownership for all uploaded files.

---

## Sentinel / Lab-Hack Safety
- `config/sentinel.php` must not exist in main/develop unless explicitly approved.
- Remove all `[LAB-HACK]` logs before merging to develop/main.
- Feature flags for weakening validation are lab-only.

---

## Laravel Gotchas
- Do not call local scopes directly through `hasMany` relation; use `where()` or query correctly.
- Docker MIME detection can be unreliable; use magic bytes for security decisions.
- Composer may require full path in container:
  `docker compose exec app php /usr/local/bin/composer dump-autoload`
- `bootstrap/app.php` 404 handler may need Symfony Response import.
- After route changes, update `navigation.ts` exact hrefs.
- Seeder must follow actual migration columns.
