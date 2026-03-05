import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { Head, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type UserData = {
    id:                 number;
    name:               string;
    email:              string;
    avatar_url:         string | null;
    initials:           string;
    whatsapp_number:    string | null;
    has_pending_email:  boolean;
    pending_email:      string | null;
    email_verified:     boolean;
};

type CandidateData = {
    full_name:      string;
    nisn:           string;
    nik:            string;
    status:         string;
    address_full:   string;
    admission_wave: { title: string; academic_year: string } | null;
} | null;

type Props = {
    user:      UserData;
    candidate: CandidateData;
    flash?:    { success?: string };
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

export default function ProfilePage({ user, candidate, flash }: Props) {
    const avatarRef = useRef<HTMLInputElement>(null);

    // ── Form state ────────────────────────────────────────────────────────────
    const [name, setName]                       = useState(user.name);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword]         = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [newEmail, setNewEmail]               = useState("");
    const [errors, setErrors]                   = useState<Record<string, string>>({});
    const [processing, setProcessing]           = useState(false);
    const [avatarProcessing, setAvatarProcessing] = useState(false);
    const [emailProcessing, setEmailProcessing]   = useState(false);

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

    // ── Submit avatar ─────────────────────────────────────────────────────────
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarProcessing(true);
        const fd = new FormData();
        fd.append("avatar", file);

        router.post(route("dashboard.profile.avatar.update"), fd, {
            onSuccess: () => {
                // Reload data user dari server — supaya avatar_url terbaru (dengan timestamp baru) ikut ter-update
                router.reload({ only: ["user"] });
            },
            onFinish: () => {
                setAvatarProcessing(false);
                if (avatarRef.current) avatarRef.current.value = "";
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
        router.delete(route("dashboard.profile.email.cancel"));
    };

    return (
        <DashboardLayout>
            <Head title="Profil Saya" />

            <div className="flex flex-col gap-6 max-w-4xl">

                {/* ── [1] FLASH MESSAGE ─────────────────────────────────────── */}
                {flash?.success && (
                    <div className="card-item opacity-0 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                        <i className="fa-solid fa-circle-check text-emerald-500"></i>
                        <p className="text-sm font-semibold text-emerald-700">{flash.success}</p>
                    </div>
                )}

                {/* ── [2] AVATAR + IDENTITAS AKUN ───────────────────────────── */}
                <div className="card-item opacity-0 bg-navy rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">

                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gold/20 border-2 border-gold/30 flex items-center justify-center">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
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
                            accept=".jpg,.jpeg,.png,.webp"
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ── [3] DATA KANDIDAT READ-ONLY ───────────────────────── */}
                    {candidate && (
                        <div className="card-item opacity-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-soft">
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
                    )}

                    {/* ── [4] EDIT NAMA & PASSWORD ──────────────────────────── */}
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

                </div>

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
                    {user.has_pending_email ? (
                        <div className="flex flex-col gap-3">
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                                <i className="fa-solid fa-clock text-amber-500 mt-0.5 shrink-0"></i>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                                        Menunggu Persetujuan Staff
                                    </p>
                                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                                        Request ganti email ke <span className="font-semibold">{user.pending_email}</span> sedang diproses.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancelEmail}
                                className="self-start text-xs font-semibold text-red-500 hover:text-red-700 transition flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-xmark text-[10px]"></i>
                                Batalkan request
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleEmailRequest} className="flex flex-col gap-4">
                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-start gap-2">
                                <i className="fa-solid fa-circle-info text-slate-400 mt-0.5 text-xs shrink-0"></i>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Permintaan ganti email memerlukan persetujuan staff terlebih dahulu sebelum diproses.
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

            </div>
        </DashboardLayout>
    );
}