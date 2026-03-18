// resources/js/Components/Dashboard/Candidate/DataDiri/TabMinat.tsx

import Select                    from "react-select";
import Field, { inputCls, textareaCls } from "@/Components/UI/Field";
import { makeSelectStyles }      from "@/Components/UI/selectStyles";

const EXTRACURRICULAR_OPTIONS = [
    "OSIS","Pramuka","PMR (Palang Merah Remaja)","Rohis","Paskibra",
    "Futsal","Basket","Voli","Badminton","Renang","Pencak Silat","Taekwondo",
    "Seni Musik","Seni Tari","Paduan Suara","Teater","Kaligrafi",
    "Karya Ilmiah Remaja (KIR)","Olimpiade Matematika","Olimpiade Sains",
    "Debat Bahasa Indonesia","Debat Bahasa Inggris",
    "Tahfidz Al-Qur'an","Majelis Ta'lim","Robotika","Coding Club",
].map(e => ({ value: e, label: e }));

type Props = {
    hobbies:    string;
    ambitions:  string;
    habits:     string;
    extracts:   string[];
    setHobbies:   (v: string)   => void;
    setAmbitions: (v: string)   => void;
    setHabits:    (v: string)   => void;
    setExtracts:  (v: string[]) => void;
};

export default function TabMinat({
    hobbies, ambitions, habits, extracts,
    setHobbies, setAmbitions, setHabits, setExtracts,
}: Props) {
    return (
        <div className="flex flex-col gap-8">

            {/* ── Hobi & Minat ──────────────────────────────────────────── */}
            <section>
                <h3 className="text-sm font-display font-bold text-white mb-1 flex items-center gap-2">
                    <i className="fa-solid fa-star text-gold text-xs"></i>
                    Hobi, Minat & Bakat
                </h3>
                <p className="text-xs text-slate-500 mb-5">Data ini membantu sekolah mengenal kamu lebih baik</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Hobi / Minat Bakat" hint="Pisahkan dengan koma">
                        <input value={hobbies} onChange={e => setHobbies(e.target.value)}
                            placeholder="Contoh: Membaca, Futsal, Menggambar"
                            className={inputCls()} />
                    </Field>

                    <Field label="Cita-cita" hint="Apa yang ingin kamu capai?">
                        <input value={ambitions} onChange={e => setAmbitions(e.target.value)}
                            placeholder="Contoh: Dokter, Insinyur, Pengusaha"
                            className={inputCls()} />
                    </Field>

                    <Field label="Kebiasaan Positif" hint="Kebiasaan baik sehari-hari" className="sm:col-span-2">
                        <textarea value={habits} onChange={e => setHabits(e.target.value)}
                            rows={3} placeholder="Contoh: Bangun pagi, membaca setiap malam, olahraga rutin..."
                            className={textareaCls()} />
                    </Field>
                </div>
            </section>

            <div className="border-t border-white/5"></div>

            {/* ── Ekstrakulikuler ───────────────────────────────────────── */}
            <section>
                <h3 className="text-sm font-display font-bold text-white mb-1 flex items-center gap-2">
                    <i className="fa-solid fa-people-group text-gold text-xs"></i>
                    Minat Ekstrakulikuler
                </h3>
                <p className="text-xs text-slate-500 mb-4">Pilih ekstrakulikuler yang diminati (bisa lebih dari satu)</p>

                <Select
                    isMulti
                    options={EXTRACURRICULAR_OPTIONS}
                    value={EXTRACURRICULAR_OPTIONS.filter(o => extracts.includes(o.value))}
                    onChange={opts => setExtracts(opts ? opts.map(o => o.value) : [])}
                    placeholder="Pilih atau ketik untuk mencari..."
                    styles={makeSelectStyles(true)}
                    noOptionsMessage={() => "Tidak ditemukan — kamu bisa input manual di Hobi"}
                />
                <p className="text-[11px] text-slate-500 mt-2">
                    Tidak ada di daftar? Tulis di kolom Hobi / Minat Bakat di atas.
                </p>
            </section>
        </div>
    );
}
