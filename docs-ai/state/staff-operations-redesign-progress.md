# Staff Operations Redesign Progress

## 2026-07-08

- Membuat branch `ui/staff-operations-redesign-task-8` dari `ui/staff-candidate-v2-task-7` karena branch tersebut berada pada commit Task-7 terbaru `00675aa97ca0cc736d167c21ab641a7a8debd61c`.
- Audit task, docs referensi, routes, controllers, models, migrations, services, UI, navigation, tests, dan runtime DB schema.
- Memutuskan information architecture staff operations:
  - Payment Operations transaction/reconciliation-first.
  - Candidate List sebagai workbench compact.
  - Candidate Detail sebagai operational profile + action rail.
  - Perlu Tindakan sebagai bucket/list/detail workbench.
- Menetapkan aksi nyata dan future/disabled sesuai source code.
- Tidak ada schema change yang dibutuhkan.

## Checks

- `php artisan db:show --database=mysql`
- `php artisan db:table payments`
- `php artisan db:table candidates`
- `php artisan db:table admission_waves`
- `php artisan db:table payment_configs`
- `php artisan db:table exam_session_candidates`
- `php artisan db:table exam_attempts`
- `php artisan tinker --execute=...` untuk count read-only awal.

## Next Milestone

Implement Staff Candidate List Workbench.

## Milestone: Staff Payment Operations

- Menambahkan `StaffPaymentOperationalService` sebagai presenter/query payment operations berbasis tabel `payments`.
- Menambahkan route staff `/dashboard/staff/payment-operations`.
- Mengarahkan menu staff `Review Pembayaran` ke Payment Operations.
- Menambahkan page `Dashboard/Staff/PaymentOperations` dengan KPI, filter transaksi, transaction table, dan detail panel.
- Manual transfer/cash proof review tetap memakai route real `staff.payments.verify`.
- Gateway/Midtrans tampil read-only, tanpa tombol verify manual atau sync override.
- Menambahkan feature tests untuk manual fallback review dan gateway readonly.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php`
- `php artisan route:list --path=dashboard/staff`
- `php -l app/Services/StaffPayment/StaffPaymentOperationalService.php`
- `php -l app/Http/Controllers/Dashboard/Staff/IndexController.php`
- `npm run build`
- `git diff --check`

## Milestone: Staff Candidate List Workbench

- Menghapus tombol Export Excel yang sebelumnya disabled/soon.
- Menambahkan `updated_at` pada row kandidat untuk konteks last update.
- Mengubah table row menjadi lebih compact dengan satu aksi utama dan tombol detail preview.
- Menambahkan panel preview kanan di `Semua Kandidat` untuk identity, lifecycle, primary blocker, readiness, progress, selection snapshot, dan link aksi nyata.
- Menambahkan shortcut header yang real ke `Perlu Tindakan` dan `Payment Ops`.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php`
- `php -l app/Http/Controllers/Dashboard/Staff/IndexController.php`
- `npm run build`
- `git diff --check`

## Milestone: Staff Candidate Detail Operational Profile

- Mengubah detail kandidat menjadi layout profile workspace dengan kolom utama dan action rail kanan.
- Menyederhanakan `OperationalOverview` menjadi konteks lifecycle/readiness/timeline, bukan shortcut/action panel tambahan.
- Memindahkan keputusan akhir kandidat dari tab dokumen ke action rail.
- Keputusan akhir hanya menampilkan form saat kandidat berstatus `verified`; status selain itu tidak memiliki tombol keputusan.
- Tab dokumen sekarang fokus pada review dokumen saja.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php`
- `npm run build`
- `git diff --check`

## Milestone: Perlu Tindakan Workbench

- Mengubah `OperationalQueuePanel` dari card grid menjadi workbench tiga kolom: bucket sidebar, queue list, dan detail/action panel.
- Bucket tetap memakai data nyata dari `StaffCandidateOperationalService::ACTION_FILTERS`.
- Queue detail hanya menampilkan link aksi nyata: buka aksi utama, profil kandidat, dan status pendaftaran.
- Data/email change request approval flow tidak diubah.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="operational queue"`
- `npm run build`
- `git diff --check`

## Final Documentation Pass

- Memperbarui `docs-ai/CORE_CONTEXT.md` untuk route staff `/dashboard/staff/payment-operations`.
- Memperbarui feature/audit/state docs dengan hasil implementasi, aksi nyata, future/disabled actions, dan checks.

## Final Verification

- `php artisan test --testsuite=Feature` -> 51 passed, 331 assertions.
- `php artisan route:list --path=dashboard/staff` -> 28 staff routes, termasuk `staff.payment-operations.index`.
- `npm run build` -> success.
- `git diff --check` -> success.

## Milestone: Reports/Rekap Workspace Shell

- Membuka route staff `/dashboard/staff/reports` dari ComingSoon menjadi workspace laporan operasional.
- Menambahkan page `Dashboard/Staff/Reports` dengan KPI kandidat, pembayaran, seleksi, dan antrean tindakan dari data/service nyata.
- Mengubah Reports menjadi pusat rekap lintas modul dengan mini trend chart, payment channel chart, funnel kandidat, blocker chart, dan kesehatan operasional.
- Menambahkan rekap per gelombang/program dari relasi kandidat, payment, dokumen, perubahan data/email, dan kesiapan sesi seleksi.
- Menampilkan aktivitas kandidat terbaru hanya sebagai rail konteks, bukan daftar kerja utama.
- Menyiapkan area export dengan tombol lebar `Unduh data` dalam kondisi disabled dan keterangan placeholder.
- Belum menambahkan halaman setting export, endpoint download, atau generator Excel.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="staff reports"`
- `php artisan route:list --path=dashboard/staff`
- `php -l app/Http/Controllers/Dashboard/Staff/IndexController.php`
- `npm run build`
- `git diff --check`

## Milestone Revision: Reports/Rekap Workspace Enrichment

- Memperkaya Reports agar terasa sebagai panel rekap staff, bukan hanya snapshot sederhana.
- Backend reports sekarang mengirim trend 14 hari, breakdown channel pembayaran, dan matriks gelombang/program.
- UI memakai chart compact dengan ukuran stabil dan table overflow horizontal untuk mencegah tumpang tindih di viewport kecil.
- Reports tetap tidak menduplikasi Payment Operations, Semua Kandidat, atau Perlu Tindakan; link hanya menuju workspace kerja yang sudah ada.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="staff reports"` -> passed.
- `php -l app/Http/Controllers/Dashboard/Staff/IndexController.php` -> no syntax errors.
- `npm run build` -> success.

## Milestone: Export Settings Placeholder

- Menambahkan route staff `/dashboard/staff/reports/export-settings`.
- Menambahkan page `Dashboard/Staff/ReportsExportSettings` untuk menyiapkan tiga kelompok format: `payment_only`, `quick_rekap`, dan `full_data`.
- Halaman settings hanya menjadi placeholder konfigurasi: pilihan format dapat dipreview lokal, tetapi tidak ada save preference.
- Tombol lebar `Unduh data` tetap disabled dengan status bahwa endpoint download, job export, dan generator file belum dibuat.
- `quick_rekap` ditandai sebagai format non-sensitive; `full_data` disiapkan sebagai format lengkap termasuk data sensitif nanti.
- Reports/Rekap sekarang memiliki link nyata ke halaman pengaturan export.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="staff report"`
- `php artisan route:list --path=dashboard/staff`
- `php -l app/Http/Controllers/Dashboard/Staff/IndexController.php`
- `npm run build`
- `git diff --check`

## Milestone: Status Kandidat Workbench

- Menambahkan route staff `/dashboard/staff/candidate-status`.
- Menambahkan submenu `Status Kandidat` di bawah `Kandidat > Semua Kandidat`.
- Menambahkan page `Dashboard/Staff/CandidateStatus` sebagai workbench agregat perjalanan kandidat.
- Data memakai `StaffCandidateOperationalService::detailOverview()` dan `StatusPendaftaranService` sehingga lifecycle, readiness, blocker, timeline, dan quick links berasal dari data nyata.
- UI berisi pipeline kandidat, readiness matrix, filter status/wave/program/waiting side, list status-first, dan preview kandidat terpilih.
- Halaman ini tidak menggandakan `Semua Kandidat`; fokusnya tahap, blocker, readiness, dan next step.
- Aksi yang tersedia hanya link nyata ke profil kandidat, detail status, atau langkah berikutnya yang sudah diberikan service.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="candidate status"`
- `php artisan route:list --path=dashboard/staff`
- `php -l app/Http/Controllers/Dashboard/Staff/IndexController.php`
- `npm run build`
- `git diff --check`

## Polish: Status Kandidat Desktop Layout

- Mengubah layout workbench `Status Kandidat` dari rail fixed pixel menjadi grid proporsional berbasis `minmax()` ratio.
- Filter bar dibuat turun bertahap sebelum viewport ekstra lebar agar input/select tidak saling menekan.
- Mode tabel 5 kolom pada list kandidat hanya aktif di viewport ekstra lebar; desktop sedang memakai row stack yang lebih lega.
- Preview panel tetap sticky di desktop, tetapi tidak lagi memakai lebar hardcoded fixed.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="candidate status"` -> passed.
- `npm run build` -> success.
- `git diff --check` -> success.

## Redesign: Status Kandidat Compact Workbench

- Mendesain ulang penuh halaman `Status Kandidat` agar lebih compact dan psikologisnya sejalan dengan `Semua Kandidat` dan `Rekap`.
- Mengganti pipeline/readiness card besar menjadi status flow strip, compact waiting-side panel, blocker ringkas, dan readiness bar kecil.
- Mengubah list kandidat menjadi status-first row yang ringan: kandidat, tahap, readiness, next step, dan preview.
- Inspector kanan dibuat lebih ramping: progress, journey dots, next step, readiness detail, timeline singkat, dan link nyata.
- Tidak membuat state `Data Kesehatan Ditolak` karena source code hanya mendukung kelengkapan health record dan ketersediaan BPJS/JKN; rejected formal tetap berasal dari dokumen, payment, selection, atau final candidate status.
- Tidak mengubah backend workflow atau menambah aksi baru.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="candidate status"` -> passed.
- `npm run build` -> success.
- `git diff --check` -> success.

## Polish Revision: Status Kandidat Density Balance

- Merapikan ulang `Status Kandidat` setelah review desktop: root gap, filter grid, summary card, list row, dan inspector kanan dibuat lebih rendah/compact.
- List kandidat memakai header tipis dan grid proporsional `fr`, bukan lebar fixed pixel, supaya kolom daftar tidak kejepit saat rail kanan aktif.
- Meter kecil khusus row ditambahkan agar progress data/verifikasi tidak memaksa minimum width dari komponen meter detail.
- Inspector kanan dipadatkan dengan meta singkat, journey dots, next step, readiness detail, timeline ringkas, dan hanya link aksi nyata.
- Tidak menambah state/action baru; semua label readiness, blocker, timeline, dan link tetap berasal dari service yang sudah ada.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="candidate status"` -> passed.
- `npm run build` -> success.

## Polish Revision: Status Kandidat Clean Strip

- Mengubah area atas `Status Kandidat` dari dua section bertumpuk menjadi satu metric strip ringan agar lebih dekat dengan look `Semua Kandidat` dan `Rekap`.
- Readiness agregat tidak lagi memakai card besar; sekarang tampil sebagai mini progress strip dalam bar konteks yang sama dengan waiting/blocker.
- Status cards memakai satu container dengan separator tipis, bukan kartu-kartu nested, supaya visual lebih clean dan tidak terasa gemuk.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="candidate status"` -> passed.
- `npm run build` -> success.

## Polish Revision: Status Kandidat Table Density

- Membuat list `Status Kandidat` lebih table-like: avatar besar diganti initial kecil, row padding diturunkan, dan readiness badge row diganti dot indicator.
- Progress data/verifikasi pada row tidak lagi memakai dua meter visual; sekarang tampil sebagai teks singkat agar row tidak terlihat tinggi.
- Inspector kanan dipadatkan lagi: meta program/sekolah menjadi line ringan, readiness detail memakai grid kecil, dan timeline dibatasi dua item.
- Tujuan polish ini adalah mendekatkan density halaman ke `Semua Kandidat` dan `Rekap`, bukan menambah fitur/status baru.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="candidate status"` -> passed.
- `npm run build` -> success.

## Polish Revision: Status Kandidat Desktop Flattening

- Summary status sekarang memakai satu baris mulai breakpoint `xl`, mengikuti pola `Semua Kandidat` agar desktop biasa tidak pecah menjadi dua baris besar.
- Readiness preview agregat di area atas dihapus karena readiness sudah tersedia sebagai dot indicator di row dan detail di inspector.
- Filter bar juga berpindah ke layout satu baris mulai `xl`, bukan menunggu `2xl`, agar tinggi halaman desktop lebih pendek.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="candidate status"` -> passed.
- `npm run build` -> success.

## Polish Revision: Status Kandidat Single Toolbar

- Menggabungkan metric strip dan filter menjadi satu toolbar card agar halaman tidak punya dua surface besar bertumpuk sebelum list.
- `StatusOverview` sekarang menjadi isi compact tanpa border/shadow sendiri; border hanya ada di toolbar utama.
- Chips waiting/blocker tetap tampil sebagai konteks singkat, tetapi tidak lagi membuat section terpisah.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="candidate status"` -> passed.
- `npm run build` -> success.

## Polish Revision: Status Kandidat Pill Summary

- Summary pipeline di `Status Kandidat` tidak lagi memakai grid angka + progress bar.
- Metric atas diganti menjadi pill bar rendah agar toolbar terasa seperti workbench, bukan panel statistik besar.
- Helper UI untuk progress/icon summary yang tidak dipakai dihapus sehingga page lebih ringan.

Checks:

- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="candidate status"` -> passed.
- `npm run build` -> success.
