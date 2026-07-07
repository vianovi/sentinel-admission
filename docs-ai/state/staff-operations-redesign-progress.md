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
