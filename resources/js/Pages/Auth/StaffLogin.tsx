// resources/js/Pages/Auth/StaffLogin.tsx

import { useEffect, useRef, useState } from 'react'
import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { animate, stagger } from 'animejs'
import { PageProps } from '@/types'

interface StaffLoginProps {
    status?: string
}

export default function StaffLogin({ status }: StaffLoginProps) {
    const { props } = usePage<PageProps>()
    const { app }   = props

    const { data, setData, post, processing, errors, reset } = useForm({
        email:    '',
        password: '',
    })

    const [showPassword, setShowPassword] = useState(false)
    const leftRef  = useRef<HTMLDivElement>(null)
    const rightRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Left panel slide in
        animate(leftRef.current!, {
            opacity:    [0, 1],
            translateX: [-40, 0],
            duration:   900,
            ease:       'outExpo',
        })
        // Form fields stagger
        animate('.login-field', {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(90, { start: 400 }),
            ease:       'outExpo',
        })
        // Mobile brand header
        animate('.mobile-brand', {
            opacity:    [0, 1],
            translateY: [-16, 0],
            duration:   600,
            ease:       'outExpo',
        })
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('staff.login.post'), {
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
        {
            icon: 'fa-lock',
            title: 'Koneksi Terenkripsi',
            desc:  'Jalur data diamankan dengan AES-256 SSL',
        },
        {
            icon: 'fa-user-shield',
            title: 'Akses Terotorisasi',
            desc:  'Hanya untuk staff & instruktur terdaftar',
        },
        {
            icon: 'fa-clock-rotate-left',
            title: 'Sistem Audit Log',
            desc:  'Seluruh aktivitas login terekam oleh sistem',
        },
    ]

    return (
        <>
            <Head title="Portal Staff" />

            <div className="min-h-screen w-full flex bg-slate-950 font-sans selection:bg-blue-500/30 selection:text-blue-300">

                {/* ══════════════════════════════════════════════════════════
                    LEFT PANEL — Command Center
                ══════════════════════════════════════════════════════════ */}
                <div
                    ref={leftRef}
                    className="hidden md:flex md:w-[45%] lg:w-[42%] flex-col justify-between p-10 lg:p-14 relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#0a1628] to-slate-950 border-r border-white/5"
                    style={{ opacity: 0 }}
                >
                    {/* Ambient orbs */}
                    <div className="pointer-events-none absolute -top-24 -left-12 w-80 h-80 bg-gradient-to-br from-blue-600/25 via-cyan-500/10 to-transparent rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-indigo-500/15 via-cyan-400/10 to-transparent rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl" />

                    {/* Dot grid */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] pointer-events-none opacity-60" />

                    {/* ── Logo ── */}
                    <div className="relative z-10">
                        <Link href={route('home')} className="inline-flex items-center gap-3 group">
                            {app.logo ? (
                                <img src={app.logo} alt={app.name} className="w-11 h-11 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                                    <i className="fa-solid fa-shield-halved text-white text-lg"></i>
                                </div>
                            )}
                            <span className="text-white font-display font-bold text-xl tracking-tight">
                                {app.name}<span className="text-blue-400">.</span>
                            </span>
                        </Link>
                    </div>

                    {/* ── Center content ── */}
                    <div className="relative z-10 space-y-10">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                                <span className="text-[10px] text-blue-300/90 font-bold uppercase tracking-widest">
                                    Portal Staff & Tenaga Pendidik
                                </span>
                            </div>
                            <h1 className="text-4xl lg:text-[50px] font-display font-extrabold text-white leading-[1.12] tracking-tight">
                                Command<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-200">
                                    Center.
                                </span>
                            </h1>
                            <p className="text-slate-400 text-[15px] mt-5 leading-relaxed max-w-sm font-medium">
                                Akses terbatas untuk tenaga pendidik dan administrasi. Kelola seleksi, verifikasi, dan pantau proses penerimaan.
                            </p>
                        </div>

                        {/* Feature list — seperti gambar referensi */}
                        <div className="space-y-1">
                            {features.map((f, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-white/[0.07] flex items-center justify-center flex-shrink-0 shadow-inner group-hover:border-blue-500/30 transition-colors">
                                        <i className={`fa-solid ${f.icon} text-blue-400 text-[13px]`}></i>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-semibold text-slate-200 leading-tight">
                                            {f.title}
                                        </p>
                                        <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">
                                            {f.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Bottom link ke portal kandidat ── */}
                    <div className="relative z-10">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-3 text-xs font-medium text-slate-400 hover:text-blue-300 transition-all group px-5 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 backdrop-blur-sm w-max"
                        >
                            <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center shadow-inner">
                                <i className="fa-solid fa-user-graduate text-[11px] text-slate-400 group-hover:text-blue-300 transition-colors"></i>
                            </div>
                            Portal Kandidat
                            <i className="fa-solid fa-arrow-right text-[11px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"></i>
                        </Link>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    RIGHT PANEL — Form (desktop putih premium + mobile dark)
                ══════════════════════════════════════════════════════════ */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden bg-slate-50 md:bg-slate-50">

                    {/* Background layers - desktop */}
                    <div className="hidden md:block pointer-events-none">
                        {/* Dot matrix */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQ4LDE2MywxODQsMC4yKSIvPjwvc3ZnPg==')] pointer-events-none" />
                        {/* Orb biru besar kanan atas */}
                        <div className="absolute -top-20 right-0 translate-x-1/3 w-[520px] h-[520px] bg-blue-500/20 rounded-full blur-[100px]" />
                        {/* Orb cyan kiri bawah */}
                        <div className="absolute bottom-0 -left-20 translate-y-1/4 w-[420px] h-[420px] bg-cyan-400/15 rounded-full blur-[100px]" />
                        {/* Orb indigo tengah subtle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-400/10 rounded-full blur-[80px]" />
                    </div>

                    {/* Background layers - mobile dark */}
                    <div className="absolute inset-0 md:hidden bg-gradient-to-b from-[#060d1a] via-[#0a1628] to-[#060d1a]">
                        {/* Orb biru besar kiri atas */}
                        <div className="absolute -top-32 -left-16 w-[360px] h-[360px] bg-blue-500/30 rounded-full blur-[80px]" />
                        {/* Orb cyan kanan bawah */}
                        <div className="absolute -bottom-20 -right-16 w-[320px] h-[320px] bg-cyan-400/25 rounded-full blur-[80px]" />
                        {/* Orb indigo tengah */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-indigo-500/15 rounded-full blur-[60px]" />
                        {/* Dot grid */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-60" />
                        {/* Blue accent line top */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
                    </div>

                    {/* Tombol kembali ke beranda - desktop only (absolute) */}
                    <div className="hidden md:block absolute top-8 left-8 z-20">
                        <Link
                            href={route('home')}
                            className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl transition-all duration-300 shadow-sm border border-slate-200/50 hover:shadow-md"
                        >
                            <i className="fa-solid fa-arrow-left-long text-[11px]"></i>
                            Beranda
                        </Link>
                    </div>

                    {/* Mobile: brand header + tombol beranda (flow normal, tidak absolute) */}
                    <div className="mobile-brand md:hidden w-full max-w-[420px] relative z-10 opacity-0 pt-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            {app.logo ? (
                                <img src={app.logo} alt={app.name} className="w-10 h-10 rounded-xl object-cover shadow-lg" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <i className="fa-solid fa-shield-halved text-white"></i>
                                </div>
                            )}
                            <div>
                                <p className="text-white font-display font-bold text-base tracking-tight leading-tight">
                                    {app.name}
                                </p>
                                <p className="text-blue-400 text-[11px] font-semibold uppercase tracking-widest">
                                    Portal Staff
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('home')}
                            className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/60 hover:text-white/90 px-3 py-2 rounded-lg transition-all duration-300 border border-white/10 hover:bg-white/8"
                        >
                            <i className="fa-solid fa-arrow-left-long text-[11px]"></i>
                            Kembali ke Beranda
                        </Link>
                    </div>

                    {/* ── Form Card ── */}
                    <div className="w-full max-w-[420px] relative z-10
                        bg-white/[0.04] md:bg-white
                        backdrop-blur-xl md:backdrop-blur-none
                        p-8 sm:p-10 rounded-2xl
                        shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_20px_50px_-12px_rgba(0,0,0,0.5)]
                        md:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)]
                        border border-white/10 md:border-slate-200/60"
                    >

                        {/* Header */}
                        <div className="login-field opacity-0 mb-8">
                            <div className="hidden md:flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center mb-5 shadow-lg shadow-blue-600/25">
                                <i className="fa-solid fa-shield-halved text-white text-lg"></i>
                            </div>
                            <h2 className="text-[26px] font-display font-extrabold tracking-tight
                                text-white md:text-slate-900">
                                Masuk ke Portal Staff
                            </h2>
                            <p className="text-[14px] mt-2 font-medium
                                text-slate-400 md:text-slate-500">
                                Khusus tenaga pendidik dan administrasi sekolah.
                            </p>
                        </div>

                        {/* Status flash */}
                        {status && (
                            <div className="login-field opacity-0 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3.5 text-sm text-emerald-400 flex items-start gap-3">
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
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors
                                        text-slate-500 group-focus-within:text-blue-400
                                        md:text-slate-400 md:group-focus-within:text-blue-500">
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
                                            // mobile dark
                                            'bg-white/[0.06] text-white placeholder:text-slate-500 border-white/10 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10',
                                            // desktop override
                                            'md:bg-slate-50 md:text-slate-900 md:placeholder:text-slate-400',
                                            errors.email
                                                ? 'border-red-500/60 focus:border-red-500 md:border-red-300 md:bg-red-50/50'
                                                : 'md:border-slate-200 md:focus:bg-white md:focus:border-blue-500 md:focus:ring-blue-500/10 md:hover:border-slate-300',
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
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors
                                        text-slate-500 group-focus-within:text-blue-400
                                        md:text-slate-400 md:group-focus-within:text-blue-500">
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
                                            'bg-white/[0.06] text-white placeholder:text-slate-500 border-white/10 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10',
                                            'md:bg-slate-50 md:text-slate-900 md:placeholder:text-slate-400',
                                            errors.password
                                                ? 'border-red-500/60 focus:border-red-500 md:border-red-300 md:bg-red-50/50'
                                                : 'md:border-slate-200 md:focus:bg-white md:focus:border-blue-500 md:focus:ring-blue-500/10 md:hover:border-slate-300',
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

                            {/* Lupa password */}
                            <div className="login-field opacity-0 flex items-center justify-end pt-1">
                                <Link
                                    href={route('password.request')}
                                    className="text-[13px] font-semibold text-slate-400 hover:text-blue-400 md:text-slate-700 md:hover:text-blue-600 transition-colors"
                                >
                                    Lupa password?
                                </Link>
                            </div>

                            {/* Submit */}
                            <div className="login-field opacity-0 pt-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="login-btn w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:shadow-[0_12px_30px_rgba(37,99,235,0.45)] active:scale-[0.98]"
                                >
                                    {processing
                                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
                                        : <><i className="fa-solid fa-shield-halved"></i> Masuk ke Dashboard</>
                                    }
                                </button>
                            </div>
                        </form>

                        {/* Mobile — feature hints di dalam card */}
                        <div className="md:hidden mt-7 pt-6 border-t border-white/[0.07] space-y-3">
                            {features.map((f, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                        <i className={`fa-solid ${f.icon} text-blue-400 text-[10px]`}></i>
                                    </div>
                                    <p className="text-[12px] text-slate-500 leading-snug">
                                        <span className="text-slate-300 font-semibold">{f.title}</span>
                                        {' — '}{f.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security Badge — desktop */}
                    <div className="login-field opacity-0 hidden md:flex mt-6 items-center justify-center gap-2.5 text-[11px] font-semibold text-slate-400 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/50 shadow-sm">
                        <i className="fa-solid fa-shield-halved text-blue-500"></i>
                        <span>Akses Terbatas · Hanya untuk Staff Terotorisasi</span>
                    </div>

                    {/* Security Badge — mobile */}
                    <div className="login-field opacity-0 md:hidden mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500 relative z-10">
                        <i className="fa-solid fa-shield-halved text-blue-500/70"></i>
                        <span>Akses Terbatas · Hanya untuk Staff Terotorisasi</span>
                    </div>

                    {/* Mobile — link ke portal kandidat (bawah) */}
                    <div className="md:hidden mt-4 relative z-10">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <i className="fa-solid fa-user-graduate text-[11px]"></i>
                            Masuk sebagai Kandidat
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}