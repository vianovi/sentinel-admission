import type { StatusTone, VerificationItem } from "./types";
import { tonePillClass } from "./styles";

type Props = {
    items: VerificationItem[];
};

const toneForStatus = (status: VerificationItem["status"]): StatusTone => {
    if (status === "complete") return "success";
    if (status === "rejected") return "danger";
    if (status === "pending_review") return "warning";
    if (status === "locked" || status === "unavailable") return "muted";
    return "neutral";
};

export default function VerificationChecklist({ items }: Props) {
    return (
        <section className="status-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
                    <i className="fa-solid fa-shield-halved text-sm" />
                </div>
                <div>
                    <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Verification Checklist</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ringkasan syarat yang dipakai sistem untuk status verified.</p>
                </div>
            </div>

            <div className="space-y-3">
                {items.map((item) => {
                    const tone = toneForStatus(item.status);

                    return (
                        <div key={item.key} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
                            </div>
                            <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${tonePillClass[tone]}`}>
                                {item.status_label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
