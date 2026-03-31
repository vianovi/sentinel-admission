// resources/js/Components/Dashboard/Candidate/DataDiri/TabProgram.tsx

type Program = {
    name:          string;
    quota_zone:    "green" | "yellow" | "red" | "open";
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
    const selectedProgram = wave?.programs.find(p => p.name === programChoice) ?? null;

    if (!wave || wave.programs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl
                                dark:bg-white/[0.05] bg-slate-100
                                border dark:border-white/[0.07] border-black/[0.07]
                                flex items-center justify-center">
                    <i className="fa-solid fa-graduation-cap text-2xl dark:text-slate-600 text-slate-300"></i>
                </div>
                <p className="text-sm dark:text-slate-500 text-slate-400 text-center">
                    Program belum tersedia untuk gelombang ini.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">

            {/* ── Pilihan program ────────────────────────────────────────── */}
            <section>
                <div className="mb-6">
                    <h3 className="text-sm font-semibold dark:text-slate-200 text-slate-700
                                   mb-1 flex items-center gap-2">
                        <i className="fa-solid fa-graduation-cap text-blue-400 text-xs"></i>
                        Pilihan Program
                        <span className="text-red-400 font-normal text-xs">*</span>
                    </h3>
                    <p className="text-xs dark:text-slate-500 text-slate-400">
                        {wave.title} — {wave.academic_year} · Pilih satu program
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {wave.programs.map((prog) => {
                        const isFull     = prog.quota_zone === "red";
                        const isSelected = programChoice === prog.name;

                        return (
                            <button
                                key={prog.name}
                                type="button"
                                disabled={isFull}
                                onClick={() => !isFull && setProgramChoice(prog.name)}
                                className={[
                                    "relative flex flex-col items-center justify-center gap-3 p-5",
                                    "rounded-2xl border-2 text-sm font-semibold",
                                    "transition-all duration-200",
                                    isFull
                                        ? "dark:border-white/[0.05] border-black/[0.05] dark:text-slate-600 text-slate-300 cursor-not-allowed opacity-50"
                                        : isSelected
                                            ? "border-blue-500 dark:bg-blue-500/10 bg-blue-50 dark:text-blue-400 text-blue-600 scale-[1.02]"
                                            : "dark:border-white/[0.10] border-black/[0.10] dark:text-slate-400 text-slate-500 dark:hover:border-blue-500/40 hover:border-blue-300 dark:hover:bg-blue-500/5 hover:bg-blue-50/50 dark:hover:text-slate-200 hover:text-slate-700",
                                ].join(" ")}
                            >
                                {isSelected && (
                                    <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full
                                                     bg-blue-500 flex items-center justify-center">
                                        <i className="fa-solid fa-check text-white text-[9px]"></i>
                                    </span>
                                )}
                                {isFull && (
                                    <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full
                                                     dark:bg-slate-700 bg-slate-200
                                                     flex items-center justify-center">
                                        <i className="fa-solid fa-lock dark:text-slate-500 text-slate-400 text-[9px]"></i>
                                    </span>
                                )}
                                <i className={[
                                    "fa-solid fa-graduation-cap text-2xl",
                                    isFull
                                        ? "dark:text-slate-700 text-slate-300"
                                        : isSelected
                                            ? "dark:text-blue-400 text-blue-500"
                                            : "dark:text-slate-600 text-slate-300",
                                ].join(" ")}></i>
                                <span>{prog.name}</span>
                                {isFull && (
                                    <span className="text-[10px] dark:text-slate-600 text-slate-400 font-normal">
                                        Kuota penuh
                                    </span>
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

                {/* Warning zona kuning */}
                {selectedProgram?.quota_zone === "yellow" && selectedProgram.warning && (
                    <div className="mt-3 flex items-start gap-2.5 rounded-xl
                                    dark:bg-amber-500/5 bg-amber-50
                                    border dark:border-amber-500/20 border-amber-200
                                    px-4 py-3">
                        <i className="fa-solid fa-circle-info dark:text-amber-400/70 text-amber-500 text-xs mt-0.5 shrink-0"></i>
                        <p className="text-[11px] dark:text-amber-300/70 text-amber-700 leading-relaxed">
                            {selectedProgram.warning}
                        </p>
                    </div>
                )}
            </section>

            {/* ── Pilihan jurusan (opsional) ─────────────────────────────── */}
            {wave.majors_enabled && wave.available_majors.length > 0 && (
                <>
                    <div className="border-b dark:border-white/[0.06] border-black/[0.06]"></div>
                    <section>
                        <h3 className="text-sm font-semibold dark:text-slate-200 text-slate-700
                                       mb-1 flex items-center gap-2">
                            <i className="fa-solid fa-book text-blue-400 text-xs"></i>
                            Pilihan Jurusan
                        </h3>
                        <p className="text-xs dark:text-slate-500 text-slate-400 mb-4">
                            Pilih jurusan yang sesuai
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {wave.available_majors.map((major) => {
                                const isSelected = majorChoice === major;
                                return (
                                    <button
                                        key={major}
                                        type="button"
                                        onClick={() => setMajorChoice(major)}
                                        className={[
                                            "relative flex flex-col items-center justify-center gap-3 p-5",
                                            "rounded-2xl border-2 text-sm font-semibold",
                                            "transition-all duration-200",
                                            isSelected
                                                ? "border-blue-500 dark:bg-blue-500/10 bg-blue-50 dark:text-blue-400 text-blue-600 scale-[1.02]"
                                                : "dark:border-white/[0.10] border-black/[0.10] dark:text-slate-400 text-slate-500 dark:hover:border-blue-500/40 hover:border-blue-300 dark:hover:bg-blue-500/5 hover:bg-blue-50/50 dark:hover:text-slate-200 hover:text-slate-700",
                                        ].join(" ")}
                                    >
                                        {isSelected && (
                                            <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full
                                                             bg-blue-500 flex items-center justify-center">
                                                <i className="fa-solid fa-check text-white text-[9px]"></i>
                                            </span>
                                        )}
                                        <i className={[
                                            "fa-solid fa-book text-2xl",
                                            isSelected ? "dark:text-blue-400 text-blue-500" : "dark:text-slate-600 text-slate-300",
                                        ].join(" ")}></i>
                                        <span>{major}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
