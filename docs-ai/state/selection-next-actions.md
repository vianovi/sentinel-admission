# Selection Online Exam — Next Actions

## Next Action

Mission complete. UX polish checkpoint also completed. No required continuation action remains for this directive.

## Instructions for Next Agent Run

1. Treat this directive as completed unless the user opens a new task.
2. For future changes, read `docs-ai/features/online-selection-exam.md` first.
3. Keep future work scoped to a new feature/bugfix request.
4. Re-run route/build/test/audit checks after future exam changes.
5. For import UX questions, use the dynamic package template route `/dashboard/admin/exams/packages/{package}/template`; the master file is `resources/templates/exam/template-import-soal-ujian-seleksi-spmb.final.xlsx`.

## Do Not Touch

- Existing auth flow
- Existing payment flow
- Existing document verification flow
- Existing profile flow
- Existing registration wizard flow
- Existing dashboard layout/global theme
- Admission accepted/rejected status semantics

## Completed Phase 5 Concrete Steps

1. Created `docs-ai/features/online-selection-exam.md`.
2. Added focused tests in `tests/Feature/OnlineSelectionExamSecurityTest.php`.
3. Ran final PHP syntax, route list, migration pretend, frontend build, feature tests, Composer audit, and answer-key leakage checks.
4. Updated `selection-exam-audit.md` with final self-audit.
5. Updated all durable state files to completed.

## Known Limitations to Document

- This is not a proctoring/browser-lockdown system.
- Option randomization is configured but not implemented in candidate rendering yet.
- Exam pass/fail does not automatically change final admission accepted/rejected status.
- Import supports XLSX only through OpenSpout, not legacy XLS.

## Recommended Future UX Polish

- Add browser/E2E viewport checks for candidate exam at 375px and 390px.
- Consider option randomization rendering if the existing `randomize_options` flag should become active.
- Consider a dedicated retake policy schema if admins need more than the current `izinkan_ujian_ulang` -> `max_attempts` 1/2 mapping.
