import type { StatusTimelineItem } from "./types";
import { toneIconClass } from "./styles";

type Props = {
    items: StatusTimelineItem[];
};

export default function StatusTimeline({ items }: Props) {
    return (
        <section className="status-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                    <i className="fa-solid fa-clock-rotate-left text-sm" />
                </div>
                <div>
                    <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Riwayat & Catatan Panitia</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Catatan aman yang relevan dengan progres pendaftaran.</p>
                </div>
            </div>

            <div className="space-y-3">
                {items.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Belum ada riwayat penting.</p>
                    </div>
                )}
                {items.map((item) => (
                    <div key={item.key} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneIconClass[item.tone]}`}>
                            <i className="fa-solid fa-circle text-[7px]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
                            {item.date && <p className="mt-2 text-[11px] font-semibold text-slate-400">{item.date}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
