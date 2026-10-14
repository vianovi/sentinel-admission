# Demo Accounts & Testing Guide

Panduan akun demo seeder, perintah simulasi live data, dan eksekusi test suite otomatis pada Sentinel Admission.

---

## 1. Akun Pengujian Bawaan Seeder

Setelah menjalankan `php artisan migrate --seed`, sistem menyediakan akun bawaan untuk pengujian alur bisnis:

| Role | Email | Password | Hak Akses & Menu |
|---|---|---|---|
| **Administrator** | `admin@spmb.com` | `password` | Pengaturan gelombang, kuota, CBT master, staff list, dan pengaturan sistem |
| **Staf Verifikator** | `staff@spmb.com` | `password` | Review kelengkapan dokumen, verifikasi pembayaran transfer manual, hasil ujian |
| **Kandidat (Siswa 1)** | `silvia@spmb.com` | `password` | Akun pendaftar dengan biodata terisi |
| **Kandidat (Siswa 2)** | `rizky@spmb.com` | `password` | Akun pendaftar untuk simulasi multi-user |

> **Peringatan Keamanan:** Kredensial di atas hanya untuk lingkungan lokal/pengujian. Jangan gunakan akun default ketika sistem diekspos ke jaringan produksi.

---

## 2. Injeksi Data Simulasi (Traffic Simulator)

Untuk menguji fitur real-time dashboard dan grafik kuota tanpa mengisi form satu per satu:

```bash
# Simulasikan 10 pendaftar masuk secara bertahap via WebSockets (jeda 1.5 detik):
php artisan demo:simulate-traffic --count=10 --mode=stream --delay=1.5

# Simulasikan antrean review berkas staf (70% status submitted):
php artisan demo:simulate-traffic --count=20 --preset=backlog

# Bersihkan seluruh data demo (@demo.spmb.com) dan berkas fisiknya:
php artisan demo:wipe
```
Rujukan operasional lengkap: [`docs/operations/traffic-simulator.md`](../operations/traffic-simulator.md).

---

## 3. Menjalankan Automated Test Suite

Aplikasi menggunakan **Pest PHP** untuk automated testing:

```bash
# Menjalankan seluruh test suite dengan format ringkas:
php artisan test --compact

# Menjalankan test feature tertentu:
php artisan test tests/Feature/StatusPendaftaranFeatureTest.php

# Menjalankan test dengan filter:
php artisan test --filter=CandidateVerification
```
