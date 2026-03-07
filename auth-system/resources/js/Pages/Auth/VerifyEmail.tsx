import { useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { animate } from 'animejs'

interface VerifyEmailProps {
    status?: string
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
    const { post, processing } = useForm({})

    useEffect(() => {
        animate('.ve-card', {
            opacity:    [0, 1],
            translateY: [24, 0],
            duration:   700,
            ease:       'outExpo',
        })
    }, [])

    const handleResend = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('verification.send'))
    }

    return (
        <>
            <Head title="Verifikasi Email" />

            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-amber-400/10 to-transparent rounded-full blur-3xl" />

                <div className="relative w-full max-w-md">
                    <div className="ve-card opacity-0 bg-slate-900/80 border border-white/5 rounded-2xl p-8 shadow-2xl backdrop-blur text-center">

                        {/* Icon */}
                        <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-5">
                            <i className="fa-solid fa-envelope-circle-check text-gold text-2xl"></i>
                        </div>

                        <h2 className="text-2xl font-display font-bold text-white mb-2">
                            Verifikasi Email Kamu
                        </h2>
                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                            Kami sudah mengirimkan link verifikasi ke email kamu.
                            Klik link tersebut untuk mengaktifkan akun sepenuhnya.
                        </p>

                        {/* Info box */}
                        <div className="bg-amber-400/5 border border-amber-400/15 rounded-xl p-4 mb-6 text-left">
                            <div className="flex items-start gap-3">
                                <i className="fa-solid fa-circle-info text-gold mt-0.5 flex-shrink-0"></i>
                                <div className="text-xs text-slate-400 leading-relaxed">
                                    Kamu tetap bisa mengakses dashboard dan memantau pendaftaran.
                                    Beberapa fitur (upload dokumen, dll) memerlukan email terverifikasi.
                                </div>
                            </div>
                        </div>

                        {/* Status setelah resend */}
                        {status === 'verification-link-sent' && (
                            <div className="mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-300 flex items-center gap-2.5">
                                <i className="fa-solid fa-circle-check flex-shrink-0"></i>
                                <span>Link verifikasi baru sudah dikirim ke email kamu.</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            {/* Kirim ulang */}
                            <form onSubmit={handleResend}>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-gold hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition hover:-translate-y-0.5 active:scale-95"
                                >
                                    {processing
                                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Mengirim...</>
                                        : <><i className="fa-solid fa-rotate-right"></i> Kirim Ulang Email</>
                                    }
                                </button>
                            </form>

                            {/* Lanjut ke dashboard */}
                            <Link
                                href={route('dashboard.index')}
                                className="w-full border border-white/10 text-slate-400 hover:text-white hover:border-white/20 px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition"
                            >
                                <i className="fa-solid fa-arrow-right"></i>
                                Lanjut ke Dashboard
                            </Link>

                            {/* Logout */}
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="w-full text-slate-600 hover:text-slate-400 text-xs transition py-1"
                            >
                                Keluar dari akun ini
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}