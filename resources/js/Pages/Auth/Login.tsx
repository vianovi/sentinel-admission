import { useEffect, useRef, useState } from 'react'
import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { animate, stagger } from 'animejs'
import { PageProps } from '@/types'

interface LoginProps {
    status?: string
}

export default function Login({ status }: LoginProps) {
    const { props } = usePage<PageProps>()
    const { app } = props

    const { data, setData, post, processing, errors, reset } = useForm({
        email:    '',
        password: '',
        remember: false,
    })

    const[showPassword, setShowPassword] = useState(false)
    const leftRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        animate(leftRef.current!, {
            opacity:[0, 1],
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
    },[])

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

            <div className="min-h-screen w-full flex bg-slate-950 font-sans selection:bg-gold/30 selection:text-gold">

                {/* ── Left Panel (Brand & Info) ── */}
                <div
                    ref={leftRef}
                    className="hidden md:flex md:w-[45%] lg:w-[42%] flex-col justify-between p-10 lg:p-14 relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-white/5"
                    style={{ opacity: 0 }}
                >
                    {/* Glowing Orbs Ambient */}
                    <div className="pointer-events-none absolute -top-20 -left-10 w-72 h-72 bg-gradient-to-br from-amber-400/20 via-rose-400/10 to-sky-400/10 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-emerald-400/10 via-cyan-400/10 to-amber-300/10 rounded-full blur-3xl" />

                    {/* Subtle Cyber Grid Overlay on Dark Side */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] pointer-events-none opacity-50" />

                    {/* Logo Area */}
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

                    {/* Center Content */}
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

                        {/* Feature List */}
                        <div className="space-y-4 pt-4">
                            {[
                                { icon: 'fa-shield-halved', text: 'Sesi aman & terenkripsi end-to-end' },
                                { icon: 'fa-bolt',          text: 'Akses real-time ke sistem lab' },
                                { icon: 'fa-bell',          text: 'Notifikasi pengumuman instan' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 text-sm text-slate-300 group">
                                    <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:border-gold/30 transition-colors">
                                        <i className={`fa-solid ${item.icon} text-amber-400 text-[13px]`}></i>
                                    </div>
                                    <span className="font-medium tracking-wide">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer left — portal staff */}
                    <div className="relative z-10">
                        <Link
                            href="/staff/login"
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

                {/* ── Right Panel (The "Wow" Form Area) ── */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden bg-slate-50">

                    {/* ── Ambient Background Kanan (Biar Gak Polos) ── */}
                    {/* Dot Matrix Pattern */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQ4LDE2MywxODQsMC4yKSIvPjwvc3ZnPg==')] pointer-events-none" />

                    {/* Glowing Orbs di kanan */}
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-sky-400/10 rounded-full blur-[100px] pointer-events-none" />

                    {/* Button Kembali ke beranda */}
                    <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
                        <Link
                            href={route('home')}
                            className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl transition-all duration-300 shadow-sm border border-slate-200/50 hover:shadow-md"
                        >
                            <i className="fa-solid fa-arrow-left-long text-[11px]"></i>
                            Beranda
                        </Link>
                    </div>

                    {/* ── Floating Glass Card Form ── */}
                    <div className="w-full max-w-[420px] relative z-10 bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white shadow-slate-200/50">

                        {/* Header Form */}
                        <div className="login-field opacity-0 mb-8">
                            <h2 className="text-[28px] font-display font-extrabold text-slate-900 tracking-tight">
                                Masuk ke Akun
                            </h2>
                            <p className="text-sm text-slate-500 mt-2 font-medium">
                                Masukkan kredensial kamu untuk mengakses lab.
                            </p>
                        </div>

                        {/* Status flash message */}
                        {status && (
                            <div className="login-field opacity-0 mb-6 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 rounded-xl px-4 py-3.5 text-sm text-emerald-700 flex items-start gap-3 shadow-sm">
                                <i className="fa-solid fa-circle-check text-emerald-500 mt-0.5 flex-shrink-0"></i>
                                <span className="font-medium leading-relaxed">{status}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Input Email */}
                            <div className="login-field opacity-0">
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gold transition-colors">
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
                                            'w-full border rounded-xl pl-11 pr-4 py-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 font-medium outline-none transition-all duration-300',
                                            errors.email
                                                ? 'bg-red-50/50 border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                                : 'bg-white/50 border-slate-200 focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 hover:border-slate-300',
                                        ].join(' ')}
                                    />
                                </div>
                                {errors.email && (
                                    <span className="text-xs font-semibold text-red-500 mt-1.5 flex items-center gap-1.5 animate-pulse">
                                        <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                                        {errors.email}
                                    </span>
                                )}
                            </div>

                            {/* Input Password */}
                            <div className="login-field opacity-0">
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gold transition-colors">
                                        <i className="fa-solid fa-lock text-sm"></i>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        autoComplete="current-password"
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className={[
                                            'w-full border rounded-xl pl-11 pr-12 py-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 font-medium outline-none transition-all duration-300',
                                            errors.password
                                                ? 'bg-red-50/50 border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                                : 'bg-white/50 border-slate-200 focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 hover:border-slate-300',
                                        ].join(' ')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                                    >
                                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="text-xs font-semibold text-red-500 mt-1.5 flex items-center gap-1.5 animate-pulse">
                                        <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                                        {errors.password}
                                    </span>
                                )}
                            </div>

                            {/* Actions (Remember Me & Lupa Password di Bawah) */}
                            <div className="login-field opacity-0 flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={data.remember}
                                            onChange={e => setData('remember', e.target.checked)}
                                            className="peer w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-gold/30 transition-all cursor-pointer"
                                        />
                                    </div>
                                    <span className="text-[13px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                                        Ingat saya
                                    </span>
                                </label>

                                <Link
                                    href={route('password.request')}
                                    className="text-[13px] font-semibold text-slate-700 hover:text-gold transition-colors"
                                >
                                    Lupa password?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <div className="login-field opacity-0 pt-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="login-btn w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_20px_rgb(15,23,42,0.2)] hover:shadow-[0_12px_25px_rgb(15,23,42,0.3)] active:scale-[0.98]"
                                >
                                    {processing
                                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
                                        : <><i className="fa-solid fa-fingerprint text-gold"></i> Masuk Sekarang</>
                                    }
                                </button>
                            </div>
                        </form>

                        {/* Divider / Daftar Link */}
                        <div className="login-field opacity-0 mt-8 pt-6 border-t border-slate-200/60 text-center">
                            <p className="text-[13px] font-medium text-slate-500">
                                Belum punya akses?{' '}
                                <Link href={route('daftar')} className="text-gold font-bold hover:text-amber-500 transition-colors">
                                    Daftar sekarang
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Security Badge (Outside Card at Bottom) */}
                    <div className="login-field opacity-0 absolute bottom-8 flex items-center justify-center gap-2.5 text-[11px] font-semibold text-slate-400 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/50 shadow-sm">
                        <i className="fa-solid fa-shield-halved text-emerald-500"></i>
                        <span>Koneksi Diamankan · AES-256 Encryption</span>
                    </div>

                </div>
            </div>
        </>
    )
}