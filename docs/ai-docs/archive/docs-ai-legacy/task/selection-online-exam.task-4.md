# TASK 4 — Stitch-First Admin Exam UI V2 Design and Implementation

## 0. Mission

This task is focused on UI only.

The current Admin Online Selection Exam UI is not accepted. The layout is still visually poor, confusing, and does not follow the intended design direction.

Codex must not redesign the UI by itself from imagination.

Codex must act as:

* UI product director
* Stitch prompt engineer
* design reviewer
* frontend implementer
* QA auditor

Stitch must act as the visual design generator.

The final implementation must be based on Stitch-generated design output, adapted to the existing project.

Do not treat the current UI as acceptable.

Do not only change colors.

Do not merely restyle the existing broken layout.

The goal is to build a professional Admin Exam UI V2 that follows the project’s theme, structure, and real workflow.

---

## 1. Main Rule

Use Stitch MCP first.

Before writing frontend code, Codex must use Stitch MCP to generate or refine the required admin exam screens.

Codex must not start implementing until it has:

1. Read the existing project UI/theme context.
2. Instructed Stitch to generate/refine the admin exam design.
3. Reviewed the Stitch design result.
4. Saved a local design reference document.
5. Created a concise implementation plan based on the Stitch result.

If Stitch MCP fails or is unavailable, stop and report the blocker.

Do not fallback to self-designed UI.

---

## 2. Project Theme Source

Before instructing Stitch, read the project’s local design and architecture references.

At minimum inspect:

* `docs-ai/01_project.final.md` if available
* existing dashboard layout
* existing admin dashboard pages
* existing navigation config
* Tailwind/theme tokens
* current dark mode classes
* existing card/button/table patterns
* existing project brand colors

Use the project’s own theme as the source of color.

Do not copy Stitch colors blindly.

Stitch should provide layout, hierarchy, spacing, card structure, page composition, and UX direction.

The project should provide final colors, dark theme, typography style, and component constraints.

---

## 3. Use Existing Stitch Project as Reference

Use Stitch MCP.

Open the Stitch project:

`Al-Muntaha School Admin Dashboard`

If project ID is needed:

`271540505065919969`

Read available screens.

Use the Stitch project as design DNA and reference.

Do not copy it blindly.

Do not ignore it.

Codex must decide:

* what visual patterns should be adopted
* what must be adapted to this project
* what must not be copied
* which parts are missing and need Stitch to generate more screens

---

## 4. Codex as Stitch Instructor

Codex must use Stitch MCP to create or refine the missing Admin Exam screens.

Codex should give Stitch precise instructions based on this project’s real workflow.

Stitch must generate high-fidelity UI concepts for:

1. Admin dashboard with “Ujian Seleksi” active in the main sidebar.
2. Pengaturan Paket page.
3. Pengaturan Sesi page.
4. Paket detail page.
5. Template download and import flow page.
6. Sesi detail / participant management page.
7. Result review page if needed for layout consistency.

The generated UI must follow the project’s theme, but Stitch should focus on structure and layout.

Codex must not accept Stitch output if it uses:

* top tabs as the main navigation
* fake inactive menus
* too many nested menus
* a second global sidebar
* cluttered cards
* oversized blocks
* generic CRUD layout
* unclear action buttons
* no back buttons
* poor workflow clarity

If Stitch output is not good enough, use Stitch edit tools to refine it before coding.

---

## 5. Required Navigation Model

The main admin dashboard sidebar must remain the only global navigation.

Under the existing main menu item:

`Ujian Seleksi`

there must be exactly two visible submenus:

1. `Pengaturan Paket`
2. `Pengaturan Sesi`

Do not add submenus such as:

* Overview
* Template
* Import
* Bank Soal
* Peserta
* Hasil
* Dokumentasi

Those are not sidebar submenus.

They must appear as workflow steps, cards, sections, or action buttons inside the related page.

---

## 6. No Tab-Based Main Structure

Do not use tab navigation as the main structure.

The current tab-like approach is rejected.

The admin exam UI must use:

* page-level workflow sections
* cards
* action groups
* detail pages
* clear back buttons
* sequential user flow

Tabs may only be used inside a small local component if absolutely appropriate, but not as the core page navigation.

## 16.5 Mandatory Audit Loop Before Commit

The agent must not commit immediately after the first implementation.

After implementing the Stitch-based Admin Exam UI V2, the agent must enter an audit loop.

The audit loop must continue until the implementation is clean, consistent, and ready for review.

The agent must repeat this cycle:

1. Inspect the implemented UI against the Stitch design reference.
2. Inspect the browser result visually if Playwright MCP is available.
3. Check whether the implementation follows the required navigation model.
4. Check whether only two submenus exist under `Ujian Seleksi`:

   * `Pengaturan Paket`
   * `Pengaturan Sesi`
5. Check that there is no main tab-based navigation.
6. Check that all important pages have clear back buttons.
7. Check that important actions are visible and text-labeled.
8. Check that the UI uses the project theme, not raw Stitch colors.
9. Check that the UI feels production-ready, not merely recolored.
10. Check for broken layout, overflow, clipped content, oversized cards, dead buttons, fake menus, and confusing workflow.
11. Run required verification commands.
12. Fix any Critical, High, or obvious Medium issue.
13. Repeat the audit after fixes.

The agent may commit only when:

* `npm run build` passes.
* `git diff --check` passes.
* relevant backend tests pass if backend/download/import code was touched.
* the UI follows the Stitch-based design reference.
* the UI no longer uses rejected tab-based main navigation.
* there are no fake inactive menus.
* there are no known Critical or High issues.
* obvious UI/UX Medium issues found during audit are fixed.
* state and audit docs are updated.
* the final diff is reviewed.

If the agent cannot reach this standard, it must not commit.

Instead, it must stop and report:

* what failed
* what remains broken
* what decision is needed
* what files were changed
* what should be done next

---

## 7. Pengaturan Paket UX

This page is about what will be tested.

It must answer:

* What packages exist?
* Which package is ready?
* Which package still needs questions?
* How does admin generate template?
* How does admin import teacher-filled questions?
* What should admin do next?

The page must contain:

* clear page title
* concise subtitle
* primary action: `Buat Paket Ujian`
* compact workflow explanation
* package list/table/cards
* status/readiness indicators
* clear actions:

  * Detail
  * Unduh Template
  * Import Soal
  * Lihat Bank Soal

The workflow must be visible but not excessive:

1. Buat Paket
2. Unduh Template
3. Guru Mengisi
4. Import Soal
5. Review Bank Soal
6. Siap Masuk Sesi

Use clean Indonesian copy.

Do not show raw column chips as the main content.

---

## 8. Pengaturan Sesi UX

This page is about when and for whom exams are available.

It must answer:

* What sessions exist?
* When are they active?
* Which packages are included?
* Which candidates are assigned?
* What is the progress?
* Where are the results?

The page must contain:

* clear page title
* concise subtitle
* primary action: `Buat Sesi Ujian`
* session list/table/cards
* status indicators
* progress indicators
* clear actions:

  * Detail
  * Atur Peserta
  * Lihat Hasil

The workflow must be visible but not excessive:

1. Buat Sesi
2. Pilih Paket Aktif
3. Atur Peserta
4. Monitor Pengerjaan
5. Review Hasil

Use clean Indonesian copy.

---

## 9. Detail Page Requirement

Detail pages must not feel like dead ends.

Every detail page must have a clear text-labeled back button.

Examples:

* `Kembali ke Pengaturan Paket`
* `Kembali ke Pengaturan Sesi`
* `Kembali ke Detail Paket`
* `Kembali ke Hasil Ujian`

Do not rely only on browser back.

Important actions must be visible and labeled.

Do not use icon-only primary actions.

---

## 10. Visual Quality Bar

The final UI must feel:

* clean
* premium
* desktop-first
* production-ready
* serious
* calm
* structured
* informative but not excessive
* consistent with Al-Muntaha School dashboard

Avoid:

* oversized cards
* awkward spacing
* clipped content
* unclear action placement
* too many nested menus
* decorative clutter
* random gradients
* generic CRUD look
* AI-generated messy layout
* pages with buttons that do not clearly lead anywhere

Prefer:

* clear hierarchy
* compact dashboard spacing
* polished cards
* readable tables
* status pills
* professional empty states
* direct CTA buttons
* helpful short descriptions
* consistent dark theme
* existing project accent colors

---

## 11. Color and Theme Rule

Do not copy Stitch colors blindly.

Use this project’s theme.

Follow existing project dark mode, dashboard shell, and accent conventions.

Stitch is used for layout and UX structure, not final color authority.

The final implementation must look native to the existing Al-Muntaha School dashboard.

---

## 12. Download/Import Work Is Not Main Focus

The current XLSX download/import has known issues.

However, this task’s main focus is UI.

Do not spend the whole task redesigning backend download/import.

Only fix blocking download/import issues if they prevent the UI from functioning during review.

Known issue to keep in mind:

* `/dashboard/admin/exams/packages/{package}/template` may download HTML or fail instead of returning a real XLSX.

If touched, preserve:

* Indonesian header support
* English header backward compatibility
* existing security tests
* existing import tests

Do not change database schema.

---

## 13. Required Local Design Reference

Before implementation, create:

`docs-ai/design/admin-exam-v2-stitch-reference.md`

This file must include:

* Stitch project used
* screens inspected/generated
* adopted design patterns
* adapted design patterns
* rejected design patterns
* mapping to project pages/components
* implementation plan
* remaining design gaps

This file is mandatory.

Do not skip it.

---

## 14. Implementation Boundary

Allowed:

* exam admin frontend pages
* exam admin components
* exam navigation config
* exam-specific UI components
* minimal route adjustments if required
* design reference docs
* state/audit docs

Avoid unless required:

* backend services
* import parser
* template service
* tests

Do not touch:

* auth
* payment
* document verification
* registration wizard
* profile
* candidate attempt lifecycle
* timer logic
* scoring logic
* global dashboard layout
* global theme system
* database schema

---

## 15. State and Audit Updates

Update durable state/audit docs after implementation.

At minimum:

* `docs-ai/state/selection-progress.md`
* `docs-ai/state/selection-known-bugs.md`
* `docs-ai/state/selection-next-actions.md`
* `docs-ai/audit/selection-exam-audit.md`

Record:

* Task 4 is a UI-first recovery task.
* Previous Codex-generated UI was rejected.
* Stitch was used as design source.
* Whether Stitch screens were generated/refined.
* What UI implementation was changed.
* Remaining visual issues.

---

## 16. Verification

Run:

* `npm run build`
* `git diff --check`
* `git diff --stat`

If routes/backend are touched, also run relevant Laravel tests.

If Playwright MCP is available, visually inspect:

* Pengaturan Paket
* Pengaturan Sesi
* package detail/import flow
* session detail/result flow

Take screenshots if useful.

Do not commit broken code.

---

## 17. Commit Rule

Commit is allowed only after the mandatory audit loop passes.

If implementation and verification pass, create one commit:

`fix(exam): implement stitch-based admin exam ui v2`

Do not commit if the UI is only partially implemented, visually inconsistent, still tab-based, or not aligned with the Stitch reference.

Do not push.
Do not merge.
Do not rebase.
Do not reset.
Do not amend previous commits unless explicitly instructed.

---

## 18. Final Report

Final report must be in Indonesian.

Include:

* Stitch project used
* Stitch tools/actions used
* screens generated or inspected
* design reference file location
* what was adopted from Stitch
* what was adapted to project theme
* what previous UI problems were fixed
* navigation changes
* pages/components changed
* verification commands and results
* commit hash if created
* remaining known issues
* recommended next task
