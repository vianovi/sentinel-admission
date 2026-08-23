// resources/js/Components/Dashboard/Staff/Profile/AvatarSection.tsx

import { useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    name:            string;
    email:           string;
    initials:        string;
    avatar_url:      string | null;
    is_active:       boolean;
    created_at:      string;
    avatarProcessing: boolean;
    avatarError?:    string;
    onAvatarChange:  (file: File) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AvatarSection({
    name,
    email,
    initials,
    avatar_url,
    is_active,
    created_at,
    avatarProcessing,
    avatarError,
    onAvatarChange,
}: Props) {
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onAvatarChange(file);
        // Reset input so same file can be re-selected
        if (fileRef.current) fileRef.current.value = "";
    };

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/5
                        bg-white dark:bg-slate-900 p-6 shadow-md">
            <div className="flex items-center gap-5">

                {/* Avatar with upload button */}
                <div className="relative shrink-0">
                    <div
                        className="w-24 h-24 rounded-2xl overflow-hidden
                                   bg-gradient-to-br from-emerald-500 to-teal-500
                                   flex items-center justify-center
                                   shadow-lg shadow-emerald-500/25"
                    >
                        {avatar_url ? (
                            <img
                                src={avatar_url}
                                alt={name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <span className="text-2xl font-display font-bold text-white">
                                {initials}
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={avatarProcessing}
                        className="absolute -bottom-2 -right-2
                                   w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl
                                   bg-emerald-500 hover:bg-emerald-600
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   text-white flex items-center justify-center
                                   shadow-lg shadow-emerald-500/25
                                   transition-all duration-200 hover:scale-110"
                        title="Ubah foto profil"
                        aria-label="Ubah foto profil"
                    >
                        {avatarProcessing ? (
                            <i className="fa-solid fa-spinner fa-spin text-xs" />
                        ) : (
                            <i className="fa-solid fa-camera text-xs" />
                        )}
                    </button>

                    <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        aria-hidden="true"
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1
                                         rounded-xl text-[11px] font-semibold uppercase tracking-wider
                                         bg-emerald-500/10 border border-emerald-500/20
                                         text-emerald-600 dark:text-emerald-400">
                            <i className="fa-solid fa-user-tie text-[9px]" />
                            Staff
                        </span>
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1
                                        rounded-xl text-[11px] font-semibold
                                        ${is_active
                                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                            : "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20"}`}
                        >
                            <i className={`fa-solid text-[9px] ${is_active ? "fa-circle-check" : "fa-circle-xmark"}`} />
                            {is_active ? "Aktif" : "Suspended"}
                        </span>
                    </div>

                    <h2 className="text-lg font-display font-bold
                                   text-slate-800 dark:text-white truncate">
                        {name}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {email}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        Bergabung sejak {created_at}
                    </p>
                </div>
            </div>

            {/* Avatar error */}
            {avatarError && (
                <p className="mt-3 text-xs text-red-500 flex items-center gap-1.5">
                    <i className="fa-solid fa-circle-exclamation text-[10px]" />
                    {avatarError}
                </p>
            )}
        </div>
    );
}
