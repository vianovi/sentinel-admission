# TASK 3 — Online Selection Exam V2: Download/Import Audit and Production Admin Panel Redesign

## 0. Mission

This is Task 3 for the Online Selection Exam Engine.

The first major task built the foundation. Task 2 added dynamic XLSX template download and Indonesian import mapping, but the admin UI result is not accepted and the template download currently fails with:

`Class "ZipArchive" not found`

This task must turn the exam admin area into a more polished V2.

The mission is not to add random features.

The mission is to stabilize the XLSX download/import flow, audit the existing implementation, preserve the good backend work, and redesign the admin panel into a professional production-grade desktop experience.

The agent must think as:

* senior Laravel engineer
* senior frontend/product engineer
* admin workflow designer
* QA auditor
* UI reviewer
* security-minded maintainer

The agent may determine the implementation plan independently, but must respect the goals, boundaries, and acceptance criteria below.

---

## 1. Current Known State

Existing important commits:

* `7404be0 wip(exam): checkpoint online selection exam engine`
* `a6a7603 chore(exam): refine admin exam workflow`

Task 1 result:

* Online exam foundation exists.
* Backend domain, attempts, timer, autosave, scoring, admin/staff/candidate routes, and security tests were created.
* Stabilization audit found no Critical/High issue.

Task 2 result:

* Dynamic XLSX template download route exists.
* Template generation service exists.
* Indonesian XLSX headers are supported.
* Old English headers remain compatible.
* No database schema change was made.
* Build/tests passed during Task 2.
* But admin UI quality is not accepted.
* Admin UI feels unprofessional and confusing.
* Tab-based navigation is not the desired structure.
* Download template currently fails in the running environment with `Class "ZipArchive" not found`.

This task must not blindly revert Task 2.

Preserve useful backend/import/template work unless it is broken.

Fix or harden the download/import workflow before redesigning the admin UI.

---

## 2. Primary Goals

The final result of this task must achieve:

1. XLSX template download no longer crashes.
2. Download/import implementation is audited and documented.
3. Import flow reads the intended Indonesian template format reliably.
4. Admin exam UI is redesigned into a production-grade desktop V2.
5. Paket Ujian and Sesi Ujian are clearly separated as two workflow domains.
6. Tab-based navigation is removed as the main admin exam structure.
7. Admin panel becomes easier to understand, navigate, and operate.
8. State/audit docs are updated with Task 3 findings and decisions.
9. Verification passes.
10. One clean commit is created if changes pass.

---

## 3. Non-Negotiable Fix: XLSX Download Error

The template download route currently fails:

`GET /dashboard/admin/exams/packages/{package}/template`

Error:

`Class "ZipArchive" not found`

The agent must audit this before UI work is considered complete.

The solution must be production-aware.

Acceptable directions include:

* enabling/installing required PHP zip extension in the project Docker/runtime if that is the correct project-level fix;
* replacing fragile direct `ZipArchive` manipulation with a safer XLSX-compatible service if it still respects project dependencies;
* keeping OpenSpout/PHP spreadsheet usage only if the runtime requirements are properly satisfied;
* adding graceful error handling if the environment is missing a required extension;
* adding a clear developer-facing requirement note in documentation;
* adding or updating tests around template download/import if practical.

The agent must not simply suppress the error.

The agent must not expose technical stack traces to end users.

The agent must ensure the admin receives a safe, readable message if template generation fails.

If the proper fix requires Dockerfile or PHP extension changes, apply the minimal project-specific change and document it.

If the environment cannot be safely changed, document the blocker clearly and provide the best safe fallback.

---

## 4. XLSX Template Flow Goal

The intended real-world flow is:

Admin creates a package with basic metadata.

System generates a package-specific XLSX template.

Admin downloads the generated template.

Admin gives the file to the subject teacher / question maker.

Teacher fills teacher-owned configuration and questions.

Admin imports the filled XLSX back into the system.

System validates it and shows the result in the admin panel.

The template master file is located at:

`resources/templates/exam/template-import-soal-ujian-seleksi-spmb.final.xlsx`

The generated file must not expose raw placeholders.

The generated file should include package data from admin input.

The import system must read the filled file and map Indonesian headers into internal fields.

The template and import flow must feel like a real product workflow, not a developer-only upload form.

---

## 5. Package and Teacher Responsibility Model

Admin-owned package fields:

* Kategori
* Judul Paket
* Kode Paket
* Deskripsi
* Status Paket if already supported

Teacher/question-maker-owned fields from XLSX:

* Durasi Pengerjaan
* Ambang Lulus
* Tampilkan Hasil
* Izinkan Ujian Ulang
* Daftar soal
* Pilihan jawaban
* Jawaban benar
* Poin
* Tingkat kesulitan
* Pembahasan
* Status aktif soal

The admin UI should not overload admin with teacher-owned configuration unless the existing backend requires showing it as readonly/advanced context.

When import succeeds, XLSX teacher-owned configuration may update existing backend package fields if those fields already exist.

Do not add schema in this task unless a critical issue makes it unavoidable.

If a better future schema is needed, document it as a proposal instead of implementing it.

---

## 6. Import Format Goal

The import system should support the final Indonesian template format.

Main question headers:

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

Exam configuration keys:

* durasi_menit
* ambang_lulus_persen
* tampilkan_hasil
* izinkan_ujian_ulang

Package metadata keys:

* kategori
* judul_paket
* kode_paket
* deskripsi
* status_paket

The `Panduan` sheet is human-facing only and must not be imported as question data.

Backward compatibility with the previous English headers should be preserved if already implemented.

Validation must remain user-readable and safe.

Import failures must not expose internal exception details.

---

## 7. Admin UI V2 Vision

The current admin exam UI is not accepted.

The V2 admin UI must feel:

* professional
* structured
* production-ready
* desktop-first
* informative but not excessive
* clear without being noisy
* workflow-oriented
* not like scattered CRUD
* not like a quick AI-generated page

The admin must always understand:

* where they are
* what domain they are working in
* what to do next
* how to go back
* whether they are configuring packages or sessions
* how template/import fits into the package workflow
* how session/participant/result fits into the session workflow

---

## 8. Required Admin Layout Direction

Do not use tab navigation as the main structure.

Create a desktop-first admin exam workspace.

The expected mental structure:

`Pengaturan Paket`

This is about what will be tested.

It includes:

* Paket Ujian
* Template Soal
* Import Soal
* Bank Soal
* Package status and package readiness

`Pengaturan Sesi`

This is about when and for whom exams are available.

It includes:

* Sesi Ujian
* Paket aktif dalam sesi
* Peserta
* Hasil Ujian

Use a left contextual sidebar inside the exam admin area.

Do not create a new global dashboard shell.

Do not modify the global dashboard layout.

The left contextual sidebar should be part of the exam admin workspace only.

The main content area should display the selected page/content.

Important actions must be visible and text-labeled.

Avoid icon-only primary actions.

---

## 9. Admin Workflow V2 Goal

The workflow should be shown naturally.

Package workflow:

* Buat Paket Ujian
* Unduh Template Soal
* Bagikan ke Guru
* Import File Soal
* Review Hasil Import
* Lihat Bank Soal
* Paket siap dimasukkan ke sesi

Session workflow:

* Buat Sesi Ujian
* Pilih Paket Aktif
* Atur Peserta
* Monitor pengerjaan
* Review hasil

The UI should show guidance and next steps, but not with excessive tutorial text.

Use concise helper text.

Use clean cards.

Use clear hierarchy.

Use meaningful empty states.

---

## 10. Visual Quality Bar

The UI must avoid:

* oversized cards
* clipped content
* awkward spacing
* messy action placement
* confusing tabs
* unclear buttons
* too many chips as main content
* table-only raw CRUD feel
* missing back buttons
* pages that feel disconnected
* unprofessional AI-generated visual patterns

The UI should use:

* clear page headers
* concise descriptions
* good content grouping
* consistent card spacing
* clear section labels
* clean desktop grid
* readable tables
* visible actions
* useful empty states
* clear back buttons
* subtle status badges
* focused admin control-center feel

Admin desktop view is priority.

Mobile admin view is not a priority in this task.

---

## 11. Back Navigation Requirement

Every important exam admin page must have clear navigation.

Back buttons must exist where users can feel trapped.

Examples:

* detail package back to package list
* import page back to package detail or package list
* question bank back to package detail
* session detail back to session list
* result detail back to result list
* participant/assignment back to session detail

Back buttons must be visible and text-labeled.

Do not rely only on browser back.

---

## 12. Candidate Side Restriction

Candidate side is not the focus.

Do not change candidate exam behavior unless a small shared component issue makes it necessary.

Do not change:

* timer enforcement
* autosave behavior
* attempt lifecycle
* scoring
* ownership checks
* answer-key exposure rules

---

## 13. Backend Restriction

Do not rebuild backend domain.

Do not change schema unless absolutely required.

Do not change scoring/timer/security logic.

Do not rewrite import architecture if a smaller safe fix is enough.

Do not remove existing successful tests.

Do not break existing routes.

Do not remove Indonesian import support.

Do not remove English import backward compatibility.

---

## 14. Documentation and State Updates

Update the durable state and audit docs.

At minimum, update:

* `docs-ai/state/selection-progress.md`
* `docs-ai/state/selection-known-bugs.md`
* `docs-ai/state/selection-next-actions.md`
* `docs-ai/audit/selection-exam-audit.md`

Record:

* ZipArchive/download error was found.
* Download/import system was audited.
* What fix was applied or what dependency requirement was added.
* Task 2 UI was not accepted.
* Admin UI V2 was redesigned.
* Known remaining limitations.

If a Docker/runtime requirement is added, document it clearly.

---

## 15. External Research Requirement

Before choosing the download/import fix and UI direction, use high-quality external references.

Research should focus on:

* PHP ZipArchive / ext-zip requirement
* OpenSpout or spreadsheet XLSX runtime requirements
* Laravel file download / stream download best practices
* spreadsheet template generation strategies
* admin panel information architecture
* tabs vs sidebar navigation suitability
* workflow-oriented admin UX patterns

Prefer official documentation and reputable design-system references.

Do not copy random blog code blindly.

Use research to guide decisions, not to bloat the implementation.

---

## 16. Verification Requirements

After implementation, run practical verification.

Required:

* `npm run build`
* `git diff --check`
* `git diff --stat`

If download/import/backend code is touched, also run:

* `php artisan test tests/Feature/OnlineSelectionExamSecurityTest.php`
* `php artisan test tests/Feature/OnlineSelectionExamImportTest.php`
* `php artisan test --testsuite=Feature`
* `php artisan route:list --path=dashboard`

If dependency/runtime changes are made, run or document:

* relevant composer checks
* whether `ZipArchive` / `ext-zip` is available
* how template download was verified

Do not commit broken code.

---

## 17. Commit Rule

If changes pass verification, create one commit:

`fix(exam): build admin exam v2 workflow`

Do not push.

Do not merge.

Do not rebase.

Do not reset.

Do not amend previous commits unless explicitly instructed.

---

## 18. Final Report Requirement

Final report must be in Indonesian.

Include:

* root cause of template download error
* download/import audit result
* fix applied for template download
* whether ext-zip / ZipArchive is required or removed
* whether dynamic template download works
* whether import still supports Indonesian headers
* whether English headers remain compatible
* what was wrong with previous admin UI
* what changed in Admin Exam V2
* how Paket and Sesi domains are now separated
* pages/components changed
* docs/state/audit updates
* verification commands and results
* commit hash if created
* known limitations
* recommended next task
