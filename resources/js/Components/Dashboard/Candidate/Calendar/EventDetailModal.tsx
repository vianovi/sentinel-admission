import { statusLabel, typeTheme } from "@/Components/Dashboard/Candidate/Calendar/constants";
import { CalendarEvent } from "@/Components/Dashboard/Candidate/Calendar/types";
import { formatReadableDate } from "@/Components/Dashboard/Candidate/Calendar/utils";

type Props = {
    event: CalendarEvent;
    onClose: () => void;
};

export default function EventDetailModal({ event, onClose }: Props) {
    const theme = typeTheme[event.type];

    return (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0d1424]">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${theme.pill}`}>
                            <i className={`fa-solid ${theme.icon}`} />
                            {theme.label}
                        </span>
                        <h2 className="mt-3 text-xl font-black text-slate-900 dark:text-white">
                            {event.title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                        aria-label="Tutup detail agenda"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <div className="space-y-3 text-sm">
                    <DetailRow icon="fa-calendar-day" label="Tanggal" value={formatReadableDate(event.start)} />
                    <DetailRow icon="fa-signal" label="Status" value={statusLabel[event.status]} />
                    {event.location && <DetailRow icon="fa-location-dot" label="Lokasi" value={event.location} />}
                    <DetailRow
                        icon="fa-database"
                        label="Sumber"
                        value={event.source === "custom" ? "Agenda pribadi kandidat" : event.source === "admission_wave" ? "Jadwal gelombang SPMB" : "API libur nasional"}
                    />
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Catatan
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        {event.description || "Tidak ada deskripsi tambahan untuk agenda ini."}
                    </p>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex gap-3 rounded-xl bg-slate-50 p-3 dark:bg-white/5">
            <i className={`fa-solid ${icon} mt-0.5 w-4 text-gold`} />
            <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    {label}
                </p>
                <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                    {value}
                </p>
            </div>
        </div>
    );
}
