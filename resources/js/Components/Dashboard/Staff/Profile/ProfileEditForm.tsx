// resources/js/Components/Dashboard/Staff/Profile/ProfileEditForm.tsx

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Errors = Record<string, string>;

type Props = {
    name:                string;
    whatsapp:            string;
    currentPassword:     string;
    newPassword:         string;
    confirmPassword:     string;
    errors:              Errors;
    processing:          boolean;
    onChangeName:        (v: string) => void;
    onChangeWhatsapp:    (v: string) => void;
    onChangeCurrent:     (v: string) => void;
    onChangeNew:         (v: string) => void;
    onChangeConfirm:     (v: string) => void;
    onSubmit:            (e: React.FormEvent) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// FIELD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function Field({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    hint,
    error,
    autoComplete,
}: {
    label:          string;
    value:          string;
    onChange:       (v: string) => void;
    type?:          string;
    placeholder?:   string;
    hint?:          string;
    error?:         string;
    autoComplete?:  string;
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
                autoComplete={autoComplete}
                className={`h-11 px-4 rounded-xl text-sm
                            bg-white dark:bg-slate-800
                            border transition-colors duration-150
                            text-slate-700 dark:text-slate-200
                            placeholder:text-slate-400 dark:placeholder:text-slate-500
                            focus:outline-none focus:ring-2 focus:ring-emerald-500/30
                            ${error
                                ? "border-red-400 dark:border-red-500/60 input-error"
                                : "border-slate-200 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-500"
                            }`}
            />
            {hint && !error && (
                <p className="text-[11px] text-slate-400">{hint}</p>
            )}
            {error && (
                <p className="text-[11px] text-red-500 flex items-center gap-1.5">
                    <i className="fa-solid fa-circle-exclamation text-[10px]" />
                    {error}
                </p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileEditForm({
    name,
    whatsapp,
    currentPassword,
    newPassword,
    confirmPassword,
    errors,
    processing,
    onChangeName,
    onChangeWhatsapp,
    onChangeCurrent,
    onChangeNew,
    onChangeConfirm,
    onSubmit,
}: Props) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/5
                        bg-white dark:bg-slate-900 p-6 shadow-md">

            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Edit Profil
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Perbarui informasi akun staff kamu
                    </p>
                </div>
                <div className="w-9 h-9 rounded-xl shrink-0
                                bg-emerald-500/10 border border-emerald-500/20
                                flex items-center justify-center">
                    <i className="fa-solid fa-pen text-emerald-500 text-sm" />
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">

                {/* ── Info Dasar ───────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                        label="Nama Lengkap"
                        value={name}
                        onChange={onChangeName}
                        error={errors.name}
                        placeholder="Nama lengkap staff"
                        autoComplete="name"
                    />
                    <Field
                        label="Nomor WhatsApp"
                        value={whatsapp}
                        onChange={onChangeWhatsapp}
                        error={errors.whatsapp_number}
                        placeholder="08xxxxxxxxxx"
                        hint="Format: 08 + 8–12 digit"
                        autoComplete="tel"
                    />
                </div>

                {/* ── Ganti Password ───────────────────────────────────────── */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest
                                  text-slate-500 dark:text-slate-400 mb-4">
                        Keamanan Akun
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field
                            label="Password Saat Ini"
                            type="password"
                            value={currentPassword}
                            onChange={onChangeCurrent}
                            error={errors.current_password}
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                        <Field
                            label="Password Baru"
                            type="password"
                            value={newPassword}
                            onChange={onChangeNew}
                            error={errors.new_password}
                            placeholder="Minimal 8 karakter"
                            autoComplete="new-password"
                        />
                        <Field
                            label="Konfirmasi Password"
                            type="password"
                            value={confirmPassword}
                            onChange={onChangeConfirm}
                            error={errors.new_password_confirmation}
                            placeholder="Ulangi password baru"
                            autoComplete="new-password"
                        />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                        Kosongkan semua field password jika tidak ingin menggantinya.
                    </p>
                </div>

                {/* ── Submit ───────────────────────────────────────────────── */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="h-11 px-6 rounded-xl
                                   bg-emerald-500 hover:bg-emerald-600
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   text-white text-sm font-semibold
                                   shadow-lg shadow-emerald-500/20
                                   transition-all duration-200 hover:scale-[1.02]
                                   inline-flex items-center gap-2"
                    >
                        {processing ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-floppy-disk" />
                                Simpan Perubahan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
