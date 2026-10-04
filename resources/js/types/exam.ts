// resources/js/types/exam.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript types for the Online Exam Engine module.
// Used by: Admin, Candidate, Staff, and Public exam pages.
// ─────────────────────────────────────────────────────────────────────────────

// ── Participant / User Identity ──────────────────────────────────────────────

export type ExamParticipant = {
    name: string;
    school?: string | null;
    email: string | null;
    is_guest: boolean;
};

export type ExamCandidate = {
    id: number;
    candidate_code: string | null;
    full_name: string | null;
    nisn: string | null;
    program_choice: string | null;
    status: string | null;
};

// ── Exam Session & Package ───────────────────────────────────────────────────

export type ExamMeta = {
    session_id: number;
    session_title: string | null;
    package_title: string | null;
    subject_name: string | null;
    duration_minutes: number | null;
    passing_score: number | null;
    show_result_to_candidate: boolean;
};

export type ExamPackageDetail = {
    id: number;
    exam_subject_id?: number;
    subject_name: string | null;
    title: string;
    code: string | null;
    description?: string | null;
    duration_minutes: number;
    passing_score: number;
    max_attempts: number;
    status: string;
    questions_count: number;
    sessions_count: number;
    randomize_questions?: boolean;
    randomize_options?: boolean;
    show_result_to_candidate?: boolean;
    created_at?: string;
};

export type ExamSessionPreview = {
    id: number;
    title: string;
    status: string;
    opens_at: string | null;
    closes_at: string | null;
    duration_minutes: number;
};

export type ExamSubject = {
    id: number;
    name: string;
    code: string | null;
    is_active?: boolean;
};

// ── Attempt Lifecycle ────────────────────────────────────────────────────────

export type ExamAttemptState = {
    id: number;
    status: string;
    attempt_number: number;
    started_at: string | null;
    started_at_iso: string | null;
    expires_at: string | null;
    expires_at_iso: string | null;
    submitted_at: string | null;
    remaining_seconds: number;
    is_locked: boolean;
    total_questions: number;
    answered_questions: number;
    blank_questions: number;
    score_visible: boolean;
    percentage_score: number | null;
    passing_score: number | null;
    passed: boolean | null;
    violations_count?: number;
};

export type ExamSaveState = "idle" | "saving" | "saved" | "failed" | "locked";

// ── Questions & Answers ──────────────────────────────────────────────────────

export type ExamQuestion = {
    id: number;
    question_text: string;
    options: Record<string, string | null>;
    point: number;
    difficulty: string;
};

export type ExamQuestionPreview = ExamQuestion & {
    correct_answer: string;
    is_active: boolean;
};

export type ExamAnswerState = {
    question_id: number;
    selected_option: string | null;
    is_marked_for_review: boolean;
    saved_at: string | null;
};

export type ExamSaveResponse = {
    message: string;
    server_time: string;
    attempt: ExamAttemptState;
    answer?: ExamAnswerState;
};

// ── Import Batches ───────────────────────────────────────────────────────────

export type ExamImportPreview = {
    id: number;
    original_filename: string;
    status: string;
    total_rows: number;
    imported_rows: number;
    failed_rows: number;
    active_questions_count?: number;
    created_at: string | null;
};
