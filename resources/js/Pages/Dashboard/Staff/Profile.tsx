import { useEffect, useRef, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import Swal from "sweetalert2";
import DashboardSplitLayout from "@/Layouts/DashboardSplitLayout";
import StaffSidebar from "@/Components/Dashboard/Staff/Shared/StaffSidebar";
import type { PageProps } from "@/types";

type UserData = {
    id:              number;
    name:            string;
    email:           string;
    role:            "staff" | "admin" | "candidate";
    is_active:       boolean;
    avatar_url:      string | null;
    initials:        string;
    whatsapp_number: string | null;
};

type Props = {
    user: UserData;
    flash?: { success?: string; error?: string };
};

const swalDark = Swal.mixin({
    background: "#0f172a",
    color: "#e2e8f0",
    confirmButtonColor: "#10b981",
    cancelButtonColor: "#334155",
    customClass: {
        popup: "!rounded-2xl !border !border-white/10",
        confirmButton: "!rounded-xl !px-6",
        cancelButton: "!rounded-xl !px-6",
    },
});

export default function StaffProfile({ user, flash }: Props) {
    const { auth } = usePage<PageProps>().props;
    const avatarRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(user.name);
    const [whatsapp, setWhatsapp] = useState(user.whatsapp_number ?? "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [avatarProcessing, setAvatarProcessing] = useState(false);

    useEffect(() => {
        animate(".staff-profile-item", {
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 520,
            delay: stagger(70),
            ease: "outExpo",
        });
    }, []);

    useEffect(() => {
        if (flash?.success) {
            swalDark.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: flash.success,
                showConfirmButton: false,
                timer: 2200,
                timerProgressBar: true,
            });
        }
        if (flash?.error) {
            swalDark.fire({
                icon: "error",
                title: "Gagal",
                text: flash.error,
            });
        }
    }, [flash]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (newPassword && newPassword !== confirmPassword) {
            setErrors({ new_password_confirmation: "Konfirmasi password tidak cocok." });
            return;
        }

        const confirm = await swalDark.fire({
            title: "Simpan perubahan profil?",
            text: "Pastikan data staff sudah sesuai sebelum disimpan.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, simpan",
            cancelButtonText: "Batal",
        });

        if (!confirm.isConfirmed) return;

        setProcessing(true);
        router.put(
            "/dashboard/staff/profile",
            {
                name,
                whatsapp_number: whatsapp || undefined,
                current_password: currentPassword || undefined,
                new_password: newPassword || undefined,
                new_password_confirmation: confirmPassword || undefined,
            },
            {
                preserveScroll: true,
                onError: (e) => setErrors(e as Record<string, string>),
                onSuccess: () => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fd = new FormData();
        fd.append("avatar", file);

        setAvatarProcessing(true);
        router.post("/dashboard/staff/profile/avatar", fd, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ["user"] }),
            onError: (e) => setErrors(e as Record<string, string>),
            onFinish: () => {
                setAvatarProcessing(false);
                if (avatarRef.current) avatarRef.current.value = "";
            },
        });
    };

    return (
        <DashboardSplitLayout
            aside={
                <StaffSidebar
                    user={auth.user}
                    candidate={{
                        full_name: user.name,
                        candidate_code: "-",
                        status: "verified",
                        admission_wave: "Staff Internal",
                    }}
                    completion={100}
                    tips={[
                        "Gunakan nama resmi staff untuk audit trail.",
                        "Nomor WhatsApp dipakai untuk koordinasi operasional.",
                        "Update password secara berkala untuk keamanan akun.",
                    ]}
                />
            }
        >
            <Head title="Staff • Profil" />

            <div className="space-y-5 px-6 py-6">
                <div className="staff-profile-item">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                            <i className="fa-solid fa-id-card text-emerald-500 text-sm"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Staff Profile Center</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Kelola identitas akun staff untuk operasional dashboard
                            </p>
                        </div>
                    </div>
                </div>

                <div className="staff-profile-item rounded-2xl border border-black/[0.07] dark:border-content-border bg-white dark:bg-content-surface p-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl font-display font-bold text-emerald-600 dark:text-emerald-400">{user.initials}</span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => avatarRef.current?.click()}
                                disabled={avatarProcessing}
                                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white flex items-center justify-center transition"
                                title="Ubah avatar"
                            >
                                {avatarProcessing ? <i className="fa-solid fa-spinner fa-spin text-xs"></i> : <i className="fa-solid fa-camera text-xs"></i>}
                            </button>
                            <input
                                ref={avatarRef}
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-500 font-semibold">Staff Account</p>
                            <h2 className="text-lg font-display font-bold text-slate-800 dark:text-slate-100 mt-1">{user.name}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
                        </div>
                    </div>
                    {errors.avatar && (
                        <p className="text-xs text-red-500 mt-3 flex items-center gap-1">
                            <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                            {errors.avatar}
                        </p>
                    )}
                </div>

                <div className="staff-profile-item rounded-2xl border border-black/[0.07] dark:border-content-border bg-white dark:bg-content-surface p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">Edit Profil Staff</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Pastikan profil konsisten untuk kualitas operasional dashboard
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <i className="fa-solid fa-pen text-emerald-500 text-sm"></i>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Field
                                label="Nama Staff"
                                value={name}
                                onChange={setName}
                                error={errors.name}
                                placeholder="Nama lengkap staff"
                            />
                            <Field
                                label="Nomor WhatsApp"
                                value={whatsapp}
                                onChange={setWhatsapp}
                                error={errors.whatsapp_number}
                                placeholder="08xxxxxxxxxx"
                                hint="Format: 08 + 8-12 digit."
                            />
                        </div>

                        <div className="space-y-4">
                            <Field
                                label="Password Saat Ini"
                                type="password"
                                value={currentPassword}
                                onChange={setCurrentPassword}
                                error={errors.current_password}
                                placeholder="••••••••"
                            />
                            <Field
                                label="Password Baru"
                                type="password"
                                value={newPassword}
                                onChange={setNewPassword}
                                error={errors.new_password}
                                placeholder="Minimal 8 karakter"
                            />
                            <Field
                                label="Konfirmasi Password Baru"
                                type="password"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                error={errors.new_password_confirmation}
                                placeholder="Ulangi password baru"
                            />
                        </div>

                        <div className="xl:col-span-2 pt-1">
                            <button
                                type="submit"
                                disabled={processing}
                                className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold transition inline-flex items-center gap-2"
                            >
                                {processing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardSplitLayout>
    );
}

function Field({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    hint,
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    hint?: string;
    error?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`h-11 px-4 rounded-xl text-sm bg-white dark:bg-slate-900 border ${
                    error
                        ? "border-red-400 dark:border-red-500/70 input-error"
                        : "border-slate-200 dark:border-white/10"
                } text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition`}
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
