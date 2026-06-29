# Selection Online Exam — Decisions

## Final Decisions

- Build the exam feature as a semi-separated exam domain under `App\Models\Exam`, `App\Services\Exam`, `App\Actions\Exam`, `App\Imports\Exam`, `App\Http\Requests\Exam`, and dashboard exam controller/page namespaces.
- Treat the mission directive and actual source code as the source of truth for this run. Older generic docs that say "ask before schema changes" are superseded by the explicit user mission on the dedicated feature branch.
- Do not add global auth roles. Keep `candidate`, `staff`, and `admin`; use existing route groups and domain pages.
- Do not change candidate acceptance semantics directly in the exam engine. Exam results will prepare/assist selection review, while final accepted/rejected transitions remain in the existing verified-candidate status workflow.

## Database Decisions

- Add dedicated exam tables rather than altering existing candidate/user/payment/document tables.
- Implemented schema:
  - `exam_subjects`
  - `exam_packages`
  - `exam_questions`
  - `exam_sessions`
  - `exam_session_candidates`
  - `exam_attempts`
  - `exam_attempt_answers`
  - `exam_import_batches`
  - `exam_audit_logs`
- Use server-side timestamps for `started_at`, `expires_at`, `submitted_at`, `scored_at`.
- Store scoring snapshots on attempts: total, answered, blank, correct, wrong, raw score, max score, percentage, passing score, passed flag.
- Store candidate eligibility in `exam_session_candidates`; do not infer exam access from frontend state.
- Keep question answer keys in `exam_questions.correct_answer`; candidate payload methods must exclude it.
- Store attempt `question_order` as JSON so randomization is stable for the whole attempt.

## Route Decisions

- Candidate exam routes live inside the existing candidate dashboard route group under `/dashboard/seleksi` with route names under `dashboard.exam.*`.
- Admin exam management routes live inside the existing admin dashboard route group under `/dashboard/admin/exams` with route names under `admin.exams.*`.
- Staff result review routes live inside the existing staff dashboard route group under `/dashboard/staff/exams` for read-only result access.
- Existing ComingSoon route for `selection-status` remains; direct accepted/rejected transition is intentionally not coupled to the exam engine.
- Route skeleton implemented:
  - Candidate: `dashboard.exam.index`, `dashboard.exam.sessions.show`, `dashboard.exam.sessions.start`, `dashboard.exam.attempts.show`, `dashboard.exam.attempts.sync`, `dashboard.exam.attempts.answers.save`, `dashboard.exam.attempts.submit`.
  - Admin: `admin.exams.index`, `admin.exams.subjects.*`, `admin.exams.packages.*`, `admin.exams.packages.imports.*`, `admin.exams.imports.show`, `admin.exams.sessions.*`, `admin.exams.results.*`.
  - Staff: `staff.exams.results.*`.

## Import Dependency Decision

- Laravel Excel (`maatwebsite/excel`) was evaluated first because the directive mentioned Laravel Excel imports.
- On this project/PHP version, Laravel Excel 3.1 pinned PhpSpreadsheet to versions that produced critical/high Composer audit advisories and newer patched PhpSpreadsheet 1.x was blocked by PHP 8.5 constraints.
- `maatwebsite/excel` was removed.
- `openspout/openspout` v5.7.2 was selected for streaming XLSX parsing because it supports the current PHP runtime and did not introduce audit advisories.
- Framework and transitive dependencies were updated to patched lockfile versions after Composer audit exposed existing Laravel/Symfony/Guzzle/CommonMark advisories.

## UX Decisions

- Candidate UI will use the existing dashboard layout and a focused exam workspace with instructions, countdown display, question navigation, marked-for-review state, autosave status, and submit confirmation.
- Candidate exam pages are active under `resources/js/Pages/Dashboard/Candidate/Exam`; active attempt uses a focused dashboard workspace rather than a right-side candidate profile panel so mobile and desktop exam navigation stay dense and readable.
- Admin UI is a control-center style: summary cards, filters, status pills, import results, failure report, and package/session/result drilldowns.
- Use Font Awesome icons to stay consistent with the existing UI stack. Do not introduce a new UI library.
- Keep class-based dark mode with literal Tailwind classes.
- Sidebar integration status:
  - Admin: `Ujian Seleksi` -> `/dashboard/admin/exams`, active.
  - Candidate: `Ujian Seleksi` -> `/dashboard/seleksi`, active.
  - Staff: `Hasil Ujian` -> `/dashboard/staff/exams/results`, active.

## Security Decisions

- Backend is authoritative for timer, attempt state, ownership, eligibility, score, and answer validation.
- Candidate exam payloads must never include `correct_answer` or explanation during the active exam.
- Autosave and submit must verify auth role, candidate ownership, session eligibility, attempt ownership, attempt lock state, question membership, and server time.
- On expiration, the server finalizes using saved answers on the next attempt read/save/submit action; client timer is display-only.
- Candidate autosave only displays saved state after the autosave endpoint accepts the write. Locked/expired rejections change the UI to locked/failed state.
- Import flow is admin-only, validates extension/MIME/size, validates XLSX signature, parses rows server-side, reports sanitized row failures, stores import metadata privately, and logs technical exceptions.
- Correct answers are visible in admin-only package preview/result detail contexts and must not be included in candidate props or JSON endpoints.
- Correct answers are visible in protected admin/staff result review contexts. Result detail views log `result_reviewed` audit events.

## External Reference Decisions

- Use official Laravel validation guidance for request classes.
- Use recognized OWASP upload/input/session guidance for practical file/input/session safety.
- Use Moodle-style timed quiz behavior as a product reference for server-authoritative deadlines and auto-submit-on-expiration, without copying LMS architecture wholesale.

## Phase 5 Closeout Decisions

- Keep exam documentation under `docs-ai/features/online-selection-exam.md` so the feature spec, import format, limitations, and manual tests live beside the durable AI task state.
- Add focused feature tests instead of broad browser/E2E tests in this run because the repo already has Pest feature-test coverage and the highest-risk exam behaviors are backend authorization, timer lock, answer-key leakage, and server-side scoring.
- Treat option randomization and automatic admission accepted/rejected transitions as documented future work rather than expanding scope during closeout.

## UX Polish Decisions

- Store the official XLSX import template as a static public asset at `public/templates/exam-question-template.xlsx` because the template is small, stable, and does not require backend generation.
- Keep the polish sprint frontend-focused. No database schema, scoring, timer, ownership, or import-domain logic was changed.
- Use existing exam UI patterns and Font Awesome icons rather than introducing a new component library.
