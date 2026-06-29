# TASK DIRECTIVE — Online Selection Exam Engine for Sentinel Admission

## 0. Read This First

This file is the main mission directive for the AI coding agent.

The agent must not treat this as a normal “make me a feature” request.

This is an autonomous product-engineering mission for building a premium online selection exam system inside the existing Sentinel Admission project.

The agent is allowed to determine its own task breakdown, inspect the codebase, research best practices, design the architecture, implement the feature, audit its own work, fix critical problems, and produce a final Indonesian report.

The agent is not allowed to ignore the project context, skip local documentation, randomly modify unrelated modules, or build a cheap CRUD-only exam page.

---

## 1. Project Context

The project is an Indonesian school admission system / SPMB platform.

Internal project name:

* Sentinel Admission

User-facing brand:

* Al-Muntaha School
* Al-Muntaha Islamic Boarding School

The internal name “Sentinel” must never appear on user-facing pages.

Core stack:

* Laravel 12
* Inertia.js v2
* React
* TypeScript
* Tailwind CSS with class-based dark mode
* MariaDB
* Docker-based local environment
* Fedora KDE Plasma
* Fish shell

Main user roles are fixed:

* candidate
* staff
* admin

Do not create new global auth roles such as examiner, bendahara, operator, reviewer, panitia, or verifikator.

If the exam feature needs different work domains, implement them as domain permissions, menu grouping, policies, or internal feature access rules while respecting the existing role model.

The project already has candidate, staff, and admin dashboard areas.

The exam feature must integrate into the existing dashboard structure, but it should be built as a semi-separated domain so it does not pollute unrelated candidate/staff/admin code.

This feature belongs conceptually to the SPMB selection flow.

The system must support the admission idea that a candidate cannot be declared accepted before passing the required selection process.

---

## 2. Main Mission

Build a full online selection exam engine for the SPMB system.

The feature must allow admins to configure online exams, import question banks from a defined Excel format, assign or make candidates eligible for exams, let candidates take exams through a polished online interface, enforce timer rules on the server, autosave answers, submit or auto-submit attempts, calculate scores, and expose results for admin/staff review.

The feature must feel premium, structured, and professional.

The candidate exam page should feel closer to a university-style online exam page than a basic CRUD form.

The admin area should feel like an exam control center, not a raw database table.

---

## 3. Core Product Goals

The final system must support:

1. Admin exam management
2. Exam subject/category management
3. Exam package management
4. Exam session/schedule management
5. Excel question bank import
6. Import validation and failure report
7. Candidate exam eligibility
8. Candidate exam dashboard/entry point
9. Candidate exam-taking page
10. Server-side timer enforcement
11. Autosave answers
12. Question navigation
13. Attempt lifecycle management
14. Final submit confirmation
15. Auto-submit or safe expiration handling
16. Server-side scoring
17. Admin/staff result review
18. Selection status integration
19. Basic audit log
20. Documentation and final self-audit report

---

## 4. Scope Firewall

This section is mandatory.

The agent must not touch unrelated parts of the project.

The agent may only modify files directly required for the Online Selection Exam Engine and its immediate integration points.

Allowed areas:

* Exam-related migrations
* Exam-related models
* Exam-related controllers
* Exam-related services/actions
* Exam-related requests/validation
* Exam-related policies or middleware
* Exam-related imports
* Exam-related frontend pages/components
* Exam-related TypeScript types
* Exam-related routes
* Exam-related dashboard menu entries
* Exam-related documentation
* Minimal candidate/staff/admin integration points
* Minimal tests or verification helpers if the project already has a testing pattern

Allowed integration points:

* Dashboard sidebar/menu
* Route registration
* Role/permission checks
* Candidate dashboard card or entry link
* Admin dashboard/menu entry
* Staff/admin selection result entry
* Shared UI components only if reuse is safe and non-breaking

Forbidden unless absolutely necessary and justified in the final report:

* Rewriting existing dashboard layout
* Rewriting candidate registration flow
* Rewriting payment flow
* Rewriting document upload/verification flow
* Rewriting profile flow
* Rewriting auth flow
* Changing global user roles
* Changing existing candidate status semantics without a migration/flow reason
* Touching unrelated controllers
* Touching unrelated pages
* Removing existing libraries
* Renaming existing routes unrelated to exam
* Global CSS/theme rewrites
* Breaking existing candidate/staff/admin dashboards
* Replacing working components with speculative rewrites
* Creating broad “cleanup” commits unrelated to the exam feature

If the agent discovers a bug outside the scope, it must document it in the final report or a separate note, but must not fix it unless it blocks the exam feature.

If an out-of-scope change is truly required, the agent must:

1. Explain why it is required
2. Keep the change minimal
3. Document it clearly
4. Ensure it does not alter unrelated behavior

No opportunistic refactoring.

No “while I’m here” cleanup.

No hidden rewrites.

---

## 5. Security Level

Target security level: medium.

This system is not intended to become a full proctoring platform or exam browser.

Do not build:

* Webcam proctoring
* Screen recording
* Browser lockdown
* Safe Exam Browser clone
* AI cheating detection
* Keystroke monitoring
* Invasive device fingerprinting
* Fake anti-cheat theater

Instead, build practical and real web-application security:

* Server-side authoritative timer
* Attempt lock after submit/expiration
* Candidate ownership checks
* Eligibility checks
* Role-based authorization
* No answer key leakage to candidate frontend
* Import validation
* File upload safety
* Randomized question/order support if feasible
* Autosave guarded by attempt state
* Submit guarded by attempt state
* Audit log for important exam events
* Silent technical errors for users
* Technical details only in logs
* No stack traces exposed to users

The frontend timer is only a display layer.

The backend is the source of truth.

---

## 6. Mandatory First Actions Before Coding

Before writing or modifying any code, the agent must inspect the existing project.

The agent must read relevant local documentation first.

Search and read relevant files from:

* docs-ai/
* project architecture docs
* route docs
* dashboard docs
* candidate docs
* staff docs
* admin docs
* status/progress docs
* any file related to permissions, menus, candidate status, document verification, payment verification, or admission workflow

Then inspect actual source files.

At minimum, inspect:

* routes/web.php or route files currently used
* User model
* Candidate model
* existing candidate dashboard controllers
* existing staff dashboard controllers
* existing admin dashboard controllers
* existing dashboard layouts
* existing sidebar/menu components
* existing candidate pages
* existing staff pages
* existing admin pages
* existing document/payment verification patterns
* existing validation patterns
* existing upload patterns
* existing middleware and role checks
* existing migrations related to users, candidates, admission waves, documents, payments, and status flow

If documentation conflicts with source code, trust actual source code.

Before schema changes, verify current branch.

Before frontend/server instructions, determine whether the project is in dev-mode or demo-mode.

Use Fish-compatible commands only.

---

## 7. External Research Permission

The agent may search the internet for high-quality implementation patterns.

External research should focus on:

* Laravel 12 validation
* Laravel upload handling
* Laravel Excel import validation
* Laravel Excel heading row validation
* OWASP file upload security
* OWASP input validation
* OWASP session management
* Server-authoritative timer patterns
* Timed exam attempt lifecycle patterns
* Moodle/Open edX-style timed exam behavior
* Online exam autosave UX
* Secure quiz scoring patterns

Do not copy a foreign LMS architecture blindly.

Extract useful patterns and adapt them to this project.

Prefer official documentation and recognized security references over random blog code.

Avoid low-quality “CRUD quiz app” tutorials.

---

## 8. Architecture Boundary

Build the feature as a semi-separated exam domain.

Prefer dedicated structures such as:

Backend:

* app/Models/Exam/
* app/Http/Controllers/Dashboard/Admin/Exam/
* app/Http/Controllers/Dashboard/Candidate/Exam/
* app/Http/Controllers/Dashboard/Staff/Exam/ if needed
* app/Services/Exam/
* app/Actions/Exam/
* app/Imports/Exam/
* app/Http/Requests/Exam/
* app/Policies/
* database/migrations for exam tables

Frontend:

* resources/js/Pages/Dashboard/Admin/Exam/
* resources/js/Pages/Dashboard/Candidate/Exam/
* resources/js/Pages/Dashboard/Staff/Exam/ if needed
* resources/js/Components/Dashboard/Exam/
* resources/js/Components/Dashboard/Admin/Exam/
* resources/js/Components/Dashboard/Candidate/Exam/

Routes:

* Admin exam management under admin dashboard routes
* Candidate exam access under candidate dashboard or dedicated candidate exam routes
* Staff/admin result review under proper dashboard routes
* Middleware and authorization must be explicit

Do not create a new dashboard layout unless there is a strong reason.

Pages must be thin orchestrators.

Business logic belongs in services/actions.

Validation belongs in request classes or dedicated validators.

Exam-specific UI logic belongs in exam components.

---

## 9. Suggested Domain Model

The agent must decide the final schema after auditing the actual project.

Potential tables may include:

* exam_subjects
* exam_packages
* exam_questions
* exam_sessions
* exam_session_candidates
* exam_attempts
* exam_attempt_answers
* exam_import_batches
* exam_audit_logs

The final schema must support:

* Multiple subjects
* Multiple packages
* Multiple sessions
* Candidate eligibility
* Excel question import
* Attempt lifecycle
* Answer storage
* Server-side scoring
* Result review
* Audit trail
* Future expansion without painful rewrite

Keep the schema clean and intentional.

Do not over-engineer into a full LMS.

Do not under-engineer into fragile CRUD.

---

## 10. Admin Exam Management Requirements

Admins must be able to manage online exams.

Admin features should include:

* Exam subject/category list
* Exam package list
* Create/edit exam package
* Configure duration
* Configure passing score
* Configure maximum attempts
* Configure schedule open/close time
* Configure visibility/status
* Import questions from Excel
* Preview imported questions
* Review import batch history
* See import failures
* Assign candidates or define eligibility
* See session statistics
* See candidate attempts
* See results

Recommended exam/package statuses:

* draft
* published
* closed
* archived

Recommended attempt statuses:

* not_started
* in_progress
* submitted
* auto_submitted
* expired
* cancelled
* invalidated

The admin UI should use cards, filters, status pills, summary stats, and clear empty states.

Avoid raw database-looking pages.

---

## 11. Excel Question Import Requirements

The system must support importing question banks from Excel.

The agent must create and document the official Excel format.

At minimum, support multiple-choice questions.

Required columns:

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

Rules:

* option_e may be optional
* explanation may be optional
* is_active may be optional
* correct_answer must be one of A, B, C, D, or E
* option E cannot be correct if option_e is empty
* point must be numeric and positive
* question_text is required
* options A-D are required
* subject/package must be resolved safely
* empty rows must be skipped or reported consistently
* invalid rows must not silently corrupt data
* import result must report success and failure counts

The import flow must show:

* Total rows scanned
* Successfully imported rows
* Failed rows
* Failure reason per row
* Missing required columns
* Invalid correct answer
* Invalid point
* Empty required fields
* Duplicate or suspected duplicate questions if feasible

Security requirements:

* Admin-only import
* Validate file extension
* Validate file type
* Validate file size
* Do not trust browser-provided MIME type alone
* Store import batch metadata
* Never expose technical import exceptions to users
* Log technical details if needed

The agent should consider using Laravel Excel validation concerns, heading row validation, skipped empty rows, and failure collection if compatible with the existing project.

---

## 12. Candidate Exam Experience

Candidate exam access must be controlled by eligibility and schedule.

Candidate states should be clear:

* Not eligible
* Eligible but not started
* Exam not open yet
* Exam already closed
* Attempt in progress
* Attempt submitted
* Attempt auto-submitted
* Attempt expired
* Result pending
* Passed/failed if result visibility is enabled

The candidate exam UI must include:

* Exam title
* Candidate identity summary
* Instruction page before start
* Server-synced countdown timer
* Question number/progress
* Question navigation panel
* Answered/unanswered status
* Mark for review
* Autosave indicator
* Save failed state
* Final submit confirmation
* Expired state handling
* Clean mobile-first layout
* Desktop layout with focused exam workspace
* Calm, professional visual design

The UI must not reveal correct answers.

The UI must not depend on hidden inputs for security.

The UI must remain usable at 375px and 390px width.

Do not build a cheap CRUD page.

---

## 13. Timer Requirements

The timer must be server-authoritative.

The server must calculate and store `started_at` and `expires_at`.

The frontend may display countdown, but the backend must enforce:

* Candidate cannot start before allowed time
* Candidate cannot start after session close
* Candidate cannot continue after attempt expiration
* Candidate cannot save answers after expiration
* Candidate cannot submit a locked attempt
* Candidate cannot create unlimited attempts
* Candidate cannot extend time by changing frontend data
* Candidate cannot access another candidate’s attempt

Add a safe time sync endpoint or include server time in relevant responses.

When time expires, prefer auto-submit of saved answers.

If auto-submit fails due to network/client issue, the server must still be able to mark the attempt expired/auto-submitted consistently on next request or via safe backend handling.

Do not trust JavaScript countdown as the final authority.

---

## 14. Autosave Requirements

Autosave must protect candidates from small browser or network issues.

Recommended behavior:

* Save when answer changes
* Debounce answer saves
* Periodic heartbeat or autosave
* Show “saving”
* Show “saved”
* Show “failed to save”
* Retry safely when possible
* Never mark saved if server rejects it
* Never save into submitted/expired/locked attempt
* Keep payload minimal
* Validate question belongs to the active attempt/session

Autosave endpoints must be protected by auth, role, ownership, attempt state, and timer rules.

---

## 15. Scoring Requirements

Scoring must be server-side.

The frontend must never receive answer keys during the exam.

Scoring should support:

* Total questions
* Answered questions
* Blank answers
* Correct answers
* Wrong answers
* Raw score
* Maximum score
* Percentage score
* Passing score
* Passed/failed status

Score must be calculated after final submission or auto-submission.

Do not trust score sent by frontend.

Do not trust correct answer sent by frontend.

---

## 16. Staff/Admin Result Review

Admin must be able to review results.

Staff may review results if this matches existing dashboard/menu policy.

Review pages should include:

* Search candidate
* Filter by exam session
* Filter by attempt status
* Filter by passed/failed
* Attempt detail page
* Score breakdown
* Candidate identity summary
* Timeline/audit events if available
* Clear result status

This feature should prepare for future integration with “Seleksi & Status”.

Do not force final admission acceptance directly unless the existing project flow supports it safely.

If direct accepted/rejected transition is risky, provide result/recommendation and document the next integration step.

---

## 17. Audit Log Requirements

Add basic audit logging for important exam events.

Recommended events:

* exam_package_created
* exam_package_published
* questions_imported
* import_failed
* candidate_assigned
* attempt_started
* answer_saved
* attempt_submitted
* attempt_auto_submitted
* attempt_expired
* attempt_invalidated
* result_reviewed

Audit logs should record:

* actor user id if available
* candidate id if relevant
* exam session/package id if relevant
* attempt id if relevant
* event type
* metadata JSON
* IP/user agent if useful and already consistent with project practices
* created_at

Do not expose raw audit metadata to candidate unless intentionally designed.

---

## 18. UX and Design Standard

The feature must look professional.

Candidate side:

* Focused
* Calm
* Clean
* Mobile-first
* Easy navigation
* Clear progress
* Clear timer
* Clear autosave status
* No clutter
* No accidental final submit

Admin side:

* Control-center feel
* Summary cards
* Tables with filters
* Status pills
* Clear empty states
* Clear import result display
* Clear failure report
* Clear action buttons

Respect existing project styling and dashboard patterns.

Use static Tailwind dark mode classes.

Do not use dynamic dark class strings.

Do not introduce a new UI library unless the existing project already allows it.

---

## 19. Route and Menu Integration

Add menu entries only where needed.

Candidate:

* Add exam/seleksi entry in the candidate dashboard menu or relevant registration/selection area
* Candidate route may be dedicated, but must stay protected

Admin:

* Add admin exam management entry
* Add exam package/session/question import/result pages

Staff:

* Add result/review entry only if aligned with the existing staff dashboard policy

Future/unfinished pages must not 404.

If a menu item is visible but not fully built, route it to an existing Coming Soon pattern.

Do not break existing active menu items.

---

## 20. Required Self-Audit Loop

After implementation, the agent must audit its own work.

The agent must check backend, frontend, security, product flow, and integration.

Backend audit:

* Migrations run
* Models correct
* Relations correct
* Controllers not bloated
* Business logic in services/actions
* Validation is server-side
* Authorization exists
* Candidate ownership enforced
* Admin-only routes protected
* Staff/admin routes protected
* Timer server-authoritative
* Attempt lock works
* Autosave rejects locked/expired attempts
* Score calculated server-side
* Answer keys not leaked
* Import validation works
* Import failures reported
* Errors are user-safe

Frontend audit:

* Pages are thin
* Components are modular
* TypeScript types clean
* Mobile-first layout
* Dark mode classes static
* Loading states
* Empty states
* Error states
* Autosave status
* Submit confirmation
* Expired state
* No answer key exposure
* No security reliance on frontend timer

Security audit:

* No IDOR
* No mass assignment issue
* No unprotected route
* No role bypass
* No answer-key leakage
* No trusting client timer
* No trusting client score
* No trusting Excel metadata only
* No user-facing stack trace
* No unrelated modules broken

Product audit:

* Admin can create/configure exam
* Admin can import questions
* Candidate can access assigned exam
* Candidate can start attempt
* Candidate can answer questions
* Autosave works
* Timer expiration handled
* Submit works
* Score appears in admin review
* Result flow is understandable
* Existing dashboard still works

If a critical or high-risk bug is found, the agent must fix it and audit again.

Repeat until no critical or high-risk bug remains.

---

## 21. Manual Testing Requirements

The agent must provide manual test steps in the final report.

At minimum, include tests for:

* Admin route access
* Candidate route access
* Staff/admin result access if built
* Non-admin cannot import questions
* Candidate cannot access another candidate’s exam
* Candidate cannot start closed exam
* Candidate cannot submit twice
* Candidate cannot save after submit
* Candidate cannot save after expiration
* Excel import success
* Excel import failure
* Invalid correct answer
* Missing required column
* Empty rows
* Timer expiration
* Autosave
* Score calculation
* Dashboard/menu integration

---

## 22. Documentation Requirements

The agent must add documentation for:

* Feature overview
* Excel import format
* Required columns
* Optional columns
* Example row
* Import validation rules
* Candidate exam flow
* Admin exam flow
* Security notes
* Known limitations
* Manual test steps

Documentation may be placed under a relevant docs-ai or project docs location consistent with existing documentation style.

---

## 23. Final Report Requirements

The final report must be written in Indonesian.

The final report must include:

* Ringkasan fitur yang dibangun
* File yang dibuat/diubah
* Perubahan database
* Route yang ditambahkan
* Cara import soal
* Cara menjalankan ujian sebagai kandidat
* Cara review hasil sebagai admin/staff
* Cara testing manual
* Command yang dijalankan
* Catatan keamanan
* Known limitations
* Hal yang sengaja tidak dibangun
* Hasil self-audit
* Out-of-scope files touched, if any, with justification

If something is unfinished, state it clearly.

Do not pretend unfinished work is complete.

---

## 24. Non-Goals

Do not build:

* Full LMS
* Public course system
* Exam browser
* Webcam proctoring
* Screen recording
* AI cheating detection
* Parent portal
* Payment accounting
* Chat system
* Advanced analytics outside exam needs
* Microservice architecture
* Global permission rewrite
* Global design-system rewrite

Do not rewrite the whole project.

Do not remove existing working features.

Do not expose internal project name to end users.

Do not create fake security theater.

---

## 25. Agent Working Principle

You may determine your own task breakdown.

You may inspect local docs and source code.

You may search for high-quality external references.

You may design the schema after audit.

You may implement backend and frontend.

You may refactor inside the exam feature boundary.

You may add minimal integration points.

You may audit and fix your own work.

But:

You must not skip project audit.

You must not touch unrelated modules casually.

You must not build generic low-quality quiz CRUD.

You must not trust the frontend for timer, score, role, ownership, or answer validation.

You must not expose correct answers to candidates.

You must not stop after “it runs” if critical flaws remain.

Your mission is complete only when the Online Selection Exam Engine is working end-to-end, cleanly integrated, secure enough for medium-risk SPMB exams, documented, manually testable, and self-audited.

## 26. Execution Strategy — Phase-Based Autonomous Build

The agent must execute this mission using a phase-based autonomous workflow.

Do not attempt to randomly modify the whole project at once.

The mission is large, so the agent must break it into internal phases, verify each phase, and continue only when the current phase is stable.

The agent is still responsible for determining the detailed task breakdown, but the execution rhythm must follow this structure:

### Phase 0 — Project Audit & Implementation Plan

Before coding, inspect local documentation and actual source files.

The agent must identify:

* Current branch
* Current project mode if relevant
* Existing route structure
* Existing dashboard layout/menu structure
* Existing role/middleware pattern
* Existing candidate/admin/staff controller patterns
* Existing migration/model conventions
* Existing upload/import patterns if any
* Existing validation patterns
* Existing status and selection-related docs
* Potential conflicts or stale docs

Output an internal implementation plan before writing code.

The plan must include:

* Database design
* Backend structure
* Frontend structure
* Routes to add
* Menu integration points
* Security strategy
* Timer strategy
* Autosave strategy
* Excel import strategy
* Audit strategy
* Risk list

If a critical ambiguity blocks implementation, stop and report the blocker.

If there is no blocker, proceed to Phase 1.

---

### Phase 1 — Database, Models, Routes Skeleton, and Core Domain

Build the exam domain foundation.

Expected output:

* Exam-related migrations
* Exam-related models and relationships
* Core route groups
* Basic policies/middleware alignment
* Service/action structure
* Audit log foundation if planned
* No candidate exam UI yet unless needed for route verification

After Phase 1, run relevant validation/build commands.

Verify:

* Migrations are valid
* Routes are valid
* Models load correctly
* Existing dashboard routes are not broken
* No unrelated module was modified unnecessarily

If stable, proceed to Phase 2.

---

### Phase 2 — Admin Exam Management and Excel Import

Build admin-facing exam management.

Expected output:

* Admin exam overview/control center
* Subject/category/package/session management
* Excel question import
* Import validation
* Import failure report
* Question preview/list
* Import documentation or template notes

Security requirements:

* Admin-only import
* File validation
* Row-by-row validation
* No technical error details shown to users
* Correct answers visible only to authorized admin contexts

After Phase 2, run relevant validation/build commands.

Verify:

* Admin can access exam management
* Non-admin cannot access it
* Valid Excel import works
* Invalid Excel import reports useful errors
* Existing admin pages still work

If stable, proceed to Phase 3.

---

### Phase 3 — Candidate Exam Access, Attempt Lifecycle, Timer, and Autosave

Build candidate-facing exam flow.

Expected output:

* Candidate exam entry page
* Exam instruction/start page
* Attempt start logic
* Server-side `started_at` and `expires_at`
* Server-authoritative timer enforcement
* Exam-taking UI
* Question navigation
* Autosave endpoint
* Autosave UI state
* Submit confirmation
* Expired/auto-submit handling

Security requirements:

* Candidate can only access their own exam/attempt
* Candidate cannot start outside allowed schedule
* Candidate cannot save after expiration
* Candidate cannot save after submission
* Candidate cannot submit twice
* Frontend timer is display only
* Correct answers are never sent to candidate frontend

After Phase 3, run relevant validation/build commands.

Verify:

* Candidate can start an eligible exam
* Candidate can answer questions
* Autosave works
* Timer expiration is enforced by backend
* Submit locks the attempt
* Existing candidate dashboard still works

If stable, proceed to Phase 4.

---

### Phase 4 — Scoring, Results, and Staff/Admin Review

Build scoring and review flow.

Expected output:

* Server-side scoring
* Attempt result calculation
* Pass/fail based on passing score
* Admin result review
* Staff result review only if aligned with existing project policy
* Candidate result state if visibility is enabled or prepared
* Selection/status integration notes

Security requirements:

* Score is never trusted from frontend
* Correct answer comparison happens server-side
* Candidate cannot view unauthorized result details
* Staff/admin access is protected

After Phase 4, run relevant validation/build commands.

Verify:

* Submitted attempt is scored correctly
* Admin can review results
* Unauthorized users cannot review results
* Result data is consistent

If stable, proceed to Phase 5.

---

### Phase 5 — UI Polish, Documentation, Manual Testing, and Self-Audit

Polish the feature and audit it.

Expected output:

* Candidate exam UI polish
* Admin control center polish
* Mobile-first review
* Empty/loading/error states
* Documentation
* Manual test guide
* Final self-audit report

The agent must audit:

* Backend
* Frontend
* Security
* Product flow
* Scope firewall
* Route/menu integration
* Existing feature safety

If a critical or high-risk bug is found, fix it and repeat the audit.

The mission is complete only when there are no known critical or high-risk bugs.

---

### Phase Gate Rules

At the end of every phase, the agent must:

1. Summarize what changed internally
2. Run available build/type/lint/test commands when practical
3. Check for obvious route/build/migration errors
4. Check whether any out-of-scope file was touched
5. Fix critical issues before continuing
6. Continue to the next phase if stable

The agent must stop and report only if:

* A schema decision is impossible without human input
* Existing source code contradicts the directive in a dangerous way
* A required dependency is missing and cannot be safely added
* Build/test failures cannot be resolved safely
* Continuing would require broad out-of-scope rewrites

Otherwise, continue phase by phase until the mission is complete.

---

### Final Report

The final report must be in Indonesian.

It must include:

* Phase summary
* Files created/changed
* Database changes
* Routes added
* How to test manually
* Commands run
* Security notes
* Known limitations
* Out-of-scope files touched, if any
* Self-audit result
* Any unfinished or blocked item

---

## 27. Durable State & Resume Protocol

This mission must be executed with durable state files.

The agent must not rely only on chat/context memory.

At the beginning of every run, before coding or continuing, read these files if they exist:

* `docs-ai/task/selection-online-exam.directive.md`
* `docs-ai/state/selection-current-phase.md`
* `docs-ai/state/selection-progress.md`
* `docs-ai/state/selection-decisions.md`
* `docs-ai/state/selection-known-bugs.md`
* `docs-ai/state/selection-next-actions.md`
* `docs-ai/audit/selection-exam-audit.md`

If the state files do not exist yet, create them before implementation.

The purpose of these files is to make the task resumable after:

* context compaction
* token limit
* usage limit
* terminal restart
* model switch
* next-day continuation
* interrupted session

The state files are not optional.

---

### 27.1 State File Responsibilities

`selection-current-phase.md`

* Stores the active phase
* Stores whether the phase is not started, in progress, blocked, or completed
* Stores the last verified safe checkpoint
* Stores the safe branch/checkpoint where work is expected to continue

`selection-progress.md`

* Tracks what has been completed
* Tracks files created/modified per phase
* Tracks commands that have been run
* Tracks verification status
* Tracks what was verified and what was not verified

`selection-decisions.md`

* Stores final architectural decisions
* Stores schema decisions
* Stores route decisions
* Stores UX/security decisions
* Prevents the agent from re-deciding the same thing differently later

`selection-known-bugs.md`

* Stores bugs found during implementation
* Stores build/test failures
* Stores unresolved risks
* Stores non-critical issues intentionally deferred
* Stores warnings that future runs must not forget

`selection-next-actions.md`

* Stores the next concrete actions
* Must be written so another fresh agent can continue safely
* Must include what to inspect next, what not to touch, and what phase to continue
* Must be updated before stopping if the session is interrupted or the context becomes too large

`selection-exam-audit.md`

* Stores audit results
* Stores phase audit notes
* Stores final self-audit
* Stores security review notes
* Stores out-of-scope file touches, if any

---

### 27.2 Mandatory Update Rule

At the end of each phase, the agent must update:

* current phase
* progress
* decisions, if any were made
* known bugs, if any were found
* next actions
* audit notes

If the agent must stop before completing the full mission, it must update `selection-next-actions.md` so the task can be resumed safely.

If the agent reaches a context limit, usage limit, terminal interruption, or any other stopping point, it must leave the repository in a resumable state.

---

### 27.3 Phase-Based Resume Rule

The agent must execute and resume this mission phase by phase:

1. Phase 0 — Project audit and implementation plan
2. Phase 1 — Database, models, routes skeleton, core domain
3. Phase 2 — Admin exam management and Excel import
4. Phase 3 — Candidate exam UI, attempt lifecycle, timer, autosave
5. Phase 4 — Scoring, results, staff/admin review
6. Phase 5 — UI polish, documentation, manual testing, self-audit

At the beginning of every run, the agent must:

1. Read the main directive
2. Read every durable state file
3. Determine the last completed phase
4. Determine the active phase
5. Inspect `selection-next-actions.md`
6. Inspect `selection-known-bugs.md`
7. Continue from the safest next action

Do not restart from scratch if previous progress exists.

Do not repeat large work unnecessarily.

Do not overwrite previous decisions unless the source code proves they are wrong or dangerous.

---

### 27.4 Scope Safety Checkpoint

At the end of every phase, the agent must inspect the modified file list.

If any out-of-scope file was touched, the agent must document:

* file path
* reason it was touched
* whether the change was necessary
* whether it affected existing behavior
* whether it should be reverted or kept

No opportunistic cleanup.

No unrelated refactor.

No broad dashboard/auth/payment/document/profile/registration rewrite.

If a discovered bug is outside the exam scope, document it instead of fixing it unless it directly blocks the exam feature.

---

### 27.5 Git Safety Rule

This mission must be developed on a dedicated feature branch.

Expected branch:

`feat/online-selection-exam`

Before starting implementation, verify the current branch.

If the branch is not dedicated to this feature, stop and report the issue.

The agent must not merge to `develop` or `main`.

The agent must not delete branches.

The agent must not rewrite git history unless explicitly instructed by the user.

If the implementation becomes unsafe or too messy, the branch can be abandoned by the human user.

---

### 27.6 Human-Readable Resume Standard

Every durable state file must be written for a future agent or human maintainer.

Avoid vague notes like:

* "continue later"
* "fix remaining stuff"
* "some files changed"
* "almost done"

Use concrete notes like:

* "Phase 2 completed: admin import page created, import validation works for missing required columns, but duplicate detection still needs verification."
* "Next action: inspect `routes/web.php`, then add candidate exam routes under the existing candidate dashboard middleware group."
* "Known bug: Vite build fails because `ExamAttemptStatus` type is missing from `resources/js/types/exam.ts`."

The state files must be useful even if the next run starts with a fresh context.

---

### 27.7 Stop Conditions

The agent must stop and report only if:

* A schema decision is impossible without human input
* Existing source code contradicts the directive in a dangerous way
* A required dependency is missing and cannot be safely added
* Build/test failures cannot be resolved safely
* Continuing would require broad out-of-scope rewrites
* The active branch is unsafe
* The project appears to be in demo-mode and implementation would risk a public/testing environment

Before stopping, update:

* `selection-current-phase.md`
* `selection-progress.md`
* `selection-known-bugs.md`
* `selection-next-actions.md`
* `selection-exam-audit.md`

---

### 27.8 Final Completion Rule

The mission is complete only when:

* The feature works end-to-end
* The final report is written in Indonesian
* Durable state files are updated
* Audit notes are complete
* Known limitations are documented
* No critical or high-risk bug remains known
* No unexplained out-of-scope change remains
* Manual testing steps are documented
* Commands run are documented

