# TASK 2 — Admin Exam Workflow, Dynamic XLSX Template, and Import UX Refinement

## 0. Purpose

This task continues the Online Selection Exam Engine work.

The engine already exists and has passed stabilization audit. This task must not rebuild the entire exam engine.

The goal of this task is to improve the admin exam management workflow so it becomes clearer, more professional, and aligned with the intended real-world SPMB process.

Main focus:

* Admin workflow clarity
* Desktop-first admin exam layout
* Dynamic XLSX template generation
* Indonesian XLSX import format
* Import UI refinement
* Clear navigation/back buttons
* Better accessibility and action visibility

This is not a full backend rewrite.

---

## 1. Current Repository Context

A WIP checkpoint commit already exists:

`wip(exam): checkpoint online selection exam engine`

The working tree should be clean before this task starts.

The previous stabilization audit reported:

* Feature tests passed
* Security tests passed
* `npm run build` passed
* `composer audit` passed
* dashboard routes passed
* no Critical/High issues were found

Before modifying code, read:

* `docs-ai/task/selection-online-exam.directive.md`
* `docs-ai/state/selection-current-phase.md`
* `docs-ai/state/selection-progress.md`
* `docs-ai/state/selection-decisions.md`
* `docs-ai/state/selection-known-bugs.md`
* `docs-ai/state/selection-next-actions.md`
* `docs-ai/audit/selection-exam-audit.md`
* `docs-ai/features/online-selection-exam.md`

Then inspect the actual source code.

Trust source code over stale documentation.

---

## 2. Important Scope Boundary

Do not rebuild the Online Selection Exam Engine.

Do not rewrite unrelated modules.

Do not touch:

* Auth flow
* Registration wizard
* Payment feature
* Document upload/verification
* Profile feature
* Global dashboard layout
* Global theme system
* Candidate attempt lifecycle logic
* Timer security logic
* Scoring engine logic
* Existing role model

Allowed changes:

* Exam admin frontend pages/components
* Exam import UI
* Exam package UI
* Exam session UI if only UX/copy/layout changes are needed
* Exam result UI if only clarity/layout changes are needed
* Exam template download route/controller/service
* Exam import parser/header mapping
* Exam docs/state/audit files
* Minimal route/menu additions required for template download
* Minimal backend support required to read the new XLSX format

Do not change database schema unless absolutely required.

If a schema change seems necessary, stop and report it instead of implementing it.

---

## 3. Product Flow Target

The intended flow is:

1. Admin creates an Exam Package.
2. The package represents one subject/mapel or one exam unit.
3. Admin fills only package metadata that belongs to the admin domain.
4. System generates an official XLSX template based on that package.
5. Admin downloads the generated template.
6. Admin shares the template with the subject teacher / question maker.
7. Teacher fills the teacher-owned fields and questions inside the XLSX.
8. Admin imports the completed XLSX.
9. System reads the XLSX, validates it, stores package settings/questions, and displays them clearly in the admin panel.
10. Admin creates/selects an exam session and assigns which packages/candidates are available.
11. Candidate opens the active session and takes the allowed package exam.

The admin UI must make this flow obvious.

---

## 4. Package Responsibility Model

The package is the main exam unit.

Each package represents one mapel / subject / test package.

The admin should input only package metadata:

* Kategori
* Judul Paket
* Kode Paket
* Deskripsi
* Status Paket if already supported by backend

The teacher/question maker should fill exam behavior and question contents through the XLSX template:

* Durasi Pengerjaan
* Ambang Lulus
* Tampilkan Hasil
* Izinkan Ujian Ulang
* Question rows
* Answer keys
* Points
* Difficulty
* Explanation
* Active status

If the current backend already stores duration/passing/show result/retake fields on package, keep using those fields. But the source of update should come from the imported XLSX when admin imports the teacher-filled file.

Do not duplicate fields in confusing places.

If the current UI still asks admin to input duration/passing/show result/retake directly, simplify the UI or clearly mark those fields as optional/advanced only if needed.

---

## 5. Dynamic XLSX Template Source

A final template file already exists in the project:

`resources/templates/exam/template-import-soal-ujian-seleksi-spmb.final.xlsx`

Use this file as the master template.

Do not serve this raw master file directly if it still contains placeholders.

The system should generate a downloadable XLSX dynamically from this master template based on the selected exam package.

Required behavior:

* Admin opens a package detail/import page.
* Admin clicks “Unduh Template Soal”.
* System reads the master XLSX template.
* System replaces placeholder values using the selected package data.
* System streams the generated XLSX as a download.
* The generated file should be named clearly, for example:

`template-soal-{kode_paket}.xlsx`

or

`template-soal-{kode_paket}-{judul_paket}.xlsx`

Use safe filename normalization.

Prefer stream download and temporary file cleanup.

Do not permanently store generated files unless the existing architecture requires it.

---

## 6. XLSX Template Structure

The template has 2 sheets:

1. `Data Soal`
2. `Panduan`

The system must read only the intended data from `Data Soal`.

The `Panduan` sheet is for humans and should not be imported as question data.

The `Data Soal` sheet contains three conceptual sections:

### A. Konfigurasi Paket — Diisi Otomatis Oleh Sistem

These values are generated from admin package input.

Expected keys/placeholders:

* kategori
* judul_paket
* kode_paket
* deskripsi
* status_paket

These should be filled by the system when generating the template.

Teacher should not need to edit these.

### B. Konfigurasi Ujian — Diisi Oleh Guru / Pembuat Soal

These values are filled by teacher/question maker:

* durasi_menit
* ambang_lulus_persen
* tampilkan_hasil
* izinkan_ujian_ulang

These values must be read during import.

These values should update the package/exam configuration if the backend supports them.

Expected boolean values should accept Indonesian-friendly values:

* ya
* tidak
* true
* false
* 1
* 0

Normalize them safely.

### C. Tabel Soal

Question table headers use Indonesian names:

* nomor
* teks_soal
* opsi_a
* opsi_b
* opsi_c
* opsi_d
* opsi_e
* jawaban_benar
* poin
* tingkat_kesulitan
* pembahasan
* aktif

The import layer must support these Indonesian headers.

Keep backward compatibility with existing English headers if they already exist:

* subject
* package
* question_text
* option_a
* option_b
* option_c
* option_d
* option_e
* correct_answer
* point
* difficulty
* explanation
* is_active

Do not break existing imports.

---

## 7. Header Mapping

Add a clean mapping layer for import headers.

Recommended mapping:

* teks_soal → question_text
* opsi_a → option_a
* opsi_b → option_b
* opsi_c → option_c
* opsi_d → option_d
* opsi_e → option_e
* jawaban_benar → correct_answer
* poin → point
* tingkat_kesulitan → difficulty
* pembahasan → explanation
* aktif → is_active
* nomor → row_number or ignored as display-only

Configuration mapping:

* durasi_menit → duration_minutes
* ambang_lulus_persen → passing_score / passing_percentage / current matching backend field
* tampilkan_hasil → show_result / current matching backend field
* izinkan_ujian_ulang → allow_retake / current matching backend field

Use the existing backend field names when possible.

Do not create fake fields.

If an expected target field does not exist, document the gap in final report.

---

## 8. Import Behavior

When admin imports a filled template:

1. Validate file type and size using existing security pattern.
2. Read the `Data Soal` sheet.
3. Read system/package metadata section.
4. Read teacher-filled exam configuration section.
5. Read question table.
6. Validate rows.
7. Normalize values.
8. Update package configuration if supported.
9. Import questions.
10. Show a clear result summary in admin UI.

Import result should show:

* Total rows scanned
* Successfully imported rows
* Failed rows
* Failure reason per row
* Package code/title detected
* Duration detected
* Passing threshold detected
* Result visibility detected
* Retake setting detected

Do not expose technical exceptions to users.

Log technical details if needed.

---

## 9. Admin UI Redesign Direction

The current admin exam UI is technically working but confusing.

Improve it as a desktop-first control center.

Main goal:

The admin should always understand:

* where they are
* what to do next
* how to go back
* which step they are currently doing
* what each exam domain means

Admin exam management should not feel like scattered CRUD pages.

---

## 10. Admin Desktop Layout

Focus on desktop.

Mobile admin layout is not a priority in this task.

Improve exam admin pages with clearer structure.

Use a contextual right-side or section sub-navigation pattern similar in spirit to the candidate subbar pattern.

The exam admin area should expose clear sections:

* Overview
* Paket Ujian
* Import Soal
* Sesi Ujian
* Peserta
* Hasil Ujian
* Template / Panduan

The sub-navigation must be clear and consistent.

Do not create a new global dashboard layout.

Do not modify unrelated dashboard shell.

Only improve exam pages/components.

---

## 11. Back Buttons and Navigation

Add clear back buttons where missing.

Every detail/create/edit/import/result page should have a logical return path.

Examples:

* Package detail → back to Paket Ujian
* Import page → back to Package detail or Paket Ujian
* Session detail → back to Sesi Ujian
* Result detail → back to Hasil Ujian
* Candidate assignment → back to Session detail

Do not rely only on browser back.

Back buttons must be visible and text-labeled.

Avoid icon-only critical actions.

---

## 12. Admin Flow UX

Make the intended admin flow clear:

### Step 1 — Buat Paket Ujian

Explain:

“Paket ujian adalah satu mapel/unit seleksi. Setelah paket dibuat, sistem dapat membuat template soal untuk guru.”

### Step 2 — Unduh Template

Explain:

“Template akan otomatis berisi kategori, judul paket, kode paket, dan deskripsi dari paket ini.”

### Step 3 — Guru Mengisi Soal

Explain:

“Guru mengisi konfigurasi ujian dan daftar soal pada file XLSX tanpa mengubah struktur/header.”

### Step 4 — Import Soal

Explain:

“Upload kembali file XLSX yang sudah diisi. Sistem akan memvalidasi dan menampilkan hasil import.”

### Step 5 — Atur Sesi

Explain:

“Sesi menentukan kapan dan untuk siapa paket tersedia.”

### Step 6 — Review Hasil

Explain:

“Setelah kandidat mengerjakan, hasil dapat ditinjau di halaman hasil ujian.”

Add helper text/cards/step indicators where useful.

---

## 13. Import UI Refinement

The import UI should no longer emphasize raw column chips as the main content.

Instead, it should emphasize the real workflow:

* Download generated template
* Give template to teacher
* Upload completed template
* Review import result

Show clear cards:

* Template generated from current package
* Teacher-filled fields
* Upload completed file
* Import history/result

Keep technical column information in a collapsible help section or documentation link, not as the main visual focus.

Use Indonesian copy.

Example labels:

* Unduh Template Soal
* Upload File Soal
* Validasi & Import
* Riwayat Import
* Format Template
* Panduan Pengisian

---

## 14. Package UI Requirements

Improve package list/detail/create/edit UI.

Package form labels should use Indonesian:

* Kategori
* Judul Paket
* Kode Paket
* Deskripsi
* Status Paket

If fields like duration, passing threshold, show result, and retake still appear in package form, evaluate whether they should be:

* removed from primary admin flow,
* moved to an advanced section,
* or shown as “akan diperbarui dari file template saat import”.

Do not remove backend capability.

Do not break existing data.

---

## 15. Session UI Requirements

Improve session UI copy and layout.

Clarify the difference:

* Paket Ujian = apa yang diuji dan berapa lama pengerjaannya
* Sesi Ujian = kapan paket tersedia dan untuk siapa

If the current backend stores open/close datetime, keep using it.

Do not migrate to active-day/start-time/end-time schema in this task.

If active day + time range is desired, document it as a future backend migration proposal.

Do not implement schema change in this task.

Make package selection inside session clearer.

Make candidate assignment clearer.

---

## 16. Accessibility and UX Clarity

Improve:

* visible action labels
* button placement
* disabled states
* loading states
* empty states
* error states
* heading hierarchy
* helper text
* spacing
* overflow/clipping issues
* table/card readability
* focus states where practical

Important actions should be easy to find.

Do not use icon-only buttons for primary actions.

Use desktop-first spacing and layout.

---

## 17. Candidate Side

Candidate side is not the main focus.

Only touch candidate pages if:

* shared components require adjustment,
* navigation is obviously broken,
* or exam entry UX has a small clarity issue.

Do not change:

* timer security
* attempt lifecycle
* autosave logic
* scoring logic
* ownership logic
* answer-key exposure rules

---

## 18. Verification

Run practical verification after changes.

Required:

* `npm run build`

If import mapping/backend is touched, also run:

* `php artisan test tests/Feature/OnlineSelectionExamSecurityTest.php`
* `php artisan test --testsuite=Feature`

If routes are touched, run:

* `php artisan route:list --path=dashboard`

Also check:

* `git diff --stat`
* modified files are exam-related only
* no unrelated modules were changed
* working tree is clean after commit

Do not commit broken code.

---

## 19. Commit Rule

If changes are made and verification passes, create one commit:

`chore(exam): refine admin exam workflow`

Do not push.

Do not merge.

Do not rebase.

Do not reset.

Do not rewrite history.

---

## 20. Final Report

Final report must be in Indonesian.

Include:

* Perubahan workflow admin
* Perubahan UI/layout
* Lokasi master template XLSX
* Cara template digenerate
* Route download template jika ditambahkan
* Mapping kolom Bahasa Indonesia
* Apakah import header lama tetap kompatibel
* Apakah backend/import parser berubah
* Command verifikasi dan hasilnya
* Commit hash jika dibuat
* Known limitations
* Usulan task berikutnya
