export type ViewerRole = "candidate" | "staff" | "admin";

export type StatusTone = "success" | "warning" | "danger" | "primary" | "neutral" | "muted";

export type ChecklistStatus =
    | "complete"
    | "incomplete"
    | "pending_review"
    | "rejected"
    | "unavailable"
    | "locked";

export type StatusAction = {
    title: string;
    description: string;
    href: string | null;
    icon: string;
    tone: StatusTone;
};

export type StatusIdentity = {
    id: number;
    full_name: string;
    candidate_code: string | null;
    registration_code: string | null;
    nisn: string | null;
    email: string | null;
    email_verified: boolean;
    phone_number: string | null;
    program_choice: string | null;
    major_choice: string | null;
    school_origin: string | null;
    is_transfer: boolean;
    admission_wave: {
        title: string;
        academic_year: string;
        start_date: string | null;
        end_date: string | null;
    } | null;
};

export type LifecycleState = {
    current: string;
    label: string;
    tone: StatusTone;
    description: string;
    waiting_side: string;
    waiting_side_label: string;
    waiting_side_description: string;
    updated_at: string | null;
};

export type LifecycleStep = {
    key: string;
    label: string;
    description: string;
    status: "complete" | "current" | "upcoming" | "rejected";
};

export type ChecklistItem = {
    key: string;
    label: string;
    icon: string;
    status: ChecklistStatus;
    status_label: string;
    tone: StatusTone;
    description: string;
    href: string | null;
    last_updated_at: string | null;
    locked_reason: string | null;
};

export type VerificationItem = {
    key: string;
    label: string;
    status: ChecklistStatus;
    status_label: string;
    description: string;
};

export type StatusTimelineItem = {
    key: string;
    title: string;
    description: string;
    date: string | null;
    tone: StatusTone;
};

export type ReviewBlocker = {
    key: string;
    title: string;
    description: string;
    href: string | null;
    tone: StatusTone;
};

export type QuickLink = {
    label: string;
    href: string;
    icon: string;
};

export type SelectionSummary = {
    status: ChecklistStatus;
    label: string;
    assignments_count: number;
    attempts_count: number;
    gate_allowed: boolean;
    locked_reason: string | null;
    latest_assignment: {
        id: number;
        status: string;
        status_label: string;
        session_title: string | null;
        assigned_at: string | null;
    } | null;
    latest_attempt: {
        id: number;
        status: string;
        status_label: string;
        attempt_number: number;
        session_title: string | null;
        submitted_at: string | null;
        score_visible: boolean;
        percentage_score: number | null;
        passing_score: number | null;
        passed: boolean | null;
    } | null;
    last_updated_at: string | null;
};

export type StatusPendaftaranSummary = {
    viewer: {
        role: ViewerRole;
        is_candidate: boolean;
        is_internal: boolean;
    };
    identity: StatusIdentity;
    lifecycle: LifecycleState;
    lifecycle_steps: LifecycleStep[];
    progress: {
        completion_percentage: number;
        verification_percentage: number;
        completed_checklist: number;
        total_checklist: number;
    };
    completion_checklist: ChecklistItem[];
    verification_checklist: VerificationItem[];
    selection_summary: SelectionSummary;
    primary_action: StatusAction | null;
    secondary_actions: StatusAction[];
    timeline: StatusTimelineItem[];
    review_blockers: ReviewBlocker[];
    quick_links: QuickLink[];
    meta: {
        generated_at: string | null;
        source: string;
    };
};
