// resources/js/Components/Dashboard/Candidate/DataDiri/TabProgram.tsx

type AdmissionWave = {
    title:               string;
    academic_year:       string;
    available_programs:  string[];
    available_majors:    string[];
    majors_enabled:      boolean;
};

type Props = {
    wave:          AdmissionWave | null;
    programChoice: string;
    majorChoice:   string;
    errors:        Record<string, string>;
    setProgramChoice: (v: string) => void;
    setMajorChoice:   (v: string) => void;
};

export default function TabProgram({
    wave, programChoice, majorChoice, errors,
    setProgramChoice, setMajorChoice,
}: Props) {
    if (!wave || wave.available_programs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center">
                    <i className="fa-solid fa-graduation-cap text-2xl text-slate-600"></i>
                </div>
                <p className="text-sm text-slate-500 text-center">Program belum tersedia untuk gelombang ini.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">

            {/* ── Pilihan program ────────────────────────────────────────── */}
            <section>
                <div className="mb-6">
                    <h3 className="text-sm font-display font-bold text-white mb-1 flex items-center gap-2">
                        <i className="fa-solid fa-graduation-cap text-gold text-xs"></i>
                        Pilihan Program <span className="text-red-400 font-normal text-xs">*</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                        {wave.title} — {wave.academic_year} · Pilih satu program
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {wave.available_programs.map((prog) => (
                        <button key={prog} type="button" onClick={() => setProgramChoice(prog)}
                            className={`
                                relative flex flex-col items-center justify-center gap-3 p-5
                                rounded-2xl border-2 text-sm font-semibold
                                transition-all duration-200
                                ${programChoice === prog
                                    ? "border-gold bg-gold/10 text-gold shadow-glow scale-[1.02]"
                                    : "border-white/10 text-slate-400 hover:border-gold/40 hover:bg-gold/5 hover:text-slate-200"
                                }
                            `}
                        >
                            {programChoice === prog && (
                                <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                                    <i className="fa-solid fa-check text-navy text-[9px]"></i>
                                </span>
                            )}
                            <i className={`fa-solid fa-graduation-cap text-2xl ${programChoice === prog ? "text-gold" : "text-slate-600"}`}></i>
                            <span>{prog}</span>
                        </button>
                    ))}
                </div>

                {errors.program_choice && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1 mt-2">
                        <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                        {errors.program_choice}
                    </p>
                )}
            </section>

            {/* ── Pilihan jurusan (opsional) ─────────────────────────────── */}
            {wave.majors_enabled && wave.available_majors.length > 0 && (
                <>
                    <div className="border-t border-white/5"></div>
                    <section>
                        <h3 className="text-sm font-display font-bold text-white mb-1 flex items-center gap-2">
                            <i className="fa-solid fa-book text-gold text-xs"></i>
                            Pilihan Jurusan
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Pilih jurusan yang sesuai</p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {wave.available_majors.map((major) => (
                                <button key={major} type="button" onClick={() => setMajorChoice(major)}
                                    className={`
                                        relative flex flex-col items-center justify-center gap-3 p-5
                                        rounded-2xl border-2 text-sm font-semibold
                                        transition-all duration-200
                                        ${majorChoice === major
                                            ? "border-gold bg-gold/10 text-gold shadow-glow scale-[1.02]"
                                            : "border-white/10 text-slate-400 hover:border-gold/40 hover:bg-gold/5 hover:text-slate-200"
                                        }
                                    `}
                                >
                                    {majorChoice === major && (
                                        <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                                            <i className="fa-solid fa-check text-navy text-[9px]"></i>
                                        </span>
                                    )}
                                    <i className={`fa-solid fa-book text-2xl ${majorChoice === major ? "text-gold" : "text-slate-600"}`}></i>
                                    <span>{major}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
