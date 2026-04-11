import { useEffect, useRef } from 'react'
import { Head, Link } from '@inertiajs/react'
import { animate } from 'animejs'

interface WrongPortalProps {
    from:         'staff' | 'candidate'
    correctRoute: string
}

export default function WrongPortal({ from, correctRoute }: WrongPortalProps) {

    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        animate(cardRef.current!, {
            opacity:   [0, 1],
            scale:     [0.92, 1],
            translateY:[24, 0],
            duration:  500,
            ease:      'outExpo',
        })
    }, [])

    // ── Copy per skenario ───────────────────────────────────────────────────
    const content = from === 'staff'
        ? {
            icon:        'fa-user-graduate',
            iconColor:   'text-amber-400',
            iconBg:      'bg-amber-500/10 border-amber-500/20',
            badge:       'Akun Kandidat Terdeteksi',
            badgeColor:  'bg-amber-500/10 border-amber-500/20 text-amber-300',
            title:       'Kamu Terdaftar sebagai Kandidat',
            description: 'Halaman ini hanya untuk Staff dan Admin. Gunakan portal kandidat untuk mengakses akun kamu.',
            btnLabel:    'Bawa Saya ke Portal Kandidat',
            btnClass:    'bg-slate-700 hover:bg-slate-600 shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.4)]',
            btnIcon:     'fa-user-graduate',
            hint:        'Sudah di portal yang benar?',
            hintLink:    route('staff.login'),
            hintLabel:   'Coba login lagi',
        }
        : {
            icon:        'fa-shield-halved',
            iconColor:   'text-blue-400',
            iconBg:      'bg-blue-500/10 border-blue-500/20',
            badge:       'Akun Staff / Admin Terdeteksi',
            badgeColor:  'bg-blue-500/10 border-blue-500/20 text-blue-300',
            title:       'Kamu Terdaftar sebagai Staff / Admin',
            description: 'Halaman ini hanya untuk Kandidat. Gunakan portal staff untuk mengakses dashboard kamu.',
            btnLabel:    'Bawa Saya ke Portal Staff',
            btnClass:    'bg-blue-600 hover:bg-blue-700 shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_12px_25px_rgba(37,99,235,0.4)]',
            btnIcon:     'fa-shield-halved',
            hint:        'Sudah di portal yang benar?',
            hintLink:    route('login'),
            hintLabel:   'Coba login lagi',
        }

    return (
        <>
            <Head title="Portal Tidak Sesuai" />

            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-6 relative overflow-hidden font-sans">

                {/* Ambient background */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
                    {/* Subtle dot grid */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiLz48L3N2Zz4=')] opacity-60" />
                </div>

                {/* Card */}
                <div
                    ref={cardRef}
                    className="relative z-10 w-full max-w-md text-center"
                    style={{ opacity: 0 }}
                >
                    {/* Warning icon */}
                    <div className="flex justify-center mb-6">
                        <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center ${content.iconBg}`}>
                            <i className={`fa-solid fa-triangle-exclamation text-amber-400 text-3xl`}></i>
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="flex justify-center mb-5">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-widest ${content.badgeColor}`}>
                            <i className={`fa-solid ${content.icon} text-[10px]`}></i>
                            {content.badge}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight leading-tight mb-4">
                        {content.title}
                    </h1>

                    {/* Description */}
                    <p className="text-slate-400 text-[15px] leading-relaxed mb-8 max-w-sm mx-auto">
                        {content.description}
                    </p>

                    {/* CTA button */}
                    <Link
                        href={correctRoute}
                        className={`inline-flex items-center justify-center gap-3 w-full text-white font-bold text-[14px] px-6 py-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] ${content.btnClass}`}
                    >
                        <i className={`fa-solid ${content.btnIcon}`}></i>
                        {content.btnLabel}
                    </Link>

                    {/* Secondary hint */}
                    <p className="mt-5 text-[13px] text-slate-500">
                        {content.hint}{' '}
                        <Link
                            href={content.hintLink}
                            className="font-semibold text-slate-400 hover:text-white transition-colors underline underline-offset-4"
                        >
                            {content.hintLabel}
                        </Link>
                    </p>

                    {/* Divider */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <Link
                            href={route('home')}
                            className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <i className="fa-solid fa-arrow-left-long text-[11px]"></i>
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}
