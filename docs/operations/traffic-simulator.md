# Panduan Sentinel Admission Traffic Simulator & Demo Injector

Dokumen ini berisi panduan lengkap penggunaan fitur **Traffic Simulator & Demo Injector** pada platform Sentinel Admission. Panduan ini disusun dalam Bahasa Indonesia agar mudah dipahami oleh seluruh tim dan pengembang.

---

## 1. Ringkasan Fitur

Sentinel Traffic Simulator dirancang untuk:
1. **Live Demo & Presentasi:** Menyimulasikan pendaftar yang masuk secara *real-time* dengan jeda waktu (*streaming mode*). Perubahan kuota pendaftaran pada *Landing Page* dan *Admin/Staff Dashboard* akan ter-update seketika via WebSockets (Laravel Reverb).
2. **Benchmark Performa:** Menguji ketahanan database, throughput pendaftaran, dan efisiensi memori (*benchmark mode*) hingga ratusan kandidat tanpa risiko *memory exhaustion*.
3. **Validitas Dokumen Nyata:** Menghasilkan dokumen dummy (PDF dan JPG) yang **100% valid dan dapat dibuka/dipratinjau di browser** tanpa error file corrupt.
4. **Pembersihan Data Aman:** Menyediakan perintah `demo:wipe` untuk membersihkan seluruh data simulasi bertanda `@demo.spmb.com` beserta file fisiknya di storage secara tuntas.

---

## 2. Perintah Utama (CLI Commands)

### A. Menjalankan Simulasi Traffic (`demo:simulate-traffic`)

Sintaks dasar:
```bash
php artisan demo:simulate-traffic [options]
```

#### Pilihan Opsi (Options):
| Opsi | Default | Deskripsi |
|---|---|---|
| `--count=N` | `10` | Jumlah kandidat yang ingin disimulasikan. |
| `--mode=MODE` | `stream` | Mode simulasi: `stream` (ada jeda waktu) atau `benchmark` (burst / tanpa jeda). |
| `--delay=DETIK` | `1.5` | Jeda waktu antar kandidat dalam detik (khusus mode `stream`). |
| `--wave=WAVE` | `active` | Gelombang pendaftaran: `active` (gelombang aktif), `random`, atau ID gelombang spesifik (misal `--wave=4`). |
| `--status=STATUS` | `random` | Target status kandidat: `random`, `draft`, `submitted`, `verified`, `paid`, `accepted`, `rejected`. |
| `--preset=PRESET` | `null` | Preset distribusi status jika memilih `--status=random`: `balanced`, `backlog`, `financial`. |

---

## 3. Contoh Penggunaan Populer

### 1. Live Streaming untuk Demo / Presentasi WebSockets
Menyimulasikan 10 kandidat yang mendaftar bergantian setiap 2 detik. Buka halaman utama (*Landing Page*) atau *Dashboard*, kuota dan antrean akan bergerak secara live:
```bash
php artisan demo:simulate-traffic --count=10 --mode=stream --delay=2
```

### 2. Pengujian Beban / Benchmark Skala Besar
Menyimulasikan 500 kandidat sekaligus secepat mungkin untuk melihat metrik database throughput, total query, dan penggunaan memori PHP:
```bash
php artisan demo:simulate-traffic --count=500 --mode=benchmark --wave=random --status=random
```

### 3. Simulasi Kasus Antrean Verifikasi Staf (`backlog`)
Menghasilkan pendaftar yang 70% di antaranya berada di status `submitted` (menunggu verifikasi berkas oleh staf):
```bash
php artisan demo:simulate-traffic --count=20 --preset=backlog
```

### 4. Simulasi Transaksi Pembayaran Lunas (`financial`)
Menghasilkan pendaftar yang mayoritas sudah membayar lunas untuk menguji laporan keuangan dan kuota pembayaran:
```bash
php artisan demo:simulate-traffic --count=20 --preset=financial
```

### 5. Injeksi Status Spesifik
* **Hanya akun draft (belum upload berkas):**
  ```bash
  php artisan demo:simulate-traffic --count=5 --status=draft
  ```
* **Kandidat sudah submit berkas lengkap (menunggu diverifikasi):**
  ```bash
  php artisan demo:simulate-traffic --count=5 --status=submitted
  ```
* **Kandidat berkas terverifikasi & pembayaran lunas:**
  ```bash
  php artisan demo:simulate-traffic --count=5 --status=verified
  ```

---

## 4. Struktur & Logika Dokumen Pendaftaran

Setiap kandidat yang disimulasikan mengikuti aturan alur berkas yang realistis:

1. **Format Berkas Asli (Anti-Corrupt):**
   * Berkas **PDF** (`resources/fixtures/demo/sample.pdf`) berstandar PDF 1.4 resmi yang memiliki teks, kop Sentinel, dan watermark. Dapat dibuka di Google Chrome / Adobe PDF Reader.
   * Berkas **JPG** (`resources/fixtures/demo/sample.jpg`) berdimensi 400x500 px bertema kartu identitas resmi Sentinel. Dapat dipratinjau di modal foto tanpa *broken image*.

2. **Perilaku Berkas per Status:**
   * **`draft`:** **0 Dokumen** diunggah. Menyimulasikan akun yang baru daftar.
   * **`submitted`:** **7 Dokumen wajib diunggah** dengan status `pending` (warna amber/kuning di dashboard, menunggu staf).
   * **`verified`:** **7 Dokumen wajib berstatus `verified`** (centang hijau staf) + pembayaran lunas.
   * **`paid`:** Dokumen verified + Pembayaran lunas + Sesi ujian CBT terjadwal.

3. **Email Otomatis Terverifikasi:**
   Semua akun demo dibuat dengan `email_verified_at` terisi, sehingga gerbang dokumen (*CandidateGate*) terbuka dan checklist kelengkapan langsung tercentang hijau tanpa terblokir status email.

---

## 5. Membersihkan Data Simulasi (`demo:wipe`)

Setelah sesi demo atau testing selesai, seluruh data simulasi dapat dibersihkan dengan satu perintah aman:

```bash
php artisan demo:wipe
```

Perintah ini akan secara otomatis:
1. Menghapus seluruh akun User dengan email akhiran `@demo.spmb.com`.
2. Menghapus data relasi kandidat, data wali, data kesehatan, transaksi pembayaran demo, dan sesi ujian demo.
3. Menghapus seluruh berkas dokumen fisik dummy yang tersimpan di disk private (`storage/app/private/sentinel/candidates/...`).
4. Memancarkan event WebSockets untuk menyegarkan angka statistik di dashboard secara *real-time*.

> **Catatan Keamanan:** Perintah `demo:wipe` **hanya** menghapus record yang berakhiran `@demo.spmb.com`. Data pengguna asli, data staf, dan konfigurasi sistem tidak akan tersentuh.

---

## 6. Arsitektur WebSocket & Tunnel Lingkungan

* **Docker Service Reverb:** Layanan WebSocket berjalan pada port `8085` di dalam container `sentinel-admission-reverb-1`.
* **Koneksi Dev-Mode:** Mengakses via `ws://localhost:8085`.
* **Koneksi Demo-Mode (Cloudflare Tunnel):** Traffic WebSocket pada path `/app/*` dan `/apps/*` otomatis diteruskan ke Reverb port 8085 via TLS (`wss://spmb.playground-ku.my.id:443`).
* **Frontend Echo (`resources/js/echo.ts`):** Menggunakan auto-deteksi protokol (`https` -> `wss: 443`, `http` -> `ws: 8085`).
