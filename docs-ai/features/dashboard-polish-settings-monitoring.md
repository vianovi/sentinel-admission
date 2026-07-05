# Dashboard Polish, Settings, and Exam Monitoring

## Purpose

This checkpoint polishes candidate registration/payment UX and adds admin operational controls that already have database support.

It is not a dashboard redesign, not an admission lifecycle rewrite, and not a replacement for existing document, payment, or exam review workflows.

## Candidate Panel Updates

- Payment success copy now directs candidates to `Status Pendaftaran` and `Seleksi` instead of saying the committee will contact them manually.
- Data Kesehatan physical eye fields now display left/right eyes in the same order as the saved database fields:
  - Mata Kiri -> `eye_left_*`
  - Mata Kanan -> `eye_right_*`
- Data Diri, Data Wali, and Data Kesehatan summary tabs now show a right-aligned `Halaman Selanjutnya` CTA only when required fields for that section are complete.
- Data Kesehatan final confirmation reminds candidates to check Dokumen and Pembayaran.

## Data Wali Updates

Tab order is now:

1. Ibu
2. Ayah
3. Wali
4. Profil Keluarga
5. Rangkuman

Business-facing rules:

- Living father and living mother records require their complete relevant fields.
- Father income is required only when family income is separated.
- Father address is required only when father and mother addresses are different.
- Guardian fields are required when the family situation needs a guardian record.
- Income options include `Tidak Ingin Memberitahu`.
- Contact fields include a mobile-friendly CTA to copy the pre-registration WhatsApp number.

Backend alignment:

- `GuardianController` validation is now conditional and mirrors the UI requirements.
- `CandidateCompletionEvaluator::guardianRequirements()` owns the completion requirement list.
- `Guardian::requiredCompletionFields()` delegates to the evaluator instead of maintaining a separate list.
- A migration adds `tidak_ingin_memberitahu` to the guardian income enum for existing MySQL/MariaDB databases, while the original guardians migration is also updated for fresh SQLite/test databases.

## Payment UX Updates

Gateway payments no longer show manual proof-upload/review language.

- Candidate payment sidebar explains that gateway confirmation is automatic.
- Candidate payment history marks gateway proof as not required.
- Staff/admin payment review hides manual proof validation controls for gateway payments and shows a read-only gateway confirmation state.

Manual transfer and cash flows still keep their existing proof/review behavior.

## Admin Gelombang

`/dashboard/admin/waves` is now a real management page instead of a database-list-only screen.

Admin can:

- create waves
- edit waves
- activate one wave while deactivating others
- delete waves only when no candidates are attached
- manage dates, exam info, announcement info, reregistration date, registration fee, quota, majors, and major selection status

The controller remains scoped to existing `AdmissionWave` fields.

## Admin Pengaturan Sistem

New admin settings surfaces use existing database tables and avoid fake pages.

Routes:

- `/dashboard/admin/settings`
- `/dashboard/admin/programs`

Managed domains:

- Program / Jalur (`AdmissionProgram`)
- Ekstrakurikuler (`Extracurricular`)
- Konfigurasi Pembayaran (`PaymentConfig`)

Important constraints:

- No new auth roles were introduced.
- Payment config activation keeps one active config per scope.
- Candidate Minat & Bakat now reads active extracurricular options from the database and uses a searchable multi-select with selected chips.

## Exam Monitoring and Math Rendering

Admin exam improvements:

- Admin exam monitoring page at `/dashboard/admin/exams/monitoring`.
- Read-only feed route at `/dashboard/admin/exams/monitoring/feed`.
- Compact display route at `/dashboard/admin/exams/monitoring/display`.
- `ExamMonitoringService` composes real-time-ish status from existing exam sessions and attempts without adding a new table.

Monitoring is polling-based, not websocket-based.

Candidate/admin exam question rendering now uses `RichExamText` for common math notation:

- caret powers such as `x^2`
- grouped powers such as `x^{2n}`
- degree notation from `°` or `derajat`
- line breaks

The renderer is React-based and does not inject raw HTML.

## Security and Scope Decisions

- Candidate lifecycle semantics remain `draft -> submitted -> verified -> accepted/rejected`.
- Final accepted/rejected status is not automated by this checkpoint.
- Payment gateway state is not trusted from frontend UI.
- Candidate exam answer keys remain excluded from candidate pages.
- Admin monitoring reads existing exam data only.
- No proctoring, webcam, browser lockdown, or device fingerprinting is added.
- No browser-based verification was attempted for this checkpoint because the task explicitly forbade it.

## Verification

Completed checks:

- `npx tsc --noEmit --pretty false`
- PHP lint for touched backend files and routes
- `php artisan route:list --path=dashboard`
- `npm run build`
- `php artisan test`
- `git diff --check`
- `php artisan optimize:clear`

