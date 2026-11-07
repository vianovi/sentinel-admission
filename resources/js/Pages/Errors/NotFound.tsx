// resources/js/Pages/Errors/NotFound.tsx
// Gunakan juga untuk halaman "Segera Hadir" dengan prop `comingSoon={true}`

import { useEffect, useRef } from 'react'
import { Head, Link, usePage } from '@inertiajs/react'
import { animate, stagger }  from 'animejs'

interface Props {
    comingSoon?: boolean  // true = "Segera Hadir", false = 404
    backUrl?:    string   // override tombol kembali
    backLabel?:  string
    featureName?: string
    description?: string
    statusLabel?: string
}

export default function NotFound({
    comingSoon = true,
    backUrl    = '/dashboard',
    backLabel  = 'Kembali',
    featureName = 'Fitur Ini Sedang Disiapkan',
    description,
    statusLabel = 'Segera Hadir',
}: Props) {

    const containerRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        // Stagger entrance
        animate('.nf-item', {
            opacity:    [0, 1],
            translateY: [30, 0],
            duration:   700,
            delay:      stagger(100, { start: 200 }),
            ease:       'outExpo',
        })

        // Glow ambient pulse
        animate('.nf-glow', {
            opacity:  [0.3, 0.6],
            scale:    [1, 1.15],
            duration: 3000,
            loop:     true,
            direction: 'alternate',
            ease:     'inOutSine',
        })

        // Floating lantern animation
        animate('.nf-lantern', {
            translateY: [-8, 8],
            duration:   2800,
            loop:       true,
            direction:  'alternate',
            ease:       'inOutSine',
        })
    }, [])

    return (
        <>
            <Head title={comingSoon ? 'Segera Hadir' : 'Halaman Tidak Ditemukan'} />

            <div
                ref={containerRef}
                className="relative min-h-screen overflow-hidden bg-[#080d18] flex items-center justify-center px-4"
            >
                {/* ── Ambient Glows ─────────────────────────────────────── */}
                <div
                    className="nf-glow pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px]
                               rounded-full opacity-40 blur-[120px]"
                    style={{ background: 'radial-gradient(circle, #d4a01733 0%, transparent 70%)' }}
                />
                <div
                    className="nf-glow pointer-events-none absolute -bottom-32 -left-20 h-[400px] w-[400px]
                               rounded-full opacity-30 blur-[100px]"
                    style={{ background: 'radial-gradient(circle, #1e40af22 0%, transparent 70%)' }}
                />

                {/* ── Dot grid pattern ──────────────────────────────────── */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #d4a017 1px, transparent 1px)',
                        backgroundSize:  '32px 32px',
                    }}
                />

                {/* ── Main Content ──────────────────────────────────────── */}
                <div className="relative z-10 flex flex-col items-center text-center max-w-lg">

                    {/* Lantern / Icon */}
                    <div className="nf-item nf-lantern mb-8">
                        {comingSoon ? (
                            // Jam pasir untuk "Segera Hadir"
                            <div className="relative flex h-24 w-24 items-center justify-center">
                                <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl" />
                                <i className="fa-solid fa-hourglass-half text-5xl text-gold" />
                            </div>
                        ) : (
                            // Kompas hilang arah untuk 404
                            <div className="relative flex h-24 w-24 items-center justify-center">
                                <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl" />
                                <i className="fa-solid fa-compass-drafting text-5xl text-gold" />
                            </div>
                        )}
                    </div>

                    {/* Kode error atau label */}
                    <div className="nf-item mb-3">
                        {comingSoon ? (
                            <span className="inline-block rounded-full border border-gold/30 bg-gold/10
                                           px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                                {statusLabel}
                            </span>
                        ) : (
                            <span
                                className="block text-[7rem] font-black leading-none tracking-tighter"
                                style={{
                                    background: 'linear-gradient(135deg, #d4a017 0%, #f5d06a 40%, #b5850b 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                404
                            </span>
                        )}
                    </div>

                    {/* Judul */}
                    <h1 className="nf-item mb-3 text-2xl font-bold text-slate-100">
                        {comingSoon
                            ? featureName
                            : 'Halaman Tidak Ditemukan'
                        }
                    </h1>

                    {/* Deskripsi */}
                    <p className="nf-item mb-8 text-sm leading-relaxed text-slate-400 max-w-sm">
                        {comingSoon
                            ? description ?? 'Fitur ini sedang disiapkan dan belum tersedia untuk digunakan.'
                            : 'Halaman yang kamu cari tidak ada atau mungkin telah dipindahkan. Jangan khawatir, kamu bisa kembali ke dashboard.'
                        }
                    </p>

                    {/* Tombol aksi */}
                    <div className="nf-item flex flex-col items-center gap-3 sm:flex-row">
                        <Link
                            href={backUrl}
                            className="flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5
                                       text-sm font-semibold text-navy transition-all duration-200
                                       hover:bg-goldhover active:scale-95"
                        >
                            <i className="fa-solid fa-arrow-left text-xs" />
                            {backLabel}
                        </Link>

                        {!comingSoon && (
                            <Link
                                href="/"
                                className="flex items-center gap-2 rounded-xl border border-white/10
                                           bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-300
                                           transition-all duration-200 hover:border-gold/30 hover:text-gold"
                            >
                                <i className="fa-solid fa-house text-xs" />
                                Halaman Utama
                            </Link>
                        )}
                    </div>

                    {/* Footer kecil */}
                    <p className="nf-item mt-12 text-xs text-slate-600">
                        Al-Muntaha School · Sistem Penerimaan Murid Baru
                    </p>

                </div>
            </div>
        </>
    )
}
