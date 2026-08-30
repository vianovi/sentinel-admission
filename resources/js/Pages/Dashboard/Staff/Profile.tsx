// resources/js/Pages/Dashboard/Staff/Profile.tsx

import { useEffect, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import Swal from "sweetalert2";
import DashboardLayout from "@/Layouts/DashboardLayout";
import AvatarSection from "@/Components/Dashboard/Staff/Profile/AvatarSection";
import ProfileEditForm from "@/Components/Dashboard/Staff/Profile/ProfileEditForm";
import AvatarCropperModal from "@/Components/UI/AvatarCropperModal";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type UserData = {
    id:              number;
    name:            string;
    email:           string;
    role:            "staff" | "admin" | "candidate";
    is_active:       boolean;
    avatar_url:      string | null;
    initials:        string;
    whatsapp_number: string | null;
    created_at:      string;
};

type Props = {
    user:   UserData;
    flash?: { success?: string; error?: string };
};

// ─────────────────────────────────────────────────────────────────────────────
// SWAL CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const swalDark = Swal.mixin({
    background: "#0f172a",
    color:      "#e2e8f0",
    confirmButtonColor: "#10b981",
    cancelButtonColor:  "#334155",
    customClass: {
        popup:         "!rounded-2xl !border !border-white/10",
        confirmButton: "!rounded-xl !px-6",
        cancelButton:  "!rounded-xl !px-6",
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function StaffProfile({ user, flash }: Props) {
    const isAdmin = user.role === "admin";
    const basePath = isAdmin ? "/dashboard/admin" : "/dashboard/staff";
    const roleLabel = isAdmin ? "Admin" : "Staff";
    const headerTone = isAdmin
        ? "bg-gradient-to-br from-rose-500 to-orange-500 shadow-rose-500/25"
        : "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/25";

    // ── Form state ───────────────────────────────────────────────────────────
    const [name, setName]                       = useState(user.name);
    const [whatsapp, setWhatsapp]               = useState(user.whatsapp_number ?? "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword]         = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // ── UI state ─────────────────────────────────────────────────────────────
    const [errors, setErrors]                   = useState<Record<string, string>>({});
    const [processing, setProcessing]           = useState(false);
    const [avatarProcessing, setAvatarProcessing] = useState(false);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [isCropOpen, setIsCropOpen]           = useState(false);

    // ── Entrance animation ───────────────────────────────────────────────────
    useEffect(() => {
        animate(".staff-profile-block", {
            opacity:    [0, 1],
            translateY: [22, 0],
            duration:   550,
            delay:      stagger(90),
            ease:       "outExpo",
        });
    }, []);

    // ── Flash handler ────────────────────────────────────────────────────────
    useEffect(() => {
        if (flash?.success) {
            swalDark.fire({
                toast:             true,
                position:          "top-end",
                icon:              "success",
                title:             flash.success,
                showConfirmButton: false,
                timer:             2200,
                timerProgressBar:  true,
            });
        }
        if (flash?.error) {
            swalDark.fire({
                icon:  "error",
                title: "Gagal",
                text:  flash.error,
            });
        }
    }, [flash]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (newPassword && newPassword !== confirmPassword) {
            setErrors({ new_password_confirmation: "Konfirmasi password tidak cocok." });
            return;
        }

        const confirmed = await swalDark.fire({
            title:             "Simpan perubahan profil?",
            text:              `Pastikan data ${roleLabel.toLowerCase()} sudah sesuai sebelum disimpan.`,
            icon:              "question",
            showCancelButton:  true,
            confirmButtonText: "Ya, simpan",
            cancelButtonText:  "Batal",
        });
        if (!confirmed.isConfirmed) return;

        setProcessing(true);
        router.put(
            `${basePath}/profile`,
            {
                name,
                whatsapp_number:           whatsapp || undefined,
                current_password:          currentPassword || undefined,
                new_password:              newPassword || undefined,
                new_password_confirmation: confirmPassword || undefined,
            },
            {
                preserveScroll: true,
                onError: (e) => {
                    setErrors(e as Record<string, string>);
                    // Shake error fields
                    const target = document.querySelector(".input-error");
                    if (target) {
                        animate(".input-error", {
                            translateX: [0, -6, 6, -4, 4, 0],
                            duration:   380,
                            ease:       "outExpo",
                        });
                    }
                },
                onSuccess: () => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    const handleSelectAvatarFile = (file: File) => {
        setSelectedAvatarFile(file);
        setIsCropOpen(true);
    };

    const handleCroppedAvatar = (croppedFile: File) => {
        const fd = new FormData();
        fd.append("avatar", croppedFile);

        setAvatarProcessing(true);
        router.post(`${basePath}/profile/avatar`, fd, {
            preserveScroll: true,
            onSuccess: () => router.reload(),
            onError: (e) => setErrors(e as Record<string, string>),
            onFinish: () => setAvatarProcessing(false),
        });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title={`${roleLabel} - Profil`} />

            <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-8">

                {/* ── Page header ──────────────────────────────────────────── */}
                <div className="staff-profile-block opacity-0 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center shadow-lg ${headerTone}`}>
                        <i className="fa-solid fa-circle-user text-white text-sm" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold
                                       text-slate-800 dark:text-white leading-tight">
                            Profil {roleLabel}
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Kelola identitas akun untuk operasional dashboard
                        </p>
                    </div>
                </div>

                {/* ── Avatar card ──────────────────────────────────────────── */}
                <div className="staff-profile-block opacity-0">
                    <AvatarSection
                        name={user.name}
                        email={user.email}
                        initials={user.initials}
                        avatar_url={user.avatar_url}
                        is_active={user.is_active}
                        created_at={user.created_at}
                        avatarProcessing={avatarProcessing}
                        avatarError={errors.avatar}
                        onAvatarChange={handleSelectAvatarFile}
                    />
                </div>

                {/* ── Edit form ────────────────────────────────────────────── */}
                <div className="staff-profile-block opacity-0">
                    <ProfileEditForm
                        name={name}
                        whatsapp={whatsapp}
                        currentPassword={currentPassword}
                        newPassword={newPassword}
                        confirmPassword={confirmPassword}
                        errors={errors}
                        processing={processing}
                        onChangeName={setName}
                        onChangeWhatsapp={setWhatsapp}
                        onChangeCurrent={setCurrentPassword}
                        onChangeNew={setNewPassword}
                        onChangeConfirm={setConfirmPassword}
                        onSubmit={handleSubmit}
                    />
                </div>

                {/* ── Avatar Cropper Modal ─────────────────────────────────── */}
                <AvatarCropperModal
                    isOpen={isCropOpen}
                    imageFile={selectedAvatarFile}
                    onClose={() => {
                        setIsCropOpen(false);
                        setSelectedAvatarFile(null);
                    }}
                    onCropComplete={handleCroppedAvatar}
                    title={`Sesuaikan Foto Profil ${roleLabel}`}
                />

            </div>
        </>
    );
}

StaffProfile.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
