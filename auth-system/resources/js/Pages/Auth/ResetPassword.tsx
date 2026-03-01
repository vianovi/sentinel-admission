import { useEffect, useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import { animate, stagger } from 'animejs'

interface ResetPasswordProps {
    token: string
    email: string
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password:              '',
        password_confirmation: '',
    })

    const [showPass, setShowPass]     = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    useEffect(() => {
        animate('.rp-field', {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(90, { start: 200 }),
            ease:       'outExpo',
        })
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
            onError: () => {
                animate('.rp-btn', {
                    translateX: [0, -8, 8, -6, 6, 0],
                    duration:   420,
                    ease:       'outExpo',
                })
            },
        })
    }

    return (
        <>
            <Head title="Reset Password" />

            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-amber-400/10 to-transparent rounded-full blur-3xl" />

                <div className="relative w-full max-w-md">

                    <div className="rp-field opacity-0 bg-slate-900/80 border border-white/5 rounded-2xl p-8 shadow-2xl backdrop-blur">

                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5">
                            <i className="fa-solid fa-lock-open text-gold text-lg"></i>
                        </div>

                        <h2 className="text-2xl font-display font-bold text-white mb-1">
                            Reset Password
                        </h2>
                        <p className="text-sm text-slate-400 mb-6">
                            Buat password baru untuk akun <span className="text-amber-300 font-medium">{email}</span>
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Password baru */}
                            <div className="rp-field opacity-0">
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Password Baru
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                        <i className="fa-solid fa-lock"></i>
                                    </span>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={data.password}
                                        autoComplete="new-password"
                                        autoFocus
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder="Minimal 8 karakter"
                                        className={[
                                            'w-full bg-slate-800/50 border rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition',
                                            errors.password
                                                ? 'border-red-500 focus:border-red-400'
                                                : 'border-white/10 focus:border-gold/50',
                                        ].join(' ')}
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition text-sm">
                                        <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                                        <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                                        {errors.password}
                                    </span>
                                )}
                            </div>

                            {/* Konfirmasi password */}
                            <div className="rp-field opacity-0">
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Konfirmasi Password
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                        <i className="fa-solid fa-lock"></i>
                                    </span>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        autoComplete="new-password"
                                        onChange={e => setData('password_confirmation', e.target.value)}
                                        placeholder="Ulangi password baru"
                                        className={[
                                            'w-full bg-slate-800/50 border rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition',
                                            errors.password_confirmation
                                                ? 'border-red-500 focus:border-red-400'
                                                : 'border-white/10 focus:border-gold/50',
                                        ].join(' ')}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition text-sm">
                                        <i className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <span className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                                        <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                                        {errors.password_confirmation}
                                    </span>
                                )}
                            </div>

                            <div className="rp-field opacity-0 pt-1">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rp-btn w-full bg-gold hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2.5 transition hover:-translate-y-0.5 active:scale-95"
                                >
                                    {processing
                                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
                                        : <><i className="fa-solid fa-check"></i> Simpan Password Baru</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}
