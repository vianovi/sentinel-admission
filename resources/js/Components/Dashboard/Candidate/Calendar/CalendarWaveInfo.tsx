import { CalendarCandidate } from "@/Components/Dashboard/Candidate/Calendar/types";

type Props = {
    candidate: CalendarCandidate;
};

export default function CalendarWaveInfo({ candidate }: Props) {
    if (!candidate?.admission_wave) {
        return null;
    }

    return (
        <section className="calendar-entrance opacity-0 mb-6 rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4 dark:border-blue-400/15 dark:bg-blue-400/5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                        Gelombang aktif kandidat
                    </p>
                    <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                        {candidate.admission_wave.title} · {candidate.admission_wave.academic_year}
                    </h2>
                </div>
                <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 lg:min-w-[360px]">
                    <InfoLine icon="fa-pen-nib" label="Info tes" value={candidate.admission_wave.exam_info ?? "Belum ada info tes tertanggal."} />
                    <InfoLine icon="fa-bullhorn" label="Pengumuman" value={candidate.admission_wave.announcement_info ?? "Belum ada info pengumuman tertanggal."} />
                </div>
            </div>
        </section>
    );
}

function InfoLine({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex gap-3 rounded-xl bg-white/70 p-3 dark:bg-white/5">
            <i className={`fa-solid ${icon} mt-1 text-blue-600 dark:text-blue-300`} />
            <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    {label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    {value}
                </p>
            </div>
        </div>
    );
}
