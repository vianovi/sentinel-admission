// resources/js/Components/Dashboard/Candidate/DataDiri/TabAlamat.tsx

import Field, { inputCls } from "@/Components/UI/Field";
import InfoRow              from "@/Components/UI/InfoRow";

type AddressDetail = {
    jalan: string; rt: string; rw: string;
    kelurahan: string; kecamatan: string; kabupaten: string; provinsi: string;
};

type Props = {
    candidate: {
        address_full:   string;
        address_detail: AddressDetail | null;
        school_origin:  string;
    };
    postalCode: string;
    schoolNpsn: string;
    certNumber: string;
    errors:     Record<string, string>;
    setPostalCode:  (v: string) => void;
    setSchoolNpsn:  (v: string) => void;
    setCertNumber:  (v: string) => void;
    validateField:  (field: string, value: string) => void;
};

export default function TabAlamat({
    candidate, postalCode, schoolNpsn, certNumber, errors,
    setPostalCode, setSchoolNpsn, setCertNumber, validateField,
}: Props) {
    return (
        <div className="flex flex-col gap-8">

            {/* ── Alamat domisili ────────────────────────────────────────── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
                            <i className="fa-solid fa-location-dot text-gold text-xs"></i>
                            Alamat Domisili
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Dari pendaftaran awal</p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center">
                        <i className="fa-solid fa-lock text-slate-500 text-[10px]"></i>
                    </div>
                </div>

                <div className="p-4 bg-slate-800/40 rounded-xl border border-white/5 mb-4">
                    <InfoRow label="Alamat Lengkap" value={candidate.address_full} />
                    {candidate.address_detail && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5">
                            <InfoRow label="RT/RW"     value={`${candidate.address_detail.rt}/${candidate.address_detail.rw}`} />
                            <InfoRow label="Kelurahan" value={candidate.address_detail.kelurahan} />
                            <InfoRow label="Kecamatan" value={candidate.address_detail.kecamatan} />
                            <InfoRow label="Kabupaten" value={candidate.address_detail.kabupaten} />
                            <InfoRow label="Provinsi"  value={candidate.address_detail.provinsi} />
                        </div>
                    )}
                </div>

                <Field label="Kode Pos" error={errors.postal_code} hint="5 digit angka">
                    <input value={postalCode}
                        onChange={e => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                        onBlur={e => validateField("postal_code", e.target.value)}
                        inputMode="numeric" placeholder="Contoh: 50231"
                        className={inputCls(errors.postal_code)} />
                </Field>
            </section>

            <div className="border-t border-white/5"></div>

            {/* ── Riwayat pendidikan ─────────────────────────────────────── */}
            <section>
                <h3 className="text-sm font-display font-bold text-white mb-5 flex items-center gap-2">
                    <i className="fa-solid fa-school text-gold text-xs"></i>
                    Riwayat Pendidikan
                </h3>

                <div className="p-4 bg-slate-800/40 rounded-xl border border-white/5 mb-4">
                    <InfoRow label="Nama Sekolah Asal" value={candidate.school_origin} required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="NPSN Sekolah" error={errors.school_npsn}
                        hint="8 digit — cek di referensi.data.kemdikbud.go.id">
                        <input value={schoolNpsn}
                            onChange={e => setSchoolNpsn(e.target.value.replace(/\D/g, "").slice(0, 8))}
                            onBlur={e => validateField("school_npsn", e.target.value)}
                            inputMode="numeric" placeholder="Contoh: 20337710"
                            className={inputCls(errors.school_npsn)} />
                    </Field>
                    <Field label="Nomor Ijazah" error={errors.certificate_number}
                        hint="Bisa disusulkan setelah lulus">
                        <input value={certNumber} onChange={e => setCertNumber(e.target.value)}
                            placeholder="Contoh: DN-03 Ma 0011234"
                            className={inputCls(errors.certificate_number)} />
                    </Field>
                </div>
            </section>
        </div>
    );
}
