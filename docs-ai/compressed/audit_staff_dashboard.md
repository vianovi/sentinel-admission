# Sentinel Admission — Staff Dashboard Audit Report
> Dibuat oleh Livi · Deep Discussion Session · Mei 2026
> Branch aktif: `feat/staf-dashboard`
> Load file ini bersama 00_core + 01_project + 02_status + 03_skill_base setiap session yang menyentuh staff dashboard.

---

## Konteks Audit

Audit ini dilakukan dengan membedah seluruh Candidate controllers, Models, Observers, dan Routes yang sudah ada — lalu memetakan fitur candidate mana saja yang **belum punya trigger/kontrol di sisi staff dashboard**.

File yang dibedah:
- Controllers: `Candidate/{Index,Profile,DataDiri,Guardian,HealthRecord,Document,Payment}Controller.php`
- Controllers: `Staff/{Index,Profile}Controller.php`
- Models: `Candidate, Guardian, HealthRecord, CandidateDocument, Payment, User, AdmissionWave, AdmissionProgram, PaymentConfig`
- Observers: `CandidateObserver, GuardianObserver, HealthRecordObserver`
- Routes: `web.php`, `auth.php`

---

## Temuan Audit

### GAP 1 — Data Change Request (BELUM ADA di Staff)

**Situasi candidate:**
Candidate bisa request perubahan data kunci (full_name, nisn, nik, gender, place_of_birth, date_of_birth, address_detail, school_origin) via `POST /dashboard/data-diri/change-request`. Data tersimpan di kolom `data_change_request` (JSON) di tabel `candidates` dengan struktur:
```json
{
  "field": "full_name",
  "old_value": "...",
  "new_value": "...",
  "reason": "...",
  "status": "pending",
  "requested_at": "..."
}
```

**Gap:** Staff dashboard **tidak punya fitur apapun** untuk melihat, menyetujui, atau menolak request ini. Request akan numpuk tanpa bisa diproses.

**Yang harus dibangun di Staff:**
- Notifikasi/badge di dashboard kalau ada pending change request
- Di halaman `Show.tsx` candidate: section khusus untuk review change request
- Backend method: `approveDataChange()` dan `rejectDataChange()` — saat approve, apply `new_value` ke kolom aslinya, lalu clear `data_change_request`
- Route: `POST /dashboard/staff/candidates/{candidate}/change-request/approve` dan `.../reject`

**Rekomendasi Service:** Logic apply change → masuk `CandidateDataService`

---

### GAP 2 — Email Change Request (BELUM ADA di Staff)

**Situasi candidate:**
Candidate bisa request ganti email via `POST /dashboard/profile/email`. Data tersimpan di `pending_email`, `pending_email_token`, `pending_email_requested_at` di tabel `users`. Candidate juga bisa cancel sendiri.

**Gap:** Staff tidak punya akses untuk approve (apply `pending_email` → `email`) atau reject (clear `pending_email`).

**Yang harus dibangun di Staff:**
- Di halaman `Show.tsx` candidate: tampilkan badge/info kalau ada pending email change
- Backend method: `approveEmailChange()` dan `rejectEmailChange()`
- Route: `POST /dashboard/staff/candidates/{candidate}/email-change/approve` dan `.../reject`

**Rekomendasi Service:** Logic approve/reject → masuk `CandidateDataService`

---

### GAP 3 — Payment Verification Manual (INCOMPLETE)

**Situasi candidate:**
Candidate bisa buat payment via 3 channel: `gateway`, `transfer`, `cash`. Untuk channel manual (transfer/cash), candidate upload bukti bayar. Model `Payment` sudah punya state machine lengkap:
```
waiting_proof → proof_uploaded → verified / rejected
```
Field yang sudah ada: `manual_status`, `proof_path`, `proof_original_filename`, `proof_uploaded_at`, `proof_attempt`, `rejection_reason`, `verified_by`, `verified_at`, `paid_at`.

**Gap:** Staff IndexController **tidak punya method verifikasi payment** sama sekali. Tidak ada route untuk ini. Data payment bahkan tidak di-load di `show()` Staff — padahal relasinya sudah ada (`$candidate->load([..., 'payments'])`).

**Yang harus dibangun di Staff:**
- Di `Show.tsx`: tab atau section Payment — tampilkan status, bukti bayar (dengan preview), dan form approve/reject
- Backend method: `verifyPayment(Request $request, Payment $payment)`
  - Approve: `manual_status = verified`, `status = paid`, `paid_at = now()`, `verified_by = Auth::id()`, `verified_at = now()`
  - Reject: `manual_status = rejected`, `rejection_reason = ...`, biarkan `status = pending` agar candidate bisa re-upload
- Route: `POST /dashboard/staff/payments/{payment}/verify`
- Serve bukti bayar dari private storage ke staff

**Rekomendasi Service:** Logic verifikasi → `PaymentVerificationService` (terpisah dari `PaymentService` yang sudah ada)

**Pending decision:** Apakah admin juga bisa verifikasi payment? → Menentukan apakah service ini shared atau staff-only.

---

### GAP 4 — Preview Dokumen Candidate dari Private Storage (INCOMPLETE)

**Situasi candidate:**
Semua dokumen candidate disimpan di private storage (`storage/app/private/candidates/{candidate_code}/`). Candidate bisa download via `GET /dashboard/data-dokumen/download/{document}` — route ini dilindungi middleware candidate.

**Gap:** Staff bisa lihat list dokumen dan bisa verify/reject di `Show.tsx`, tapi **tidak bisa membuka/preview file dokumen** karena tidak ada serve route untuk staff.

**Yang harus dibangun di Staff:**
- Route: `GET /dashboard/staff/documents/{document}/preview`
- Backend method: `previewDocument(CandidateDocument $document)` — validasi ownership (dokumen milik candidate manapun boleh diakses staff), serve dari private storage

**Rekomendasi Service:** Bisa pakai `PrivateFileService` sederhana, atau langsung di controller karena logicnya straightforward.

---

### GAP 5 — Preview Health Documents dari Private Storage (BELUM ADA)

**Situasi candidate:**
Health record punya 4 file upload terpisah yang disimpan di private storage:
- `surat_sehat_path` → `health-documents/{candidate_id}/`
- `bpjs_card_path`
- `vaccine_card_path`
- `chronic_disease_doc_path`

URL untuk candidate menggunakan `temporaryUrl()` yang di-generate di model accessor (`getSuratSehatUrlAttribute()`, dll).

**Gap:** Di `Show.tsx` tab Kesehatan, staff hanya lihat data teks — **tidak bisa lihat dokumen kesehatan** candidate sama sekali. Accessor `temporaryUrl` di HealthRecord model hanya untuk candidate (pakai S3-style temp URL, tidak bisa untuk private disk lokal).

**Yang harus dibangun di Staff:**
- Route: `GET /dashboard/staff/health-documents/{candidate}/surat-sehat` (dan untuk 3 dokumen lainnya) — atau satu route dengan `{docType}` parameter
- Backend method: serve health document dari private storage dengan validasi staff role

---

### GAP 6 — Force Verified oleh Staff (EDGE CASE, Perlu Keputusan)

**Situasi sekarang:**
Status `verified` hanya ter-trigger otomatis dari `verifyDocument()` — kalau **semua** dokumen candidate sudah berstatus `verified`. Logic-nya:
```php
$allVerified = $candidate->documents()->where('status', '!=', 'verified')->doesntExist();
if ($allVerified && $candidate->documents()->count() > 0) {
    $candidate->update(['status' => 'verified']);
}
```

**Edge case:** Candidate yang tidak upload dokumen sama sekali (`count() = 0`) tidak akan pernah berstatus `verified` secara otomatis → tidak bisa di-accept/reject oleh staff.

**Yang perlu diputuskan Silvia:**
- Apakah staff boleh manual force-set `status = verified` untuk bypass kasus ini?
- Atau kita enforce: candidate harus upload minimal 1 dokumen sebelum bisa diverifikasi?

**Pending decision:** Butuh keputusan eksplisit dari Silvia sebelum dibangun.

---

## Rekomendasi Service Structure

Berdasarkan audit, berikut rekomendasi perubahan service layer:

| Logic | Sekarang | Rekomendasi |
|---|---|---|
| Verify dokumen kandidat | Di `IndexController@verifyDocument` | Pindah ke `DocumentVerificationService` |
| Approve/reject data change request | Belum ada | Buat `CandidateDataService` |
| Approve/reject email change | Belum ada | Masuk `CandidateDataService` |
| Verifikasi payment manual | Belum ada | Buat `PaymentVerificationService` |
| Serve private file untuk staff | Belum ada | Logic sederhana, langsung di controller atau `PrivateFileService` |

**Yang TIDAK perlu diubah:**
- `DocumentSecurityService` — sudah benar dan bersih
- `PaymentService` — sudah benar, fokusnya adalah create & upload proof

---

## Summary — Fitur Staff Dashboard Yang Perlu Dibangun

### Belum Ada Sama Sekali (5 fitur)
1. ✅ Approve / reject **data change request** candidate
2. ✅ Approve / reject **email change request** candidate
3. ✅ **Verifikasi payment manual** (approve/reject bukti bayar)
4. ✅ **Preview dokumen** candidate dari private storage
5. ✅ **Preview health documents** dari private storage

### Sudah Ada Tapi Perlu Dilengkapi (2 hal)
6. ⚠️ Logic **force-verified** oleh staff untuk edge case candidate tanpa dokumen → pending keputusan Silvia
7. ⚠️ **Service layer** untuk payment verification & candidate data changes → refactor setelah semua fitur selesai dibangun

---

## Pending Decisions — Harus Dijawab Silvia Sebelum Build

| # | Pertanyaan | Impact |
|---|---|---|
| 1 | Apakah admin juga bisa verifikasi payment manual, atau staff saja? | Menentukan apakah `PaymentVerificationService` shared atau staff-only |
| 2 | Apakah staff boleh force-set `verified` untuk candidate tanpa dokumen? | Menentukan apakah perlu manual override di `updateStatus()` |

---

## File Yang Perlu Disentuh (Estimasi)

| File | Aksi |
|---|---|
| `app/Http/Controllers/Dashboard/Staff/IndexController.php` | Edit — tambah `verifyPayment()`, `approveDataChange()`, `rejectDataChange()`, `approveEmailChange()`, `rejectEmailChange()`, `previewDocument()` |
| `app/Services/CandidateDataService.php` | Baru |
| `app/Services/PaymentVerificationService.php` | Baru |
| `routes/web.php` | Edit — tambah routes baru di staff group |
| `resources/js/Pages/Dashboard/Staff/Show.tsx` | Edit — tambah tab/section Payment, Change Request, Email Change |
| `resources/js/Components/Dashboard/Staff/Show/TabPayment.tsx` | Baru |
| `resources/js/Components/Dashboard/Staff/Show/TabChangeRequest.tsx` | Baru |

---

*Sentinel Admission · Audit oleh Livi · Mei 2026*
*Jangan execute apapun sebelum pending decisions di atas dijawab Silvia*
