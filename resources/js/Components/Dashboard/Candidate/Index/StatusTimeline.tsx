import { Link } from "@inertiajs/react";
import { memo } from "react";
import type { StatusSummary, TimelineStep } from "./types";

type Props = {
    status: StatusSummary;
};

const stepClasses: Record<TimelineStep["state"], string> = {
    complete: "bg-emerald-500 text-white border-emerald-500",
    current: "bg-gold text-navy border-gold",
    warning: "bg-red-500 text-white border-red-500",
    upcoming: "bg-white text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-white/[0.08]",
};

function StatusTimeline({ status }: Props) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Status Kandidat
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {status.current_label}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Timeline ini adalah ringkasan di dashboard sampai halaman status khusus tersedia.
                    </p>
                </div>
                <Link
                    href="/dashboard/status"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-gold/50 hover:text-gold dark:border-white/[0.08] dark:text-slate-200"
                >
                    <span>Status</span>
                    <i className="fa-solid fa-arrow-right text-xs" />
                </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {status.timeline.map((step, index) => (
                    <div key={step.key} className="relative flex gap-3 sm:block">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${stepClasses[step.state]}`}>
                            {step.state === "complete" ? <i className="fa-solid fa-check" /> : index + 1}
                        </div>
                        <div className="min-w-0 sm:mt-3">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{step.label}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {step.state === "complete" && "Selesai"}
                                {step.state === "current" && "Sedang berjalan"}
                                {step.state === "warning" && "Perlu perhatian"}
                                {step.state === "upcoming" && "Menunggu tahap sebelumnya"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default memo(StatusTimeline);
