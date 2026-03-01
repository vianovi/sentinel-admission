import { useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { animate, stagger } from 'animejs'

interface ForgotPasswordProps {
    status?: string
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({ email: '' })

    useEffect(() => {
        animate('.fp-field', {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(90, { start: 200 }),
            ease:       'outExpo',
        })
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('password.email'), {
            onError: () => {
                animate('.fp-btn', {
                    translateX: [0, -8, 8, -6, 6, 0],
                    duration:   420,
                    ease:       'outExpo',
                })
            },
        })
    }

    return (
        <>
            <Head title="Lupa Password" />

            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

                {/* Background glow */}
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-amber-400/10 to-transparent rounded-full blur-3xl" />

                <div className="relative w-full max-w-md">

                    {/* Back to login */}
                    <div className="fp-field opacity-0 mb-6">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-300 transition"
                        >
                            <i className="fa-solid fa-arrow-left text-[10px]"></i>
                            Kembali ke Login
                        </Link>
                    </div>

                    <div className="fp-field opacity-0 bg-slate-900/80 border border-white/5 rounded-2xl p-8 shadow-2xl backdrop-blur">

                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5">
                            <i className="fa-solid fa-key text-gold text-lg"></i>
                        </div>

                        <h2 className="text-2xl font-display font-bold text-white mb-1">
                            Lupa Password?
                        </h2>
                        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                            Masukkan email yang terdaftar. Kami akan kirimkan link untuk reset password kamu.
                        </p>

                        {/* Success status */}
                        {status && (
                            <div className="mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-300 flex items-start gap-2.5">
                                <i className="fa-solid fa-circle-check mt-0.5 flex-shrink-0"></i>
                                <span>{status}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Alamat Email
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                        <i className="fa-solid fa-envelope"></i>
                                    </span>
                                    <input
                                        type="email"
                                        value={data.email}
                                        autoComplete="email"
                                        autoFocus
                                        onChange={e => setData('email', e.target.value)}
                                        placeholder="nama@gmail.com"
                                        className={[
                                            'w-full bg-slate-800/50 border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition',
                                            errors.email
                                                ? 'border-red-500 focus:border-red-400'
                                                : 'border-white/10 focus:border-gold/50',
                                        ].join(' ')}
                                    />
                                </div>
                                {errors.email && (
                                    <span className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                                        <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                                        {errors.email}
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="fp-btn w-full bg-gold hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2.5 transition hover:-translate-y-0.5 active:scale-95"
                            >
                                {processing
                                    ? <><i className="fa-solid fa-spinner fa-spin"></i> Mengirim...</>
                                    : <><i className="fa-solid fa-paper-plane"></i> Kirim Link Reset</>
                                }
                            </button>
                        </form>
                    </div>

                    {/* Security note */}
                    <div className="fp-field opacity-0 mt-4 text-center text-[11px] text-slate-600">
                        Link reset akan expired dalam 60 menit.
                    </div>
                </div>
            </div>
        </>
    )
}
