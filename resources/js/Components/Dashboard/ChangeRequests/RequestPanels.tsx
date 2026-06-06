import { Link } from "@inertiajs/react";

export type RequestScope = "staff" | "admin";

export type DataRequestItem = {
    candidate_id: number;
    candidate_code: string;
    candidate_name: string;
    candidate_status: string;
    account_email: string | null;
    admission_wave: string | null;
    field: string;
    field_label: string;
    old_value: string;
    new_value: string;
    reason: string;
    requested_at: string;
};

export type EmailRequestItem = {
    candidate_id: number;
    candidate_code: string;
    candidate_name: string;
    candidate_status: string;
    current_email: string;
    pending_email: string;
    admission_wave: string | null;
    requested_at: string;
};

type ThemeTone = {
    badge: string;
    button: string;
    buttonGhost: string;
    icon: string;
    mutedBorder: string;
    mutedSurface: string;
};

type TabButtonProps = {
    active: boolean;
    count: number;
    icon: string;
    label: string;
    onClick: () => void;
    tone: ThemeTone;
};

type StatCardProps = {
    label: string;
    value: number;
    icon: string;
    accent: string;
};

type DataCardProps = {
    item: DataRequestItem;
    scope: RequestScope;
    tone: ThemeTone;
    onApprove: (item: DataRequestItem) => void;
    onReject: (item: DataRequestItem) => void;
};

type EmailCardProps = {
    item: EmailRequestItem;
    scope: RequestScope;
    tone: ThemeTone;
    onApprove: (item: EmailRequestItem) => void;
    onReject: (item: EmailRequestItem) => void;
};

export function StatCard({ label, value, icon, accent }: StatCardProps) {
    return (
        <div className="change-request-card opacity-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-white/5 dark:bg-slate-900">
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accent}`}>
                    <i className={`${icon} text-sm`} />
                </div>
                <div>
                    <p className="text-2xl font-display font-bold leading-none text-slate-800 dark:text-white">
                        {value}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {label}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function TabButton({ active, count, icon, label, onClick, tone }: TabButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "flex min-h-[48px] flex-1 items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                active
                    ? `border-transparent ${tone.button} text-white shadow-lg`
                    : `border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white`,
            ].join(" ")}
        >
            <span className="flex items-center gap-2.5">
                <i className={`${icon} text-sm`} />
                <span className="text-sm font-semibold">{label}</span>
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${active ? "bg-white/15 text-white" : tone.badge}`}>
                {count}
            </span>
        </button>
    );
}

export function EmptyRequestState({ title, description, icon }: { title: string; description: string; icon: string }) {
    return (
        <div className="change-request-block opacity-0 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                <i className={`${icon} text-lg text-slate-400 dark:text-slate-500`} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
        </div>
    );
}

export function DataRequestCard({ item, scope, tone, onApprove, onReject }: DataCardProps) {
    const candidateUrl = scope === "staff" ? `/dashboard/staff/candidates/${item.candidate_id}` : null;

    return (
        <article className="change-request-block opacity-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/5 dark:bg-slate-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${tone.badge}`}>
                            <i className="fa-solid fa-clock mr-1.5 text-[10px]" />
                            Pending
                        </span>
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
                            {item.field_label}
                        </span>
                    </div>
                    <h2 className="mt-3 text-lg font-display font-bold text-slate-800 dark:text-white">
                        {item.candidate_name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.candidate_code}
                        {item.account_email ? ` · ${item.account_email}` : ""}
                        {item.admission_wave ? ` · ${item.admission_wave}` : ""}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                    {candidateUrl && (
                        <Link
                            href={candidateUrl}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                        >
                            <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                            Lihat Kandidat
                        </Link>
                    )}
                    <button
                        type="button"
                        onClick={() => onReject(item)}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                    >
                        <i className="fa-solid fa-ban text-xs" />
                        Tolak
                    </button>
                    <button
                        type="button"
                        onClick={() => onApprove(item)}
                        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition ${tone.buttonGhost}`}
                    >
                        <i className="fa-solid fa-circle-check text-xs" />
                        Setujui
                    </button>
                </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className={`rounded-2xl border p-4 ${tone.mutedBorder} ${tone.mutedSurface}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Nilai Lama
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        {item.old_value || "-"}
                    </p>
                </div>
                <div className={`rounded-2xl border p-4 ${tone.mutedBorder} ${tone.mutedSurface}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Nilai Baru
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        {item.new_value || "-"}
                    </p>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                    Alasan Kandidat
                </p>
                <p className="mt-2 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                    {item.reason}
                </p>
                <p className="mt-3 text-[11px] text-amber-700/80 dark:text-amber-300/80">
                    Diajukan {item.requested_at}
                </p>
            </div>
        </article>
    );
}

export function EmailRequestCard({ item, scope, tone, onApprove, onReject }: EmailCardProps) {
    const candidateUrl = scope === "staff" ? `/dashboard/staff/candidates/${item.candidate_id}` : null;

    return (
        <article className="change-request-block opacity-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/5 dark:bg-slate-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${tone.badge}`}>
                            <i className="fa-solid fa-envelope mr-1.5 text-[10px]" />
                            Pending
                        </span>
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
                            Email Login
                        </span>
                    </div>
                    <h2 className="mt-3 text-lg font-display font-bold text-slate-800 dark:text-white">
                        {item.candidate_name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.candidate_code}
                        {item.admission_wave ? ` · ${item.admission_wave}` : ""}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                    {candidateUrl && (
                        <Link
                            href={candidateUrl}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                        >
                            <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                            Lihat Kandidat
                        </Link>
                    )}
                    <button
                        type="button"
                        onClick={() => onReject(item)}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                    >
                        <i className="fa-solid fa-ban text-xs" />
                        Tolak
                    </button>
                    <button
                        type="button"
                        onClick={() => onApprove(item)}
                        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition ${tone.buttonGhost}`}
                    >
                        <i className="fa-solid fa-circle-check text-xs" />
                        Setujui
                    </button>
                </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className={`rounded-2xl border p-4 ${tone.mutedBorder} ${tone.mutedSurface}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Email Saat Ini
                    </p>
                    <p className="mt-2 break-all text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        {item.current_email}
                    </p>
                </div>
                <div className={`rounded-2xl border p-4 ${tone.mutedBorder} ${tone.mutedSurface}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Email Baru
                    </p>
                    <p className="mt-2 break-all text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        {item.pending_email}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <i className={`fa-solid fa-shield-halved ${tone.icon}`} />
                    Approval staff/admin hanya membuka langkah konfirmasi kandidat. Email login lama tetap aktif sampai kandidat menerapkan email baru sendiri.
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Diajukan {item.requested_at}
                </p>
            </div>
        </article>
    );
}
