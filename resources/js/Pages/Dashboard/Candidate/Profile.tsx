import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { Head, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import RequestStatusBanner from "@/Components/Dashboard/Candidate/Shared/RequestStatusBanner";
import ResizableSplitGrid from "@/Components/Dashboard/Shared/ResizableSplitGrid";
import AvatarCropperModal from "@/Components/UI/AvatarCropperModal";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type UserData = {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    initials: string;
    whatsapp_number: string | null;
    email_verified: boolean;
};

type EmailChangeRequest = {
    status: "pending" | "approved" | "rejected";
    current_email: string;
    pending_email: string;
    requested_at: string | null;
    reviewed_by_name: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    can_apply: boolean;
    can_cancel: boolean;
} | null;

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

type CandidateData = {
    full_name:      string;
    nisn:           string;
    nik:            string;
    status:         string;
    address_full:   string;
    admission_wave: { title: string; academic_year: string } | null;
} | null;

type Props = {
    user: UserData;
    candidate: CandidateData;
    email_change_request: EmailChangeRequest;
    data_change_request_result: DataChangeRequestResult;
    flash?: { success?: string; error?: string };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        draft:     "bg-slate-100 text-slate-600",
        submitted: "bg-blue-50 text-blue-600",
        verified:  "bg-amber-50 text-amber-600",
        accepted:  "bg-emerald-50 text-emerald-700",
        rejected:  "bg-red-50 text-red-600",
    };
    return map[status] ?? "bg-slate-100 text-slate-500";
};

const statusLabel = (status: string) => {
    const map: Record<string, string> = {
        draft:     "Draft",
        submitted: "Menunggu Verifikasi",
        verified:  "Terverifikasi",
        accepted:  "Diterima",
        rejected:  "Ditolak",
    };
    return map[status] ?? status;
};

const reviewedByLabel = (name: string | null | undefined) => name ?? "petugas";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Label + value row untuk data read-only */
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">
                {label}
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {value ?? "-"}
            </p>
        </div>
    );
}

/** Input field reusable */
function FormInput({
    label, type = "text", value, onChange, error, placeholder, hint,
}: {
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    placeholder?: string;
    hint?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-gold transition bg-white dark:bg-slate-800 placeholder:text-slate-400"
            />
            {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
            {error && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                    {error}
                </p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage({
    user,
    candidate,
    email_change_request,
    data_change_request_result,
    flash,
}: Props) {
    const avatarRef = useRef<HTMLInputElement>(null);

    // ── Form state ────────────────────────────────────────────────────────────
    const [name, setName]                       = useState(user.name);
    const [avatarUrl, setAvatarUrl]             = useState(user.avatar_url);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword]         = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [newEmail, setNewEmail]               = useState("");
    const [errors, setErrors]                   = useState<Record<string, string>>({});
    const [processing, setProcessing]           = useState(false);
    const [avatarProcessing, setAvatarProcessing] = useState(false);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [isCropOpen, setIsCropOpen]           = useState(false);
    const [emailProcessing, setEmailProcessing]   = useState(false);
    const [applyEmailProcessing, setApplyEmailProcessing] = useState(false);

    useEffect(() => {
        setAvatarUrl(user.avatar_url);
    }, [user.avatar_url]);

    // ── Entrance animation ────────────────────────────────────────────────────
    useEffect(() => {
        animate(".card-item", {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(80),
            ease:       "outExpo",
        });
    }, []);

    // ── Submit update profile (nama + password) ───────────────────────────────
    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (newPassword && newPassword !== confirmPassword) {
            setErrors({ confirm_password: "Konfirmasi password tidak cocok." });
            return;
        }

        setProcessing(true);
        router.put(route("dashboard.profile.update"), {
            name,
            current_password: currentPassword || undefined,
            new_password:     newPassword || undefined,
            new_password_confirmation: confirmPassword || undefined,
        }, {
            onError:  (e) => setErrors(e),
            onSuccess: () => {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            },
            onFinish: () => setProcessing(false),
        });
    };

    // ── Select avatar file for cropping ───────────────────────────────────────
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedAvatarFile(file);
        setIsCropOpen(true);
        if (avatarRef.current) avatarRef.current.value = "";
    };

    // ── Upload cropped avatar ─────────────────────────────────────────────────
    const handleCroppedAvatar = (croppedFile: File) => {
        setAvatarProcessing(true);
        const fd = new FormData();
        fd.append("avatar", croppedFile);

        router.post(route("dashboard.profile.avatar.update"), fd, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload();
            },
            onFinish: () => {
                setAvatarProcessing(false);
            },
        });
    };

    // ── Request ganti email ───────────────────────────────────────────────────
    const handleEmailRequest = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setEmailProcessing(true);

        router.post(route("dashboard.profile.email.request"), { new_email: newEmail }, {
            onError:  (e) => setErrors(e),
            onSuccess: () => setNewEmail(""),
            onFinish: () => setEmailProcessing(false),
        });
    };

    // ── Cancel ganti email ────────────────────────────────────────────────────
    const handleCancelEmail = () => {
        router.delete(route("dashboard.profile.email.cancel"), {
            preserveScroll: true,
        });
    };

    const handleApplyApprovedEmail = () => {
        setApplyEmailProcessing(true);

        router.post(route("dashboard.profile.email.apply"), {}, {
            preserveScroll: true,
            onFinish: () => setApplyEmailProcessing(false),
        });
    };

    const canShowEmailForm = !email_change_request || email_change_request.status === "rejected";

    return (
        <DashboardLayout>
            <Head title="Profil Saya" />

            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">

                {/* ── [1] FLASH MESSAGE ─────────────────────────────────────── */}
                {flash?.success && (
                    <div className="card-item opacity-0 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                        <i className="fa-solid fa-circle-check text-emerald-500"></i>
                        <p className="text-sm font-semibold text-emerald-700">{flash.success}</p>
                    </div>
                )}
                {flash?.error && (
                    <div className="card-item opacity-0 bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                        <i className="fa-solid fa-circle-exclamation text-red-500"></i>
                        <p className="text-sm font-semibold text-red-700">{flash.error}</p>
                    </div>
                )}

                {data_change_request_result && (
                    <div className="card-item opacity-0">
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

                {email_change_request && email_change_request.status !== "pending" && (
                    <div className="card-item opacity-0">
                        <RequestStatusBanner
                            tone={email_change_request.status === "approved" ? "amber" : "red"}
                            icon={email_change_request.status === "approved" ? "fa-solid fa-envelope-circle-check" : "fa-solid fa-envelope-circle-xmark"}
                            title={email_change_request.status === "approved" ? "Perubahan email siap diterapkan" : "Permintaan perubahan email ditolak"}
                            description={
                                email_change_request.status === "approved"
                                    ? `Perubahan email ke ${email_change_request.pending_email} telah disetujui dan diverifikasi manual oleh ${reviewedByLabel(email_change_request.reviewed_by_name)}. Login masih menggunakan email lama sampai kamu menerapkannya sendiri.`
                                    : `Permintaan perubahan email ditolak oleh ${reviewedByLabel(email_change_request.reviewed_by_name)}.${email_change_request.rejection_reason ? ` Alasan: ${email_change_request.rejection_reason}.` : ""}`
                            }
                            meta={email_change_request.reviewed_at ? `Ditinjau ${email_change_request.reviewed_at}` : null}
                            actions={email_change_request.can_apply ? [{
                                label: "Terapkan Email Baru",
                                icon: applyEmailProcessing ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-check",
                                onClick: handleApplyApprovedEmail,
                                disabled: applyEmailProcessing,
                            }] : []}
                        />
                    </div>
                )}

                {/* ── [2] AVATAR + IDENTITAS AKUN ───────────────────────────── */}
                <div className="card-item opacity-0 bg-navy rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">

                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gold/20 border-2 border-gold/30 flex items-center justify-center">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-display font-bold text-gold">
                                    {user.initials}
                                </span>
                            )}
                        </div>

                        {/* Tombol ganti avatar */}
                        <button
                            onClick={() => avatarRef.current?.click()}
                            disabled={avatarProcessing}
                            className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-gold hover:bg-goldhover text-navy flex items-center justify-center shadow-glow transition disabled:opacity-50"
                            title="Ganti avatar"
                        >
                            {avatarProcessing
                                ? <i className="fa-solid fa-spinner fa-spin text-[11px]"></i>
                                : <i className="fa-solid fa-camera text-[11px]"></i>
                            }
                        </button>
                        <input
                            ref={avatarRef}
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>

                    {/* Info akun */}
                    <div className="flex-1 text-center sm:text-left">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold mb-1">
                            Profil Akun
                        </p>
                        <h1 className="text-xl font-display font-bold text-white">
                            {user.name}
                        </h1>
                        <p className="text-sm text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-2">
                            <i className="fa-solid fa-envelope text-xs"></i>
                            {user.email}
                            {user.email_verified
                                ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400"><i className="fa-solid fa-circle-check text-[9px]"></i>Terverifikasi</span>
                                : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400"><i className="fa-solid fa-circle-exclamation text-[9px]"></i>Belum verifikasi</span>
                            }
                        </p>
                        {user.whatsapp_number && (
                            <p className="text-sm text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-2">
                                <i className="fa-brands fa-whatsapp text-xs text-emerald-400"></i>
                                {user.whatsapp_number}
                            </p>
                        )}
                    </div>
                </div>

                <ResizableSplitGrid
                    storageKey="candidate-profile"
                    initialLeftWidth={400}
                    minLeftWidth={300}
                    maxLeftWidth={600}
                    left={
                        candidate ? (
                            <div className="card-item opacity-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-soft h-full">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-sm font-display font-semibold text-slate-800 dark:text-white">
                                        Data Pendaftaran
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${statusBadge(candidate.status)}`}>
                                            {statusLabel(candidate.status)}
                                        </span>
                                        <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                                            <i className="fa-solid fa-id-card text-gold text-xs"></i>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <InfoRow label="Nama Lengkap"   value={candidate.full_name} />
                                    <InfoRow label="NISN"           value={candidate.nisn} />
                                    <InfoRow label="NIK"            value={candidate.nik} />
                                    <InfoRow label="Alamat"         value={candidate.address_full} />
                                    <InfoRow
                                        label="Gelombang"
                                        value={candidate.admission_wave
                                            ? `${candidate.admission_wave.title} — ${candidate.admission_wave.academic_year}`
                                            : null
                                        }
                                    />
                                </div>

                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-5 flex items-center gap-1.5">
                                    <i className="fa-solid fa-lock text-[10px]"></i>
                                    Data ini tidak dapat diubah. Hubungi staff jika ada kesalahan.
                                </p>
                            </div>
                        ) : <div />
                    }
                    right={
                        <div className="card-item opacity-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-soft">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-sm font-display font-semibold text-slate-800 dark:text-white">
                                    Edit Akun
                                </h2>
                                <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                                    <i className="fa-solid fa-pen text-gold text-xs"></i>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                                <FormInput
                                    label="Nama Akun"
                                    value={name}
                                    onChange={setName}
                                    error={errors.name}
                                    placeholder="Nama tampilan akun"
                                />

                                <div className="border-t border-slate-100 dark:border-white/5 pt-4">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                                        Ganti Password <span className="font-normal">(kosongkan jika tidak ingin ganti)</span>
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <FormInput
                                            label="Password Saat Ini"
                                            type="password"
                                            value={currentPassword}
                                            onChange={setCurrentPassword}
                                            error={errors.current_password}
                                            placeholder="••••••••"
                                        />
                                        <FormInput
                                            label="Password Baru"
                                            type="password"
                                            value={newPassword}
                                            onChange={setNewPassword}
                                            error={errors.new_password}
                                            placeholder="Min. 8 karakter"
                                            hint="Minimal 8 karakter"
                                        />
                                        <FormInput
                                            label="Konfirmasi Password Baru"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={setConfirmPassword}
                                            error={errors.confirm_password}
                                            placeholder="Ulangi password baru"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-gold hover:bg-goldhover disabled:opacity-50 text-navy px-5 py-2.5 rounded-xl font-semibold text-sm shadow-glow transition hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {processing
                                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...</>
                                        : <><i className="fa-solid fa-floppy-disk"></i> Simpan Perubahan</>
                                    }
                                </button>
                            </form>
                        </div>
                    }
                />

                {/* ── [5] REQUEST GANTI EMAIL ───────────────────────────────── */}
                <div className="card-item opacity-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-display font-semibold text-slate-800 dark:text-white">
                            Ganti Email
                        </h2>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <i className="fa-solid fa-envelope text-amber-500 text-xs"></i>
                        </div>
                    </div>

                    {/* Sudah ada request pending */}
                    {email_change_request?.status === "pending" ? (
                        <div className="flex flex-col gap-3">
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                                <i className="fa-solid fa-clock text-amber-500 mt-0.5 shrink-0"></i>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                                        Menunggu Persetujuan Staff
                                    </p>
                                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                                        Request ganti email ke <span className="font-semibold">{email_change_request.pending_email}</span> sedang diproses.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCancelEmail}
                                className="self-start text-xs font-semibold text-red-500 hover:text-red-700 transition flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-xmark text-[10px]"></i>
                                Batalkan request
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {email_change_request?.status === "approved" && (
                                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <i className="fa-solid fa-shield-check text-blue-500 mt-0.5 shrink-0"></i>
                                        <div>
                                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                                Email baru sudah disetujui dan diverifikasi manual
                                            </p>
                                            <p className="text-xs text-blue-700 dark:text-blue-200 mt-0.5">
                                                Staff/admin sudah memeriksa email ini. Login tetap memakai email lama sampai kamu menekan tombol terapkan untuk <span className="font-semibold">{email_change_request.pending_email}</span>.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleApplyApprovedEmail}
                                        disabled={applyEmailProcessing}
                                        className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <i className={`${applyEmailProcessing ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-check"} text-xs`}></i>
                                        Terapkan Email Baru
                                    </button>
                                </div>
                            )}

                            {email_change_request?.status === "rejected" && (
                                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <i className="fa-solid fa-circle-exclamation text-red-500 mt-0.5 shrink-0"></i>
                                    <div>
                                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                                            Ajukan email baru jika diperlukan
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-200 mt-0.5">
                                            Request sebelumnya tidak diproses ke email login. Kamu bisa mengirim permintaan baru dari form di bawah.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {canShowEmailForm && (
                                <form onSubmit={handleEmailRequest} className="flex flex-col gap-4">
                                    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-start gap-2">
                                        <i className="fa-solid fa-circle-info text-slate-400 mt-0.5 text-xs shrink-0"></i>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Permintaan ganti email memerlukan persetujuan dan verifikasi manual staff/admin terlebih dahulu. Email login lama tetap aktif sampai kamu menerapkan email baru yang sudah disetujui.
                                        </p>
                                    </div>

                                    <FormInput
                                        label="Email Baru"
                                        type="email"
                                        value={newEmail}
                                        onChange={setNewEmail}
                                        error={errors.new_email}
                                        placeholder="email@baru.com"
                                    />

                                    <button
                                        type="submit"
                                        disabled={emailProcessing || !newEmail}
                                        className="self-start bg-navy hover:bg-navy/90 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                                    >
                                        {emailProcessing
                                            ? <><i className="fa-solid fa-spinner fa-spin"></i> Mengirim...</>
                                            : <><i className="fa-solid fa-paper-plane"></i> Kirim Request</>
                                        }
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* ── [6] AVATAR CROPPER MODAL ─────────────────────────────── */}
                <AvatarCropperModal
                    isOpen={isCropOpen}
                    imageFile={selectedAvatarFile}
                    onClose={() => {
                        setIsCropOpen(false);
                        setSelectedAvatarFile(null);
                    }}
                    onCropComplete={handleCroppedAvatar}
                    title="Sesuaikan Foto Profil Kandidat"
                />

            </div>
        </DashboardLayout>
    );
}
