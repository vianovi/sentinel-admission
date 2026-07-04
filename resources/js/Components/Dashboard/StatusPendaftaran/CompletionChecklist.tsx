import { Link } from "@inertiajs/react";
import type { ChecklistItem } from "./types";
import { toneIconClass, tonePillClass } from "./styles";

type Props = {
    items: ChecklistItem[];
    title?: string;
    description?: string;
};

export default function CompletionChecklist({
    items,
    title = "Checklist Kelengkapan",
    description = "Daftar syarat utama yang menentukan kesiapan pendaftaran.",
}: Props) {
    return (
        <section className="status-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-amber-600 dark:text-gold">
                    <i className="fa-solid fa-list-check text-sm" />
                </div>
                <div>
                    <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">{title}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                    <div key={item.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="flex items-start gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneIconClass[item.tone]}`}>
                                <i className={`${item.icon} text-sm`} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${tonePillClass[item.tone]}`}>
                                        {item.status_label}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
                                {item.last_updated_at && (
                                    <p className="mt-2 text-[11px] font-semibold text-slate-400">Update {item.last_updated_at}</p>
                                )}
                                {item.href && item.status !== "locked" && item.status !== "unavailable" && (
                                    <Link
                                        href={item.href}
                                        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-gold/30 px-3 text-xs font-bold text-amber-700 transition hover:border-gold hover:bg-gold/10 dark:text-gold"
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
