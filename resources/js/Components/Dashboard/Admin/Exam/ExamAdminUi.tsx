import { Link } from "@inertiajs/react";
import type { ReactNode } from "react";

export const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white";

export const labelClass =
    "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";

export function PageHeader({
    title,
    description,
    icon,
    actions,
}: {
    title: string;
    description: string;
    icon: string;
    actions?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white shadow-sm shadow-rose-500/25">
                    <i className={`${icon} text-sm`} />
                </div>
                <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                </div>
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
    );
}

export function StatusPill({ value }: { value: string | null | undefined }) {
    const normalized = (value ?? "-").toString();
    const tone = ["published", "completed", "submitted", "auto_submitted", "eligible"].includes(normalized)
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : ["failed", "closed", "expired", "invalidated", "blocked", "cancelled"].includes(normalized)
            ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
            : ["draft", "pending", "in_progress"].includes(normalized)
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
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-5 py-10 text-center dark:border-white/10 dark:bg-slate-900">
            <i className={`${icon} text-3xl text-slate-300 dark:text-slate-600`} />
            <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
    );
}

export function StatCard({ label, value, icon, tone = "text-rose-500" }: { label: string; value: string | number; icon: string; tone?: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
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
    if (!value) return null;

    const tone = type === "success"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
        : "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-200";

    return <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${tone}`}>{value}</div>;
}

export function BackLink({ href, label = "Kembali" }: { href: string; label?: string }) {
    return (
        <Link href={href} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-200">
            <i className="fa-solid fa-arrow-left text-xs" />
            {label}
        </Link>
    );
}
