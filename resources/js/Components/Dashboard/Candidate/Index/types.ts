export type SectionState = "complete" | "warning" | "incomplete";

export type ActionTone = "primary" | "warning" | "danger" | "neutral";

export type AdmissionWave = {
    title: string;
    academic_year: string | null;
    end_date: string | null;
} | null;

export type DashboardIdentity = {
    full_name: string;
    candidate_code: string | null;
    registration_code: string | null;
    status: string;
    status_label: string;
    admission_wave: AdmissionWave;
    program_choice: string | null;
    major_choice: string | null;
    email: string;
    phone_number: string | null;
    nisn: string | null;
    school_origin: string | null;
};

export type ProgressSection = {
    key: string;
    label: string;
    icon: string;
    href: string;
    percentage: number;
    state: SectionState;
    missing: string[];
    coming_soon: boolean;
};

export type DashboardProgress = {
    overall_percentage: number;
    completed_sections: number;
    total_sections: number;
    sections: ProgressSection[];
};

export type NextAction = {
    title: string;
    description: string;
    href: string;
    label: string;
    icon: string;
    tone: ActionTone;
    comingSoon: boolean;
};

export type DocumentsSummary = {
    total_required: number;
    uploaded_required: number;
    total_uploaded: number;
    pending: number;
    verified: number;
    rejected: number;
    missing_required: number;
    missing_required_labels: string[];
    rejected_labels: string[];
    completion_percentage: number;
    state: SectionState;
};

export type PaymentSummary = {
    exists: boolean;
    status: string;
    status_label: string;
    payment_channel: string | null;
    payment_channel_label: string | null;
    manual_status: string | null;
    manual_status_label: string | null;
    amount: number | null;
    proof_uploaded: boolean;
    verified_at: string | null;
    rejection_reason: string | null;
    completion_percentage: number;
    missing: string[];
    state: SectionState;
};

export type TimelineStep = {
    key: string;
    label: string;
    state: "complete" | "current" | "upcoming" | "warning";
};

export type StatusSummary = {
    current: string;
    current_label: string;
    completion_percentage: number;
    state: SectionState;
    missing: string[];
    timeline: TimelineStep[];
};

export type CandidateDashboardData = {
    identity: DashboardIdentity;
    progress: DashboardProgress;
    next_action: NextAction;
    documents_summary: DocumentsSummary;
    payment_summary: PaymentSummary;
    status_summary: StatusSummary;
};
