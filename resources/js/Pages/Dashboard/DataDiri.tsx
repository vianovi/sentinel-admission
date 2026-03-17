import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { Head, router } from "@inertiajs/react";
import Select from "react-select";
import Swal from "sweetalert2";
import DashboardLayout from "@/Layouts/DashboardLayout";

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

const RELIGION_OPTIONS = ["Islam","Kristen","Katolik","Hindu","Buddha","Konghucu"]
    .map(r => ({ value: r, label: r }));

const EXTRACURRICULAR_OPTIONS = [
    "OSIS","Pramuka","PMR (Palang Merah Remaja)","Rohis","Paskibra",
    "Futsal","Basket","Voli","Badminton","Renang","Pencak Silat","Taekwondo",
    "Seni Musik","Seni Tari","Paduan Suara","Teater","Kaligrafi",
    "Karya Ilmiah Remaja (KIR)","Olimpiade Matematika","Olimpiade Sains",
    "Debat Bahasa Indonesia","Debat Bahasa Inggris",
    "Tahfidz Al-Qur'an","Majelis Ta'lim","Robotika","Coding Club",
].map(e => ({ value: e, label: e }));

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

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
    draft:     { label: "Draft",               cls: "bg-slate-700/80 text-slate-300",       dot: "bg-slate-400" },
    submitted: { label: "Menunggu Verifikasi", cls: "bg-blue-500/20 text-blue-300",         dot: "bg-blue-400" },
    verified:  { label: "Terverifikasi",       cls: "bg-amber-500/20 text-amber-300",       dot: "bg-amber-400" },
    accepted:  { label: "Diterima",            cls: "bg-emerald-500/20 text-emerald-300",   dot: "bg-emerald-400" },
    rejected:  { label: "Ditolak",             cls: "bg-red-500/20 text-red-300",           dot: "bg-red-400" },
};

// SweetAlert2 dark theme config
const swalDark = Swal.mixin({
    background:     "#0f172a",
    color:          "#e2e8f0",
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
// SELECT STYLES
// ─────────────────────────────────────────────────────────────────────────────

const makeSelectStyles = (isMulti = false) => ({
    control: (base: any, state: any) => ({
        ...base,
        backgroundColor: "rgba(15,23,42,0.6)",
        borderColor: state.isFocused ? "#d4a017" : "rgba(255,255,255,0.1)",
        borderRadius: "0.75rem",
        padding: isMulti ? "2px 4px" : "2px 4px",
        boxShadow: "none",
        minHeight: "44px",
        "&:hover": { borderColor: "#d4a017" },
    }),
    menu: (base: any) => ({
        ...base,
        backgroundColor: "#1e293b",
        borderRadius: "0.75rem",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        zIndex: 100,
    }),
    menuList: (base: any) => ({ ...base, maxHeight: "200px" }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "#d4a017"
            : state.isFocused ? "rgba(212,160,23,0.15)" : "transparent",
        color: state.isSelected ? "#0f172a" : "#e2e8f0",
        cursor: "pointer",
        fontSize: "13px",
    }),
    singleValue:      (base: any) => ({ ...base, color: "#e2e8f0", fontSize: "14px" }),
    multiValue:       (base: any) => ({ ...base, backgroundColor: "rgba(212,160,23,0.2)", borderRadius: "6px" }),
    multiValueLabel:  (base: any) => ({ ...base, color: "#d4a017", fontSize: "12px" }),
    multiValueRemove: (base: any) => ({ ...base, color: "#d4a017", "&:hover": { backgroundColor: "rgba(212,160,23,0.3)", color: "#fff" } }),
    placeholder:      (base: any) => ({ ...base, color: "#64748b", fontSize: "14px" }),
    input:            (base: any) => ({ ...base, color: "#e2e8f0" }),
});

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({ label, value, required }: {
    label: string; value?: string | number | null; required?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1">
                {label}
                {required && <span className="text-red-400 normal-case tracking-normal font-normal"> *</span>}
            </p>
            <p className="text-sm font-medium text-slate-200 leading-snug">
                {value ?? <span className="text-slate-600 italic text-xs">Belum diisi</span>}
            </p>
        </div>
    );
}

function Field({ label, children, error, hint, required, className = "" }: {
    label: string; children: React.ReactNode;
    error?: string; hint?: string; required?: boolean; className?: string;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                {label}
                {required && <span className="text-red-400">*</span>}
            </label>
            {children}
            {hint  && <p className="text-[11px] text-slate-500 leading-tight">{hint}</p>}
            {error && (
                <p className="error-msg text-[11px] text-red-400 flex items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation text-[10px]"></i> {error}
                </p>
            )}
        </div>
    );
}

const inputCls = (err?: string) =>
    `w-full bg-slate-900/60 border ${err ? "border-red-500/60 bg-red-500/5" : "border-white/10"} rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-gold focus:bg-slate-900/80 transition placeholder:text-slate-600`;

const textareaCls = (err?: string) =>
    `w-full bg-slate-900/60 border ${err ? "border-red-500/60" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-gold transition placeholder:text-slate-600 resize-none`;

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS RING
// ─────────────────────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 56 }: { pct: number; size?: number }) {
    const r = (size / 2) - 5;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#d4a017" : "#64748b";
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4"/>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
                    strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.7s ease" }}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color }}>
                {pct}%
            </span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DataDiriPage({ user, candidate, flash }: Props) {

    const [activeTab,      setActiveTab]      = useState<TabId>("identitas");
    const [errors,         setErrors]         = useState<Record<string, string>>({});
    const [processing,     setProcessing]     = useState(false);
    const [crProcessing,   setCrProcessing]   = useState(false);
    const [showChangeForm, setShowChangeForm] = useState(false);

    // ── Form state — Tab 1: Identitas ─────────────────────────────────────────
    const [religion,      setReligion]      = useState(candidate?.religion ?? "");
    const [childOrder,    setChildOrder]    = useState(candidate?.child_order?.toString() ?? "");
    const [siblingsCount, setSiblingsCount] = useState(candidate?.siblings_count?.toString() ?? "");
    const [phoneNumber,   setPhoneNumber]   = useState(candidate?.phone_number ?? "");
    const [email,         setEmail]         = useState(candidate?.email ?? "");
    const [birthCertNo,   setBirthCertNo]   = useState(candidate?.birth_certificate_number ?? "");
    const [familyCardNo,  setFamilyCardNo]  = useState(candidate?.family_card_number ?? "");

    // ── Form state — Tab 2: Alamat & Sekolah ─────────────────────────────────
    const [postalCode, setPostalCode] = useState(candidate?.postal_code ?? "");
    const [schoolNpsn, setSchoolNpsn] = useState(candidate?.school_npsn ?? "");
    const [certNumber, setCertNumber] = useState(candidate?.certificate_number ?? "");

    // ── Form state — Tab 3: Minat & Bakat ────────────────────────────────────
    const [hobbies,       setHobbies]       = useState(candidate?.hobbies ?? "");
    const [ambitions,     setAmbitions]     = useState(candidate?.ambitions ?? "");
    const [habits,        setHabits]        = useState(candidate?.habits ?? "");
    const [extracts,      setExtracts]      = useState<string[]>(candidate?.extracurricular_interests ?? []);

    // ── Form state — Tab 4: Program ───────────────────────────────────────────
    const [programChoice, setProgramChoice] = useState(candidate?.program_choice ?? "");
    const [majorChoice,   setMajorChoice]   = useState(candidate?.major_choice ?? "");

    // ── Change request ────────────────────────────────────────────────────────
    const [changeField,    setChangeField]    = useState("");
    const [changeNewValue, setChangeNewValue] = useState("");
    const [changeReason,   setChangeReason]   = useState("");

    // ── Ref untuk menghitung completion realtime ──────────────────────────────
    const liveCandidate = candidate ? {
        ...candidate,
        religion:      religion      || null,
        phone_number:  phoneNumber   || null,
        email:         email         || null,
        birth_certificate_number: birthCertNo  || null,
        family_card_number:       familyCardNo || null,
        postal_code:   postalCode    || null,
        school_npsn:   schoolNpsn    || null,
        program_choice: programChoice || null,
        child_order:   childOrder    ? +childOrder : null,
        siblings_count: siblingsCount !== "" ? +siblingsCount : null,
        hobbies:       hobbies       || null,
        ambitions:     ambitions     || null,
    } : null;

    const completion = liveCandidate ? calcCompletion(liveCandidate) : 0;

    // ── Entrance animation ────────────────────────────────────────────────────
    useEffect(() => {
        animate(".fade-in", {
            opacity: [0, 1], translateY: [12, 0],
            duration: 450, delay: stagger(60), ease: "outExpo",
        });
    }, []);

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

    // ── Full validation sebelum submit ────────────────────────────────────────
    const validateAll = (): Record<string, string> => {
        const e: Record<string, string> = {};

        // Tab identitas
        if (email && !/^[^\s@]+@gmail\.com$/.test(email.toLowerCase()))
            e.email = "Gunakan email Gmail. Contoh: nama@gmail.com";
        if (phoneNumber && !/^08[0-9]{8,12}$/.test(phoneNumber))
            e.phone_number = "Nomor harus diawali 08, minimal 10 digit.";
        if (familyCardNo && !/^\d{16}$/.test(familyCardNo))
            e.family_card_number = "Nomor KK harus tepat 16 digit angka.";
        if (childOrder && (isNaN(+childOrder) || +childOrder < 1 || +childOrder > 20))
            e.child_order = "Anak ke-berapa tidak valid (1–20).";
        if (siblingsCount && (isNaN(+siblingsCount) || +siblingsCount < 0 || +siblingsCount > 20))
            e.siblings_count = "Jumlah saudara tidak valid (0–20).";

        // Tab alamat
        if (postalCode && !/^\d{5}$/.test(postalCode))
            e.postal_code = "Kode pos harus 5 digit angka.";
        if (schoolNpsn && !/^\d{8}$/.test(schoolNpsn))
            e.school_npsn = "NPSN harus 8 digit angka.";

        // Tab program
        if (!programChoice)
            e.program_choice = "Pilihan program wajib diisi sebelum menyimpan.";

        return e;
    };

    // ── Submit dengan SweetAlert2 konfirmasi ──────────────────────────────────
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const errs = validateAll();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            animate(".save-btn", { translateX: [0, -8, 8, -5, 5, 0], duration: 400, ease: "outExpo" });

            // Pindah ke tab yang punya error
            if (errs.email || errs.phone_number || errs.family_card_number || errs.child_order || errs.siblings_count)
                setActiveTab("identitas");
            else if (errs.postal_code || errs.school_npsn)
                setActiveTab("alamat");
            else if (errs.program_choice)
                setActiveTab("program");

            await swalDark.fire({
                icon: "warning",
                title: "Data belum lengkap",
                text: "Periksa kembali field yang ditandai merah sebelum menyimpan.",
                confirmButtonText: "Oke, saya periksa",
            });
            return;
        }

        const result = await swalDark.fire({
            icon: "question",
            title: "Simpan Data Diri?",
            html: `<p class="text-sm text-slate-400">Pastikan semua data sudah benar. Data yang salah dapat mempengaruhi proses pendaftaran.</p>`,
            showCancelButton: true,
            confirmButtonText: '<i class="fa-solid fa-floppy-disk mr-2"></i>Ya, Simpan',
            cancelButtonText:  "Periksa Lagi",
        });

        if (!result.isConfirmed) return;

        setProcessing(true);
        router.put(route("dashboard.data-diri.update"), {
            email:                    email || null,
            phone_number:             phoneNumber || null,
            religion:                 religion || null,
            child_order:              childOrder ? +childOrder : null,
            siblings_count:           siblingsCount !== "" ? +siblingsCount : null,
            hobbies:                  hobbies || null,
            ambitions:                ambitions || null,
            habits:                   habits || null,
            extracurricular_interests: extracts.length > 0 ? extracts : null,
            postal_code:              postalCode || null,
            school_npsn:              schoolNpsn || null,
            certificate_number:       certNumber || null,
            birth_certificate_number: birthCertNo || null,
            family_card_number:       familyCardNo || null,
            program_choice:           programChoice || null,
            major_choice:             majorChoice || null,
        }, {
            onError:  (e) => {
                setErrors(e);
                swalDark.fire({ icon: "error", title: "Gagal menyimpan", text: "Terjadi kesalahan. Periksa koneksi dan coba lagi." });
            },
            onSuccess: () => {
                swalDark.fire({ icon: "success", title: "Tersimpan!", text: "Data diri berhasil diperbarui.", timer: 2000, showConfirmButton: false });
            },
            onFinish: () => setProcessing(false),
        });
    };

    // ── Change request ────────────────────────────────────────────────────────
    const handleChangeRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const err: Record<string, string> = {};
        if (!changeField)    err.cr_field  = "Pilih data yang ingin diubah.";
        if (!changeNewValue) err.cr_value  = "Nilai baru wajib diisi.";
        if (!changeReason)   err.cr_reason = "Alasan wajib diisi (min. 10 karakter).";
        else if (changeReason.length < 10) err.cr_reason = "Alasan terlalu singkat (min. 10 karakter).";
        if (Object.keys(err).length) { setErrors(e => ({ ...e, ...err })); return; }

        const result = await swalDark.fire({
            icon: "warning",
            title: "Ajukan Perubahan Data?",
            html: `<p class="text-sm text-slate-400">Pengajuan akan dikirim ke staff untuk ditinjau. Kamu tidak bisa mengubah data ini sampai disetujui atau ditolak.</p>`,
            showCancelButton: true,
            confirmButtonText: "Ya, Kirim Pengajuan",
            cancelButtonText:  "Batal",
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
            <DashboardLayout>
                <Head title="Data Diri" />
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <i className="fa-solid fa-id-card text-2xl text-slate-500"></i>
                    </div>
                    <p className="text-sm text-slate-500">Data kandidat tidak ditemukan.</p>
                </div>
            </DashboardLayout>
        );
    }

    const wave   = candidate.admission_wave;
    const status = STATUS_MAP[candidate.status] ?? STATUS_MAP.draft;

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <DashboardLayout>
            <Head title="Data Diri" />

            {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
            <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-3 pt-2 bg-light dark:bg-slate-950 border-b border-slate-200 dark:border-white/5 mb-5">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar mini */}
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                            {user.avatar_url
                                ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                : <span className="text-xs font-bold text-gold">{user.initials}</span>
                            }
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-widest text-gold font-bold leading-none mb-0.5">Data Diri</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{candidate.full_name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${status.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                            {status.label}
                        </span>
                        <ProgressRing pct={completion} size={48} />
                    </div>
                </div>
            </div>

            {/* ── MAIN LAYOUT ───────────────────────────────────────────────── */}
            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_280px] gap-5 items-start max-w-7xl">

                {/* ══ KIRI — Tab form ══ */}
                <div className="flex flex-col gap-0 min-w-0 w-full rounded-2xl overflow-hidden border border-white/5 bg-navy">

                    {/* Tab nav — sticky di dalam kolom kiri */}
                    <div className="sticky top-[61px] z-20 bg-navy border-b border-white/5">
                        <div className="flex overflow-x-auto no-scrollbar">
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
                                    {/* Dot indicator kalau ada error di tab ini */}
                                    {((tab.id === "identitas" && (errors.email || errors.phone_number || errors.family_card_number)) ||
                                      (tab.id === "alamat"    && (errors.postal_code || errors.school_npsn)) ||
                                      (tab.id === "program"   && errors.program_choice)) && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 ml-0.5"></span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Flash */}
                    {flash?.success && (
                        <div className="mx-6 mt-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                            <i className="fa-solid fa-circle-check text-emerald-400"></i>
                            <p className="text-sm font-semibold text-emerald-300">{flash.success}</p>
                        </div>
                    )}

                    {/* Tab content */}
                    <form onSubmit={handleSave}>
                        <div className="tab-content p-6 space-y-8">

                            {/* ══ TAB 1: IDENTITAS ══ */}
                            {activeTab === "identitas" && (
                                <>
                                    {/* Data kunci */}
                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
                                                    <i className="fa-solid fa-shield text-gold text-xs"></i>
                                                    Data Identitas Resmi
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-0.5">Dari pendaftaran awal — tidak bisa diubah langsung</p>
                                            </div>
                                            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center">
                                                <i className="fa-solid fa-lock text-slate-500 text-[10px]"></i>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 p-5 bg-slate-800/40 rounded-xl border border-white/5">
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
                                                <div className="flex flex-col gap-2 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                    <div className="flex items-start gap-2.5">
                                                        <i className="fa-solid fa-clock text-amber-400 mt-0.5 shrink-0 text-xs"></i>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-amber-300">Pengajuan menunggu persetujuan staff</p>
                                                            <p className="text-[11px] text-amber-400/70 mt-0.5">
                                                                <span className="font-medium">{FIELD_LABELS[candidate.data_change_request.field]}</span>
                                                                {" "}→ {candidate.data_change_request.new_value}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button type="button"
                                                        onClick={() => router.delete(route("dashboard.data-diri.change-request.cancel"))}
                                                        className="self-start text-[11px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                                                    >
                                                        <i className="fa-solid fa-xmark text-[10px]"></i> Batalkan pengajuan
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <button type="button" onClick={() => setShowChangeForm(!showChangeForm)}
                                                        className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-gold transition"
                                                    >
                                                        <i className={`fa-solid ${showChangeForm ? "fa-chevron-up" : "fa-pen-to-square"} text-[10px]`}></i>
                                                        {showChangeForm ? "Tutup form pengajuan" : "Ada data yang salah? Ajukan perubahan"}
                                                    </button>
                                                    {showChangeForm && (
                                                        <div className="mt-3 flex flex-col gap-3 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                                                            <Field label="Data yang ingin diubah" error={errors.cr_field} required>
                                                                <select value={changeField} onChange={e => setChangeField(e.target.value)} className={inputCls(errors.cr_field)}>
                                                                    <option value="">Pilih data...</option>
                                                                    {Object.entries(FIELD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                                                </select>
                                                            </Field>
                                                            {changeField && (
                                                                <Field label={`Nilai baru untuk ${FIELD_LABELS[changeField]}`} error={errors.cr_value} required>
                                                                    <input value={changeNewValue} onChange={e => setChangeNewValue(e.target.value)}
                                                                        placeholder="Masukkan nilai yang benar..." className={inputCls(errors.cr_value)} />
                                                                </Field>
                                                            )}
                                                            <Field label="Alasan perubahan" error={errors.cr_reason} required hint="Minimal 10 karakter">
                                                                <textarea value={changeReason} onChange={e => setChangeReason(e.target.value)}
                                                                    rows={2} placeholder="Contoh: Nama saya salah ketik, seharusnya..."
                                                                    className={textareaCls(errors.cr_reason)} />
                                                            </Field>
                                                            <button type="button" onClick={handleChangeRequest} disabled={crProcessing}
                                                                className="self-start bg-navy border border-gold/30 hover:border-gold text-gold px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 disabled:opacity-50"
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

                                    <div className="border-t border-white/5"></div>

                                    {/* Data tambahan */}
                                    <section>
                                        <h3 className="text-sm font-display font-bold text-white mb-5 flex items-center gap-2">
                                            <i className="fa-solid fa-pen-to-square text-gold text-xs"></i>
                                            Data Tambahan
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <Field label="Agama" required>
                                                <Select
                                                    options={RELIGION_OPTIONS}
                                                    value={RELIGION_OPTIONS.find(o => o.value === religion) ?? null}
                                                    onChange={opt => setReligion(opt?.value ?? "")}
                                                    placeholder="Pilih agama..."
                                                    styles={makeSelectStyles()}
                                                    isSearchable={false}
                                                />
                                            </Field>
                                            <Field label="Nomor HP/WA Siswa" error={errors.phone_number}
                                                hint="Diawali 08 — +62 dan tanda baca otomatis dihapus">
                                                <input value={phoneNumber}
                                                    onChange={e => setPhoneNumber(formatHP(e.target.value))}
                                                    onBlur={e => validateField("phone_number", e.target.value)}
                                                    inputMode="numeric" placeholder="Contoh: 081234567890"
                                                    className={inputCls(errors.phone_number)} />
                                            </Field>
                                            <Field label="Email Siswa" error={errors.email} hint="Wajib email Gmail">
                                                <input type="email" value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    onBlur={e => {
                                                        const v = e.target.value.trim().toLowerCase();
                                                        setEmail(v);
                                                        validateField("email", v);
                                                    }}
                                                    placeholder="Contoh: nama@gmail.com"
                                                    className={inputCls(errors.email)} />
                                            </Field>
                                            <Field label="Nomor Akta Lahir" error={errors.birth_certificate_number}>
                                                <input value={birthCertNo} onChange={e => setBirthCertNo(e.target.value)}
                                                    placeholder="Contoh: 3578-LT-2006-0001"
                                                    className={inputCls(errors.birth_certificate_number)} />
                                            </Field>
                                            <Field label="Nomor Kartu Keluarga" error={errors.family_card_number} hint="16 digit angka sesuai KK">
                                                <input value={familyCardNo}
                                                    onChange={e => setFamilyCardNo(e.target.value.replace(/\D/g, "").slice(0, 16))}
                                                    onBlur={e => validateField("family_card_number", e.target.value)}
                                                    inputMode="numeric" placeholder="Contoh: 3578012345678901"
                                                    className={inputCls(errors.family_card_number)} />
                                            </Field>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="Anak ke-" error={errors.child_order}>
                                                    <input value={childOrder}
                                                        onChange={e => setChildOrder(e.target.value.replace(/\D/g, "").slice(0, 2))}
                                                        inputMode="numeric" placeholder="Contoh: 1"
                                                        className={inputCls(errors.child_order)} />
                                                </Field>
                                                <Field label="Jml. Saudara" error={errors.siblings_count}>
                                                    <input value={siblingsCount}
                                                        onChange={e => setSiblingsCount(e.target.value.replace(/\D/g, "").slice(0, 2))}
                                                        inputMode="numeric" placeholder="Contoh: 2"
                                                        className={inputCls(errors.siblings_count)} />
                                                </Field>
                                            </div>
                                        </div>
                                    </section>
                                </>
                            )}

                            {/* ══ TAB 2: ALAMAT & SEKOLAH ══ */}
                            {activeTab === "alamat" && (
                                <>
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
                                </>
                            )}

                            {/* ══ TAB 3: MINAT & BAKAT ══ */}
                            {activeTab === "minat" && (
                                <>
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
                                </>
                            )}

                            {/* ══ TAB 4: PROGRAM ══ */}
                            {activeTab === "program" && (
                                <section>
                                    {wave && wave.available_programs.length > 0 ? (
                                        <>
                                            <div className="mb-6">
                                                <h3 className="text-sm font-display font-bold text-white mb-1 flex items-center gap-2">
                                                    <i className="fa-solid fa-graduation-cap text-gold text-xs"></i>
                                                    Pilihan Program <span className="text-red-400 font-normal text-xs">*</span>
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    {wave.title} — {wave.academic_year} · Pilih satu program
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                                                {wave.available_programs.map((prog) => (
                                                    <button key={prog} type="button" onClick={() => setProgramChoice(prog)}
                                                        className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 text-sm font-semibold transition-all duration-200 ${
                                                            programChoice === prog
                                                                ? "border-gold bg-gold/10 text-gold shadow-glow scale-[1.02]"
                                                                : "border-white/10 text-slate-400 hover:border-gold/40 hover:bg-gold/5 hover:text-slate-200"
                                                        }`}
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
                                                <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
                                                    <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                                                    {errors.program_choice}
                                                </p>
                                            )}

                                            {wave.majors_enabled && wave.available_majors.length > 0 && (
                                                <div className="mt-8">
                                                    <div className="border-t border-white/5 mb-6"></div>
                                                    <h3 className="text-sm font-display font-bold text-white mb-1 flex items-center gap-2">
                                                        <i className="fa-solid fa-book text-gold text-xs"></i>
                                                        Pilihan Jurusan
                                                    </h3>
                                                    <p className="text-xs text-slate-500 mb-4">Pilih jurusan yang sesuai</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        {wave.available_majors.map((major) => (
                                                            <button key={major} type="button" onClick={() => setMajorChoice(major)}
                                                                className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 text-sm font-semibold transition-all duration-200 ${
                                                                    majorChoice === major
                                                                        ? "border-gold bg-gold/10 text-gold shadow-glow scale-[1.02]"
                                                                        : "border-white/10 text-slate-400 hover:border-gold/40 hover:bg-gold/5 hover:text-slate-200"
                                                                }`}
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
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center">
                                                <i className="fa-solid fa-graduation-cap text-2xl text-slate-600"></i>
                                            </div>
                                            <p className="text-sm text-slate-500 text-center">Program belum tersedia untuk gelombang ini.</p>
                                        </div>
                                    )}
                                </section>
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
                {/* ══ END KIRI ══ */}

                {/* ══ KANAN — sticky sidebar ══ */}
                {/* Mobile: muncul sebelum tab (order-first), Desktop: kolom kanan sticky */}
                <div className="order-first lg:order-none flex flex-col gap-4 lg:sticky lg:top-[69px]">

                    {/* Profile + progress */}
                    <div className="fade-in opacity-0 bg-navy border border-white/5 rounded-2xl overflow-hidden">
                        {/* Banner */}
                        <div className="h-16 bg-gradient-to-br from-gold/20 to-navy relative">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(212,160,23,0.15),transparent)]"></div>
                        </div>
                        {/* Content */}
                        <div className="px-5 pb-5">
                            {/* Avatar overlap */}
                            <div className="flex items-end justify-between -mt-7 mb-4">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gold/10 border-2 border-navy ring-2 ring-gold/20 flex items-center justify-center">
                                    {user.avatar_url
                                        ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                        : <span className="text-lg font-display font-bold text-gold">{user.initials}</span>
                                    }
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${status.cls}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                                    {status.label}
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-white leading-snug">{candidate.full_name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{wave ? wave.title : "Belum ada gelombang"}</p>

                            {/* Progress */}
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-slate-400">Kelengkapan Data</p>
                                    <p className="text-xs font-bold text-gold">{completion}%</p>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${
                                            completion >= 80 ? "bg-emerald-400" : completion >= 50 ? "bg-gold" : "bg-slate-500"
                                        }`}
                                        style={{ width: `${completion}%` }}
                                    ></div>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1.5">
                                    {completion === 100 ? "✅ Data sudah lengkap!" : `${12 - Math.round(completion / 100 * 12)} field lagi perlu diisi`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ringkasan data */}
                    <div className="fade-in opacity-0 bg-navy border border-white/5 rounded-2xl p-5">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">Ringkasan</p>
                        <div className="flex flex-col gap-2.5">
                            {[
                                { label: "NISN",         value: candidate.nisn },
                                { label: "NIK",          value: candidate.nik },
                                { label: "Jenis Kelamin",value: candidate.gender_label },
                                { label: "Tgl. Lahir",   value: candidate.date_of_birth_label },
                                { label: "Asal Sekolah", value: candidate.school_origin },
                            ].map(item => (
                                <div key={item.label} className="flex items-start justify-between gap-2">
                                    <p className="text-xs text-slate-500 shrink-0">{item.label}</p>
                                    <p className="text-xs font-medium text-slate-200 text-right truncate max-w-[140px]">{item.value ?? "—"}</p>
                                </div>
                            ))}
                            {programChoice && (
                                <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between gap-2">
                                    <p className="text-xs text-slate-500 shrink-0">Program</p>
                                    <p className="text-xs font-bold text-gold">{programChoice}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="fade-in opacity-0 bg-gold/5 border border-gold/10 rounded-2xl p-4">
                        <div className="flex items-start gap-2.5">
                            <i className="fa-solid fa-lightbulb text-gold text-sm mt-0.5 shrink-0"></i>
                            <div>
                                <p className="text-xs font-bold text-gold mb-1.5">Tips Pengisian</p>
                                <ul className="space-y-1.5">
                                    {[
                                        "Pastikan data sesuai dokumen resmi (KK, Akta)",
                                        "Email harus Gmail aktif",
                                        "Nomor HP harus aktif dan bisa dihubungi",
                                        "Lengkapi semua data untuk mempercepat verifikasi",
                                    ].map((tip, i) => (
                                        <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                                            <span className="text-gold/60 mt-0.5 shrink-0">•</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>
                {/* ══ END KANAN ══ */}

            </div>
        </DashboardLayout>
    );
}