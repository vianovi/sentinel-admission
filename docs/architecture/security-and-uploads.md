# Security Standard & Upload Security Pipeline

Dokumen ini merupakan Single Source of Truth (SSOT) untuk standar keamanan aplikasi dan pipeline validasi berkas pendaftaran di Sentinel Admission.

---

## 1. File Upload Security Pipeline (4 Layers)

Setiap dokumen pendaftaran (`photo_formal`, `birth_certificate`, `family_card`, `report_card`, dll.) wajib melalui 4 lapisan keamanan bertahap:

```text
[ Browser / Client ] (UX Type & Size Check - NEVER TRUSTED)
        ↓
[ Network Boundary ] (Auth + CSRF + HTTPS + Rate Limit 10 uploads/min/user)
        ↓
[ Backend Validation ]
   ├─ 1. Extension & MIME Allowlist (jpeg, png, pdf / max 5MB)
   ├─ 2. Magic-Byte Binary Header Inspection
   └─ 3. Polyglot / Malicious Payload Scanning
        ↓
[ Storage & Access ] (UUID v4 Filename + Private Disk + Controller-Gated Access)
```

### Layer 1: Client / Browser UX Guard
- Pengecekan ukuran dan tipe ekstensi di sisi browser hanya untuk kenyamanan interaksi pengguna (UX), **tidak pernah dianggap sebagai kontrol keamanan**.

### Layer 2: Network & Request Boundary
- Seluruh endpoint upload berada di balik middleware autentikasi session (`auth`, `role:candidate|staff|admin`), verifikasi CSRF token, HTTPS, dan rate limiting ketat (maksimal 10 upload/menit per user).

### Layer 3: Backend Deep Inspection
1. **MIME & Extension Allowlist:**
   Pemeriksaan ketat ekstensi dan MIME type:
   ```php
   "file" => "required|file|mimes:jpeg,png,pdf|mimetypes:image/jpeg,image/png,application/pdf|max:5120"
   ```
2. **Magic-Byte Binary Inspection:**
   Sistem membaca byte awal langsung dari stream berkas untuk mencocokkan signature resmi:
   - **JPEG**: `FF D8 FF`
   - **PNG**: `89 50 4E 47`
   - **PDF**: `25 50 44 46` (`%PDF`)
3. **Polyglot & Malicious Payload Scanning:**
   Pemeriksaan konten biner terhadap injeksi skrip server-side berbahaya:
   - `<?php`, `<?=`, `eval(`, `system(`, `exec(`, `passthru(`, `shell_exec(`, `base64_decode(`
   - Catatan: Polyglot scanning berfungsi sebagai layer pertahanan tambahan (*defense in depth*).

### Layer 4: Storage & Private Gated Access
- **UUID Filename:** Nama asli berkas dari pengguna langsung diganti dengan UUID v4 acak (`Str::uuid()`) untuk mencegah path traversal dan overwriting.
- **Private Filesystem Disk:** Berkas disimpan di `storage/app/private/sentinel/candidates/...`, **tidak pernah** diletakkan di `public/storage/` atau web root Apache.
- **Controller-Gated Access:** Akses unduh dan pratinjau dilayani secara eksklusif melalui controller (`SecureFileController`) yang memverifikasi kepemilikan data kandidat (`CandidatePolicy` / IDOR protection).

---

## 2. OWASP ASVS Security Standard (9 Mandatory Domains)

### Domain 1: Authentication & Accounts
- Pendaftaran, login, logout dengan session regeneration.
- Password hashing menggunakan bcrypt dengan cost faktor standar framework.
- Proteksi brute force via rate limiting / throttling pada route auth (`/login`, `/daftar/*`).
- Email verification dan proteksi token reset password.
- Pencegahan enumerasi akun pada formulir login dan reset.

### Domain 2: Authorization & Ownership (RBAC & IDOR)
- Pemisahan peran tegas (`candidate`, `staff`, `admin`) via middleware `RoleMiddleware`.
- Pemeriksaan kepemilikan data kandidat (`$candidate->user_id === Auth::id()`).
- Data yang berstatus final (`accepted`, `rejected`, `verified`) dilindungi dari mutasi sepihak oleh kandidat.

### Domain 3: Input Validation & Sanitization
- Seluruh input eksternal divalidasi via Form Request (`StoreCandidateRequest`, `SaveAnswerRequest`, dll.).
- Output encoding otomatis oleh Blade dan React (JSX) untuk mencegah XSS.
- Penggunaan Eloquent parameter binding untuk seluruh interaksi query database (proteksi SQL Injection).

### Domain 4: Session & CSRF
- CSRF token diwajibkan untuk seluruh request HTTP `POST`, `PUT`, `PATCH`, dan `DELETE`.
- Cookie session dikonfigurasi dengan flag `HttpOnly`, `SameSite=Lax`, dan `Secure` pada mode HTTPS/produksi.

### Domain 5: Payment & Webhook Security
- Jumlah tagihan dan nomor order di-generate oleh backend Laravel, tidak pernah dipercayai dari frontend client.
- Webhook Midtrans wajib diverifikasi menggunakan signature hash SHA-512 (`order_id + status_code + gross_amount + ServerKey`).
- Penanganan webhook menerapkan prinsip idempotensi untuk mencegah race condition pembayaran ganda.

### Domain 6: Exam CBT Engine Integrity
- Jawaban ujian disimpan dan dihitung skornya di server (`ExamScoringService`), kunci jawaban **tidak pernah dikirim ke browser**.
- Timer ujian dikontrol oleh server (`expires_at_iso`). Jika waktu habis, attempt otomatis dikunci (`auto-submitted`).
- Isolasi attempt per sesi ujian dan verifikasi status pembayaran lunas sebelum ujian dapat dibuka.

### Domain 7: Error Handling & Logging
- `APP_DEBUG=false` pada mode staging dan produksi; stack trace tidak boleh bocor ke browser pengguna.
- Log sistem disanitasi: dilarang mencatat kata sandi, token autentikasi, server key pembayaran, atau PII sensitif.

### Domain 8: Dependencies & Infrastructure
- Pemeriksaan kerentanan berkala via `composer audit` dan `npm audit`.
- Web server root strictly mengarah ke direktori `public/`.
- File konfigurasi rahasia (`.env`) tidak boleh berada dalam kontrol versi Git.

### Domain 9: Severity Classification Matrix
- **CRITICAL:** RCE, SQLi, bypass autentikasi, IDOR baca/tulis massal, kebocoran payment key. Memblokir promosi rilis secara mutlak.
- **HIGH:** Celah eskalasi hak akses terbatas, kegagalan CSRF pada mutasi sensitif, kebocoran kunci jawaban ujian. Memblokir promosi rilis.
- **MEDIUM:** Kelemahan rate limit pada endpoint sekunder, header keamanan yang kurang ketat.
- **LOW / INFORMATIONAL:** Hardening minor, catatan observasi kode.
