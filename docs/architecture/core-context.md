# Core Domain Model & Business Architecture

Dokumen ini merupakan panduan arsitektur model bisnis, alur pendaftaran berjenjang, konvensi penamaan, dan aturan integritas data pada Sentinel Admission.

---

## 1. Identitas Sistem & Penamaan Brand

| Parameter | Nilai Resmi | Aturan Penggunaan |
|---|---|---|
| **Internal Code** | `Sentinel Admission` | Nama arsitektur sistem; **dilarang ditampilkan pada halaman publik/user-facing** |
| **Website Brand** | `Al-Muntaha School` / `Al-Muntaha Islamic Boarding School` | Ditampilkan pada navbar publik, footer, judul tab browser |
| **Brand Tagline** | `Menuju Puncak Ilmu & Akhlak` | Ditampilkan pada hero & sub-navbar |
| **Kode Registrasi** | `REG-{4char}-{yy}-G{wave}` | Diberikan pada saat pendaftaran awal (Draft) |
| **Kode Kandidat** | `CDT-{4char}-{yy}-G{wave}` | Ditransformasi dari `REG-` ke `CDT-` setelah draft disubmit menjadi akun resmi |

---

## 2. Model Otorisasi & Peran Global (RBAC)

Aplikasi memiliki 3 peran global mutlak yang dikontrol oleh `App\\Http\\Middleware\\RoleMiddleware`:
- **`candidate`**: Pendaftar / calon peserta didik. Hanya berhak mengakses data dirinya sendiri (`$candidate->user_id === Auth::id()`).
- **`staff`**: Petugas panitia SPMB. Bertugas memverifikasi kelengkapan berkas fisik/administrasi, memeriksa bukti transfer manual, dan mencatat hasil seleksi.
- **`admin`**: Administrator sistem. Memiliki seluruh hak akses staf ditambah pengaturan gelombang, penetapan kuota, master CBT (bank soal, sesi, paket), dan manajemen akun pengguna.

> **Catatan Arsitektur:** Istilah fungsional seperti *verifikator*, *bendahara*, atau *penguji CBT* adalah domain operasional di dalam peran `staff`, bukan role autentikasi database terpisah.

---

## 3. Alur Formulir Pendaftaran Tamu (Form Wizard)

Pendaftaran akun baru dilakukan secara bertahap melalui antarmuka multi-langkah tanpa memerlukan autentikasi login terlebih dahulu:

```text
[ Step 1: Data Diri ] ──────► POST /daftar/step1
      │                        └─ Menghasilkan draft_token (HttpOnly Cookie) & REG-XXXX
      ▼
[ Step 2: Data Wali ] ──────► PUT /daftar/step2/{draft}
      │                        └─ Menyimpan data orang tua & wali murid
      ▼
[ Step 3: Data Medis ] ─────► PUT /daftar/step3/{draft}
      │                        └─ Validasi final & pembuatan akun User + Candidate
      ▼
[ Auto Login & Redirect ] ──► Pengalihan langsung ke Dashboard Kandidat
```

### Kunci Penyimpanan Sementara Browser (`localStorage`):
- `wizard_step1`, `wizard_step2`, `wizard_step3`, `wizard_draft_id`, `wizard_last_step`

---

## 4. Standar Validasi Data (Frontend & Backend Aligned)

| Field / Parameter | Aturan Validasi | Keterangan |
|---|---|---|
| `email` | `required|email|max:255|unique:users,email` | Domain pendaftaran valid |
| `phone_number` / `whatsapp` | `required|string|regex:/^08[0-9]{8,12}$/` | Dinormalisasi ke format lokal `08...` |
| `nik` & `family_card_number` | `digits:16` | Nomor Induk Kependudukan & Nomor Kartu Keluarga |
| `postal_code` | `digits:5` | Kode pos alamat domisili |
| `previous_school_npsn` | `digits:8` | Nomor Pokok Sekolah Nasional |
| `child_order` | `integer|between:1,20` | Urutan anak dalam keluarga |
| `siblings_count` | `integer|between:0,20` | Jumlah saudara kandung |

---

## 5. Protokol Pengajuan Perubahan Data (Change Request)

### A. Perubahan Biodata Kandidat (`candidates.data_change_request`)
Setelah status pendaftaran berstatus `verified`, perubahan data inti (`full_name`, `nisn`, `nik`, `birth_place`, `birth_date`, `address_detail`, `previous_school_name`) wajib melalui persetujuan staf:
```json
{
  "field": "full_name",
  "old_value": "Nama Lama",
  "new_value": "Nama Baru",
  "reason": "Penyesuaian ejaan akta kelahiran",
  "status": "pending",
  "requested_at": "2026-10-14T10:00:00Z"
}
```
Ketika staf menyetujui, service `ChangeRequestService` otomatis menimpa nilai ke kolom model kandidat dan mengubah status request menjadi `approved`.

### B. Perubahan Email Akun (`users.pending_email`)
Kandidat mengajukan email baru -> staf memverifikasi secara manual -> setelah disetujui (`pending_email_status = approved`), kandidat menerapkan perubahan tersebut dari panel profil.

---

## 6. Prinsip Integritas Data & Transaksi

1. **Pencegahan Observer Infinite Loop:**
   Setiap observer yang memperbarui model yang sama wajib menggunakan method `updateQuietly()`:
   ```php
   $model->updateQuietly(["status" => $newStatus]);
   ```
2. **Transaksi Database Multi-Tabel:**
   Seluruh operasi penulisan yang melibatkan lebih dari satu tabel wajib dibungkus dalam `DB::transaction()` dengan penanganan `ValidationException` (rollback lalu rethrow).
3. **Penyembunyian Pesan Error Teknis (Silent Errors):**
   Stack trace database atau error PHP tidak boleh ditampilkan ke browser pengguna; tampilkan pesan ramah (*"Sistem sedang mengalami gangguan..."*) dan simpan detail exception ke file log Laravel.
4. **Thin Controllers, Rich Services:**
   Controller hanya bertindak sebagai orchestration layer; logika bisnis diletakkan pada service class (`App\\Services\\CandidateStatus\\*`, `PaymentService`, `ChangeRequestService`).

---

## 7. Rujukan Dokumen SSOT Terkait

- **Skema & Kamus Tabel Database:** [`docs/reference/database-schema.md`](../reference/database-schema.md)
- **Pemetaan Rute & Navigasi Sidebar:** [`docs/reference/routes-and-navigation.md`](../reference/routes-and-navigation.md)
- **Tumpukan Teknologi & Versi:** [`docs/reference/tech-stack.md`](../reference/tech-stack.md)
- **Siklus Kandidat & Persyaratan Dokumen:** [`docs/architecture/candidate-lifecycle.md`](candidate-lifecycle.md)
- **Standar Keamanan & Pipeline Upload Berkas:** [`docs/architecture/security-and-uploads.md`](security-and-uploads.md)
- **Standar Antarmuka, State & Animasi:** [`docs/architecture/frontend-standards.md`](frontend-standards.md)
- **Penyiapan Lingkungan Lokal:** [`docs/getting-started/local-development.md`](../getting-started/local-development.md)
