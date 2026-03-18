// resources/js/Pages/Dashboard/Candidate/DataDiri.tsx

import { useEffect, useState }   from "react";
import { animate }               from "animejs";
import { Head, router }          from "@inertiajs/react";
import Swal                      from "sweetalert2";
import DashboardSplitLayout      from "@/Layouts/DashboardSplitLayout";
import CandidateSidebar          from "@/Components/Dashboard/Candidate/Shared/CandidateSidebar";
import TabIdentitas               from "@/Components/Dashboard/Candidate/DataDiri/TabIdentitas";
import TabAlamat                 from "@/Components/Dashboard/Candidate/DataDiri/TabAlamat";
import TabMinat                  from "@/Components/Dashboard/Candidate/DataDiri/TabMinat";
import TabProgram                from "@/Components/Dashboard/Candidate/DataDiri/TabProgram";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type AddressDetail = {
    jalan: string; rt: string; rw: string;
    kelurahan: string; kecamatan: string; kabupaten: string; provinsi: string;
};

type DataChangeRequest = {
    field: string; old_value: string; new_value: string;
    reason: string; status: "pending" | "approved" | "rejected"; requested_at: string;
} | null;

type AdmissionWave = {
    title: string; academic_year: string;
    available_programs: string[]; available_majors: string[]; majors_enabled: boolean;
};

type CandidateData = {
    id: number;
    full_name: string; nisn: string; nik: string;
    gender: string; gender_label: string;
    place_of_birth: string; date_of_birth: string; date_of_birth_label: string;
    address_full: string; address_detail: AddressDetail | null;
    school_origin: string;
    email: string | null; phone_number: string | null; religion: string | null;
    child_order: number | null; siblings_count: number | null;
    hobbies: string | null; ambitions: string | null; habits: string | null;
    extracurricular_interests: string[] | null;
    postal_code: string | null; school_npsn: string | null; certificate_number: string | null;
    birth_certificate_number: string | null; family_card_number: string | null;
    program_choice: string | null; major_choice: string | null;
    status: string; has_pending_change: boolean; data_change_request: DataChangeRequest;
    admission_wave: AdmissionWave | null;
};

type UserData = {
    name: string;
    avatar_url: string | null;
    initials: string;
};

type Props = {
    user:      UserData;
    candidate: CandidateData | null;
    flash?:    { success?: string };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
    { id: "identitas", label: "Identitas",       icon: "fa-id-card" },
    { id: "alamat",    label: "Alamat & Sekolah", icon: "fa-map-location-dot" },
    { id: "minat",     label: "Minat & Bakat",    icon: "fa-star" },
    { id: "program",   label: "Program",          icon: "fa-graduation-cap" },
] as const;

type TabId = typeof TABS[number]["id"];

// SweetAlert2 dark theme
const swalDark = Swal.mixin({
    background:         "#0f172a",
    color:              "#e2e8f0",
    confirmButtonColor: "#d4a017",
    cancelButtonColor:  "#334155",
    customClass: {
        confirmButton: "!rounded-xl !font-semibold !px-6",
        cancelButton:  "!rounded-xl !font-semibold !px-6",
        popup:         "!rounded-2xl !border !border-white/10",
        title:         "!text-white !font-display",
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatHP = (val: string): string => {
    let v = val.replace(/\D/g, "");
    if (v.startsWith("62"))   v = "0" + v.slice(2);
    if (v.startsWith("0062")) v = "0" + v.slice(4);
    return v.slice(0, 14);
};

const calcCompletion = (c: CandidateData): number => {
    const checks = [
        !!c.religion, !!c.phone_number, !!c.email,
        !!c.birth_certificate_number, !!c.family_card_number,
        !!c.postal_code, !!c.school_npsn, !!c.program_choice,
        c.child_order !== null, c.siblings_count !== null,
        !!c.hobbies, !!c.ambitions,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DataDiriPage({ user, candidate, flash }: Props) {

    const [activeTab,      setActiveTab]      = useState<TabId>("identitas");
    const [errors,         setErrors]         = useState<Record<string, string>>({});
    const [processing,     setProcessing]     = useState(false);
    const [crProcessing,   setCrProcessing]   = useState(false);
    const [showChangeForm, setShowChangeForm] = useState(false);

    // ── Form state ────────────────────────────────────────────────────────────
    const [religion,      setReligion]      = useState(candidate?.religion ?? "");
    const [phoneNumber,   setPhoneNumber]   = useState(candidate?.phone_number ?? "");
    const [email,         setEmail]         = useState(candidate?.email ?? "");
    const [birthCertNo,   setBirthCertNo]   = useState(candidate?.birth_certificate_number ?? "");
    const [familyCardNo,  setFamilyCardNo]  = useState(candidate?.family_card_number ?? "");
    const [childOrder,    setChildOrder]    = useState(candidate?.child_order?.toString() ?? "");
    const [siblingsCount, setSiblingsCount] = useState(candidate?.siblings_count?.toString() ?? "");
    const [postalCode,    setPostalCode]    = useState(candidate?.postal_code ?? "");
    const [schoolNpsn,    setSchoolNpsn]    = useState(candidate?.school_npsn ?? "");
    const [certNumber,    setCertNumber]    = useState(candidate?.certificate_number ?? "");
    const [hobbies,       setHobbies]       = useState(candidate?.hobbies ?? "");
    const [ambitions,     setAmbitions]     = useState(candidate?.ambitions ?? "");
    const [habits,        setHabits]        = useState(candidate?.habits ?? "");
    const [extracts,      setExtracts]      = useState<string[]>(candidate?.extracurricular_interests ?? []);
    const [programChoice, setProgramChoice] = useState(candidate?.program_choice ?? "");
    const [majorChoice,   setMajorChoice]   = useState(candidate?.major_choice ?? "");
    const [changeField,    setChangeField]    = useState("");
    const [changeNewValue, setChangeNewValue] = useState("");
    const [changeReason,   setChangeReason]   = useState("");

    // ── Live completion (realtime saat form diisi) ────────────────────────────
    const liveCompletion = candidate ? calcCompletion({
        ...candidate,
        religion:                religion      || null,
        phone_number:            phoneNumber   || null,
        email:                   email         || null,
        birth_certificate_number: birthCertNo  || null,
        family_card_number:      familyCardNo  || null,
        postal_code:             postalCode    || null,
        school_npsn:             schoolNpsn    || null,
        program_choice:          programChoice || null,
        child_order:             childOrder    ? +childOrder : null,
        siblings_count:          siblingsCount !== "" ? +siblingsCount : null,
        hobbies:                 hobbies       || null,
        ambitions:               ambitions     || null,
    }) : 0;

    // ── Animations ───────────────────────────────────────────────────────────
    useEffect(() => {
        animate(".tab-content", {
            opacity: [0, 1], translateY: [6, 0],
            duration: 280, ease: "outExpo",
        });
    }, [activeTab]);

    // ── Per-field onBlur validation ───────────────────────────────────────────
    const validateField = (field: string, value: string) => {
        const e = { ...errors };
        switch (field) {
            case "email":
                if (value && !/^[^\s@]+@gmail\.com$/.test(value.toLowerCase()))
                    e.email = "Gunakan email Gmail. Contoh: nama@gmail.com";
                else delete e.email;
                break;
            case "phone_number":
                if (value && !/^08[0-9]{8,12}$/.test(value))
                    e.phone_number = "Nomor harus diawali 08, minimal 10 digit.";
                else delete e.phone_number;
                break;
            case "family_card_number":
                if (value && !/^\d{16}$/.test(value))
                    e.family_card_number = "Nomor KK harus tepat 16 digit angka.";
                else delete e.family_card_number;
                break;
            case "postal_code":
                if (value && !/^\d{5}$/.test(value))
                    e.postal_code = "Kode pos harus 5 digit angka.";
                else delete e.postal_code;
                break;
            case "school_npsn":
                if (value && !/^\d{8}$/.test(value))
                    e.school_npsn = "NPSN harus 8 digit angka.";
                else delete e.school_npsn;
                break;
        }
        setErrors(e);
    };

    // ── Full validation ───────────────────────────────────────────────────────
    const validateAll = (): Record<string, string> => {
        const e: Record<string, string> = {};
        if (email       && !/^[^\s@]+@gmail\.com$/.test(email.toLowerCase()))
            e.email = "Gunakan email Gmail. Contoh: nama@gmail.com";
        if (phoneNumber && !/^08[0-9]{8,12}$/.test(phoneNumber))
            e.phone_number = "Nomor harus diawali 08, minimal 10 digit.";
        if (familyCardNo && !/^\d{16}$/.test(familyCardNo))
            e.family_card_number = "Nomor KK harus tepat 16 digit angka.";
        if (childOrder   && (isNaN(+childOrder)   || +childOrder   < 1  || +childOrder   > 20))
            e.child_order = "Anak ke-berapa tidak valid (1–20).";
        if (siblingsCount && (isNaN(+siblingsCount) || +siblingsCount < 0 || +siblingsCount > 20))
            e.siblings_count = "Jumlah saudara tidak valid (0–20).";
        if (postalCode   && !/^\d{5}$/.test(postalCode))
            e.postal_code = "Kode pos harus 5 digit angka.";
        if (schoolNpsn   && !/^\d{8}$/.test(schoolNpsn))
            e.school_npsn = "NPSN harus 8 digit angka.";
        if (!programChoice)
            e.program_choice = "Pilihan program wajib diisi sebelum menyimpan.";
        return e;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validateAll();

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            animate(".save-btn", { translateX: [0,-8,8,-5,5,0], duration: 400, ease: "outExpo" });
            if (errs.email || errs.phone_number || errs.family_card_number || errs.child_order || errs.siblings_count)
                setActiveTab("identitas");
            else if (errs.postal_code || errs.school_npsn)
                setActiveTab("alamat");
            else if (errs.program_choice)
                setActiveTab("program");
            await swalDark.fire({ icon: "warning", title: "Data belum lengkap", text: "Periksa kembali field yang ditandai merah.", confirmButtonText: "Oke, saya periksa" });
            return;
        }

        const result = await swalDark.fire({
            icon: "question", title: "Simpan Data Diri?",
            html: `<p class="text-sm text-slate-400">Pastikan semua data sudah benar sebelum disimpan.</p>`,
            showCancelButton: true,
            confirmButtonText: '<i class="fa-solid fa-floppy-disk mr-2"></i>Ya, Simpan',
            cancelButtonText: "Periksa Lagi",
        });
        if (!result.isConfirmed) return;

        setProcessing(true);
        router.put(route("dashboard.data-diri.update"), {
            email:                    email         || null,
            phone_number:             phoneNumber   || null,
            religion:                 religion      || null,
            child_order:              childOrder    ? +childOrder : null,
            siblings_count:           siblingsCount !== "" ? +siblingsCount : null,
            hobbies:                  hobbies       || null,
            ambitions:                ambitions     || null,
            habits:                   habits        || null,
            extracurricular_interests: extracts.length > 0 ? extracts : null,
            postal_code:              postalCode    || null,
            school_npsn:              schoolNpsn    || null,
            certificate_number:       certNumber    || null,
            birth_certificate_number: birthCertNo   || null,
            family_card_number:       familyCardNo  || null,
            program_choice:           programChoice || null,
            major_choice:             majorChoice   || null,
        }, {
            onError:   (e) => { setErrors(e); swalDark.fire({ icon: "error", title: "Gagal menyimpan", text: "Terjadi kesalahan. Periksa koneksi dan coba lagi." }); },
            onSuccess: () => { swalDark.fire({ icon: "success", title: "Tersimpan!", text: "Data diri berhasil diperbarui.", timer: 2000, showConfirmButton: false }); },
            onFinish:  () => setProcessing(false),
        });
    };

    // ── Change request ────────────────────────────────────────────────────────
    const handleChangeRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const err: Record<string, string> = {};
        if (!changeField)                        err.cr_field  = "Pilih data yang ingin diubah.";
        if (!changeNewValue)                     err.cr_value  = "Nilai baru wajib diisi.";
        if (!changeReason)                       err.cr_reason = "Alasan wajib diisi (min. 10 karakter).";
        else if (changeReason.length < 10)       err.cr_reason = "Alasan terlalu singkat (min. 10 karakter).";
        if (Object.keys(err).length) { setErrors(prev => ({ ...prev, ...err })); return; }

        const result = await swalDark.fire({
            icon: "warning", title: "Ajukan Perubahan Data?",
            html: `<p class="text-sm text-slate-400">Pengajuan akan dikirim ke staff untuk ditinjau.</p>`,
            showCancelButton: true, confirmButtonText: "Ya, Kirim", cancelButtonText: "Batal",
        });
        if (!result.isConfirmed) return;

        setCrProcessing(true);
        router.post(route("dashboard.data-diri.change-request"), {
            field: changeField, new_value: changeNewValue, reason: changeReason,
        }, {
            onError:   (e) => setErrors(prev => ({ ...prev, ...e })),
            onSuccess: () => {
                setShowChangeForm(false);
                setChangeField(""); setChangeNewValue(""); setChangeReason("");
                swalDark.fire({ icon: "success", title: "Pengajuan Terkirim", text: "Menunggu persetujuan staff.", timer: 2000, showConfirmButton: false });
            },
            onFinish: () => setCrProcessing(false),
        });
    };

    // ── Empty state ───────────────────────────────────────────────────────────
    if (!candidate) {
        return (
            <DashboardSplitLayout>
                <Head title="Data Diri" />
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <i className="fa-solid fa-id-card text-2xl text-slate-500"></i>
                    </div>
                    <p className="text-sm text-slate-500">Data kandidat tidak ditemukan.</p>
                </div>
            </DashboardSplitLayout>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <DashboardSplitLayout
            aside={
                <CandidateSidebar
                    user={user}
                    candidate={{
                        full_name:           candidate.full_name,
                        nisn:                candidate.nisn,
                        nik:                 candidate.nik,
                        gender_label:        candidate.gender_label,
                        date_of_birth_label: candidate.date_of_birth_label,
                        school_origin:       candidate.school_origin,
                        status:              candidate.status,
                        program_choice:      programChoice || candidate.program_choice,
                        admission_wave:      candidate.admission_wave,
                    }}
                    completion={liveCompletion}
                />
            }
        >
            <Head title="Data Diri" />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                    <i className="fa-solid fa-circle-check text-emerald-400"></i>
                    <p className="text-sm font-semibold text-emerald-300">{flash.success}</p>
                </div>
            )}

            {/* Tab card */}
            <div className="bg-navy border border-white/5 rounded-2xl overflow-hidden">

                {/* Tab nav */}
                <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
                    {TABS.map((tab) => (
                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200 ${
                                activeTab === tab.id
                                    ? "border-gold text-gold bg-gold/5"
                                    : "border-transparent text-slate-500 hover:text-slate-200 hover:bg-white/5"
                            }`}
                        >
                            <i className={`fa-solid ${tab.icon}`}></i>
                            {tab.label}
                            {/* Error dot */}
                            {((tab.id === "identitas" && (errors.email || errors.phone_number || errors.family_card_number)) ||
                              (tab.id === "alamat"    && (errors.postal_code || errors.school_npsn)) ||
                              (tab.id === "program"   && errors.program_choice)) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 ml-0.5"></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <form onSubmit={handleSave}>
                    <div className="tab-content p-6">

                        {activeTab === "identitas" && (
                            <TabIdentitas
                                candidate={candidate}
                                religion={religion}         phoneNumber={phoneNumber}
                                email={email}               birthCertNo={birthCertNo}
                                familyCardNo={familyCardNo} childOrder={childOrder}
                                siblingsCount={siblingsCount}
                                errors={errors}
                                showChangeForm={showChangeForm}
                                changeField={changeField}   changeNewValue={changeNewValue}
                                changeReason={changeReason} crProcessing={crProcessing}
                                setReligion={setReligion}       setPhoneNumber={setPhoneNumber}
                                setEmail={setEmail}             setBirthCertNo={setBirthCertNo}
                                setFamilyCardNo={setFamilyCardNo} setChildOrder={setChildOrder}
                                setSiblingsCount={setSiblingsCount}
                                setShowChangeForm={setShowChangeForm}
                                setChangeField={setChangeField} setChangeNewValue={setChangeNewValue}
                                setChangeReason={setChangeReason}
                                validateField={validateField}
                                onChangeRequest={handleChangeRequest}
                                formatHP={formatHP}
                            />
                        )}

                        {activeTab === "alamat" && (
                            <TabAlamat
                                candidate={candidate}
                                postalCode={postalCode} schoolNpsn={schoolNpsn} certNumber={certNumber}
                                errors={errors}
                                setPostalCode={setPostalCode} setSchoolNpsn={setSchoolNpsn} setCertNumber={setCertNumber}
                                validateField={validateField}
                            />
                        )}

                        {activeTab === "minat" && (
                            <TabMinat
                                hobbies={hobbies}   ambitions={ambitions}
                                habits={habits}     extracts={extracts}
                                setHobbies={setHobbies}     setAmbitions={setAmbitions}
                                setHabits={setHabits}       setExtracts={setExtracts}
                            />
                        )}

                        {activeTab === "program" && (
                            <TabProgram
                                wave={candidate.admission_wave}
                                programChoice={programChoice} majorChoice={majorChoice}
                                errors={errors}
                                setProgramChoice={setProgramChoice} setMajorChoice={setMajorChoice}
                            />
                        )}
                    </div>

                    {/* Save bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-900/50">
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <i className="fa-solid fa-circle-info text-[10px]"></i>
                            Field <span className="text-red-400 mx-0.5">*</span> wajib diisi
                        </p>
                        <button type="submit" disabled={processing}
                            className="save-btn bg-gold hover:bg-goldhover disabled:opacity-50 text-navy px-6 py-2.5 rounded-xl font-bold text-sm shadow-glow transition hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                        >
                            {processing
                                ? <><i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...</>
                                : <><i className="fa-solid fa-floppy-disk"></i> Simpan Data</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </DashboardSplitLayout>
    );
}
