import { Link } from "@inertiajs/react";
import { useEffect, type ReactNode } from "react";
import { showSuccessToast, showErrorToast } from "@/utils/swal";

type ExamWorkspaceActive = "packages" | "sessions";

export const cardClass =
    "rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#171f33]";

export const subtleCardClass =
    "rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]";

export const primaryButtonClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-gold px-3 text-sm font-bold text-navy transition hover:bg-goldhover hover:text-white focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 transition hover:border-gold/60 hover:text-gold dark:border-white/10 dark:text-slate-200";

export const dangerButtonClass =
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-red-300 hover:text-red-500 dark:border-white/10 dark:text-slate-200";

export const textLinkClass =
    "text-xs font-bold text-gold transition hover:text-goldhover";

export const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gold focus:ring-2 focus:ring-gold/15 dark:border-white/10 dark:bg-[#060e20] dark:text-white";

export const labelClass =
    "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";

export function PageHeader({
    title,
    badge = "MODUL SELEKSI & UJIAN",
    description,
    icon,
    actions,
}: {
    title: string;
    badge?: string;
    description: string;
    icon: string;
    actions?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 border border-indigo-500/20 shadow-xl">
            <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <i className={icon} /> {badge}
                </div>
                <h1 className="text-xl font-black text-white mt-1">{title}</h1>
                <p className="text-xs text-slate-300 mt-1">{description}</p>
            </div>
            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
    );
}

export function StatusPill({ value }: { value: string | null | undefined }) {
    const normalized = (value ?? "-").toString();
    const tone = ["published", "completed", "submitted", "auto_submitted", "eligible", "aktif", "lulus", "benar"].includes(normalized)
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : ["failed", "closed", "expired", "invalidated", "blocked", "cancelled", "nonaktif", "belum lulus", "salah"].includes(normalized)
            ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
            : ["draft", "pending", "in_progress", "kosong"].includes(normalized)
                ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";

    return (
        <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${tone}`}>
            {normalized.replaceAll("_", " ")}
        </span>
    );
}

export function BooleanPill({ value, trueLabel = "Aktif", falseLabel = "Nonaktif" }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
    return <StatusPill value={value ? trueLabel : falseLabel} />;
}

export function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-5 py-10 text-center dark:border-white/10 dark:bg-[#131b2e]">
            <i className={`${icon} text-3xl text-slate-300 dark:text-slate-600`} />
            <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
    );
}

export function StatCard({ label, value, icon, tone = "text-gold" }: { label: string; value: string | number; icon: string; tone?: string }) {
    return (
        <div className={cardClass}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 dark:bg-white/5">
                    <i className={`${icon} ${tone} text-sm`} />
                </div>
            </div>
        </div>
    );
}

export function FlashMessage({ value, type = "error" }: { value?: string | null; type?: "error" | "success" }) {
    useEffect(() => {
        if (!value) return;
        if (type === "success") {
            showSuccessToast(value);
        } else {
            showErrorToast(value);
        }
    }, [value, type]);

    if (!value) return null;

    const tone = type === "success"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
        : "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-200";

    return (
        <div className={`rounded-xl border px-4 py-3 text-xs font-semibold shadow-md flex items-center justify-between ${tone}`}>
            <div className="flex items-center gap-2">
                <i className={`fa-solid ${type === "success" ? "fa-circle-check text-emerald-400" : "fa-circle-exclamation text-amber-400"} text-sm`} />
                <span>{value}</span>
            </div>
        </div>
    );
}

export function BackLink({ href, label = "Kembali" }: { href: string; label?: string }) {
    return (
        <Link href={href} className={secondaryButtonClass}>
            <i className="fa-solid fa-arrow-left text-xs" />
            {label}
        </Link>
    );
}

export function WorkflowRail({
    items,
}: {
    items: Array<{
        label: string;
        title: string;
        description: string;
        icon: string;
        state?: "done" | "active" | "idle";
    }>;
}) {
    const gridColumns = items.length >= 6
        ? "xl:grid-cols-6"
        : items.length === 5
            ? "xl:grid-cols-5"
            : "xl:grid-cols-4";

    return (
        <section className={cardClass}>
            <div className={`grid gap-3 md:grid-cols-2 ${gridColumns}`}>
                {items.map((item) => {
                    const state = item.state ?? "idle";
                    const tone = state === "done"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : state === "active"
                            ? "border-gold/40 bg-gold/10 text-gold"
                            : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400";

                    return (
                        <article key={item.title} className={`rounded-lg border p-3 ${tone}`}>
                            <div className="flex items-start gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-xs font-black text-slate-900 ring-1 ring-black/5 dark:bg-white/10 dark:text-white">
                                    <i className={`${item.icon} text-xs`} />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-wide opacity-80">{item.label}</p>
                                    <h2 className="mt-1 text-sm font-black text-slate-900 dark:text-white">{item.title}</h2>
                                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.description}</p>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

export function ExamWorkspace({
    children,
}: {
    active: ExamWorkspaceActive;
    packageId?: number;
    sessionId?: number;
    children: ReactNode;
}) {
    return <main className="min-w-0 space-y-5 pb-8">{children}</main>;
}
