import { Link } from "@inertiajs/react";
import { lazy, memo, Suspense } from "react";
import type { DashboardProgress } from "./types";
import { stateClasses, stateLabel } from "./ui";

const ProgressRing = lazy(() => import("./ProgressRing"));

type Props = {
    progress: DashboardProgress;
};

function ProgressOverview({ progress }: Props) {
    return (
        <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-slate-900 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Progress Pendaftaran
                        </p>
                        <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                            {progress.overall_percentage}% selesai
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {progress.completed_sections} dari {progress.total_sections} area sudah lengkap.
                        </p>
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-center">
                    <div className="relative">
                        <Suspense fallback={<div className="h-32 w-32 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06] sm:h-36 sm:w-36" />}>
                            <ProgressRing value={progress.overall_percentage} />
                        </Suspense>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-slate-900 dark:text-white">{progress.overall_percentage}</span>
                            <span className="text-xs font-semibold text-slate-400">persen</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {progress.sections.map((section) => (
                    <Link
                        key={section.key}
                        href={section.href}
                        className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-gold/40 dark:border-white/[0.08] dark:bg-slate-900"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
                                    <i className={`${section.icon} text-sm`} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                        {section.label}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {section.percentage}% selesai
                                    </p>
                                </div>
                            </div>
                            <span className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-semibold ${stateClasses[section.state]}`}>
                                {stateLabel(section.state)}
                            </span>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                            <div
                                className="h-full rounded-full bg-gold transition-all duration-500"
                                style={{ width: `${section.percentage}%` }}
                            />
                        </div>

                        <div className="mt-3 min-h-[36px]">
                            {section.missing.length > 0 ? (
                                <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    Kurang: {section.missing.join(", ")}
                                </p>
                            ) : (
                                <p className="text-xs leading-5 text-emerald-600 dark:text-emerald-300">
                                    Area ini sudah siap.
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default memo(ProgressOverview);
