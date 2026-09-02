# Task: Candidate Lifecycle, Document Gate & Exam Readiness Refactor

**Task Code:** `TASK-LIFECYCLE-GATE-EXAM-01`  
**Status:** `READY_FOR_EXECUTION`  
**Created:** `2026-09-02`  
**Reference Discussion:** Alur Pendaftaran Berjenjang (*Sequential Admission Pipeline*) & *Exam Readiness Gate*

---

## 1. Executive Summary & Objective

Refactor the candidate lifecycle, gate services, and UI feedback to implement a clean **sequential pipeline (Document-First, Pay-to-Validate Model)**:
1. **Core Data Completion (`draft` -> `submitted`):** Candidate fills personal, guardian, and health forms. BPJS card is explicitly **optional** and non-blocking.
2. **Document Upload Gate (`submitted`):** Candidate uploads required identification/administrative documents.
3. **Payment Gate Activation:** Once all mandatory documents are uploaded (even before staff verification), the **Payment Gateway / Menu is unlocked**.
4. **Exam Readiness & Gate:**
   - Admin/Staff can assign `submitted` candidates to exam sessions.
   - Candidate can only unlock and begin the exam once **Payment is Verified / Paid** AND they are assigned to an active session.
   - Staff physical/administrative document verification runs concurrently and serves as the final qualification step before final acceptance (`accepted`).

---

## 2. Milestone Breakdown

### Milestone 1: Data Health & BPJS Decoupling
- **Goal:** Make `health.bpjs_card_path` strictly optional across verification evaluators and checklist calculators.
- **Scope & Files:**
  - `app/Services/CandidateStatus/CandidateVerificationEvaluator.php`: Remove `health.bpjs_card_path` from required verification requirements.
  - `app/Services/CandidateVerificationChecklist.php`: Ensure BPJS is marked as optional supplementary data.
  - `app/Services/StatusPendaftaranService.php`: Update percentage calculator so candidates with verified documents & payment reach 100% without BPJS.
- **Verification:** Run `php artisan test --filter CandidateVerification` & `CandidateStatusFlowTest`.

### Milestone 2: Document-to-Payment Sequential Gate
- **Goal:** Unlock the Payment menu based on completion of mandatory document uploads rather than waiting for manual staff approval.
- **Scope & Files:**
  - `app/Services/CandidateStatus/CandidateGateService.php`:
    - Define mandatory uploaded documents (Photo, KK, Akta, Surat Pernyataan + Surat Pindah if transfer).
    - Update `payment()` gate to check `hasUploadedMandatoryDocuments()` while in `submitted` status.
  - `resources/js/Pages/Dashboard/Candidate/Payment.tsx` & `DataDokumen.tsx`:
    - Update UX hints: Show banner/alert on Payment page if locked explaining that mandatory documents must be uploaded first.
- **Verification:** Test payment gate transitions via Pest feature tests.

### Milestone 3: Exam Readiness Gate & Candidate Exam UX
- **Goal:** Prevent 403 blocks for assigned candidates whose payment is confirmed, and provide clear UI readiness feedback.
- **Scope & Files:**
  - `app/Services/CandidateStatus/CandidateGateService.php`:
    - Update `exam()` gate logic: If candidate is `submitted` and assigned to an exam session, allow access if and only if registration payment status is `paid`.
    - Provide human-readable lock reasons if payment is still pending: *"Sesi ujian tersedia, silakan selesaikan pembayaran pendaftaran untuk memulai."*
  - `resources/js/Pages/Dashboard/Candidate/Exam/`:
    - Display Exam Readiness checklist (Formulir Lengkap [✓], Berkas Wajib [✓], Pembayaran Lunas [✓], Sesi Ujian Ditugaskan [✓]).
- **Verification:** Test candidate exam access for paid vs unpaid states.

### Milestone 4: Full Regression, Telescope Profiling & State Checkpoint
- **Goal:** Ensure all 89+ test suites pass, verify no lazy-loading regressions in Telescope, and record durable state.
- **Scope:**
  - Run full test suite: `php artisan test`.
  - Format code with Laravel Pint: `./vendor/bin/pint`.
  - Update `docs/state-aktif/CURRENT.md`, `DECISIONS.md`, and `HANDOFF.md`.

---

## 3. Session Continuity & Documentation Protocol (MANDATORY)

To safeguard against sudden session disconnects or context loss:
1. **Checkpoint Rule:** Every time a milestone is completed or a file is modified:
   - Log progress and changes in `docs/state-aktif/CURRENT.md` and `docs/state-aktif/HANDOFF.md`.
   - Record architectural rulings or rule changes in `docs/state-aktif/DECISIONS.md`.
2. **Never batch without committing state:** Keep working tree clean and preserve test evidence in docs.
3. **Tool Precedence:** Always prioritize Graphify, Context7, and Pest CLI before making speculative assumptions.
