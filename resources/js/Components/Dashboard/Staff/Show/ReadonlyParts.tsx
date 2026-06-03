import type { ReactNode } from "react";

type InfoFieldProps = {
    label: string;
    value?: ReactNode;
    className?: string;
};

type SectionTitleProps = {
    icon: string;
    title: string;
    subtitle?: string;
    tone?: "blue" | "cyan" | "violet" | "amber" | "orange" | "emerald";
};

const toneClass = {
    blue:    "dark:bg-blue-500/10 bg-blue-50 dark:border-blue-500/20 border-blue-200 text-blue-500",
    cyan:    "dark:bg-cyan-500/10 bg-cyan-50 dark:border-cyan-500/20 border-cyan-200 text-cyan-500",
    violet:  "dark:bg-violet-500/10 bg-violet-50 dark:border-violet-500/20 border-violet-200 text-violet-500",
    amber:   "dark:bg-amber-500/10 bg-amber-50 dark:border-amber-500/20 border-amber-200 text-amber-500",
    orange:  "dark:bg-orange-500/10 bg-orange-50 dark:border-orange-500/20 border-orange-200 text-orange-500",
    emerald: "dark:bg-emerald-500/10 bg-emerald-50 dark:border-emerald-500/20 border-emerald-200 text-emerald-500",
};

export function SectionTitle({ icon, title, subtitle, tone = "emerald" }: SectionTitleProps) {
    return (
        <div className="flex items-start gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${toneClass[tone]}`}>
                <i className={`${icon} text-sm`}></i>
            </div>
            <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {title}
                </p>
                {subtitle && (
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}

export function InfoField({ label, value, className = "" }: InfoFieldProps) {
    const empty = value === null || value === undefined || value === "";

    return (
        <div className={`flex flex-col gap-1 rounded-xl border border-black/[0.06] bg-slate-50 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02] ${className}`}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {label}
            </p>
            <div className="min-h-[20px] text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                {empty ? <span className="text-slate-400 dark:text-slate-500">-</span> : value}
            </div>
        </div>
    );
}

export function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
                <i className={`${icon} text-lg text-slate-400`}></i>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                {description}
            </p>
        </div>
    );
}

export function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" | "orange" }) {
    const cls = {
        slate:  "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
        green:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
        amber:  "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
        red:    "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
        blue:   "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
        orange: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${cls[tone]}`}>
            {children}
        </span>
    );
}
