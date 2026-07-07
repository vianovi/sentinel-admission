# Staff Operations Redesign Audit

Tanggal: 2026-07-08
Branch: `ui/staff-operations-redesign-task-8`
Base: `ui/staff-candidate-v2-task-7` pada commit `00675aa97ca0cc736d167c21ab641a7a8debd61c`.

## Sumber Yang Diaudit

- Task dan instruksi: `docs-ai/task/staff-operations-redesign.task-8.md`, `docs-ai/compressed/04_skill_frontend.optimized.md`, `docs-ai/compressed/intruction_system.md`, `docs-ai/CORE_CONTEXT.md`.
- Dokumen referensi: `docs-ai/audit/staff-candidate-v2-audit.md`, `docs-ai/features/staff-candidate-v2.md`, `docs-ai/state/staff-candidate-v2-progress.md`, `docs-ai/state/staff-candidate-v2-next-actions.md`, `docs-ai/features/status-pendaftaran.md`, `docs-ai/features/dashboard-polish-settings-monitoring.md`, `docs-ai/features/online-selection-exam.md`.
- Routes/controller: `routes/web.php`, `app/Http/Controllers/Dashboard/Staff/IndexController.php`, `app/Http/Controllers/Dashboard/ChangeRequestController.php`, `app/Http/Controllers/Dashboard/Candidate/PaymentController.php`, `app/Http/Controllers/Webhook/MidtransController.php`.
- Models/migrations: `Candidate`, `CandidateDocument`, `Guardian`, `HealthRecord`, `Payment`, `PaymentConfig`, `AdmissionWave`, `ExamSession`, `ExamSessionCandidate`, `ExamAttempt`, dan migration terkait.
- Services: `StaffCandidateOperationalService`, `StatusPendaftaranService`, `CandidateStatusService`, `CandidateCompletionEvaluator`, `CandidateVerificationEvaluator`, `CandidateGateService`, `PaymentService`.
- UI: `resources/js/Pages/Dashboard/Staff/Candidates.tsx`, `resources/js/Pages/Dashboard/Staff/Show.tsx`, `resources/js/Pages/Dashboard/Operations/ChangeRequests.tsx`, komponen Staff Candidates/Show/ChangeRequests, `resources/js/config/navigation.ts`, `resources/js/Components/Dashboard/Shared/Sidebar.tsx`.
- Tests: `tests/Feature/StaffCandidateV2Test.php`, payment/status/gate/exam feature tests.
- Runtime database read-only: `php artisan db:show --database=mysql`, `php artisan db:table payments`, `candidates`, `admission_waves`, `payment_configs`, `exam_session_candidates`, `exam_attempts`.

## Candidate Relation Map

`candidates` adalah pusat data operasional staff.

- `candidates.user_id -> users.id`: akun login, email verification, pending email change.
- `candidates.admission_wave_id -> admission_waves.id`: gelombang, tahun ajaran, biaya pendaftaran snapshot source.
- `candidates.registration_draft_id -> registration_drafts.id`: kode registrasi awal.
- `candidates hasOne guardian`: data wali/orang tua dan completion wali.
- `candidates hasOne healthRecord`: data kesehatan dan file BPJS/JKN.
- `candidates hasMany candidate_documents`: dokumen, status `pending|verified|rejected`, verifier staff.
- `candidates hasMany payments`: transaksi gateway/manual, status pembayaran.
- `candidates hasMany exam_session_candidates`: assignment sesi ujian.
- `candidates hasMany exam_attempts`: attempt, skor, pass/fail.

Lifecycle status kandidat: `draft`, `submitted`, `verified`, `accepted`, `rejected`.

Completion dihitung dari data diri, wali, dan kesehatan. Verification dihitung dari dokumen wajib verified, BPJS/JKN tersedia, dan minimal satu payment `paid`. Kandidat hanya otomatis naik ke `verified` jika completion dan verification lengkap. Final `accepted/rejected` tetap aksi manual yang saat ini hanya valid saat kandidat `verified`.

## Payment, Midtrans, Wave, Fee Map

Payment source of truth adalah `payments`.

- Candidate membuat payment lewat `Candidate\PaymentController`.
- Channel:
  - `gateway`: Midtrans Snap, manual proof null.
  - `transfer` dan `cash`: fallback manual dengan proof upload.
- Snapshot nominal:
  - `base_amount`: nilai `admission_waves.registration_fee` saat transaksi dibuat.
  - `fee_amount`: fee gateway dari `payment_configs`, 0 untuk transfer/cash.
  - `final_amount`: base + fee.
- Gateway fields:
  - `order_id`, `snap_token`, `payment_method`, `midtrans_transaction_id`, `metadata`.
  - Webhook `/payment/webhook` memvalidasi signature lalu update `status`, method, transaction id, paid_at, metadata.
  - `PaymentService::syncGatewayPaymentStatus()` ada, tetapi tidak ada route/aksi staff saat audit.
- Manual fallback:
  - `manual_status`: `waiting_proof`, `proof_uploaded`, `verified`, `rejected`.
  - `proof_path`, `proof_original_filename`, `proof_uploaded_at`, `proof_attempt`.
  - Staff hanya bisa verify/reject saat `manual_status = proof_uploaded`.

Wave/fee structure:

- `admission_waves.registration_fee` adalah biaya dasar per gelombang.
- `payment_configs` menyimpan config aktif global/per-wave untuk gateway fee: `gateway_fee_type`, `gateway_fee_value`, `gateway_fee_label`, bank transfer info, dan kontak WhatsApp.
- Tidak ada tabel fee component dinamis per transaksi. UI tidak boleh membuat breakdown palsu selain snapshot `base_amount`, `fee_amount`, `final_amount` dan konteks config/wave yang nyata.

Runtime DB read-only pada awal audit: candidates 2, payments 2, manual_review 0, gateway_pending 0, paid 2, waves 3, payment_configs 1.

## Exam Readiness Map

- `exam_session_candidates` menandai kandidat assigned ke sesi dengan status `eligible|blocked|completed`.
- `exam_attempts` menyimpan status `in_progress|submitted|auto_submitted|expired|cancelled|invalidated`, score, passing score, dan `passed`.
- Exam gate dari `CandidateGateService` baru allowed setelah kandidat minimal `verified` dan email verified.
- Staff result page read-only sudah ada di `/dashboard/staff/exams/results`.
- Final admission decision tidak otomatis dari exam result.

## Current UI Teardown

Keep:

- Query/presenter `StaffCandidateOperationalService`.
- Existing document verify route and proof verify route.
- Read-only detail data as secondary reference.
- Status Pendaftaran internal page as lifecycle source.
- Change request approve/reject flow.

Remove:

- Disabled Excel export button from candidate list.
- Payment review entry that depends on last-selected candidate.
- Final candidate decision form from document tab.
- Repeated card-only queue layout as primary information architecture.
- Any gateway manual-proof validation affordance.

Replace:

- Candidate list with compact operations table/workbench.
- Candidate detail first screen with operational profile and action rail.
- Payment review with transaction/reconciliation-first payment operations workspace.
- Perlu Tindakan with bucket/list/detail workbench.

Move To Secondary Detail:

- Full data diri/wali/kesehatan field grids.
- Detailed document group tabs.
- Detailed latest payment proof panel.
- Status Pendaftaran full timeline/checklist.

## Real Actions vs Future

Real actions:

- Open candidate detail.
- Open status pendaftaran.
- Open document review and preview secure files.
- Verify/reject candidate document.
- Verify/reject manual transfer/cash proof when proof uploaded.
- Approve/reject data change request.
- Approve/reject pending email change request.
- Final accept/reject candidate only from candidate action rail when status is `verified`.

Disabled/future:

- Gateway sync/check/override from staff UI.
- Excel export.
- Payment provider management.
- Dynamic fee component editing.
- Exam session assignment from staff panel.
- Final admission automation from exam result.

## Implementation Decision

Proceed with scoped staff operations redesign only. Backend changes are presenter/query additions, no schema changes. Navigation should repoint staff `Review Pembayaran` to a real Payment Operations workspace. Admin dashboard is not redesigned, though shared candidate detail must not break admin route reuse.

## Implementation Result

- Payment Operations ditambahkan di `/dashboard/staff/payment-operations` dengan query/presenter `StaffPaymentOperationalService`.
- Candidate list diganti menjadi workbench compact dengan preview panel kanan dan tanpa Export Excel mati.
- Candidate detail diganti menjadi operational profile dengan action rail kanan.
- Final admission decision dipindahkan dari tab dokumen ke action rail dan hanya tampil sebagai form saat kandidat `verified`.
- Perlu Tindakan diganti menjadi bucket/list/detail workbench.
- `Review Pembayaran` staff sekarang membuka Payment Operations, bukan section pembayaran kandidat terakhir.

## Verification Summary

Milestone checks yang sudah dijalankan:

- `php artisan test tests/Feature/StaffCandidateV2Test.php`
- `php artisan test tests/Feature/StaffCandidateV2Test.php --filter="operational queue"`
- `php artisan route:list --path=dashboard/staff`
- `php -l app/Services/StaffPayment/StaffPaymentOperationalService.php`
- `php -l app/Http/Controllers/Dashboard/Staff/IndexController.php`
- `npm run build`
- `git diff --check`

Full final checks dicatat di progress doc setelah final verification selesai.
