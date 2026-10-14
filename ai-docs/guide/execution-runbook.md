# Auditor Execution Runbook & Operational Standards

Dokumen ini merupakan panduan operasional teknis pelaksanaan audit kode, verifikasi sistem, pencatatan bukti, dan klaim kesiapan produksi di Sentinel Admission. Aturan filosofi dan batasan keselamatan inti merujuk ke [`AGENTS.md`](../../AGENTS.md).

---

## 1. Startup & Resume Protocol

### A. Startup Sesi Baru
1. Periksa root repositori dan branch kerja: `git status --short --branch`.
2. Baca file state aktif secara berurutan:
   - `ai-docs/state/CURRENT.md` (koordinat aktif)
   - `ai-docs/state/HANDOFF.md` (catatan transfer konteks)
   - `ai-docs/state/BLOCKERS.md` (eskalasi terbuka)
   - `ai-docs/state/QUEUE.md` (antrean slice)
3. Baca task aktif di `ai-docs/tasks/`.
4. Catat baseline commit SHA sebelum memulai modifikasi kode.

### B. Melanjutkan Sesi (Resume)
1. Bandingkan catatan di `CURRENT.md` dengan status riil Git (`git log -2 --oneline`).
2. Periksa apakah terdapat perubahan yang belum di-commit (`working tree clean`).
3. Jalankan verifikasi terkecil yang relevan untuk memastikan fondasi hijau sebelum melanjutkan langkah berikutnya.

---

## 2. Checklist Pelaksanaan Deep Audit (Deep Audit Execution)

Saat mengaudit sebuah slice fitur, lakukan penelusuran sistematis berikut:

1. **State Mutation Tracing:**
   - Telusuri seluruh jalur mutasi (insert, update, delete, transisi status) pada model-model penting (`Candidate`, `Payment`, `ExamAttempt`).
   - Pastikan transisi status dikontrol oleh Service terpusat, bukan controller ad-hoc.
2. **Contract Verification (Backend to Frontend):**
   - Pastikan props yang dikirim dari controller Inertia/JSON sesuai dengan antarmuka TypeScript pada komponen frontend.
3. **Edge & Failure Paths:**
   - Audit validasi input, penanganan nilai kosong/null, kondisi batas (*boundary conditions*), dan pesan feedback error.
4. **Idempotency & Concurrency:**
   - Gunakan transaksi atomik (`DB::transaction`) untuk operasi tulis yang melibatkan lebih dari satu tabel atau pembaruan status krusial (kuota, pembayaran, penyerahan jawaban ujian CBT).
5. **Async & Background Jobs:**
   - Audit penanganan queue, WebSockets Reverb broadcaster, dan webhook listener Midtrans.

---

## 3. Evidence & Documentation Standards

Setiap slice audit yang selesai wajib mencatat bukti terverifikasi di bawah direktori `ai-docs/reports/evidence/<slice-name>/<date>/`:

- **Lingkungan & Commit:** Catat branch, commit baseline, dan commit hasil perbaikan.
- **Perintah yang Dijalankan:** Simpan ringkasan perintah CLI beserta exit status.
- **Hasil Verifikasi:** Rekam jumlah test (`Tests: X passed (Y assertions)`), status build Vite, dan daftar route.
- **Sanitasi Data:** Dilarang menyimpan credential `.env`, private key, token autentikasi, atau data pribadi nyata dalam berkas evidence.

---

## 4. Claims Policy (Kebijakan Klaim Status)

Auditor dilarang membuat klaim kesiapan produksi tanpa bukti terverifikasi langsung:

| Klaim yang Diizinkan (Dengan Bukti) | Klaim Terlarang (Dilarang Tanpa Bukti) |
|---|---|
| `CODE AUDIT PASS` | "Aplikasi 100% bebas dari bug" |
| `SECURITY PASS FOR AUDITED SCOPE` | "Tidak ada celah kerentanan sama sekali" |
| `BUILD / TEST PASS (114/114 passing)` | "Tampilan UI visual sudah disetujui / sempurna" |
| `HUMAN VISUAL REVIEW REQUIRED` | "Seluruh alur bisnis berjalan mulus di semua perangkat" |

---

## 5. Perintah Verifikasi Standar

Gunakan perintah resmi sesuai lingkup perubahan:

```bash
# 1. Verifikasi route & middleware
php artisan route:list

# 2. Verifikasi unit & feature test
php artisan test --compact

# 3. Verifikasi formatting kode PHP
vendor/bin/pint --dirty --format agent

# 4. Verifikasi kompilasi frontend TypeScript
npx tsc --noEmit

# 5. Verifikasi build asset produksi
npx vite build
```


---

## 6. Checkpoints & Findings Schema

### A. Checkpoint Discipline
Record a checkpoint in `ai-docs/state/`:
- After every confirmed finding.
- After any file modification.
- Before and after running test or verification suites.
- When approaching context budget limit.

### B. Standard Findings Schema
```markdown
[CRITICAL | HIGH | MEDIUM | LOW] — <finding title>
File: <path:line>
Evidence: <command run + actual output, or code excerpt>
Verified: YES (describe how) | NO (state why not)
Recommendation: <specific fix>
Status: OPEN | FIXED | HUMAN REVIEW REQUIRED
```

### C. Verification & Retry Discipline
- On failing checks, investigate root cause and retry at most 2 times. If still failing, stop and escalate.
- Never mark tasks "passing" from partial or truncated command outputs.
- When a fix is applied, re-run the original failing check to confirm resolution.

