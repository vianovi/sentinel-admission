type SummaryCardTone = "blue" | "amber" | "rose" | "slate";

type Props = {
    todayCount: number;
    urgentCount: number;
    holidayCount: number;
    noteCount: number;
};

export default function CalendarSummaryGrid({ todayCount, urgentCount, holidayCount, noteCount }: Props) {
    return (
        <section className="calendar-entrance opacity-0 mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard icon="fa-calendar-day" label="Agenda Hari Ini" value={String(todayCount)} tone="blue" />
            <SummaryCard icon="fa-triangle-exclamation" label="Mendesak" value={String(urgentCount)} tone="amber" />
            <SummaryCard icon="fa-calendar-xmark" label="Tanggal Merah" value={String(holidayCount)} tone="rose" />
            <SummaryCard icon="fa-note-sticky" label="Catatan Pribadi" value={String(noteCount)} tone="slate" />
        </section>
    );
}

function SummaryCard({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: SummaryCardTone }) {
    const toneClass = {
        blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
        amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        slate: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    }[tone];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1424]">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                        {value}
                    </p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClass}`}>
                    <i className={`fa-solid ${icon}`} />
                </span>
            </div>
        </div>
    );
}
