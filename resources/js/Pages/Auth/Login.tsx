// resources/js/Pages/Auth/Login.tsx

import { useEffect, useRef, useState } from 'react'
import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { animate, stagger } from 'animejs'
import { PageProps } from '@/types'

interface LoginProps {
    status?: string
}

export default function Login({ status }: LoginProps) {
    const { props } = usePage<PageProps>()
    const { app }   = props

    const { data, setData, post, processing, errors, reset } = useForm({
        email:    '',
        password: '',
        remember: false,
    })

    const [showPassword, setShowPassword] = useState(false)
    const leftRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        animate(leftRef.current!, {
            opacity:    [0, 1],
            translateX: [-40, 0],
            duration:   900,
            ease:       'outExpo',
        })
        animate('.login-field', {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(90, { start: 400 }),
            ease:       'outExpo',
        })
        animate('.mobile-brand', {
            opacity:    [0, 1],
            translateY: [-16, 0],
            duration:   600,
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

    const features = [
        { icon: 'fa-shield-halved', text: 'Sesi aman & terenkripsi end-to-end' },
        { icon: 'fa-bolt',          text: 'Akses real-time ke sistem pendaftaran' },
        { icon: 'fa-bell',          text: 'Notifikasi pengumuman instan' },
    ]

    return (
        <>
            <Head title="Login" />

            <div className="min-h-screen w-full flex bg-slate-950 font-sans selection:bg-gold/30 selection:text-gold">

                {/* ══════════════════════════════════════════════════════════
                    LEFT PANEL
                ══════════════════════════════════════════════════════════ */}
                <div
                    ref={leftRef}
                    className="hidden md:flex md:w-[45%] lg:w-[42%] flex-col justify-between p-10 lg:p-14 relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-white/5"
                    style={{ opacity: 0 }}
                >
                    {/* Ambient orbs */}
                    <div className="pointer-events-none absolute -top-20 -left-10 w-72 h-72 bg-gradient-to-br from-amber-400/20 via-rose-400/10 to-sky-400/10 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-emerald-400/10 via-cyan-400/10 to-amber-300/10 rounded-full blur-3xl" />

                    {/* Dot grid */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] pointer-events-none opacity-50" />

                    {/* Logo */}
                    <div className="relative z-10">
                        <Link href={route('home')} className="inline-flex items-center gap-3 group">
                            {app.logo ? (
                                <img src={app.logo} alt={app.name} className="w-11 h-11 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center shadow-lg shadow-amber-400/20 group-hover:scale-105 transition-transform duration-300">
                                    <i className="fa-solid fa-graduation-cap text-slate-900 text-lg"></i>
                                </div>
                            )}
                            <span className="text-white font-display font-bold text-xl tracking-tight">
                                {app.name}<span className="text-gold">.</span>
                            </span>
                        </Link>
                    </div>

                    {/* Center content */}
                    <div className="relative z-10 space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-5 backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
                                <span className="text-[10px] text-amber-300/90 font-bold uppercase tracking-widest">
                                    {app.tagline}
                                </span>
                            </div>
                            <h1 className="text-4xl lg:text-[52px] font-display font-extrabold text-white leading-[1.15] tracking-tight">
                                Selamat<br />
                                Datang<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-amber-300 to-yellow-200">Kembali.</span>
                            </h1>
                            <p className="text-slate-400 text-[15px] mt-6 leading-relaxed max-w-sm font-medium">
                                Masuk ke sistem terenkripsi untuk melanjutkan proses pendaftaran dan memantau status secara real-time.
                            </p>
                        </div>

                        {/* Feature list */}
                        <div className="space-y-4 pt-4">
                            {features.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 text-sm text-slate-300 group">
                                    <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:border-gold/30 transition-colors">
                                        <i className={`fa-solid ${item.icon} text-amber-400 text-[13px]`}></i>
                                    </div>
                                    <span className="font-medium tracking-wide">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom — link ke portal staff */}
                    <div className="relative z-10">
                        <Link
                            href={route('staff.login')}
                            className="inline-flex items-center gap-3 text-xs font-medium text-slate-400 hover:text-amber-300 transition-all group px-5 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 backdrop-blur-sm w-max"
                        >
                            <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center shadow-inner">
                                <i className="fa-solid fa-user-tie text-[11px] text-slate-400 group-hover:text-gold transition-colors"></i>
                            </div>
                            Portal Staff & Tenaga Pendidik
                            <i className="fa-solid fa-arrow-right text-[11px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"></i>
                        </Link>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    RIGHT PANEL — Form (desktop putih premium + mobile dark)
                ══════════════════════════════════════════════════════════ */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden bg-slate-50">

                    {/* Background layers — desktop */}
                    <div className="hidden md:block">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQ4LDE2MywxODQsMC4yKSIvPjwvc3ZnPg==')] pointer-events-none" />
                        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-sky-400/10 rounded-full blur-[100px] pointer-events-none" />
                    </div>

                    {/* Background layers — mobile dark */}
                    <div className="absolute inset-0 md:hidden bg-gradient-to-b from-[#1a0f00] via-[#1c1200] to-[#0f0a00]">
                        {/* Orbs amber/gold untuk nuansa kandidat */}
                        <div className="absolute -top-20 -right-10 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 -left-10 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-500/8 rounded-full blur-2xl" />
                        {/* Dot grid */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-60" />
                        {/* Gold accent line top */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                    </div>

                    {/* Tombol kembali ke beranda — desktop only */}
                    <div className="hidden md:block absolute top-8 left-8 z-20">
                        <Link
                            href={route('home')}
                            className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl transition-all duration-300 shadow-sm border border-slate-200/50 hover:shadow-md"
                        >
                            <i className="fa-solid fa-arrow-left-long text-[11px]"></i>
                            Beranda
                        </Link>
                    </div>

                    {/* Mobile: brand header + tombol beranda (flow normal) */}
                    <div className="mobile-brand md:hidden w-full max-w-[420px] relative z-10 opacity-0 pt-6 mb-6">
                        {/* Brand */}
                        <div className="flex items-center gap-3 mb-4">
                            {app.logo ? (
                                <img src={app.logo} alt={app.name} className="w-10 h-10 rounded-xl object-cover shadow-lg" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center shadow-lg shadow-amber-400/20">
                                    <i className="fa-solid fa-graduation-cap text-slate-900"></i>
                                </div>
                            )}
                            <div>
                                <p className="text-white font-display font-bold text-base tracking-tight leading-tight">
                                    {app.name}
                                </p>
                                <p className="text-amber-400 text-[11px] font-semibold uppercase tracking-widest">
                                    Portal Kandidat
                                </p>
                            </div>
                        </div>
                        {/* Tombol Beranda di bawah brand */}
                        <Link
                            href={route('home')}
                            className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/60 hover:text-white/90 px-3 py-2 rounded-lg transition-all duration-300 border border-white/10 hover:bg-white/8"
                        >
                            <i className="fa-solid fa-arrow-left-long text-[11px]"></i>
                            Kembali ke Beranda
                        </Link>
                    </div>

                    {/* Form Card */}
                    <div className="w-full max-w-[420px] relative z-10
                        bg-white/[0.04] md:bg-white/70
                        backdrop-blur-xl
                        p-8 sm:p-10 rounded-[2rem]
                        shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_20px_50px_-12px_rgba(0,0,0,0.5)]
                        md:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]
                        border border-white/10 md:border-white
                    ">

                        {/* Header */}
                        <div className="login-field opacity-0 mb-8">
                            <h2 className="text-[28px] font-display font-extrabold tracking-tight text-white md:text-slate-900">
                                Masuk ke Akun
                            </h2>
                            <p className="text-sm mt-2 font-medium text-slate-400 md:text-slate-500">
                                Masukkan kredensial kamu untuk mengakses sistem.
                            </p>
                        </div>

                        {/* Status flash */}
                        {status && (
                            <div className="login-field opacity-0 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3.5 text-sm text-emerald-400 flex items-start gap-3 md:bg-emerald-50/80 md:border-emerald-200/60 md:text-emerald-700">
                                <i className="fa-solid fa-circle-check mt-0.5 flex-shrink-0"></i>
                                <span className="font-medium leading-relaxed">{status}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Email */}
                            <div className="login-field opacity-0">
                                <label className="block text-[13px] font-bold mb-2 text-slate-300 md:text-slate-700">
                                    Email <span className="text-red-400 md:text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-slate-500 group-focus-within:text-amber-400 md:text-slate-400 md:group-focus-within:text-gold">
                                        <i className="fa-solid fa-envelope text-sm"></i>
                                    </span>
                                    <input
                                        type="email"
                                        value={data.email}
                                        autoComplete="email"
                                        autoFocus
                                        onChange={e => setData('email', e.target.value)}
                                        placeholder="nama@email.com"
                                        className={[
                                            'w-full border rounded-xl pl-11 pr-4 py-3.5 text-[15px] font-medium outline-none transition-all duration-300',
                                            'bg-white/[0.06] text-white placeholder:text-slate-500 border-white/10 focus:border-amber-500/60 focus:ring-4 focus:ring-amber-500/10',
                                            'md:bg-white/50 md:text-slate-900 md:placeholder:text-slate-400',
                                            errors.email
                                                ? 'border-red-500/60 md:bg-red-50/50 md:border-red-300 md:focus:border-red-500 md:focus:ring-red-500/10'
                                                : 'md:border-slate-200 md:focus:bg-white md:focus:border-gold md:focus:ring-gold/15 md:hover:border-slate-300',
                                        ].join(' ')}
                                    />
                                </div>
                                {errors.email && (
                                    <span className="text-xs font-semibold text-red-400 mt-1.5 flex items-center gap-1.5 animate-pulse">
                                        <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                                        {errors.email}
                                    </span>
                                )}
                            </div>

                            {/* Password */}
                            <div className="login-field opacity-0">
                                <label className="block text-[13px] font-bold mb-2 text-slate-300 md:text-slate-700">
                                    Password <span className="text-red-400 md:text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-slate-500 group-focus-within:text-amber-400 md:text-slate-400 md:group-focus-within:text-gold">
                                        <i className="fa-solid fa-lock text-sm"></i>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        autoComplete="current-password"
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className={[
                                            'w-full border rounded-xl pl-11 pr-12 py-3.5 text-[15px] font-medium outline-none transition-all duration-300',
                                            'bg-white/[0.06] text-white placeholder:text-slate-500 border-white/10 focus:border-amber-500/60 focus:ring-4 focus:ring-amber-500/10',
                                            'md:bg-white/50 md:text-slate-900 md:placeholder:text-slate-400',
                                            errors.password
                                                ? 'border-red-500/60 md:bg-red-50/50 md:border-red-300 md:focus:border-red-500 md:focus:ring-red-500/10'
                                                : 'md:border-slate-200 md:focus:bg-white md:focus:border-gold md:focus:ring-gold/15 md:hover:border-slate-300',
                                        ].join(' ')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 md:text-slate-400 md:hover:text-slate-700 transition-colors"
                                    >
                                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="text-xs font-semibold text-red-400 mt-1.5 flex items-center gap-1.5 animate-pulse">
                                        <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                                        {errors.password}
                                    </span>
                                )}
                            </div>

                            {/* Remember me & Lupa password */}
                            <div className="login-field opacity-0 flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={e => setData('remember', e.target.checked)}
                                        className="peer w-4 h-4 rounded border-white/20 md:border-slate-300 bg-white/10 md:bg-white text-gold focus:ring-gold/30 transition-all cursor-pointer"
                                    />
                                    <span className="text-[13px] font-medium text-slate-400 group-hover:text-slate-200 md:text-slate-600 md:group-hover:text-slate-900 transition-colors">
                                        Ingat saya
                                    </span>
                                </label>
                                <Link
                                    href={route('password.request')}
                                    className="text-[13px] font-semibold text-slate-400 hover:text-amber-400 md:text-slate-700 md:hover:text-gold transition-colors"
                                >
                                    Lupa password?
                                </Link>
                            </div>

                            {/* Submit */}
                            <div className="login-field opacity-0 pt-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="login-btn w-full bg-slate-900 hover:bg-slate-800 md:bg-slate-900 md:hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5 shadow-[0_8px_20px_rgba(15,23,42,0.4)] hover:shadow-[0_12px_25px_rgba(15,23,42,0.5)] active:scale-[0.98]"
                                >
                                    {processing
                                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
                                        : <><i className="fa-solid fa-fingerprint text-gold"></i> Masuk Sekarang</>
                                    }
                                </button>
                            </div>
                        </form>

                        {/* Daftar link */}
                        <div className="login-field opacity-0 mt-8 pt-6 border-t border-white/[0.07] md:border-slate-200/60 text-center">
                            <p className="text-[13px] font-medium text-slate-500 md:text-slate-500">
                                Belum punya akses?{' '}
                                <Link href={route('daftar')} className="text-amber-400 md:text-gold font-bold hover:text-amber-300 md:hover:text-amber-500 transition-colors">
                                    Daftar sekarang
                                </Link>
                            </p>
                        </div>

                        {/* Mobile — feature hints di dalam card */}
                        <div className="md:hidden mt-6 pt-5 border-t border-white/[0.07] space-y-3">
                            {features.map((f, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                                        <i className={`fa-solid ${f.icon} text-amber-400 text-[10px]`}></i>
                                    </div>
                                    <p className="text-[12px] text-slate-500 leading-snug">
                                        <span className="text-slate-300 font-semibold">{f.icon === 'fa-shield-halved' ? 'Aman' : f.icon === 'fa-bolt' ? 'Real-time' : 'Notifikasi'}</span>
                                        {' — '}{f.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security Badge — desktop */}
                    <div className="login-field opacity-0 hidden md:flex mt-6 absolute bottom-8 items-center justify-center gap-2.5 text-[11px] font-semibold text-slate-400 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/50 shadow-sm">
                        <i className="fa-solid fa-shield-halved text-emerald-500"></i>
                        <span>Koneksi Diamankan · AES-256 Encryption</span>
                    </div>

                    {/* Security Badge — mobile */}
                    <div className="login-field opacity-0 md:hidden mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500 relative z-10">
                        <i className="fa-solid fa-shield-halved text-amber-500/70"></i>
                        <span>Koneksi Diamankan · AES-256 Encryption</span>
                    </div>

                    {/* Mobile — link ke portal staff */}
                    <div className="md:hidden mt-4 relative z-10">
                        <Link
                            href={route('staff.login')}
                            className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <i className="fa-solid fa-user-tie text-[11px]"></i>
                            Masuk sebagai Staff
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}