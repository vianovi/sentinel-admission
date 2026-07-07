import { Link } from "@inertiajs/react";

export type OperationalTone = "success" | "warning" | "danger" | "primary" | "neutral" | "muted";

export type ReadinessItem = {
    key: string;
    label: string;
    status: string;
    status_label: string;
    tone: OperationalTone | string;
    description?: string | null;
    href?: string | null;
    last_updated_at?: string | null;
};

export type ActionNeeded = {
    key: string;
    label: string;
    description: string;
    tone: OperationalTone | string;
    href?: string | null;
};

const toneClass: Record<OperationalTone, string> = {
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    primary: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    neutral: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
    muted: "border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-500",
};

const statusIcon: Record<string, string> = {
    complete: "fa-solid fa-check",
    pending_review: "fa-solid fa-clock",
    rejected: "fa-solid fa-triangle-exclamation",
    incomplete: "fa-solid fa-minus",
    locked: "fa-solid fa-lock",
    unavailable: "fa-solid fa-circle",
};

function normalizedTone(tone: string): OperationalTone {
    return ["success", "warning", "danger", "primary", "neutral", "muted"].includes(tone)
        ? tone as OperationalTone
        : "neutral";
}

export function LifecycleBadge({ status }: { status: string }) {
    const labels: Record<string, string> = {
        draft: "Draft",
        submitted: "Menunggu Verifikasi",
        verified: "Terverifikasi",
        accepted: "Diterima",
        rejected: "Ditolak",
    };
    const tones: Record<string, OperationalTone> = {
        draft: "neutral",
        submitted: "warning",
        verified: "primary",
        accepted: "success",
        rejected: "danger",
    };

    return (
        <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold ${toneClass[tones[status] ?? "neutral"]}`}>
            {labels[status] ?? status}
        </span>
    );
}

export function ReadinessStrip({ items, compact = false }: { items: ReadinessItem[]; compact?: boolean }) {
    if (!items?.length) {
        return <span className="text-xs text-slate-400">Belum ada ringkasan</span>;
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {items.map((item) => {
                const tone = normalizedTone(String(item.tone));
                const content = (
                    <>
                        <i className={`${statusIcon[item.status] ?? "fa-solid fa-circle"} text-[9px]`} />
                        <span>{compact ? item.label.split(" ")[0] : item.label}</span>
                    </>
                );
                const className = `inline-flex min-h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] font-bold ${toneClass[tone]}`;

                if (item.href) {
                    return (
                        <Link key={item.key} href={item.href} title={`${item.label}: ${item.status_label}`} className={className}>
                            {content}
                        </Link>
                    );
                }

                return (
                    <span key={item.key} title={`${item.label}: ${item.status_label}`} className={className}>
                        {content}
                    </span>
                );
            })}
        </div>
    );
}

export function ActionNeededBadge({ action }: { action?: ActionNeeded | null }) {
    if (!action || action.key === "clear") {
        return (
            <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] font-bold ${toneClass.success}`}>
                <i className="fa-solid fa-check text-[9px]" />
                Aman
            </span>
        );
    }

    const tone = normalizedTone(String(action.tone));

    return (
        <span title={action.description} className={`inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-md border px-2 text-[11px] font-bold ${toneClass[tone]}`}>
            <i className="fa-solid fa-bolt text-[9px]" />
            <span className="truncate">{action.label}</span>
        </span>
    );
}

export function MiniMeter({ label, value }: { label: string; value: number }) {
    const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

    return (
        <div className="min-w-[92px]">
            <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{safeValue}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${safeValue}%` }} />
            </div>
        </div>
    );
}
