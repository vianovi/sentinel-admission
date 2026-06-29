// resources/js/Components/Dashboard/Candidate/DataDiri/TabIdentitas.tsx

import Select                           from "react-select";
import { router }                       from "@inertiajs/react";
import Field, { inputCls, textareaCls } from "@/Components/UI/Field";
import InfoRow                          from "@/Components/UI/InfoRow";
import { makeSelectStyles }             from "@/Components/UI/selectStyles";
import { useTheme }                     from "@/context/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type DataChangeRequest = {
    field: string; old_value: string; new_value: string;
    reason: string; status: "pending" | "approved" | "rejected"; requested_at: string;
} | null;

type Props = {
    candidate: {
        full_name:           string;
        nisn:                string;
        nik:                 string;
        gender_label:        string;
        place_of_birth:      string;
        date_of_birth_label: string;
        has_pending_change:  boolean;
        data_change_request: DataChangeRequest;
    };
    religion:      string;
    phoneNumber:   string;
    email:         string;
    birthCertNo:   string;
    familyCardNo:  string;
    childOrder:    string;
    siblingsCount: string;
    errors:        Record<string, string>;
    showChangeForm:  boolean;
    changeField:     string;
    changeNewValue:  string;
    changeReason:    string;
    crProcessing:    boolean;
    setReligion:       (v: string)  => void;
    setPhoneNumber:    (v: string)  => void;
    setEmail:          (v: string)  => void;
    setBirthCertNo:    (v: string)  => void;
    setFamilyCardNo:   (v: string)  => void;
    setChildOrder:     (v: string)  => void;
    setSiblingsCount:  (v: string)  => void;
    setShowChangeForm: (v: boolean) => void;
    setChangeField:    (v: string)  => void;
    setChangeNewValue: (v: string)  => void;
    setChangeReason:   (v: string)  => void;
    validateField:     (field: string, value: string) => void;
    onChangeRequest:   (e: React.FormEvent) => void;
    formatHP:          (v: string)  => string;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const RELIGION_OPTIONS = ["Islam","Kristen","Katolik","Hindu","Buddha","Konghucu"]
    .map(r => ({ value: r, label: r }));

const FIELD_LABELS: Record<string, string> = {
    full_name:      "Nama Lengkap",
    nisn:           "NISN",
    nik:            "NIK",
    gender:         "Jenis Kelamin",
    place_of_birth: "Tempat Lahir",
    date_of_birth:  "Tanggal Lahir",
    address_detail: "Alamat",
    school_origin:  "Asal Sekolah",
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TabIdentitas({
    candidate,
    religion, phoneNumber, email, birthCertNo, familyCardNo, childOrder, siblingsCount,
    errors,
    showChangeForm, changeField, changeNewValue, changeReason, crProcessing,
    setReligion, setPhoneNumber, setEmail, setBirthCertNo, setFamilyCardNo,
    setChildOrder, setSiblingsCount, setShowChangeForm, setChangeField,
    setChangeNewValue, setChangeReason,
    validateField, onChangeRequest, formatHP,
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

            {/* ── Data kunci read-only ───────────────────────────────────── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-semibold dark:text-slate-200 text-slate-700
                                       flex items-center gap-2">
                            <i className="fa-solid fa-shield text-blue-400 text-xs"></i>
                            Data Identitas Resmi
                        </h3>
                        <p className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
                            Dari pendaftaran awal — tidak bisa diubah langsung
                        </p>
                    </div>
                    <div className="w-7 h-7 rounded-lg
                                    dark:bg-white/[0.05] bg-slate-100
                                    border dark:border-white/[0.07] border-black/[0.07]
                                    flex items-center justify-center">
                        <i className="fa-solid fa-lock dark:text-slate-500 text-slate-400 text-[10px]"></i>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 p-5
                                dark:bg-white/[0.02] bg-slate-50
                                rounded-xl border dark:border-white/[0.06] border-black/[0.06]">
                    <InfoRow label="Nama Lengkap"  value={candidate.full_name}           required />
                    <InfoRow label="NISN"          value={candidate.nisn}                required />
                    <InfoRow label="NIK"           value={candidate.nik}                 required />
                    <InfoRow label="Jenis Kelamin" value={candidate.gender_label}        required />
                    <InfoRow label="Tempat Lahir"  value={candidate.place_of_birth}      required />
                    <InfoRow label="Tanggal Lahir" value={candidate.date_of_birth_label} required />
                </div>

                {/* Change request */}
                <div className="mt-3">
                    {candidate.has_pending_change && candidate.data_change_request ? (
                        <div className="flex flex-col gap-2 p-3.5
                                        dark:bg-amber-500/10 bg-amber-50
                                        border dark:border-amber-500/20 border-amber-200
                                        rounded-xl">
                            <div className="flex items-start gap-2.5">
                                <i className="fa-solid fa-clock text-amber-400 mt-0.5 shrink-0 text-xs"></i>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold dark:text-amber-300 text-amber-700">
                                        Pengajuan menunggu persetujuan staff
                                    </p>
                                    <p className="text-[11px] dark:text-amber-400/70 text-amber-600/80 mt-0.5">
                                        <span className="font-medium">
                                            {FIELD_LABELS[candidate.data_change_request.field]}
                                        </span>
                                        {" "}→ {candidate.data_change_request.new_value}
                                    </p>
                                </div>
                            </div>
                            <button type="button"
                                onClick={() => router.delete(route("dashboard.data-diri.change-request.cancel"))}
                                className="self-start text-[11px] font-semibold
                                           text-red-400 hover:text-red-300
                                           flex items-center gap-1 transition"
                            >
                                <i className="fa-solid fa-xmark text-[10px]"></i>
                                Batalkan pengajuan
                            </button>
                        </div>
                    ) : (
                        <div>
                            <button type="button"
                                onClick={() => setShowChangeForm(!showChangeForm)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl
                                           dark:bg-white/[0.04] bg-slate-100
                                           border dark:border-white/[0.08] border-black/[0.07]
                                           dark:hover:border-blue-500/30 hover:border-blue-300
                                           dark:hover:bg-blue-500/5 hover:bg-blue-50
                                           dark:text-slate-400 text-slate-500
                                           dark:hover:text-blue-400 hover:text-blue-600
                                           text-[11px] font-semibold transition-all duration-200"
                            >
                                <i className={`fa-solid ${showChangeForm ? "fa-chevron-up" : "fa-pen-to-square"} text-[10px]`}></i>
                                {showChangeForm ? "Tutup form pengajuan" : "Ada data yang salah? Ajukan perubahan"}
                            </button>

                            {showChangeForm && (
                                <div className="mt-3 flex flex-col gap-3 p-4
                                                dark:bg-white/[0.02] bg-slate-50
                                                rounded-xl border dark:border-white/[0.06] border-black/[0.06]">
                                    <Field label="Data yang ingin diubah" error={errors.cr_field} required>
                                        <Select
                                            options={Object.entries(FIELD_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                                            value={changeField
                                                ? { value: changeField, label: FIELD_LABELS[changeField] }
                                                : null
                                            }
                                            onChange={opt => setChangeField(opt?.value ?? "")}
                                            placeholder="Pilih data yang ingin diubah..."
                                            isSearchable={false}
                                            {...portalProps(!!errors.cr_field)}
                                        />
                                    </Field>
                                    {changeField && (
                                        <Field label={`Nilai baru untuk ${FIELD_LABELS[changeField]}`}
                                            error={errors.cr_value} required>
                                            <input
                                                value={changeNewValue}
                                                onChange={e => setChangeNewValue(e.target.value)}
                                                placeholder="Masukkan nilai yang benar..."
                                                className={inputCls(errors.cr_value)}
                                            />
                                        </Field>
                                    )}
                                    <Field label="Alasan perubahan" error={errors.cr_reason}
                                        required hint="Minimal 10 karakter">
                                        <textarea
                                            value={changeReason}
                                            onChange={e => setChangeReason(e.target.value)}
                                            rows={2}
                                            placeholder="Contoh: Nama saya salah ketik, seharusnya..."
                                            className={textareaCls(errors.cr_reason)}
                                        />
                                    </Field>
                                    <button type="button"
                                        onClick={onChangeRequest}
                                        disabled={crProcessing}
                                        className="self-start flex items-center gap-2 px-4 py-2 rounded-xl
                                                   text-xs font-semibold transition
                                                   dark:bg-white/[0.05] bg-slate-100
                                                   dark:border dark:border-blue-500/30 border border-blue-200
                                                   dark:text-blue-400 text-blue-600
                                                   dark:hover:border-blue-400 hover:border-blue-400
                                                   disabled:opacity-50 min-h-[44px]"
                                    >
                                        {crProcessing
                                            ? <><i className="fa-solid fa-spinner fa-spin"></i> Mengirim...</>
                                            : <><i className="fa-solid fa-paper-plane"></i> Kirim Pengajuan</>
                                        }
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <div className="border-b dark:border-white/[0.06] border-black/[0.06]"></div>

            {/* ── Data tambahan editable ─────────────────────────────────── */}
            <section>
                <h3 className="text-sm font-semibold dark:text-slate-200 text-slate-700
                               mb-5 flex items-center gap-2">
                    <i className="fa-solid fa-pen-to-square text-blue-400 text-xs"></i>
                    Data Tambahan
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Agama" required>
                        <Select
                            options={RELIGION_OPTIONS}
                            value={RELIGION_OPTIONS.find(o => o.value === religion) ?? null}
                            onChange={opt => setReligion(opt?.value ?? "")}
                            placeholder="Pilih agama..."
                            isSearchable={false}
                            {...portalProps(!!errors.religion)}
                        />
                    </Field>

                    <Field label="Nomor HP/WA Siswa" required error={errors.phone_number}
                        hint="Diawali 08 — +62 dan tanda baca otomatis dihapus">
                        <input
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(formatHP(e.target.value))}
                            onBlur={e => validateField("phone_number", e.target.value)}
                            inputMode="numeric" placeholder="Contoh: 081234567890"
                            className={inputCls(errors.phone_number)}
                        />
                    </Field>

                    <Field label="Email Siswa" error={errors.email} hint="Wajib email Gmail">
                        <input
                            type="email" value={email}
                            onChange={e => setEmail(e.target.value)}
                            onBlur={e => {
                                const v = e.target.value.trim().toLowerCase();
                                setEmail(v);
                                validateField("email", v);
                            }}
                            placeholder="Contoh: nama@gmail.com"
                            className={inputCls(errors.email)}
                        />
                    </Field>

                    <Field label="Nomor Akta Lahir" error={errors.birth_certificate_number}>
                        <input
                            value={birthCertNo}
                            onChange={e => setBirthCertNo(e.target.value)}
                            placeholder="Contoh: 3578-LT-2006-0001"
                            className={inputCls(errors.birth_certificate_number)}
                        />
                    </Field>

                    <Field label="Nomor Kartu Keluarga" required error={errors.family_card_number}
                        hint="16 digit angka sesuai KK">
                        <input
                            value={familyCardNo}
                            onChange={e => setFamilyCardNo(e.target.value.replace(/\D/g, "").slice(0, 16))}
                            onBlur={e => validateField("family_card_number", e.target.value)}
                            inputMode="numeric" placeholder="Contoh: 3578012345678901"
                            className={inputCls(errors.family_card_number)}
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Anak ke-" error={errors.child_order}>
                            <input
                                value={childOrder}
                                onChange={e => setChildOrder(e.target.value.replace(/\D/g, "").slice(0, 2))}
                                inputMode="numeric" placeholder="Contoh: 1"
                                className={inputCls(errors.child_order)}
                            />
                        </Field>
                        <Field label="Jml. Saudara" error={errors.siblings_count}>
                            <input
                                value={siblingsCount}
                                onChange={e => setSiblingsCount(e.target.value.replace(/\D/g, "").slice(0, 2))}
                                inputMode="numeric" placeholder="Contoh: 2"
                                className={inputCls(errors.siblings_count)}
                            />
                        </Field>
                    </div>
                </div>
            </section>
        </div>
    );
}
