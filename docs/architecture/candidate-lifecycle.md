# Candidate Lifecycle & SPMB Document Specification

Dokumen ini merupakan Single Source of Truth (SSOT) untuk siklus pendaftaran kandidat, aturan gerbang tahapan (*admission gate*), dan spesifikasi kelengkapan berkas dokumen SPMB di Sentinel Admission.

---

## 1. Sequential Admission Pipeline (Alur Berjenjang)

Sentinel Admission menerapkan model **Document-First, Pay-to-Validate**:

```text
[ 1. Draft ] ────────► Mengisi Formulir Pendaftaran Bertahap (Data Diri, Wali, Kesehatan)
      │
      ▼
[ 2. Submitted ] ────► Mengunggah 7 Dokumen Wajib (Status berkas: pending review)
      │                └─ Setelah 7 dokumen lengkap ──► Gerbang PEMBAYARAN Terbuka
      ▼
[ 3. Paid ] ─────────► Pembayaran Lunas (Midtrans / Bukti Transfer Manual)
      │                └─ Terjadwal di Sesi CBT ──► Gerbang UJIAN SELEKSI Terbuka
      ▼
[ 4. Exam Ready ] ───► Mengerjakan Ujian CBT Online
      │
      ▼
[ 5. Verified ] ─────► Verifikasi Fisik & Administratif oleh Staf Penerimaan
      │
      ▼
[ Final Decision ] ──► ACCEPTED (Diterima) / REJECTED (Tidak Diterima)
```

### Prinsip Utama Pipeline:
1. **BPJS Opsional (D-008):** Berkas kartu BPJS (`health.bpjs_card_path`) bersifat suplementer/opsional, tidak memblokir kelengkapan data maupun status verifikasi.
2. **Unggah Berkas Membuka Pembayaran:** Kandidat tidak perlu menunggu staf memverifikasi berkas secara manual untuk membayar biaya pendaftaran; mengunggah 7 berkas wajib otomatis membuka menu Pembayaran.
3. **Ujian Seleksi Berbasis Pembayaran:** Akses ke sesi CBT terbuka seketika setelah pembayaran pendaftaran berstatus `paid` dan kandidat telah dimasukkan ke jadwal sesi ujian aktif oleh admin/staf.
4. **Verifikasi Staf sebagai Penentu Kelulusan Akhir:** Verifikasi berkas oleh staf berjalan paralel/setelah ujian sebagai prasyarat keputusan akhir (`accepted`).

---

## 2. Spesifikasi Dokumen Persyaratan SPMB

Sumber kebenaran kode: `App\Models\CandidateDocument::DOC_TYPES` dan `CandidateVerificationEvaluator::REQUIRED_DOCUMENT_TYPES`.

### A. 7 Dokumen Wajib (Mandatory)
Seluruh pendaftar wajib mengunggah 7 berkas ini sebelum dapat melanjutkan ke pembayaran:

| Kode Dokumen | Label Resmi | Kelompok | Keterangan |
|---|---|---|---|
| `photo_formal` | Pas Foto Resmi | `identity` | Foto formal terbaru latar merah/biru untuk kartu peserta |
| `birth_certificate` | Akta Kelahiran | `identity` | Verifikasi identitas dan tanggal lahir resmi |
| `family_card` | Kartu Keluarga (KK) | `identity` | Verifikasi nomor KK dan data orang tua/wali |
| `parent_id_card` | KTP Orang Tua / Wali | `identity` | Legalitas identitas penanggung jawab calon siswa |
| `graduation_certificate` | Ijazah / SKL | `academic` | Ijazah jenjang sebelumnya atau Surat Keterangan Lulus |
| `report_card` | Buku Rapor Terakhir | `academic` | Salinan rapor semester terakhir |
| `parent_statement` | Surat Pernyataan Wali | `boarding` | Surat persetujuan tata tertib dan pembiayaan |

### B. Dokumen Kondisional (Khusus Siswa Pindahan)
| Kode Dokumen | Label Resmi | Kelompok | Ketentuan |
|---|---|---|---|
| `transfer_letter` | Surat Pindah Sekolah | `boarding` | **Wajib** diunggah jika `candidates.is_transfer = true` |

### C. Dokumen Pendukung & Jalur Khusus (Opsional / Supplementary)
| Kode Dokumen | Label Resmi | Kelompok | Ketentuan |
|---|---|---|---|
| `academic_transcript` | Transkrip Nilai | `academic` | Opsional untuk penguatan data akademik |
| `achievement_academic` | Sertifikat Prestasi Akademik | `achievement` | Opsional, mendukung multi-upload berkas |
| `achievement_nonacademic`| Sertifikat Prestasi Non-Akademik | `achievement` | Opsional (olahraga, seni, organisasi) |
| `achievement_religious` | Sertifikat Tahfidz / Keagamaan | `achievement` | Opsional (hafalan Al-Qur'an / keagamaan) |
| `kip_card` | Kartu Indonesia Pintar (KIP) | `welfare` | Jalur beasiswa/bantuan (pilih salah satu) |
| `welfare_card` | Kartu PKH / KKS | `welfare` | Jalur keluarga prasejahtera (pilih salah satu) |
| `poverty_letter` | Surat Keterangan Tidak Mampu | `welfare` | Surat resmi kelurahan/desa (pilih salah satu) |
| `recommendation_letter` | Surat Rekomendasi Tokoh/Sekolah | `boarding` | Opsional |

---

## 3. Aturan Evaluasi Gerbang (Candidate Gate Rules)

Logika otorisasi alur pendaftaran dipusatkan di `App\Services\CandidateStatus\CandidateGateService`:

- **Gerbang Data Form (`biodata`, `wali`, `kesehatan`):** Terbuka selama status pendaftaran belum final (`accepted`/`rejected`). Jika berstatus `verified`, perubahan data dialihkan melalui mekanisme *Change Request*.
- **Gerbang Dokumen (`documents`):** Terbuka setelah data diri utama tersimpan (`status != draft`).
- **Gerbang Pembayaran (`payment`):** Terbuka jika kandidat telah mengunggah seluruh dokumen wajib (`hasUploadedMandatoryDocuments === true`) dan email telah terverifikasi.
- **Gerbang Ujian CBT (`exam`):** Terbuka jika kandidat telah memiliki pembayaran `paid` dan terdaftar pada sesi ujian aktif (`examSessionCandidates`).

---

## 4. Mekanisme Permintaan Perubahan Data (Change Request)

Setelah berkas kandidat diverifikasi staf (`status: verified`), kandidat tidak dapat mengubah data secara sepihak.

1. **Pengajuan:** Kandidat mengajukan perubahan 1 field melalui formulir khusus disertai alasan dan nilai baru (`candidates.data_change_request`).
2. **Review:** Staf/Admin memeriksa melalui panel *Change Requests* (`/dashboard/staff/change-requests`).
3. **Keputusan:**
   - **Disetujui (`approve`):** Nilai baru otomatis ditimpa ke kolom model kandidat, riwayat reviewer dicatat, status request diubah ke `approved`.
   - **Ditolak (`reject`):** Data asli tetap dipertahankan, staf wajib menyertakan alasan penolakan (`rejection_reason`).
