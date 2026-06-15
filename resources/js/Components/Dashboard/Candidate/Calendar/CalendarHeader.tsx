type Props = {
    hideJavaneseCalendar: boolean;
    onToggleJavaneseCalendar: (checked: boolean) => void;
    onOpenAgendaForm: () => void;
};

export default function CalendarHeader({
    hideJavaneseCalendar,
    onToggleJavaneseCalendar,
    onOpenAgendaForm,
}: Props) {
    return (
        <div className="calendar-entrance opacity-0 mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0d1424]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                        <i className="fa-solid fa-calendar-days" />
                        Kalender SPMB
                    </p>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                        Kalender agenda dan tanggal penting
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        Pantau jadwal pendaftaran, deadline, tanggal merah nasional, catatan pribadi, Hijriyah, dan weton Jawa dalam satu tempat.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                        <input
                            type="checkbox"
                            checked={hideJavaneseCalendar}
                            onChange={(event) => onToggleJavaneseCalendar(event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-gold focus:ring-gold"
                        />
                        Sembunyikan Kalender Jawa & Hijriyah
                    </label>
                    <button
                        type="button"
                        onClick={onOpenAgendaForm}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-black text-navy shadow-glow transition hover:bg-goldhover"
                    >
                        <i className="fa-solid fa-plus" />
                        Tambah Agenda
                    </button>
                </div>
            </div>
        </div>
    );
}
