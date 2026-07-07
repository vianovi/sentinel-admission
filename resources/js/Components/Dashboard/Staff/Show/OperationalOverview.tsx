import {
    ActionNeededBadge,
    MiniMeter,
    ReadinessStrip,
    type ActionNeeded,
    type ReadinessItem,
} from "@/Components/Dashboard/Staff/Candidates/OperationalBadges";

type QuickLink = {
    label: string;
    href: string;
    icon: string;
};

type TimelineItem = {
    key: string;
    title: string;
    description: string;
    date: string | null;
    tone: string;
};

export type StaffCandidateOverview = {
    identity: {
        id: number;
        full_name: string;
        candidate_code: string;
        nisn: string | null;
        email: string | null;
        phone_number: string | null;
        program_choice: string | null;
        major_choice: string | null;
        school_origin: string | null;
        admission_wave: {
            title: string;
            academic_year: string | null;
        } | null;
    };
    lifecycle: {
        current: string;
        label: string;
        description: string;
        waiting_side_label: string;
        waiting_side_description: string;
        updated_at: string | null;
    };
    progress: {
        completion_percentage: number;
        verification_percentage: number;
        completed_checklist: number;
        total_checklist: number;
    };
    readiness: ReadinessItem[];
    primary_blocker: ActionNeeded;
    quick_links: QuickLink[];
    timeline: TimelineItem[];
};

type Props = {
    overview: StaffCandidateOverview;
};

const lifecycleTone: Record<string, string> = {
    draft: "border-slate-300 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200",
    submitted: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    verified: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    accepted: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    rejected: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
};

export default function OperationalOverview({ overview }: Props) {
    return (
        <section className="staff-show-item opacity-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-bold ${lifecycleTone[overview.lifecycle.current] ?? lifecycleTone.draft}`}>
                            {overview.lifecycle.label}
                        </span>
                        <ActionNeededBadge action={overview.primary_blocker} />
                    </div>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {overview.lifecycle.description}
                    </p>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <Info label="Gelombang" value={overview.identity.admission_wave?.title ?? "-"} />
                        <Info label="Program" value={overview.identity.program_choice ?? "-"} />
                        <Info label="Menunggu Sisi" value={overview.lifecycle.waiting_side_label ?? "-"} />
                    </div>

                    <div className="mt-5">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Readiness</p>
                        <ReadinessStrip items={overview.readiness} />
                    </div>
                </div>

                <div className="grid min-w-[220px] grid-cols-2 gap-3">
                    <MiniMeter label="Data" value={overview.progress.completion_percentage} />
                    <MiniMeter label="Verif" value={overview.progress.verification_percentage} />
                </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5 dark:border-white/10">
                <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Aktivitas Terbaru</p>
                    <div className="mt-3 grid gap-3 lg:grid-cols-3">
                        {overview.timeline.length === 0 ? (
                            <p className="text-xs text-slate-400">Belum ada aktivitas yang bisa ditampilkan.</p>
                        ) : (
                            overview.timeline.slice(0, 3).map((item) => (
                                <div key={item.key} className="rounded-md border border-slate-200 p-3 dark:border-white/10">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
                                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                                        {item.description}
                                    </p>
                                    {item.date && <p className="mt-1 text-[10px] font-semibold text-slate-400">{item.date}</p>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    );
}
