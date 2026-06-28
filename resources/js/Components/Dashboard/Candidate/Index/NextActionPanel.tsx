import { Link } from "@inertiajs/react";
import { memo } from "react";
import type { NextAction } from "./types";
import { toneClasses } from "./ui";

type Props = {
    action: NextAction;
};

function NextActionPanel({ action }: Props) {
    return (
        <section className="rounded-2xl border border-gold/25 bg-gold/10 p-5 shadow-soft dark:bg-gold/10 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold text-navy">
                        <i className={`${action.icon} text-base`} />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                                Langkah Berikutnya
                            </p>
                            {action.comingSoon && (
                                <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                                    Ringkasan Sementara
                                </span>
                            )}
                        </div>
                        <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                            {action.title}
                        </h2>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {action.description}
                        </p>
                    </div>
                </div>

                <Link
                    href={action.href}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition ${toneClasses[action.tone]}`}
                >
                    <span>{action.label}</span>
                    <i className="fa-solid fa-arrow-right text-xs" />
                </Link>
            </div>
        </section>
    );
}

export default memo(NextActionPanel);
