import { useEffect, useRef, useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { animate, stagger } from 'animejs'
import axios from 'axios'

interface LoginProps {
    status?: string
}

export default function Login({ status }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email:    '',
        password: '',
        remember: false,
    })

    const [showPassword, setShowPassword] = useState(false)
    const leftRef  = useRef<HTMLDivElement>(null)
    const rightRef = useRef<HTMLDivElement>(null)

    // ── Entrance animations ───────────────────────────────────────────────────
    useEffect(() => {
        // Left panel — slide in dari kiri
        animate(leftRef.current!, {
            opacity:    [0, 1],
            translateX: [-40, 0],
            duration:   900,
            ease:       'outExpo',
        })

        // Right panel fields — stagger dari atas
        animate('.login-field', {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(90, { start: 400 }),
            ease:       'outExpo',
        })
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('login'), {
            onFinish: () => reset('password'),
            onError: () => {
                animate('.login-btn', {
                    translateX: [0, -8, 8, -6, 6, 0],
                    duration:   420,
                    ease:       'outExpo',
                })
            },
        })
    }

    return (
        <>
            <Head title="Login" />

            <div className="min-h-screen w-full flex bg-slate-950">

                {/* ── Left Panel ── */}
                <div
                    ref={leftRef}
                    className="hidden md:flex md:w-[45%] lg:w-[40%] flex-col justify-between p-10 lg:p-14 relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-white/5"
                    style={{ opacity: 0 }}
                >
                    {/* Glow */}
                    <div className="pointer-events-none absolute -top-20 -left-10 w-72 h-72 bg-gradient-to-br from-amber-400/30 via-rose-400/20 to-sky-400/20 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 -right-10 w-80 h-80 bg-gradient-to-tr from-emerald-400/20 via-cyan-400/20 to-amber-300/20 rounded-full blur-3xl" />

                    {/* Logo + nama */}
                    <div className="relative z-10">
                        <Link href={route('home')} className="inline-flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center shadow-lg shadow-amber-400/30">
                                <i className="fa-solid fa-graduation-cap text-slate-900 text-base"></i>
                            </div>
                            <span className="text-white font-display font-bold text-lg tracking-tight">
                                Sentinel<span className="text-gold">.</span>
                            </span>
                        </Link>
                    </div>

                    {/* Center content */}
                    <div className="relative z-10 space-y-6">
                        <div>
                            <p className="text-[11px] text-amber-300/70 uppercase tracking-[0.22em] mb-3">
                                Sistem SPMB Digital
                            </p>
                            <h1 className="text-4xl lg:text-5xl font-display font-bold text-white leading-[1.1]">
                                Selamat<br />
                                Datang<br />
                                <span className="text-gold">Kembali.</span>
                            </h1>
                            <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-xs">
                                Masuk ke akun kamu untuk melanjutkan proses pendaftaran dan memantau status pendaftaran.
                            </p>
                        </div>

                        {/* Info cards */}
                        <div className="space-y-3">
                            {[
                                { icon: 'fa-shield-halved', text: 'Sesi aman & terenkripsi' },
                                { icon: 'fa-bolt',          text: 'Akses real-time ke status pendaftaran' },
                                { icon: 'fa-bell',          text: 'Notifikasi pengumuman langsung' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                        <i className={`fa-solid ${item.icon} text-gold text-[11px]`}></i>
                                    </div>
                                    <span>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 text-[11px] text-slate-600">
                        Belum punya akun?{' '}
                        <Link href={route('daftar')} className="text-amber-400/70 hover:text-gold transition">
                            Daftar sekarang →
                        </Link>
                    </div>
                </div>

                {/* ── Right Panel ── */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-50 relative">

                    {/* Mobile: back to home */}
                    <div className="md:hidden absolute top-5 left-5">
                        <Link href={route('home')} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-navy transition">
                            <i className="fa-solid fa-arrow-left text-[10px]"></i>
                            Beranda
                        </Link>
                    </div>

                    <div className="w-full max-w-sm">

                        {/* Header */}
                        <div className="login-field opacity-0 mb-8">
                            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
                                Masuk ke Akun
                            </h2>
                            <p className="text-sm text-slate-500 mt-1.5">
                                Gunakan email dan password yang sudah terdaftar.
                            </p>
                        </div>

                        {/* Status flash (misal: password berhasil direset) */}
                        {status && (
                            <div className="login-field opacity-0 mb-5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 flex items-center gap-2.5">
                                <i className="fa-solid fa-circle-check text-emerald-500 flex-shrink-0"></i>
                                <span>{status}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Email */}
                            <div className="login-field opacity-0">
                                <label className="label">Email</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                        <i className="fa-solid fa-envelope"></i>
                                    </span>
                                    <input
                                        type="email"
                                        value={data.email}
                                        autoComplete="email"
                                        autoFocus
                                        onChange={e => setData('email', e.target.value)}
                                        placeholder="nama@gmail.com"
                                        className={`input-field pl-10 ${errors.email ? 'input-error' : ''}`}
                                    />
                                </div>
                                {errors.email && <span className="error-text">{errors.email}</span>}
                            </div>

                            {/* Password */}
                            <div className="login-field opacity-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="label mb-0">Password</label>
                                    <Link
                                        href={route('password.request')}
                                        className="text-[11px] text-slate-500 hover:text-gold transition font-medium"
                                    >
                                        Lupa password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                        <i className="fa-solid fa-lock"></i>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        autoComplete="current-password"
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className={`input-field pl-10 pr-11 ${errors.password ? 'input-error' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition text-sm"
                                    >
                                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                                {errors.password && <span className="error-text">{errors.password}</span>}
                            </div>

                            {/* Remember me */}
                            <div className="login-field opacity-0 flex items-center gap-2.5">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={data.remember}
                                    onChange={e => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 accent-navy"
                                />
                                <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer select-none">
                                    Ingat saya selama 30 hari
                                </label>
                            </div>

                            {/* Submit */}
                            <div className="login-field opacity-0 pt-1">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="login-btn w-full bg-navy hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2.5 transition hover:-translate-y-0.5 active:scale-95"
                                >
                                    {processing
                                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
                                        : <><i className="fa-solid fa-right-to-bracket"></i> Masuk</>
                                    }
                                </button>
                            </div>
                        </form>

                        {/* Mobile: daftar link */}
                        <div className="login-field opacity-0 mt-6 text-center text-xs text-slate-500 md:hidden">
                            Belum punya akun?{' '}
                            <Link href={route('daftar')} className="text-gold font-semibold hover:underline">
                                Daftar sekarang
                            </Link>
                        </div>

                        {/* Security note */}
                        <div className="login-field opacity-0 mt-8 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                            <i className="fa-solid fa-shield-halved"></i>
                            <span>Koneksi aman · Dilindungi enkripsi SSL</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
