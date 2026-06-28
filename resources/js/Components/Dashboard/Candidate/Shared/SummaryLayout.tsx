import type { ReactNode } from "react";

export type SummaryAccent = "blue" | "cyan" | "violet";

export type SummaryMissingGroup<T extends string> = {
    tab: T;
    label: string;
    fields: { key: string; label: string }[];
};

const accentClasses: Record<SummaryAccent, {
    icon: string;
    text: string;
    button: string;
    soft: string;
    hover: string;
}> = {
    blue: {
        icon: "dark:bg-blue-500/20 bg-blue-50 text-blue-500 dark:text-blue-400",
        text: "dark:text-blue-400 text-blue-600",
        button: "bg-blue-500 hover:bg-blue-400 text-white",
        soft: "dark:bg-blue-500/10 bg-blue-50 dark:border-blue-500/20 border-blue-200",
        hover: "dark:hover:text-blue-400 hover:text-blue-600 dark:hover:bg-blue-500/10 hover:bg-blue-50",
    },
    cyan: {
        icon: "dark:bg-cyan-500/20 bg-cyan-50 text-cyan-500 dark:text-cyan-400",
        text: "dark:text-cyan-400 text-cyan-600",
        button: "bg-cyan-500 hover:bg-cyan-400 text-white",
        soft: "dark:bg-cyan-500/10 bg-cyan-50 dark:border-cyan-500/20 border-cyan-200",
        hover: "dark:hover:text-cyan-400 hover:text-cyan-600 dark:hover:bg-cyan-500/10 hover:bg-cyan-50",
    },
    violet: {
        icon: "dark:bg-violet-500/20 bg-violet-50 text-violet-500 dark:text-violet-400",
        text: "dark:text-violet-400 text-violet-600",
        button: "bg-violet-500 hover:bg-violet-400 text-white",
        soft: "dark:bg-violet-500/10 bg-violet-50 dark:border-violet-500/20 border-violet-200",
        hover: "dark:hover:text-violet-400 hover:text-violet-600 dark:hover:bg-violet-500/10 hover:bg-violet-50",
    },
};

export function summaryProgressGradient(pct: number): string {
    if (pct < 50) return "linear-gradient(to right, #c0392b, #e74c3c)";
    if (pct < 75) return "linear-gradient(to right, #d35400, #f39c12)";
    if (pct < 100) return "linear-gradient(to right, #2980b9, #7aa2f7)";
    return "linear-gradient(to right, #1e8449, #27ae60)";
}

export function SummaryEmptyState({
    accent,
    icon,
    title,
    description,
    actionLabel,
    onAction,
}: {
    accent: SummaryAccent;
    icon: string;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
}) {
    const classes = accentClasses[accent];

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${classes.soft}`}>
                <i className={`${icon} text-2xl ${classes.text}`} />
            </div>
            <div className="max-w-xs text-center">
                <p className="mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    {description}{" "}
                    <button
                        type="button"
                        onClick={onAction}
                        className={`font-semibold hover:underline ${classes.text}`}
                    >
                        {actionLabel}
                    </button>
                </p>
            </div>
        </div>
    );
}

export function SummaryStatus<T extends string>({
    accent,
    completion,
    completeMessage,
    missingGroups,
    onNavigate,
}: {
    accent: SummaryAccent;
    completion: number;
    completeMessage: string;
    missingGroups: SummaryMissingGroup<T>[];
    onNavigate: (tab: T) => void;
}) {
    const classes = accentClasses[accent];
    const missingCount = missingGroups.reduce((total, group) => total + group.fields.length, 0);

    return (
        <div className="summary-card opacity-0 overflow-hidden rounded-xl border border-black/[0.07] bg-white dark:border-white/[0.07] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5 border-b border-black/[0.06] bg-slate-50 px-4 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className={`flex h-5 w-5 items-center justify-center rounded-md ${classes.icon}`}>
                    <i className="fa-solid fa-circle-check text-[10px]" />
                </div>
                <p className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status Kelengkapan
                </p>
                <span className={`text-xs font-bold ${
                    completion === 100 ? classes.text
                        : completion >= 75 ? "dark:text-blue-400 text-blue-600"
                        : completion >= 50 ? "dark:text-amber-400 text-amber-600"
                        : "dark:text-red-400 text-red-600"
                }`}>
                    {completion}%
                </span>
            </div>
            <div className="p-4">
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.05]">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${completion}%`, background: summaryProgressGradient(completion) }}
                    />
                </div>
                {completion === 100 ? (
                    <p className={`flex items-center gap-1.5 text-xs ${classes.text}`}>
                        <i className="fa-solid fa-circle-check text-[11px]" />
                        {completeMessage}
                    </p>
                ) : missingCount === 0 ? (
                    <p className={`flex items-center gap-1.5 text-xs ${classes.text}`}>
                        <i className="fa-solid fa-circle-check text-[11px]" />
                        Field wajib sudah lengkap. Data pendukung masih bisa dilengkapi agar rangkuman lebih kuat.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {missingCount} field wajib belum diisi:
                        </p>
                        {missingGroups.map((group) => (
                            <div key={group.tab} className="flex items-start gap-3">
                                <button
                                    type="button"
                                    onClick={() => onNavigate(group.tab)}
                                    className={`min-h-[28px] shrink-0 rounded-lg border border-black/[0.07] bg-black/[0.05] px-2.5 py-1 text-[10px] font-semibold text-slate-500 transition-all duration-150 dark:border-white/[0.07] dark:bg-white/[0.05] dark:text-slate-400 ${classes.hover}`}
                                >
                                    <i className="fa-solid fa-arrow-right mr-1 text-[9px]" />
                                    {group.label}
                                </button>
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {group.fields.map((field) => (
                                        <span
                                            key={field.key}
                                            className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                                        >
                                            {field.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export function SummaryCard({
    accent,
    icon,
    title,
    onEdit,
    badge,
    children,
}: {
    accent: SummaryAccent;
    icon: string;
    title: string;
    onEdit: () => void;
    badge?: string;
    children: ReactNode;
}) {
    const classes = accentClasses[accent];

    return (
        <div className="summary-card opacity-0 overflow-hidden rounded-xl border border-black/[0.07] bg-white dark:border-white/[0.07] dark:bg-white/[0.02]">
            <div className="flex items-center justify-between border-b border-black/[0.06] bg-slate-50 px-4 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="flex min-w-0 items-center gap-2">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${classes.icon}`}>
                        <i className={`${icon} text-[10px]`} />
                    </div>
                    <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {title}
                    </p>
                    {badge && (
                        <span className="rounded-full border border-black/[0.07] bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-slate-400">
                            {badge}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onEdit}
                    className={`flex min-h-[28px] shrink-0 items-center gap-1 text-[11px] text-slate-400 transition-colors duration-150 dark:text-slate-500 ${classes.hover}`}
                >
                    <i className="fa-solid fa-pen-to-square text-[9px]" />
                    Edit
                </button>
            </div>
            <div>{children}</div>
        </div>
    );
}

export function SummaryRow({
    label,
    value,
    valueClass,
}: {
    label: string;
    value: string | null | undefined;
    valueClass?: string;
}) {
    return (
        <div className="flex items-baseline justify-between gap-3 border-b border-black/[0.04] px-4 py-[7px] last:border-0 dark:border-white/[0.04]">
            <p className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">{label}</p>
            <p className={`min-w-0 break-words text-right text-[12px] font-medium ${valueClass ?? "text-slate-700 dark:text-slate-200"} ${!value ? "font-normal italic text-slate-300 dark:text-slate-600" : ""}`}>
                {value || "-"}
            </p>
        </div>
    );
}

export function SummaryActionFooter({
    accent,
    title,
    description,
    submitting,
    onSubmit,
}: {
    accent: SummaryAccent;
    title: string;
    description: string;
    submitting: boolean;
    onSubmit: () => void;
}) {
    const classes = accentClasses[accent];

    return (
        <div className="summary-card opacity-0 rounded-xl border border-black/[0.07] bg-white p-4 dark:border-white/[0.07] dark:bg-white/[0.02]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{description}</p>
                </div>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={submitting}
                    className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${classes.button}`}
                >
                    {submitting ? (
                        <>
                            <i className="fa-solid fa-spinner fa-spin text-xs" />
                            Mengirim...
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-paper-plane text-xs" />
                            Kirim &amp; Selesaikan
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export function SummaryWarning({ count }: { count: number }) {
    if (count === 0) return null;

    return (
        <div className="summary-card opacity-0 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/[0.08]">
            <i className="fa-solid fa-circle-info mt-0.5 shrink-0 text-xs text-amber-400" />
            <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
                Masih ada <strong>{count} field wajib</strong> yang belum diisi. Klik tab di atas untuk melengkapi data yang kurang.
            </p>
        </div>
    );
}
