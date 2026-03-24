// resources/js/Components/Dashboard/Candidate/DataDiri/TabProgram.tsx

type Program = {
    name:          string;
    quota_zone:    'green' | 'yellow' | 'red' | 'open';
    warning:       string | null;
    is_open_quota: boolean;
};

type AdmissionWave = {
    title:            string;
    academic_year:    string;
    programs:         Program[];
    available_majors: string[];
    majors_enabled:   boolean;
};

type Props = {
    wave:             AdmissionWave | null;
    programChoice:    string;
    majorChoice:      string;
    errors:           Record<string, string>;
    setProgramChoice: (v: string) => void;
    setMajorChoice:   (v: string) => void;
};

export default function TabProgram({
    wave, programChoice, majorChoice, errors,
    setProgramChoice, setMajorChoice,
}: Props) {

    const availablePrograms = wave?.programs.filter(p => p.quota_zone !== 'red') ?? [];
    const selectedProgram   = wave?.programs.find(p => p.name === programChoice) ?? null;

    if (!wave || wave.programs.length === 0) {
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
                    {wave.programs.map((prog) => {
                        const isFull     = prog.quota_zone === 'red';
                        const isSelected = programChoice === prog.name;

                        return (
                            <button
                                key={prog.name}
                                type="button"
                                disabled={isFull}
                                onClick={() => !isFull && setProgramChoice(prog.name)}
                                className={`
                                    relative flex flex-col items-center justify-center gap-3 p-5
                                    rounded-2xl border-2 text-sm font-semibold
                                    transition-all duration-200
                                    ${isFull
                                        ? 'border-white/5 text-slate-600 cursor-not-allowed opacity-50'
                                        : isSelected
                                            ? 'border-gold bg-gold/10 text-gold shadow-glow scale-[1.02]'
                                            : 'border-white/10 text-slate-400 hover:border-gold/40 hover:bg-gold/5 hover:text-slate-200'
                                    }
                                `}
                            >
                                {isSelected && (
                                    <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                                        <i className="fa-solid fa-check text-navy text-[9px]"></i>
                                    </span>
                                )}
                                {isFull && (
                                    <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center">
                                        <i className="fa-solid fa-lock text-slate-500 text-[9px]"></i>
                                    </span>
                                )}
                                <i className={`fa-solid fa-graduation-cap text-2xl ${
                                    isFull ? 'text-slate-700' : isSelected ? 'text-gold' : 'text-slate-600'
                                }`}></i>
                                <span>{prog.name}</span>
                                {isFull && (
                                    <span className="text-[10px] text-slate-600 font-normal">Kuota penuh</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {errors.program_choice && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1 mt-2">
                        <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                        {errors.program_choice}
                    </p>
                )}

                {/* Warning zona kuning — halus, tidak menakutkan */}
                {selectedProgram?.quota_zone === 'yellow' && selectedProgram.warning && (
                    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                        <i className="fa-solid fa-circle-info text-amber-400/70 text-xs mt-0.5 shrink-0"></i>
                        <p className="text-[11px] text-amber-300/70 leading-relaxed">
                            {selectedProgram.warning}
                        </p>
                    </div>
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
                                            ? 'border-gold bg-gold/10 text-gold shadow-glow scale-[1.02]'
                                            : 'border-white/10 text-slate-400 hover:border-gold/40 hover:bg-gold/5 hover:text-slate-200'
                                        }
                                    `}
                                >
                                    {majorChoice === major && (
                                        <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                                            <i className="fa-solid fa-check text-navy text-[9px]"></i>
                                        </span>
                                    )}
                                    <i className={`fa-solid fa-book text-2xl ${majorChoice === major ? 'text-gold' : 'text-slate-600'}`}></i>
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