// resources/js/Components/Dashboard/Candidate/DataKesehatan/TabRiwayat.tsx

import { useEffect }          from "react";
import { animate, stagger }   from "animejs";
import Field, { textareaCls } from "@/Components/UI/Field";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    majorIllnesses:   string; setMajorIllnesses:   (v: string) => void;
    lastIllness:      string; setLastIllness:       (v: string) => void;
    allergyFood:      string; setAllergyFood:       (v: string) => void;
    allergyMedicine:  string; setAllergyMedicine:   (v: string) => void;
    allergyCondition: string; setAllergyCondition:  (v: string) => void;
    physicalDisab:    string; setPhysicalDisab:     (v: string) => void;
    chronicDocUrl:    string | null;
    errors:           Record<string, string>;
    clearError:       (field: string) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TabRiwayat({
    majorIllnesses, setMajorIllnesses,
    lastIllness,    setLastIllness,
    allergyFood,    setAllergyFood,
    allergyMedicine,  setAllergyMedicine,
    allergyCondition, setAllergyCondition,
    physicalDisab,    setPhysicalDisab,
    chronicDocUrl,
    errors,
    clearError,
}: Props) {

    useEffect(() => {
        animate(".riwayat-section", {
            opacity:    [0, 1],
            translateY: [12, 0],
            duration:   450,
            delay:      stagger(80),
            ease:       "outExpo",
        });
    }, []);

    return (
        <div className="flex flex-col gap-8">

            {/* ── Penyakit & Sakit Terakhir ─────────────────────────────── */}
            <section className="riwayat-section opacity-0">
                <h3 className="text-sm font-display font-bold dark:text-white text-slate-800
                                flex items-center gap-2 mb-1">
                    <i className="fa-solid fa-file-medical text-cyan-400 text-xs"></i>
                    Riwayat Penyakit
                </h3>
                <p className="text-xs dark:text-slate-500 text-slate-400 mb-5">
                    Tulis <strong className="dark:text-slate-300 text-slate-600">"Tidak Ada"</strong> jika tidak memiliki riwayat
                </p>

                <div className="flex flex-col gap-5">
                    <Field label="Penyakit Berat Pernah Diderita" error={errors.major_illnesses}
                        required hint="Contoh: Asma, Jantung, Diabetes — atau tulis Tidak Ada">
                        <textarea
                            value={majorIllnesses}
                            onChange={e => {
                                setMajorIllnesses(e.target.value);
                                if (e.target.value) clearError("major_illnesses");
                            }}
                            rows={3}
                            placeholder="Tulis 'Tidak Ada' jika tidak ada riwayat penyakit berat..."
                            className={textareaCls(errors.major_illnesses)}
                        />
                    </Field>

                    <Field label="Sakit Terakhir yang Dialami" error={errors.last_illness}
                        required hint="Sakit bukan demam biasa — contoh: DBD, Typhus, Pneumonia">
                        <textarea
                            value={lastIllness}
                            onChange={e => {
                                setLastIllness(e.target.value);
                                if (e.target.value) clearError("last_illness");
                            }}
                            rows={3}
                            placeholder="Contoh: Typhus pada Januari 2024, dirawat 5 hari..."
                            className={textareaCls(errors.last_illness)}
                        />
                    </Field>
                </div>
            </section>

            <div className="border-t dark:border-white/[0.06] border-black/[0.06]"></div>

            {/* ── Alergi ────────────────────────────────────────────────── */}
            <section className="riwayat-section opacity-0">
                <h3 className="text-sm font-display font-bold dark:text-white text-slate-800
                                flex items-center gap-2 mb-1">
                    <i className="fa-solid fa-triangle-exclamation text-cyan-400 text-xs"></i>
                    Alergi
                </h3>
                <p className="text-xs dark:text-slate-500 text-slate-400 mb-5">
                    Semua kolom wajib diisi — tulis <strong className="dark:text-slate-300 text-slate-600">"Tidak Ada"</strong> jika tidak alergi
                </p>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5
                                dark:bg-amber-500/[0.08] bg-amber-50
                                border dark:border-amber-500/20 border-amber-200">
                    <i className="fa-solid fa-circle-info text-amber-400 text-xs mt-0.5 shrink-0"></i>
                    <p className="text-[11px] dark:text-amber-300/80 text-amber-700">
                        Informasi alergi <strong>sangat penting</strong> bagi tim kesehatan sekolah
                        — terutama saat keadaan darurat medis.
                    </p>
                </div>

                <div className="flex flex-col gap-5">
                    <Field label="Alergi Makanan" error={errors.allergy_food} required
                        hint="Contoh: Seafood, Kacang, Susu — atau tulis Tidak Ada">
                        <textarea
                            value={allergyFood}
                            onChange={e => {
                                setAllergyFood(e.target.value);
                                if (e.target.value) clearError("allergy_food");
                            }}
                            rows={2}
                            placeholder="Tulis 'Tidak Ada' jika tidak memiliki alergi makanan..."
                            className={textareaCls(errors.allergy_food)}
                        />
                    </Field>

                    <Field label="Alergi Obat" error={errors.allergy_medicine} required
                        hint="Contoh: Penisilin, Ibuprofen, Amoksisilin — atau tulis Tidak Ada">
                        <textarea
                            value={allergyMedicine}
                            onChange={e => {
                                setAllergyMedicine(e.target.value);
                                if (e.target.value) clearError("allergy_medicine");
                            }}
                            rows={2}
                            placeholder="Tulis 'Tidak Ada' jika tidak memiliki alergi obat..."
                            className={textareaCls(errors.allergy_medicine)}
                        />
                    </Field>

                    <Field label="Alergi Kondisi / Lingkungan" error={errors.allergy_condition} required
                        hint="Contoh: Debu, Dingin berlebih, Serbuk sari — atau tulis Tidak Ada">
                        <textarea
                            value={allergyCondition}
                            onChange={e => {
                                setAllergyCondition(e.target.value);
                                if (e.target.value) clearError("allergy_condition");
                            }}
                            rows={2}
                            placeholder="Tulis 'Tidak Ada' jika tidak memiliki alergi kondisi..."
                            className={textareaCls(errors.allergy_condition)}
                        />
                    </Field>
                </div>
            </section>

            <div className="border-t dark:border-white/[0.06] border-black/[0.06]"></div>

            {/* ── Disabilitas & Hasil Lab ───────────────────────────────── */}
            <section className="riwayat-section opacity-0">
                <h3 className="text-sm font-display font-bold dark:text-white text-slate-800
                                flex items-center gap-2 mb-5">
                    <i className="fa-solid fa-wheelchair text-cyan-400 text-xs"></i>
                    Kondisi Fisik Khusus
                </h3>

                <div className="flex flex-col gap-5">
                    <Field label="Disabilitas Fisik / Kebutuhan Khusus" error={errors.physical_disabilities}
                        required hint="Contoh: Tunarungu ringan, Penggunaan kursi roda — atau tulis Tidak Ada">
                        <textarea
                            value={physicalDisab}
                            onChange={e => {
                                setPhysicalDisab(e.target.value);
                                if (e.target.value) clearError("physical_disabilities");
                            }}
                            rows={3}
                            placeholder="Tulis 'Tidak Ada' jika tidak ada disabilitas fisik..."
                            className={textareaCls(errors.physical_disabilities)}
                        />
                    </Field>

                    <div>
                        <p className="text-xs font-semibold dark:text-slate-400 text-slate-600 mb-2">
                            Dokumen Hasil Lab / CT Scan / USG
                            <span className="ml-1.5 text-[10px] font-normal dark:text-slate-500 text-slate-400">
                                (opsional)
                            </span>
                        </p>
                        {chronicDocUrl ? (
                            <div className="flex items-center gap-3 p-3.5 rounded-xl
                                            dark:bg-cyan-500/10 bg-cyan-50
                                            border dark:border-cyan-500/20 border-cyan-200">
                                <i className="fa-solid fa-file-waveform text-cyan-400 text-sm shrink-0"></i>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium dark:text-cyan-300 text-cyan-700">
                                        Dokumen sudah diunggah
                                    </p>
                                </div>
                                <a href={chronicDocUrl} target="_blank" rel="noreferrer"
                                    className="text-xs font-semibold dark:text-cyan-400 text-cyan-600 hover:underline shrink-0">
                                    Lihat →
                                </a>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3.5 rounded-xl
                                            dark:bg-white/[0.02] bg-slate-50
                                            border border-dashed dark:border-slate-700 border-slate-200">
                                <i className="fa-solid fa-file-waveform dark:text-slate-600 text-slate-300 text-sm shrink-0"></i>
                                <p className="text-xs dark:text-slate-500 text-slate-400">
                                    Upload hasil lab dapat dilakukan di tab{" "}
                                    <strong className="dark:text-slate-300 text-slate-600">Catatan Khusus</strong>
                                    {" "}— opsional, hanya jika ada penyakit kronis
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

        </div>
    );
}