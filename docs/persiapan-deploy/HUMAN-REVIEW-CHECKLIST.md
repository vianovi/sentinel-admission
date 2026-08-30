# Checklist Review Manual (Human Review)

> **Catatan Auditor:** Berkas ini disiapkan oleh sistem audit otomatis, namun persetujuan akhir **wajib dilakukan oleh manusia (pemilik proyek / deployment owner)** sebelum kode dipromosikan ke `main` atau dideploy ke server produksi.

---

## 1. Verifikasi Visual & Interaksi Antarmuka (UI/UX)

- [ ] **Landing Page Publik:** Tampilan hero, navigasi publik, footer, dan informasi alur pendaftaran responsif di mobile & desktop.
- [ ] **Autentikasi & Registrasi:** Formulir daftar, login kandidat, login staff/admin, dan alur reset password berjalan mulus.
- [ ] **Dashboard Kandidat:** Panel tahapan pendaftaran, banner status verifikasi data, status terkunci/terbuka.
- [ ] **Pengisian Data & Unggah Dokumen:** Upload berkas (foto, KK, ijazah), preview dokumen aman, dan pesan feedback validasi.
- [ ] **Pembayaran (Midtrans Gateway):** Pembuatan tagihan Snap/QRIS/Virtual Account, tampilan status pembayaran instan, dan riwayat transaksi.
- [ ] **Ujian Seleksi Online (CBT):** Tampilan instruksi, timer ujian real-time, navigasi soal, auto-save jawaban, dan halaman hasil/skor.
- [ ] **Dashboard Staff:** Verifikasi dokumen kandidat, persetujuan perubahan data, dan operasional verifikasi pembayaran manual.
- [ ] **Dashboard Admin:** Pengaturan gelombang pendaftaran, kuota, manajemen paket soal ujian, dan pengaturan akun staff.
- [ ] **State Khusus UI:** State loading, pesan error yang ramah, dialog konfirmasi modal, dan state data kosong (*empty state*).

---

## 2. Pengujian Alur Bisnis Menyeluruh (End-to-End Walkthrough)

- [ ] **Registrasi Akun Baru:** Buat 1 akun kandidat simulasi dan verifikasi login berhasil.
- [ ] **Lengkapi Biodata:** Isi data diri, orang tua/wali, data kesehatan, dan periksa kelengkapan 100%.
- [ ] **Unggah Dokumen Syarat:** Upload dokumen dummy dan pastikan file tersimpan di *private storage* (bukan folder public langsung).
- [ ] **Review oleh Staff:** Login sebagai staff, buka data kandidat tadi, dan lakukan verifikasi berkas.
- [ ] **Simulasi Pembayaran:** Buat transaksi pembayaran dan pastikan webhook callback berhasil mengubah status menjadi `LUNAS / VERIFIED`.
- [ ] **Simulasi Ujian Seleksi:** Masuk sesi ujian, jawab pertanyaan, submit ujian, dan pastikan nilai terhitung di database.
- [ ] **Review Hasil & Export:** Login sebagai admin/staff dan pastikan hasil seleksi terdata di rekapitulasi.

---

## 3. Lembar Persetujuan Rilis (Sign-off)

- **Nama Reviewer / Penguji:** 
- **Tanggal Review:** 
- **Commit SHA Release Candidate:** 
- **Keputusan:** `DISETUJUI (APPROVE)` / `PERLU PERBAIKAN (REQUEST CHANGES)`
- **Catatan Tambahan:** 

