import { useEffect, useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { animate, stagger } from 'animejs'

interface DraftSummary {
    full_name: string
    nisn: string
    whatsapp_number: string
    email: string
    registration_code: string
    school_origin: string
}

interface RegisterProps {
    draft: DraftSummary
    flash?: {
        registration_code?: string
        error?: string
    }
    errors?: Record<string, string>
}

export default function Register({ draft, flash, errors = {} }: RegisterProps) {
    const [password, setPassword]               = useState('')
    const [passwordConfirmation, setConfirm]    = useState('')
    const [showPass, setShowPass]               = useState(false)
    const [showConfirm, setShowConfirm]         = useState(false)
    const [submitting, setSubmitting]           = useState(false)
    const [localErrors, setLocalErrors]         = useState<Record<string, string>>(errors)

    useEffect(() => {
        animate('.reg-card', {
            opacity: [0, 1],
            translateY: [24, 0],
            duration: 900,
            ease: 'outExpo',
        })
        animate('.reg-field', {
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 500,
            delay: stagger(80, { start: 400 }),
            ease: 'outExpo',
        })
    }, [])

    // Sync server errors
    useEffect(() => {
        setLocalErrors(errors)
    }, [errors])

    const validate = (): boolean => {
        const e: Record<string, string> = {}
        if (!password) e.password = 'Password wajib diisi.'
        else if (password.length < 8) e.password = 'Password minimal 8 karakter.'
        if (!passwordConfirmation) e.password_confirmation = 'Ulangi password wajib diisi.'
        else if (password !== passwordConfirmation) e.password_confirmation = 'Konfirmasi password tidak cocok.'
        setLocalErrors(e)
        if (Object.keys(e).length > 0) {
            animate('.reg-submit', {
                translateX: [0, -8, 8, -6, 6, 0],
                duration: 420,
                ease: 'outExpo',
            })
        }
        return Object.keys(e).length === 0
    }

    const handleSubmit = () => {
        if (!validate()) return
        setSubmitting(true)
        router.post('/register', {
            password,
            password_confirmation: passwordConfirmation,
        }, {
            onError: (errs) => {
                setLocalErrors(errs)
                setSubmitting(false)
                animate('.reg-submit', {
                    translateX: [0, -8, 8, -6, 6, 0],
                    duration: 420,
                    ease: 'outExpo',
                })
            },
        })
    }

    const strengthLevel = (): { label: string; color: string; width: string } => {
        const len = password.length
        const hasUpper = /[A-Z]/.test(password)
        const hasNum   = /\d/.test(password)
        const hasSpec  = /[^A-Za-z0-9]/.test(password)
        const score    = [len >= 8, hasUpper, hasNum, hasSpec].filter(Boolean).length
        if (!password)    return { label: '',         color: 'bg-slate-200',  width: '0%' }
        if (score <= 1)   return { label: 'Lemah',    color: 'bg-rose-400',   width: '25%' }
        if (score === 2)  return { label: 'Cukup',    color: 'bg-amber-400',  width: '50%' }
        if (score === 3)  return { label: 'Kuat',     color: 'bg-emerald-400',width: '75%' }
        return               { label: 'Sangat Kuat', color: 'bg-emerald-500', width: '100%' }
    }

    const strength = strengthLevel()

    return (
        <>
            <Head title="Registrasi Akun" />

            <div className="min-h-screen w-full bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-start sm:items-center justify-center py-0 sm:py-8 px-0 sm:px-4 md:px-8">
                <div className="reg-card opacity-0 relative w-full sm:max-w-6xl sm:rounded-3xl overflow-hidden shadow-[0_22px_45px_rgba(15,23,42,0.45)] bg-slate-900/80 border-0 sm:border border-white/5 min-h-screen sm:min-h-0">

                    {/* Glow */}
                    <div className="pointer-events-none absolute -top-24 -right-16 w-48 sm:w-72 h-48 sm:h-72 bg-gradient-to-br from-amber-400/45 via-rose-400/35 to-sky-500/35 rounded-full blur-3xl opacity-70" style={{ animation: 'glow-move 14s ease-in-out infinite alternate' }}></div>
                    <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 sm:w-80 h-56 sm:h-80 bg-gradient-to-tr from-emerald-400/30 via-cyan-400/30 to-amber-300/30 rounded-full blur-3xl opacity-70" style={{ animation: 'glow-move 14s ease-in-out infinite alternate' }}></div>

                    <div className="relative flex flex-col lg:grid lg:grid-cols-[320px,1fr]">

                        {/* ── SIDEBAR ── */}
                        <aside className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-5 sm:px-8 py-6 sm:py-8 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5">
                            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-amber-200/80 hover:text-amber-300 transition w-fit">
                                <i className="fa-solid fa-arrow-left text-[11px]"></i>
                                <span>Kembali ke Home</span>
                            </Link>

                            <div className="mt-6 sm:mt-8">
                                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Akun Calon Siswa</p>
                                <h1 className="text-2xl sm:text-3xl font-display font-bold leading-tight mt-2">
                                    Buat<br />
                                    <span className="text-gold">Password</span>
                                </h1>
                                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                    Satu langkah lagi! Buat password untuk akun kamu. Setelah ini kamu langsung masuk ke dashboard.
                                </p>
                            </div>

                            {/* Draft summary */}
                            <div className="mt-6 sm:mt-8 bg-slate-800/60 border border-slate-700 rounded-2xl p-4 sm:p-5">
                                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold mb-3 sm:mb-4">
                                    Ringkasan Data
                                </div>
                                <div className="space-y-2.5 text-sm">
                                    {[
                                        { label: 'Nama',       value: draft.full_name },
                                        { label: 'NISN',       value: draft.nisn },
                                        { label: 'WhatsApp',   value: draft.whatsapp_number },
                                        { label: 'Kode',       value: draft.registration_code },
                                    ].map(item => (
                                        <div key={item.label} className="flex justify-between gap-3">
                                            <span className="text-slate-400 text-xs flex-shrink-0">{item.label}</span>
                                            <span className="font-semibold text-slate-100 text-right text-xs break-all">{item.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    href="/daftar"
                                    className="mt-4 sm:mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950/60 hover:bg-slate-950 text-amber-200 px-4 py-2.5 text-xs font-bold transition border border-slate-700"
                                >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                    <span>Edit Data Pendaftaran</span>
                                </Link>
                            </div>

                            <div className="mt-auto pt-6 text-[10px] text-slate-500">
                                &copy; {new Date().getFullYear()} Sentinel Admission System.
                            </div>
                        </aside>

                        {/* ── CONTENT ── */}
                        <main className="bg-slate-50/95 px-4 sm:px-8 md:px-10 py-6 sm:py-8">

                            {/* Flash / server error */}
                            {flash?.error && (
                                <div className="reg-field opacity-0 mb-5 bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-r-xl text-sm text-red-800 flex gap-3">
                                    <i className="fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0"></i>
                                    <div><div className="font-semibold mb-0.5">Terjadi Kesalahan</div><p>{flash.error}</p></div>
                                </div>
                            )}

                            {/* Header */}
                            <div className="reg-field opacity-0 border-b border-slate-200 pb-4 mb-6 flex items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900">Buat Password Login</h2>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                        Setelah akun dibuat, kamu langsung diarahkan ke dashboard.
                                    </p>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 flex-shrink-0">
                                    <i className="fa-solid fa-shield-halved text-gold"></i>
                                    <span>Token-only (cookie)</span>
                                </div>
                            </div>

                            {/* Email readonly */}
                            <div className="reg-field opacity-0 mb-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                                <label className="label">Email Login</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={draft.email}
                                        readOnly
                                        className="input-field pr-10 bg-slate-100 text-slate-500 cursor-not-allowed"
                                    />
                                    <i className="fa-solid fa-lock absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                </div>
                                <p className="hint">Email diambil dari data pendaftaran dan tidak bisa diubah di sini.</p>
                            </div>

                            {/* Password form */}
                            <div className="reg-field opacity-0 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
                                {/* Password */}
                                <div>
                                    <label className="label">
                                        Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => {
                                                setPassword(e.target.value)
                                                if (localErrors.password) setLocalErrors(p => ({ ...p, password: '' }))
                                            }}
                                            placeholder="Minimal 8 karakter"
                                            autoComplete="new-password"
                                            className={`input-field pr-10 ${localErrors.password ? 'input-error' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                        >
                                            <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                                        </button>
                                    </div>

                                    {/* Strength bar */}
                                    {password && (
                                        <div className="mt-2">
                                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                                                    style={{ width: strength.width }}
                                                />
                                            </div>
                                            <p className={`text-[11px] mt-1 font-semibold ${
                                                strength.label === 'Lemah' ? 'text-rose-400'
                                                : strength.label === 'Cukup' ? 'text-amber-500'
                                                : 'text-emerald-500'
                                            }`}>
                                                {strength.label}
                                            </p>
                                        </div>
                                    )}
                                    {localErrors.password && <span className="error-text">{localErrors.password}</span>}
                                </div>

                                {/* Konfirmasi password */}
                                <div>
                                    <label className="label">
                                        Ulangi Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={passwordConfirmation}
                                            onChange={e => {
                                                setConfirm(e.target.value)
                                                if (localErrors.password_confirmation) setLocalErrors(p => ({ ...p, password_confirmation: '' }))
                                            }}
                                            placeholder="Harus sama dengan password di atas"
                                            autoComplete="new-password"
                                            className={`input-field pr-10 ${localErrors.password_confirmation ? 'input-error' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                        >
                                            <i className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                                        </button>
                                    </div>

                                    {/* Match indicator */}
                                    {passwordConfirmation && (
                                        <p className={`text-[11px] mt-1 font-semibold flex items-center gap-1 ${
                                            password === passwordConfirmation ? 'text-emerald-500' : 'text-rose-400'
                                        }`}>
                                            <i className={`fa-solid ${password === passwordConfirmation ? 'fa-check' : 'fa-xmark'} text-[10px]`}></i>
                                            {password === passwordConfirmation ? 'Password cocok' : 'Password tidak cocok'}
                                        </p>
                                    )}
                                    {localErrors.password_confirmation && <span className="error-text">{localErrors.password_confirmation}</span>}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-200">
                                    <Link
                                        href="/login"
                                        className="text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 transition text-center sm:text-left"
                                    >
                                        Sudah punya akun? Login
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="reg-submit w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-navy hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 text-sm font-extrabold shadow-lg transition hover:-translate-y-0.5 active:scale-95"
                                    >
                                        {submitting
                                            ? <><i className="fa-solid fa-spinner fa-spin"></i> Membuat Akun...</>
                                            : <><i className="fa-solid fa-arrow-right"></i> Buat Akun &amp; Masuk</>
                                        }
                                    </button>
                                </div>
                            </div>

                            <p className="reg-field opacity-0 text-xs text-slate-500 mt-4 text-center sm:text-left">
                                Dengan membuat akun, kamu menyetujui bahwa data yang diisi sudah benar dan siap diproses panitia.
                            </p>
                        </main>
                    </div>
                </div>
            </div>
        </>
    )
}
