# Online Selection Exam Engine

## Overview

The Online Selection Exam Engine adds structured online exams to the SPMB dashboard flow.

Implemented areas:

- Admin exam control center
- Exam subject/category management
- Exam package management
- XLSX question import with validation and failure reporting
- Exam session scheduling
- Candidate assignment/eligibility
- Candidate exam dashboard and instruction/start page
- Candidate exam workspace with server-synced timer display
- Debounced autosave
- Submit and auto-submit on expiration
- Server-side scoring
- Admin and staff result review
- Basic exam audit log

The engine does not change final admission acceptance/rejection status automatically. Exam results are review data for selection decisions.

## Database Tables

- `exam_subjects`
- `exam_packages`
- `exam_import_batches`
- `exam_questions`
- `exam_sessions`
- `exam_session_candidates`
- `exam_attempts`
- `exam_attempt_answers`
- `exam_audit_logs`

## Admin Flow

1. Open `/dashboard/admin/exams`.
2. Create at least one subject from `Kategori`.
3. Create a package from `Paket`.
4. Import questions into the package using XLSX format.
5. Publish the package after it has active questions.
6. Create a session from `Sesi`.
7. Assign eligible candidates from the session detail page.
8. Review attempts and scores from `Hasil Ujian`.

Admin result detail may show answer keys because it is inside the protected admin dashboard route group.

## Staff Flow

Staff can open `/dashboard/staff/exams/results` to review read-only exam results.

Staff review supports:

- Search by candidate name, candidate code, NISN, session title, or package title
- Filter by session
- Filter by attempt status
- Filter by pass/fail
- Attempt detail with answer review

Staff result detail may show answer keys because it is inside the protected staff dashboard route group.

## Candidate Flow

1. Candidate opens `/dashboard/seleksi`.
2. Candidate sees assigned exam sessions and current status.
3. Candidate opens a session detail page.
4. If eligible and the session is open, candidate can start the exam.
5. The backend creates `started_at`, `expires_at`, and stable `question_order`.
6. Candidate answers questions in the exam workspace.
7. Answers autosave through the backend.
8. Candidate submits manually, or the backend auto-submits when the attempt is expired and touched again by show/sync/save/submit.
9. Candidate may see score only if result visibility is enabled on the session/package.

Candidate pages must not receive `correct_answer`, explanations, correctness flags, or awarded points during the exam.

## XLSX Import Format

The import uses OpenSpout and supports `.xlsx` files only.

Official template:

- `/templates/exam-question-template.xlsx`
- Admins should download the template from the package import panel, keep the header row unchanged, replace the example row with real questions, then upload the completed XLSX.

Required heading row columns:

| Column | Required Cell Value | Notes |
| --- | --- | --- |
| `subject` | yes | Must match the target package subject name or code. |
| `package` | yes | Must match the target package title or code. |
| `question_text` | yes | Main question text. |
| `option_a` | yes | Choice A. |
| `option_b` | yes | Choice B. |
| `option_c` | yes | Choice C. |
| `option_d` | yes | Choice D. |
| `option_e` | optional value | Column must exist. Value may be empty unless answer is E. |
| `correct_answer` | yes | A, B, C, D, or E. |
| `point` | yes | Positive number. |
| `difficulty` | yes | `easy`, `medium`, `hard`, or Indonesian aliases `mudah`, `sedang`, `sulit`. |
| `explanation` | optional value | Column must exist. Admin/staff review only. |
| `is_active` | optional value | Empty means active. Accepts true/false, yes/no, y/n, 1/0, aktif/nonaktif. |

Example row:

| subject | package | question_text | option_a | option_b | option_c | option_d | option_e | correct_answer | point | difficulty | explanation | is_active |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Akademik | Tes Gelombang 1 | Hasil dari 12 + 8 adalah ... | 18 | 19 | 20 | 21 | 22 | C | 1 | easy | 12 + 8 = 20 | true |

## Import Validation

The import flow validates:

- Admin-only route/request authorization
- File extension `.xlsx`
- Allowed MIME types
- Maximum size 5 MB
- XLSX ZIP signature
- Required heading columns
- Empty required fields
- Subject/package mismatch
- Invalid correct answer
- Option E missing when answer is E
- Non-positive point
- Invalid difficulty
- Invalid `is_active`
- Duplicate question text within the file
- Duplicate question hash already existing in the same package

Technical exceptions are logged. The user sees sanitized failure messages and row-level reports.

## Timer and Autosave

The frontend countdown is display-only.

Authoritative values:

- `exam_attempts.started_at`
- `exam_attempts.expires_at`
- server `now()`
- session close time

Backend rules:

- Candidate cannot start before session opens.
- Candidate cannot start after session closes.
- Candidate cannot exceed max attempts.
- Candidate cannot save an answer after submit or expiration.
- Candidate cannot submit a locked attempt.
- Expired in-progress attempts are auto-submitted by the backend on the next read/save/submit/sync touch.

Autosave behavior:

- Candidate UI debounces answer saves.
- UI shows saving/saved/failed/locked states.
- UI only marks saved after the server accepts the save.
- Save payload contains question id, selected option, and marked-for-review flag only.

## Scoring

Scoring happens only on the server in `ExamScoringService`.

The scoring service calculates:

- total questions
- answered questions
- blank questions
- correct answers
- wrong answers
- raw score
- maximum score
- percentage score
- passing score
- passed flag

The frontend never submits score or answer-key data.

## Audit Events

Implemented audit events include:

- `exam_package_created`
- `exam_package_published`
- `questions_imported`
- `import_failed`
- `candidate_assigned`
- `attempt_started`
- `answer_saved`
- `attempt_submitted`
- `attempt_auto_submitted`
- `result_reviewed`

## Security Notes

- Role protection uses existing exact role middleware.
- Candidate session/attempt access is checked against authenticated candidate ownership.
- Admin/staff result review is protected by dashboard role groups.
- Candidate pages do not include answer keys.
- Import files are stored on the private disk with generated paths.
- Import errors shown to users are sanitized.
- Composer audit is clean at the implementation checkpoint.
- This is not a proctoring system and does not attempt webcam, screen recording, browser lockdown, AI cheating detection, or device fingerprinting.

## Known Limitations

- Option randomization is configured on packages but not implemented in candidate option rendering yet.
- Import supports `.xlsx`, not legacy `.xls`.
- Exam pass/fail does not automatically update final admission accepted/rejected status.
- There is no background scheduler yet for expiring attempts that are never touched again; expiration is finalized on read/save/submit/sync.
- No fake proctoring or browser-lockdown behavior is included.

## Manual Test Guide

Admin:

1. Login as admin.
2. Open `/dashboard/admin/exams`.
3. Create a subject.
4. Create a package.
5. Try publishing before import; it should be rejected.
6. Import a valid XLSX file and verify success count.
7. Import an invalid XLSX file and verify failure report.
8. Test missing required column, invalid `correct_answer`, invalid point, duplicate question, and empty optional values.
9. Publish the package.
10. Create a session with current open/close time.
11. Assign a candidate.
12. Open admin result list and detail after candidate submits.

Candidate:

1. Login as assigned candidate.
2. Open `/dashboard/seleksi`.
3. Open the assigned session.
4. Verify the start button is disabled if the session is not open.
5. Start an open session.
6. Answer questions and verify autosave status changes to saved.
7. Mark a question for review.
8. Refresh the page and verify saved answers remain selected.
9. Submit the attempt.
10. Try opening autosave/submit again after submit; backend must reject locked changes.
11. Use another candidate account and verify it cannot access the first candidate’s attempt.

Staff/Admin Review:

1. Login as staff and open `/dashboard/staff/exams/results`.
2. Filter by session, status, pass/fail, and search term.
3. Open result detail and verify score breakdown.
4. Login as admin and repeat on `/dashboard/admin/exams/results`.
5. Verify result detail access logs `result_reviewed`.

Security:

1. Inspect candidate page props/network responses during an attempt.
2. Confirm no `correct_answer`, `explanation`, `is_correct`, or `point_awarded` appears in candidate exam responses.
3. Submit an autosave request with a question not in the attempt; backend must reject it.
4. Submit an invalid option; backend must reject it.
5. Force local countdown changes in browser devtools; backend expiration must remain authoritative.
