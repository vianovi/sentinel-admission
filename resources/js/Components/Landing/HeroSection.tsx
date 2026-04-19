// resources/js/Components/Landing/HeroSection.tsx

import { useEffect, useRef, useState } from 'react'
import { Link } from '@inertiajs/react'
import { animate, stagger } from 'animejs'
import { AdmissionWaveData } from '@/types/landing'
import WaveCard from './WaveCard'
import ScheduleModal from './ScheduleModal'

interface HeroSectionProps {
    activeWave:   AdmissionWaveData | null
    onOpenVideo:  () => void
}

export default function HeroSection({ activeWave, onOpenVideo }: HeroSectionProps) {
    const currentYear = new Date().getFullYear()
    const heroRef = useRef<HTMLDivElement>(null)
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false)

    useEffect(() => {
        animate('.hero-animate', {
            opacity:    [0, 1],
            translateY: [40, 0],
            duration:   1200,
            delay:      stagger(180, { start: 200 }),
            ease:       'outExpo',
        })
        animate('.wave-card-animate', {
            opacity:    [0, 1],
            translateX: [60, 0],
            duration:   1300,
            delay:      600,
            ease:       'outExpo',
        })
    }, [])

    /*
     * ✅ PERF: <style> inline dihapus sepenuhnya.
     *    hero-shimmer-text & @keyframes hero-shimmer
     *    sudah dipindah ke resources/css/app.css — di-cache browser,
     *    tidak di-parse ulang setiap render.
     */

    return (
        <>
            <header id="home" className="relative min-h-[90vh] flex items-center pt-10 pb-20">

                {/* Background image + dark overlay */}
                <div className="absolute inset-0 z-0">
                    {/*
                     * ✅ PERF: Pakai <picture> untuk serve gambar berbeda per device.
                     *    - Mobile (≤768px) → hero-background-mobile.webp (18KB)
                     *    - Desktop (>768px) → hero-background.webp (68KB)
                     *    - fetchPriority="high" → LCP element, prioritas tertinggi
                     *    - loading="eager"     → jangan lazy, langsung load
                     *    - decoding="async"    → decode di background thread
                     */}
                    <picture>
                        <source
                            media="(max-width: 768px)"
                            srcSet="/assets/hero-background-mobile.webp"
                            type="image/webp"
                        />
                        <source
                            media="(min-width: 769px)"
                            srcSet="/assets/hero-background.webp"
                            type="image/webp"
                        />
                        <img
                            src="/assets/hero-background.webp"
                            alt="Lingkungan Al-Muntaha Boarding School"
                            className="w-full h-full object-cover"
                            fetchPriority="high"
                            loading="eager"
                            decoding="async"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-r from-navy/85 via-navy/60 to-navy/20 lg:to-navy/10" />
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div ref={heroRef} className="space-y-6 text-center lg:text-left">

                            {/* Badge PSB */}
                            <div className="hero-animate opacity-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                                <span className="relative flex h-2 w-2 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                                </span>
                                Penerimaan Siswa Baru {currentYear}/{currentYear + 1}
                            </div>

                            {/* Headline */}
                            <h1 className="hero-animate opacity-0 text-4xl lg:text-6xl font-display font-bold leading-tight">
                                <span className="text-white">Membangun Generasi</span>
                                <br />
                                {/* ✅ Class hero-shimmer-text sekarang dari app.css */}
                                <span className="hero-shimmer-text">Cerdas &amp; Beradab</span>
                            </h1>

                            {/* Subtext */}
                            <p className="hero-animate opacity-0 text-slate-300 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                                Al-Muntaha Islamic Boarding School — tempat tumbuhnya generasi unggul
                                yang berilmu, berkarakter, dan siap menghadapi tantangan zaman.
                            </p>

                            {/* CTA Buttons */}
                            <div className="hero-animate flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <Link
                                    href="/daftar"
                                    className="w-full sm:w-auto px-8 py-3.5 bg-gold rounded-xl font-semibold shadow-xl hover:-translate-y-1 transition duration-300 text-center"
                                    style={{ color: '#0f172a' }}
                                >
                                    Daftar Gelombang Ini
                                </Link>
                                <button
                                    onClick={onOpenVideo}
                                    aria-label="Tonton video profil sekolah"
                                    className="w-full sm:w-auto px-6 py-3.5 border border-white/30 text-white rounded-xl font-medium hover:bg-white/10 transition flex items-center justify-center gap-2 group backdrop-blur-sm"
                                >
                                    <i className="fa-solid fa-play-circle text-gold text-xl group-hover:scale-110 transition"></i>
                                    Tonton Profil
                                </button>
                            </div>

                            {/* Badges */}
                            <div className="hero-animate pt-6 flex items-center gap-3 justify-center lg:justify-start flex-wrap">
                                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gold/15 border border-gold/40 text-white font-bold text-xs shadow-sm backdrop-blur-sm">
                                    <i className="fa-solid fa-medal text-gold text-sm"></i>
                                    <span>Akreditasi <span className="text-gold">A</span></span>
                                </div>
                                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-xs shadow-sm backdrop-blur-sm">
                                    <i className="fa-solid fa-check-shield text-white/80 text-sm"></i>
                                    <span>Kemdikbud</span>
                                </div>
                                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-xs shadow-sm backdrop-blur-sm">
                                    <i className="fa-solid fa-mosque text-white/80 text-sm"></i>
                                    <span>Islamic Boarding</span>
                                </div>
                            </div>
                        </div>

                        <div className="wave-card-animate opacity-0">
                            <WaveCard
                                activeWave={activeWave}
                                onOpenSchedule={() => setScheduleModalOpen(true)}
                            />
                        </div>
                    </div>
                </div>

                {/* Wave SVG Divider */}
                <div className="absolute bottom-0 left-0 right-0 z-10 leading-none">
                    <svg
                        viewBox="0 0 1440 72"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                        className="w-full h-[60px] md:h-[72px]"
                    >
                        <path
                            d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z"
                            fill="#f8fafc"
                        />
                    </svg>
                </div>
            </header>

            {activeWave && (
                <ScheduleModal
                    isOpen={scheduleModalOpen}
                    onClose={() => setScheduleModalOpen(false)}
                    activeWave={activeWave}
                />
            )}
        </>
    )
}