import { statusLabel, typeTheme } from "@/Components/Dashboard/Candidate/Calendar/constants";
import { CalendarEvent } from "@/Components/Dashboard/Candidate/Calendar/types";
import { formatReadableDate } from "@/Components/Dashboard/Candidate/Calendar/utils";

type Props = {
    upcomingEvents: CalendarEvent[];
    onSelectEvent: (event: CalendarEvent) => void;
};

export default function CalendarSidebar({ upcomingEvents, onSelectEvent }: Props) {
    return (
        <aside className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1424]">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">
                    <i className="fa-solid fa-clock text-gold" />
                    Agenda Terdekat
                </h2>

                {upcomingEvents.length === 0 ? (
                    <EmptyState text="Belum ada agenda terdekat di rentang kalender ini." />
                ) : (
                    <div className="space-y-3">
                        {upcomingEvents.map((event) => (
                            <button
                                key={event.id}
                                type="button"
                                onClick={() => onSelectEvent(event)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-gold/40 hover:bg-gold/5 dark:border-white/10 dark:bg-white/5 dark:hover:border-gold/40"
                            >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-black ${typeTheme[event.type].pill}`}>
                                        <i className={`fa-solid ${typeTheme[event.type].icon}`} />
                                        {typeTheme[event.type].label}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                        {formatReadableDate(event.start)}
                                    </span>
                                </div>
                                <p className="line-clamp-2 text-sm font-black text-slate-900 dark:text-white">
                                    {event.title}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {statusLabel[event.status]}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1424]">
                <h2 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">
                    Legenda
                </h2>
                <div className="grid gap-2">
                    {Object.entries(typeTheme).map(([key, theme]) => (
                        <div key={key} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                            {theme.label}
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {text}
        </div>
    );
}
