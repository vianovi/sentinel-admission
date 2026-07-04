import { Link } from "@inertiajs/react";
import type { ReviewBlocker } from "./types";
import { toneIconClass } from "./styles";

type Props = {
    blockers: ReviewBlocker[];
};

export default function ReviewBlockers({ blockers }: Props) {
    return (
        <section className="status-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-300">
                    <i className="fa-solid fa-triangle-exclamation text-sm" />
                </div>
                <div>
                    <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Review Blockers / Perlu Tindakan</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Hambatan operasional yang perlu dilihat staff/admin.</p>
                </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                {blockers.map((blocker) => (
                    <div key={blocker.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="flex items-start gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneIconClass[blocker.tone]}`}>
                                <i className={blocker.tone === "success" ? "fa-solid fa-check" : "fa-solid fa-exclamation"} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{blocker.title}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{blocker.description}</p>
                                {blocker.href && (
                                    <Link
                                        href={blocker.href}
                                        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-gold/30 px-3 text-xs font-bold text-amber-700 transition hover:border-gold hover:bg-gold/10 dark:text-gold"
                                    >
                                        Buka sumber
                                        <i className="fa-solid fa-arrow-right text-[10px]" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
