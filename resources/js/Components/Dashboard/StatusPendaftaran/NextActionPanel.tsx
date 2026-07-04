import { Link } from "@inertiajs/react";
import type { StatusAction } from "./types";
import { toneIconClass } from "./styles";

type Props = {
    primaryAction: StatusAction | null;
    secondaryActions: StatusAction[];
};

export default function NextActionPanel({ primaryAction, secondaryActions }: Props) {
    const actions = primaryAction ? [primaryAction, ...secondaryActions] : secondaryActions;

    return (
        <section className="status-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-amber-600 dark:text-gold">
                    <i className="fa-solid fa-bolt text-sm" />
                </div>
                <div>
                    <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Aksi Berikutnya</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Aksi yang paling masuk akal berdasarkan status backend saat ini.</p>
                </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                {actions.map((action) => (
                    <div key={`${action.title}-${action.href ?? "none"}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="flex items-start gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneIconClass[action.tone]}`}>
                                <i className={`${action.icon} text-sm`} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{action.title}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{action.description}</p>
                                {action.href && (
                                    <Link
                                        href={action.href}
                                        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-gold px-3 text-xs font-bold text-navy transition hover:bg-goldhover"
                                    >
                                        Buka
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
