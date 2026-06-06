import type { ReactNode } from "react";

type Tone = "emerald" | "red" | "amber" | "blue";

type BannerAction = {
    label: string;
    icon: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "solid" | "ghost";
};

type Props = {
    tone: Tone;
    icon: string;
    title: string;
    description: ReactNode;
    meta?: string | null;
    actions?: BannerAction[];
    className?: string;
};

const TONE_STYLES: Record<Tone, { wrap: string; icon: string; solid: string; ghost: string; meta: string }> = {
    emerald: {
        wrap: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20",
        icon: "text-emerald-500 dark:text-emerald-300",
        solid: "bg-emerald-600 text-white hover:bg-emerald-500",
        ghost: "border-emerald-200 text-emerald-700 hover:border-emerald-300 dark:border-emerald-500/20 dark:text-emerald-300",
        meta: "text-emerald-700/80 dark:text-emerald-300/80",
    },
    red: {
        wrap: "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20",
        icon: "text-red-500 dark:text-red-300",
        solid: "bg-red-600 text-white hover:bg-red-500",
        ghost: "border-red-200 text-red-700 hover:border-red-300 dark:border-red-500/20 dark:text-red-300",
        meta: "text-red-700/80 dark:text-red-300/80",
    },
    amber: {
        wrap: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20",
        icon: "text-amber-500 dark:text-amber-300",
        solid: "bg-amber-500 text-slate-950 hover:bg-amber-400",
        ghost: "border-amber-200 text-amber-700 hover:border-amber-300 dark:border-amber-500/20 dark:text-amber-300",
        meta: "text-amber-700/80 dark:text-amber-300/80",
    },
    blue: {
        wrap: "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20",
        icon: "text-blue-500 dark:text-blue-300",
        solid: "bg-blue-600 text-white hover:bg-blue-500",
        ghost: "border-blue-200 text-blue-700 hover:border-blue-300 dark:border-blue-500/20 dark:text-blue-300",
        meta: "text-blue-700/80 dark:text-blue-300/80",
    },
};

export default function RequestStatusBanner({
    tone,
    icon,
    title,
    description,
    meta,
    actions = [],
    className = "",
}: Props) {
    const styles = TONE_STYLES[tone];

    return (
        <div className={`rounded-2xl border px-5 py-4 ${styles.wrap} ${className}`.trim()}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/40 bg-white/60 dark:border-white/10 dark:bg-slate-950/30 ${styles.icon}`}>
                        <i className={`${icon} text-sm`} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
                        <div className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {description}
                        </div>
                        {meta && (
                            <p className={`mt-2 text-xs ${styles.meta}`}>
                                {meta}
                            </p>
                        )}
                    </div>
                </div>

                {actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                        {actions.map((action) => {
                            const actionStyle = action.variant === "ghost" ? styles.ghost : styles.solid;

                            return (
                                <button
                                    key={action.label}
                                    type="button"
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${actionStyle}`}
                                >
                                    <i className={`${action.icon} text-xs`} />
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
