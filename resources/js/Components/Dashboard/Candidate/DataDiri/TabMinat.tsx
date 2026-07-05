// resources/js/Components/Dashboard/Candidate/DataDiri/TabMinat.tsx

import Select                           from "react-select";
import Field, { inputCls, textareaCls } from "@/Components/UI/Field";
import { makeSelectStyles }             from "@/Components/UI/selectStyles";
import { useTheme }                     from "@/context/ThemeContext";

type SelectOption = {
    value: string;
    label: string;
};

type Props = {
    hobbies:      string;
    ambitions:    string;
    habits:       string;
    extracts:     string[];
    extracurricularOptions: SelectOption[];
    setHobbies:   (v: string)   => void;
    setAmbitions: (v: string)   => void;
    setHabits:    (v: string)   => void;
    setExtracts:  (v: string[]) => void;
};

export default function TabMinat({
    hobbies, ambitions, habits, extracts,
    extracurricularOptions,
    setHobbies, setAmbitions, setHabits, setExtracts,
}: Props) {
    // isDark harus dari dalam komponen — tidak bisa module level
    const { theme } = useTheme();
    const isDark    = theme === "dark";

    const portalProps = (hasError = false) => ({
        styles:           makeSelectStyles(hasError, isDark),
        menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
        menuPosition:     "fixed"  as const,
        menuPlacement:    "auto"   as const,
    });

    return (
        <div className="flex flex-col gap-8">

            {/* ── Hobi & Minat ──────────────────────────────────────────── */}
            <section>
                <h3 className="text-sm font-semibold dark:text-slate-200 text-slate-700
                               mb-1 flex items-center gap-2">
                    <i className="fa-solid fa-star text-blue-400 text-xs"></i>
                    Hobi, Minat &amp; Bakat
                </h3>
                <p className="text-xs dark:text-slate-500 text-slate-400 mb-5">
                    Data ini membantu sekolah mengenal kamu lebih baik
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Hobi / Minat Bakat" hint="Pisahkan dengan koma">
                        <input
                            value={hobbies}
                            onChange={e => setHobbies(e.target.value)}
                            placeholder="Contoh: Membaca, Futsal, Menggambar"
                            className={inputCls()}
                        />
                    </Field>

                    <Field label="Cita-cita" hint="Apa yang ingin kamu capai?">
                        <input
                            value={ambitions}
                            onChange={e => setAmbitions(e.target.value)}
                            placeholder="Contoh: Dokter, Insinyur, Pengusaha"
                            className={inputCls()}
                        />
                    </Field>

                    <Field label="Kebiasaan Positif" hint="Kebiasaan baik sehari-hari"
                        className="sm:col-span-2">
                        <textarea
                            value={habits}
                            onChange={e => setHabits(e.target.value)}
                            rows={3}
                            placeholder="Contoh: Bangun pagi, membaca setiap malam, olahraga rutin..."
                            className={textareaCls()}
                        />
                    </Field>
                </div>
            </section>

            <div className="border-b dark:border-white/[0.06] border-black/[0.06]"></div>

            {/* ── Ekstrakulikuler ───────────────────────────────────────── */}
            <section>
                <h3 className="text-sm font-semibold dark:text-slate-200 text-slate-700
                               mb-1 flex items-center gap-2">
                    <i className="fa-solid fa-people-group text-blue-400 text-xs"></i>
                    Minat Ekstrakulikuler
                </h3>
                <p className="text-xs dark:text-slate-500 text-slate-400 mb-4">
                    Pilih ekstrakulikuler yang diminati (bisa lebih dari satu)
                </p>

                <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.03] p-3">
                    <Select
                        isMulti
                        options={extracurricularOptions}
                        value={extracurricularOptions.filter(o => extracts.includes(o.value))}
                        onChange={opts => setExtracts(opts ? opts.map(o => o.value) : [])}
                        placeholder="Cari dan pilih ekstrakurikuler..."
                        noOptionsMessage={() => "Tidak ada pilihan aktif"}
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                        maxMenuHeight={260}
                        {...portalProps()}
                    />

                    {extracts.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {extracts.map(item => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setExtracts(extracts.filter(selected => selected !== item))}
                                    className="inline-flex min-h-9 items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 text-xs font-semibold text-blue-600 transition hover:border-blue-400 hover:bg-blue-500/15 dark:text-blue-300"
                                >
                                    {item}
                                    <i className="fa-solid fa-xmark text-[10px]" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <p className="text-[11px] dark:text-slate-500 text-slate-400 mt-2">
                    Pilihan mengikuti daftar aktif dari admin. Tidak ada di daftar? Tulis di kolom Hobi / Minat Bakat di atas.
                </p>
            </section>
        </div>
    );
}
