// resources/js/Pages/Dashboard/Candidate/DataDiri.tsx

// ─────────────────────────────────────────────────────────────────────────────
// KRITERIA AUTO-SUBMITTED (untuk CandidateObserver)
// Field berikut WAJIB diisi agar status kandidat bisa berubah ke "submitted":
//
// Tab Identitas:
//   - religion       (required)
//
// Tab Program:
//   - program_choice (required)
//
// Field OPSIONAL (tidak masuk kriteria submitted):
//   - email, phone_number, birth_certificate_number, family_card_number
//   - child_order, siblings_count, postal_code, school_npsn
//   - certificate_number, hobbies, ambitions, habits
//   - extracurricular_interests, major_choice, is_transfer
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState }  from "react";
import { animate, stagger }             from "animejs";
import { Head, router }                 from "@inertiajs/react";
import Swal                             from "sweetalert2";
import DashboardSplitLayout             from "@/Layouts/DashboardSplitLayout";
import CandidateSidebar                 from "@/Components/Dashboard/Candidate/Shared/CandidateSidebar";
import RequestStatusBanner              from "@/Components/Dashboard/Candidate/Shared/RequestStatusBanner";
import TabIdentitas                     from "@/Components/Dashboard/Candidate/DataDiri/TabIdentitas";
import TabAlamat                        from "@/Components/Dashboard/Candidate/DataDiri/TabAlamat";
import TabMinat                         from "@/Components/Dashboard/Candidate/DataDiri/TabMinat";
import TabProgram                       from "@/Components/Dashboard/Candidate/DataDiri/TabProgram";
import TabRangkuman from "@/Components/Dashboard/Candidate/DataDiri/TabRangkuman";

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

export type CandidateData = {
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
    is_transfer: boolean;
    status: string; has_pending_change: boolean; data_change_request: DataChangeRequest;
    admission_wave: AdmissionWave | null;
};

type UserData = {
    name: string; avatar_url: string | null; initials: string;
};

type DataChangeRequestResult = {
    field: string;
    field_label: string;
    old_value: string;
    new_value: string;
    reason: string | null;
    status: "approved" | "rejected";
    reviewed_by: number | null;
    reviewed_by_name: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    review_note: string | null;
} | null;

type Props = {
    user: UserData;
    candidate: CandidateData | null;
    data_change_request_result: DataChangeRequestResult;
    flash?: { success?: string; error?: string };
};

// EmptyField — untuk TabRangkuman nanti
export type EmptyField = { key: string; label: string; tab: TabId };

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
    { id: "identitas", label: "Identitas",       icon: "fa-solid fa-id-card" },
    { id: "alamat",    label: "Alamat & Sekolah", icon: "fa-solid fa-map-location-dot" },
    { id: "minat",     label: "Minat & Bakat",    icon: "fa-solid fa-star" },
    { id: "program",   label: "Program",          icon: "fa-solid fa-graduation-cap" },
    { id: "rangkuman", label: "Rangkuman",        icon: "fa-solid fa-chart-pie" },
] as const;

type TabId = typeof TABS[number]["id"];

// Field wajib untuk completion tracking & TabRangkuman
const REQUIRED_FIELDS: EmptyField[] = [
    { key: "religion",      label: "Agama",              tab: "identitas" },
    { key: "phoneNumber",   label: "Nomor HP/WA",        tab: "identitas" },
    { key: "email",         label: "Email",              tab: "identitas" },
    { key: "familyCardNo",  label: "No. Kartu Keluarga", tab: "identitas" },
    { key: "childOrder",    label: "Anak ke-",           tab: "identitas" },
    { key: "siblingsCount", label: "Jumlah Saudara",     tab: "identitas" },
    { key: "postalCode",    label: "Kode Pos",           tab: "alamat" },
    { key: "schoolNpsn",    label: "NPSN Sekolah",       tab: "alamat" },
    { key: "hobbies",       label: "Hobi / Minat",       tab: "minat" },
    { key: "ambitions",     label: "Cita-cita",          tab: "minat" },
    { key: "programChoice", label: "Pilihan Program",    tab: "program" },
];

// Field wajib per tab — validasi sebelum simpan & pindah tab
const REQUIRED_BY_TAB: Record<string, string[]> = {
    identitas: ["religion"],
    alamat:    [],
    minat:     [],
    program:   ["program_choice"],
    rangkuman: [],
};

const swalDark = Swal.mixin({
    background:         "#0f172a",
    color:              "#e2e8f0",
    confirmButtonColor: "#d4a017",
    cancelButtonColor:  "#334155",
    customClass: {
        popup:         "!rounded-2xl !border !border-white/10",
        confirmButton: "!rounded-xl !font-semibold",
        cancelButton:  "!rounded-xl !font-semibold",
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const reviewedByLabel = (name: string | null | undefined) => name ?? "petugas";

export default function DataDiriPage({ user, candidate, data_change_request_result, flash }: Props) {
    const [activeTab,    setActiveTab]    = useState<TabId>("identitas");
    const [submitting,   setSubmitting]   = useState(false);
    const [errors,       setErrors]       = useState<Record<string, string>>({});
    const [crProcessing, setCrProcessing] = useState(false);
    const [showChangeForm, setShowChangeForm] = useState(false);
    const tabContentRef = useRef<HTMLDivElement>(null);

    // ── Form state — Tab Identitas ────────────────────────────────────────────
    const [religion,      setReligion]      = useState(candidate?.religion                   ?? "");
    const [phoneNumber,   setPhoneNumber]   = useState(candidate?.phone_number               ?? "");
    const [email,         setEmail]         = useState(candidate?.email                      ?? "");
    const [birthCertNo,   setBirthCertNo]   = useState(candidate?.birth_certificate_number   ?? "");
    const [familyCardNo,  setFamilyCardNo]  = useState(candidate?.family_card_number         ?? "");
    const [childOrder,    setChildOrder]    = useState(candidate?.child_order?.toString()    ?? "");
    const [siblingsCount, setSiblingsCount] = useState(candidate?.siblings_count?.toString() ?? "");

    // ── Form state — Tab Alamat ───────────────────────────────────────────────
    const [postalCode, setPostalCode] = useState(candidate?.postal_code        ?? "");
    const [schoolNpsn, setSchoolNpsn] = useState(candidate?.school_npsn        ?? "");
    const [certNumber, setCertNumber] = useState(candidate?.certificate_number ?? "");
    const [isTransfer, setIsTransfer] = useState<boolean>(candidate?.is_transfer ?? false);

    // ── Form state — Tab Minat ────────────────────────────────────────────────
    const [hobbies,   setHobbies]   = useState(candidate?.hobbies   ?? "");
    const [ambitions, setAmbitions] = useState(candidate?.ambitions ?? "");
    const [habits,    setHabits]    = useState(candidate?.habits    ?? "");
    const [extracts,  setExtracts]  = useState<string[]>(candidate?.extracurricular_interests ?? []);

    // ── Form state — Tab Program ──────────────────────────────────────────────
    const [programChoice, setProgramChoice] = useState(candidate?.program_choice ?? "");
    const [majorChoice,   setMajorChoice]   = useState(candidate?.major_choice   ?? "");

    // ── Change request state ──────────────────────────────────────────────────
    const [changeField,    setChangeField]    = useState("");
    const [changeNewValue, setChangeNewValue] = useState("");
    const [changeReason,   setChangeReason]   = useState("");

    // ── Completion & empty fields (realtime) ──────────────────────────────────
    const formSnapshot: Record<string, string> = {
        religion, phoneNumber, email, familyCardNo,
        childOrder, siblingsCount, postalCode, schoolNpsn,
        hobbies, ambitions, programChoice,
    };

    const emptyRequiredFields = REQUIRED_FIELDS.filter(f => !formSnapshot[f.key]);
    const hasEmptyRequired    = emptyRequiredFields.length > 0;
    const completion          = Math.round(
        ((REQUIRED_FIELDS.length - emptyRequiredFields.length) / REQUIRED_FIELDS.length) * 100
    );

    const progressGradient = (() => {
        if (completion < 50)  return "linear-gradient(to right, #c0392b, #e74c3c)";
        if (completion < 75)  return "linear-gradient(to right, #d35400, #f39c12)";
        if (completion < 100) return "linear-gradient(to right, #2980b9, #7aa2f7)";
        return "linear-gradient(to right, #1e8449, #27ae60)";
    })();

    // ── Entrance animation ────────────────────────────────────────────────────
    useEffect(() => {
        animate(".datadiri-card", {
            opacity: [0, 1], translateY: [20, 0],
            duration: 600, delay: stagger(80), ease: "outExpo",
        });
    }, []);

    // ── Flash messages ────────────────────────────────────────────────────────
    useEffect(() => {
        if (flash?.success) {
            swalDark.fire({
                icon: "success", title: "Tersimpan!",
                text: flash.success, timer: 2500, showConfirmButton: false,
            });
        }
        if (flash?.error) {
            swalDark.fire({ icon: "error", title: "Gagal", text: flash.error });
        }
    }, [flash]);

    // ── Tab transition ────────────────────────────────────────────────────────
    const handleTabChange = (tabId: TabId) => {
        if (tabId === activeTab) return;
        const currentIdx = TABS.findIndex(t => t.id === activeTab);
        const nextIdx    = TABS.findIndex(t => t.id === tabId);
        const dir        = nextIdx > currentIdx ? 1 : -1;

        if (tabContentRef.current) {
            animate(tabContentRef.current, {
                opacity: [1, 0], translateX: [0, dir * -20],
                duration: 180, ease: "inQuad",
            });
        }
        setTimeout(() => {
            setActiveTab(tabId);
            if (tabContentRef.current) {
                animate(tabContentRef.current, {
                    opacity: [0, 1], translateX: [dir * 20, 0],
                    duration: 350, ease: "outExpo",
                });
            }
        }, 190);
    };

    // ── Clear single error ────────────────────────────────────────────────────
    const clearError = (field: string) => {
        setErrors(prev => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    // ── Per-field onBlur validation ───────────────────────────────────────────
    const validateField = (field: string, value: string) => {
        const e = { ...errors };
        switch (field) {
            case "email":
                if (value && !/^[^\s@]+@gmail\.com$/.test(value.toLowerCase()))
                    e.email = "Gunakan email Gmail. Contoh: nama@gmail.com";
                else delete e.email; break;
            case "phone_number":
                if (value && !/^08[0-9]{8,12}$/.test(value))
                    e.phone_number = "Nomor harus diawali 08, minimal 10 digit.";
                else delete e.phone_number; break;
            case "family_card_number":
                if (value && !/^\d{16}$/.test(value))
                    e.family_card_number = "Nomor KK harus tepat 16 digit angka.";
                else delete e.family_card_number; break;
            case "postal_code":
                if (value && !/^\d{5}$/.test(value))
                    e.postal_code = "Kode pos harus 5 digit angka.";
                else delete e.postal_code; break;
            case "school_npsn":
                if (value && !/^\d{8}$/.test(value))
                    e.school_npsn = "NPSN harus 8 digit angka.";
                else delete e.school_npsn; break;
        }
        setErrors(e);
    };

    // ── Validate per-tab ──────────────────────────────────────────────────────
    const validateTab = (tabId: TabId): boolean => {
        const required = REQUIRED_BY_TAB[tabId] ?? [];
        const currentValues: Record<string, string> = {
            religion,
            program_choice: programChoice,
        };

        const newErrors: Record<string, string> = {};
        required.forEach(field => {
            if (!currentValues[field]) newErrors[field] = "Field ini wajib diisi.";
        });

        // Validasi format per tab
        if (tabId === "identitas") {
            if (email       && !/^[^\s@]+@gmail\.com$/.test(email.toLowerCase()))
                newErrors.email = "Gunakan email Gmail. Contoh: nama@gmail.com";
            if (phoneNumber && !/^08[0-9]{8,12}$/.test(phoneNumber))
                newErrors.phone_number = "Nomor harus diawali 08, minimal 10 digit.";
            if (familyCardNo && !/^\d{16}$/.test(familyCardNo))
                newErrors.family_card_number = "Nomor KK harus tepat 16 digit angka.";
            if (childOrder   && (isNaN(+childOrder)   || +childOrder   < 1  || +childOrder   > 20))
                newErrors.child_order = "Anak ke-berapa tidak valid (1–20).";
            if (siblingsCount && (isNaN(+siblingsCount) || +siblingsCount < 0 || +siblingsCount > 20))
                newErrors.siblings_count = "Jumlah saudara tidak valid (0–20).";
        }
        if (tabId === "alamat") {
            if (postalCode && !/^\d{5}$/.test(postalCode))
                newErrors.postal_code = "Kode pos harus 5 digit angka.";
            if (schoolNpsn && !/^\d{8}$/.test(schoolNpsn))
                newErrors.school_npsn = "NPSN harus 8 digit angka.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...newErrors }));
            setTimeout(() => {
                animate(".input-error", {
                    translateX: [0, -6, 6, -4, 4, 0], duration: 380, ease: "outExpo",
                });
            }, 50);
            swalDark.fire({
                toast: true, position: "top-end", icon: "warning",
                title: "Data belum terisi",
                text: "Lengkapi field yang ditandai merah terlebih dahulu.",
                showConfirmButton: false, timer: 3000, timerProgressBar: true,
            });
            return false;
        }
        return true;
    };

    // ── Submit per-tab + auto pindah ke tab berikutnya ────────────────────────
    const handleTabSubmit = (tabId: TabId) => {
        if (!validateTab(tabId)) return;

        type Payload = Record<string, string | number | boolean | null | string[]>;
        const payloads: Record<string, Payload> = {
            identitas: {
                religion, email: email || null, phone_number: phoneNumber || null,
                birth_certificate_number: birthCertNo  || null,
                family_card_number:       familyCardNo || null,
                child_order:    childOrder    ? +childOrder    : null,
                siblings_count: siblingsCount ? +siblingsCount : null,
            },
            alamat: {
                postal_code: postalCode || null, school_npsn: schoolNpsn || null,
                certificate_number: certNumber || null, is_transfer: isTransfer,
            },
            minat: {
                hobbies: hobbies || null, ambitions: ambitions || null,
                habits:  habits  || null,
                extracurricular_interests: extracts.length > 0 ? extracts : null,
            },
            program: {
                program_choice: programChoice || null,
                major_choice:   majorChoice   || null,
            },
        };

        setSubmitting(true);
        router.put(route("dashboard.data-diri.update"), payloads[tabId] ?? {}, {
            onError: (errs) => {
                setErrors(prev => ({ ...prev, ...errs }));
                setSubmitting(false);
                setTimeout(() => {
                    animate(".input-error", {
                        translateX: [0, -6, 6, -4, 4, 0], duration: 380, ease: "outExpo",
                    });
                }, 50);
            },
            onSuccess: () => {
                setSubmitting(false);
                const tabFields = REQUIRED_BY_TAB[tabId] ?? [];
                setErrors(prev => {
                    const next = { ...prev };
                    tabFields.forEach(f => delete next[f]);
                    return next;
                });
                swalDark.fire({
                    toast: true, position: "top-end", icon: "success",
                    title: "Tersimpan!", showConfirmButton: false,
                    timer: 2000, timerProgressBar: true,
                });
                const currentIdx = TABS.findIndex(t => t.id === tabId);
                const nextTab    = TABS[currentIdx + 1];
                if (nextTab) handleTabChange(nextTab.id);
            },
            preserveScroll: true,
        });
    };

    // ── Submit semua (dari Rangkuman) — konfirmasi 2 langkah ─────────────────
    const handleSubmitAll = async () => {
        const identitasValid = validateTab("identitas");
        const programValid   = validateTab("program");

        if (!identitasValid || !programValid) {
            if (!identitasValid) handleTabChange("identitas");
            else handleTabChange("program");
            swalDark.fire({
                icon: "warning", title: "Ada yang perlu dilengkapi",
                text: "Silakan periksa kembali isian yang ditandai merah.",
                confirmButtonText: "OK",
            });
            return;
        }

        const confirm1 = await swalDark.fire({
            icon: "question", title: "Data sudah sesuai?",
            text: "Pastikan semua informasi yang kamu isi sudah benar sebelum dikirim.",
            showCancelButton: true,
            confirmButtonText: "<i class='fa-solid fa-paper-plane mr-2'></i> Tetap Kirim",
            cancelButtonText:  "<i class='fa-solid fa-arrow-left mr-2'></i> Cek Lagi",
            reverseButtons: true,
        });
        if (!confirm1.isConfirmed) { handleTabChange("identitas"); return; }

        setSubmitting(true);
        router.put(route("dashboard.data-diri.update"), {
            religion, email: email || null, phone_number: phoneNumber || null,
            birth_certificate_number:  birthCertNo   || null,
            family_card_number:        familyCardNo  || null,
            child_order:    childOrder    ? +childOrder    : null,
            siblings_count: siblingsCount ? +siblingsCount : null,
            postal_code:    postalCode    || null,
            school_npsn:    schoolNpsn    || null,
            certificate_number: certNumber || null,
            is_transfer: isTransfer,
            hobbies: hobbies || null, ambitions: ambitions || null,
            habits:  habits  || null,
            extracurricular_interests: extracts.length > 0 ? extracts : null,
            program_choice: programChoice || null,
            major_choice:   majorChoice   || null,
        }, {
            onError: (errs) => {
                setErrors(errs);
                setSubmitting(false);
                const identitasFields = ["religion","email","phone_number",
                    "family_card_number","child_order","siblings_count"];
                const alamatFields    = ["postal_code","school_npsn"];
                const errKeys = Object.keys(errs);
                if      (errKeys.some(k => identitasFields.includes(k))) handleTabChange("identitas");
                else if (errKeys.some(k => alamatFields.includes(k)))    handleTabChange("alamat");
                else if (errs.program_choice)                            handleTabChange("program");
            },
            onSuccess: () => {
                setSubmitting(false);
                setErrors({});
                swalDark.fire({
                    icon: "success", title: "Data Tersimpan!",
                    text: "Semua data diri kamu telah berhasil dikirim.",
                    confirmButtonText: "Oke, Terima Kasih!",
                });
            },
            preserveScroll: true,
        });
    };

    // ── Change request ────────────────────────────────────────────────────────
    const handleChangeRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const err: Record<string, string> = {};
        if (!changeField)                  err.cr_field  = "Pilih data yang ingin diubah.";
        if (!changeNewValue)               err.cr_value  = "Nilai baru wajib diisi.";
        if (!changeReason)                 err.cr_reason = "Alasan wajib diisi (min. 10 karakter).";
        else if (changeReason.length < 10) err.cr_reason = "Alasan terlalu singkat (min. 10 karakter).";
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
                swalDark.fire({
                    icon: "success", title: "Pengajuan Terkirim",
                    text: "Menunggu persetujuan staff.", timer: 2000, showConfirmButton: false,
                });
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
                    <div className="w-16 h-16 rounded-2xl dark:bg-white/5 bg-slate-100
                                    flex items-center justify-center">
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
                    completion={completion}
                    tips={[
                        "Isi sesuai dokumen resmi (KK, Akta Kelahiran)",
                        "Email harus Gmail aktif yang bisa dihubungi",
                        "Nomor HP harus aktif — dipakai untuk komunikasi",
                        "Lengkapi semua data untuk mempercepat verifikasi",
                    ]}
                />
            }
        >
            <Head title="Data Diri" />

            <div className="space-y-5 px-4 py-6 sm:px-6">

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="datadiri-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl
                                        dark:bg-blue-500/10 bg-blue-50
                                        border dark:border-blue-500/20 border-blue-200
                                        flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-id-card text-blue-400 text-sm"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold dark:text-slate-100 text-slate-800">
                                Data Diri
                            </h1>
                            <p className="text-sm dark:text-slate-400 text-slate-500 mt-0.5">
                                Informasi pribadi &amp; pilihan program pendaftaran
                            </p>
                        </div>
                    </div>
                </div>

                {data_change_request_result && (
                    <div className="datadiri-card">
                        <RequestStatusBanner
                            tone={data_change_request_result.status === "approved" ? "emerald" : "red"}
                            icon={data_change_request_result.status === "approved" ? "fa-solid fa-file-circle-check" : "fa-solid fa-file-circle-xmark"}
                            title={data_change_request_result.status === "approved" ? "Permintaan perubahan data disetujui" : "Permintaan perubahan data ditolak"}
                            description={
                                data_change_request_result.status === "approved"
                                    ? `Permintaan perubahan data ${data_change_request_result.field_label.toLowerCase()} disetujui oleh ${reviewedByLabel(data_change_request_result.reviewed_by_name)}. Data kamu sudah diperbarui.`
                                    : `Permintaan perubahan data ditolak oleh ${reviewedByLabel(data_change_request_result.reviewed_by_name)}.${data_change_request_result.rejection_reason ? ` Alasan: ${data_change_request_result.rejection_reason}.` : ""}`
                            }
                            meta={data_change_request_result.reviewed_at ? `Ditinjau ${data_change_request_result.reviewed_at}` : null}
                        />
                    </div>
                )}

                {/* ── Tab navigation — pill style ──────────────────────────── */}
                <div className="datadiri-card">
                    <div className="flex overflow-x-auto rounded-xl
                                    border dark:border-content-border border-black/[0.08]
                                    dark:bg-content-card bg-slate-50
                                    p-1 gap-1 no-scrollbar">
                        {TABS.map((tab) => {
                            const isActive    = activeTab === tab.id;
                            const isRangkuman = tab.id === "rangkuman";
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabChange(tab.id)}
                                    className={[
                                        "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg",
                                        "px-2 py-2 sm:px-3 text-xs font-semibold",
                                        "transition-all duration-200 min-w-[36px] min-h-[36px]",
                                        isActive
                                            ? "dark:bg-blue-500 bg-blue-500 text-white shadow-sm"
                                            : "dark:text-slate-400 text-slate-500 dark:hover:bg-content-muted hover:bg-black/[0.04] dark:hover:text-slate-300 hover:text-slate-700",
                                    ].join(" ")}
                                >
                                    <i className={`${tab.icon} text-xs shrink-0`} />
                                    {/* Label hanya tampil di sm ke atas */}
                                    <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>

                                    {/* Dot amber — Rangkuman kalau ada field kosong */}
                                    {isRangkuman && hasEmptyRequired && !isActive && (
                                        <span className="absolute -right-0.5 -top-0.5
                                                         h-2 w-2 rounded-full bg-amber-400" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Tab content ───────────────────────────────────────────── */}
                <div
                    ref={tabContentRef}
                    className="datadiri-card rounded-xl
                               dark:border dark:border-content-border border border-black/[0.07]
                               dark:bg-content-surface bg-white
                               p-5 sm:p-6 min-h-[420px]"
                >
                    {activeTab === "identitas" && (
                        <TabIdentitas
                            candidate={candidate}
                            religion={religion}         phoneNumber={phoneNumber}
                            email={email}               birthCertNo={birthCertNo}
                            familyCardNo={familyCardNo} childOrder={childOrder}
                            siblingsCount={siblingsCount}
                            errors={errors}
                            showChangeForm={showChangeForm}
                            changeField={changeField}     changeNewValue={changeNewValue}
                            changeReason={changeReason}   crProcessing={crProcessing}
                            setReligion={setReligion}         setPhoneNumber={setPhoneNumber}
                            setEmail={setEmail}               setBirthCertNo={setBirthCertNo}
                            setFamilyCardNo={setFamilyCardNo} setChildOrder={setChildOrder}
                            setSiblingsCount={setSiblingsCount}
                            setShowChangeForm={setShowChangeForm}
                            setChangeField={setChangeField}   setChangeNewValue={setChangeNewValue}
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
                            isTransfer={isTransfer}
                            errors={errors}
                            setPostalCode={setPostalCode} setSchoolNpsn={setSchoolNpsn}
                            setCertNumber={setCertNumber} setIsTransfer={setIsTransfer}
                            validateField={validateField}
                        />
                    )}

                    {activeTab === "minat" && (
                        <TabMinat
                            hobbies={hobbies}   ambitions={ambitions}
                            habits={habits}     extracts={extracts}
                            setHobbies={setHobbies}   setAmbitions={setAmbitions}
                            setHabits={setHabits}     setExtracts={setExtracts}
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

                    {activeTab === "rangkuman" && (
                        <TabRangkuman
                            candidate={{
                                full_name:           candidate.full_name,
                                nisn:                candidate.nisn,
                                nik:                 candidate.nik,
                                gender_label:        candidate.gender_label,
                                date_of_birth_label: candidate.date_of_birth_label,
                                place_of_birth:      candidate.place_of_birth,
                                school_origin:       candidate.school_origin,
                                address_full:        candidate.address_full,
                            }}
                            formState={{
                                religion, phoneNumber, email, birthCertNo, familyCardNo,
                                childOrder, siblingsCount, postalCode, schoolNpsn, certNumber,
                                isTransfer, hobbies, ambitions, habits, extracts,
                                programChoice, majorChoice,
                            }}
                            emptyRequiredFields={emptyRequiredFields}
                            progressGradient={progressGradient}
                            completion={completion}
                            submitting={submitting}
                            onNavigateToTab={handleTabChange}
                            onSubmitAll={handleSubmitAll}
                        />
                    )}
                </div>

                {/* ── Navigasi tab — Kembali & Simpan & Lanjut ─────────────── */}
                {(() => {
                    const currentIdx  = TABS.findIndex(t => t.id === activeTab);
                    const prevTab     = TABS[currentIdx - 1];
                    const nextTab     = TABS[currentIdx + 1];
                    const isRangkuman = activeTab === "rangkuman";

                    return (
                        <div className="datadiri-card flex items-center justify-between gap-3">
                            {/* Tombol Kembali */}
                            {prevTab ? (
                                <button
                                    type="button"
                                    onClick={() => handleTabChange(prevTab.id)}
                                    className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl
                                               dark:bg-white/[0.05] bg-slate-100
                                               dark:hover:bg-white/[0.08] hover:bg-slate-200
                                               dark:text-slate-300 text-slate-600
                                               text-sm font-semibold transition-all duration-200
                                               active:scale-95 min-h-[44px] whitespace-nowrap"
                                >
                                    <i className="fa-solid fa-arrow-left text-xs"></i>
                                    <span>Kembali</span>
                                </button>
                            ) : <div />}

                            {/* Tombol kanan — hanya muncul kalau bukan tab rangkuman */}
                            {!isRangkuman ? (
                                <button
                                    type="button"
                                    onClick={() => handleTabSubmit(activeTab)}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl
                                               bg-blue-500 hover:bg-blue-400
                                               text-white text-sm font-semibold whitespace-nowrap
                                               transition-all duration-200 active:scale-95
                                               disabled:opacity-60 disabled:cursor-not-allowed
                                               min-h-[44px]"
                                >
                                    {submitting
                                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...</>
                                        : nextTab
                                            ? <><i className="fa-solid fa-floppy-disk"></i> Simpan &amp; Lanjut <i className="fa-solid fa-arrow-right text-xs ml-1"></i></>
                                            : <><i className="fa-solid fa-floppy-disk"></i> Simpan Data</>
                                    }
                                </button>
                            ) : (
                                // Rangkuman — tombol Kirim & Selesaikan ada di dalam TabRangkuman
                                <div />
                            )}
                        </div>
                    );
                })()}

            </div>
        </DashboardSplitLayout>
    );
}
