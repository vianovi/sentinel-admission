# Staff Operations Redesign

## Goal

Mengubah panel staff menjadi workspace operasional desktop-first untuk monitoring kandidat, review readiness, rekonsiliasi pembayaran, dan antrean tindakan. Ini mengganti pola lama yang menaruh panel baru di atas UI lama.

## Information Architecture

### Semua Kandidat

Workbench utama untuk scan kandidat.

- Header ringkas dengan total hasil.
- Summary strip dari data operasional nyata.
- Toolbar search/filter: lifecycle, gelombang, program, action bucket.
- Table compact dengan kolom identitas, gelombang/program, lifecycle, readiness, progress, primary blocker, last update, dan satu aksi utama.
- Tidak ada Excel export aktif pada task ini.

### Staff Candidate Detail

Operational profile, bukan preview form kandidat.

- Header identitas, lifecycle, waiting side, primary blocker.
- Readiness board dan timeline sebagai konteks utama.
- Action rail kanan untuk aksi nyata.
- Secondary detail sections untuk data diri, wali, kesehatan, dokumen, pembayaran, seleksi.
- Final admission decision hanya di action rail dan hanya aktif saat kandidat `verified`.

### Staff Payment Operations

Workspace transaksi dan rekonsiliasi.

- KPI strip payment.
- Toolbar search/filter: status, channel, wave, action state.
- Transaction table berdasarkan `payments`.
- Menampilkan snapshot nominal asli: base, fee, final.
- Gateway tampil sebagai transaksi provider; proof review tidak tampil untuk gateway.
- Manual transfer/cash menampilkan fallback proof review hanya jika `manual_status = proof_uploaded`.
- Gateway sync/override tidak diaktifkan karena belum ada route staff.

### Perlu Tindakan

Queue workbench.

- Bucket sidebar dari `StaffCandidateOperationalService::ACTION_FILTERS`.
- Queue list compact untuk kandidat dan blocker.
- Detail panel untuk item terpilih, dengan link ke aksi nyata.
- Data/email request tetap bisa approve/reject di area perubahan data.

## Payment Structure Decision

Midtrans gateway adalah jalur utama. Staff Payment Operations harus transaction-first. Manual proof review tetap real tetapi fallback untuk `transfer` dan `cash` saja.

Tidak ada fee component table. UI hanya boleh menampilkan:

- `base_amount`
- `fee_amount`
- `final_amount`
- `payment_configs.gateway_fee_label/type/value` sebagai konteks config jika dikirim backend
- `admission_waves.registration_fee` sebagai konteks gelombang

## Old UI Reorganized

- Candidate list: tombol export mati dihapus; action kecil dikurangi.
- Candidate detail: old field-grid tabs turun menjadi secondary reference.
- Document tab: final admission decision dipindah ke action rail.
- Payment tab: menjadi detail transaksi kandidat, bukan pusat operasi pembayaran.
- Change request page: antrean operasional menjadi workbench, bukan card grid utama.

## Non-Goals

- Tidak membuat Excel export.
- Tidak menambah schema.
- Tidak rewrite Midtrans.
- Tidak menambah provider behavior.
- Tidak redesign candidate/admin dashboard.
- Tidak membuat otomasi final admission.
