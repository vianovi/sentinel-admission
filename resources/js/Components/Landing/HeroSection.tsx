// resources/js/Components/Landing/HeroSection.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from '@inertiajs/react'
import { animate, stagger } from 'animejs'
import { AdmissionWaveData } from '@/types/landing'
import WaveCard from './WaveCard'
import ScheduleModal from './ScheduleModal'

interface HeroSectionProps {
    activeWave: AdmissionWaveData | null
    onOpenVideo: () => void
}

export default function HeroSection({ activeWave, onOpenVideo }: HeroSectionProps) {
    const heroRef = useRef<HTMLDivElement>(null)
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false)

    // Memoize callback untuk menghindari re-render tidak berguna pada WaveCard
    const handleOpenSchedule = useCallback(() => {
        setScheduleModalOpen(true)
    },[])

    useEffect(() => {
        // Strict Anime.js V4 approach dengan instance capture
        const textAnim = animate('.hero-text-anim', {
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 1100,
            delay: stagger(150, { start: 100 }),
            ease: 'outExpo',
        })

        const cardAnim = animate('.hero-card-anim', {
            opacity: [0, 1],
            translateX: [40, 0],
            duration: 1200,
            delay: 500,
            ease: 'outExpo',
        })

        // Cleanup function (Anti-Memory Leak Policy)
        return () => {
            if (textAnim) textAnim.cancel()
            if (cardAnim) cardAnim.cancel()
        }
    },[])

    return (
        <>
            <header id="home" className="relative min-h-[80vh] flex items-center pt-24 pb-20 overflow-hidden bg-navy">

                {/* BACKGROUND: Bersih dari filter blend yang mengotori warna */}
                <div className="absolute inset-0 z-0">
                    <picture>
                        <source media="(max-width: 768px)" srcSet="/assets/hero-background-mobile.webp" type="image/webp" />
                        <source media="(min-width: 769px)" srcSet="/assets/hero-background.webp" type="image/webp" />
                        <img
                            src="/assets/hero-background.webp"
                            alt="Lingkungan Al-Muntaha Boarding School"
                            className="w-full h-full object-cover"
                            fetchPriority="high"
                            loading="eager"
                            decoding="async"
                        />
                    </picture>
                    {/* Gradien Deep Navy yang mengembalikan nyawa biru pada gambar */}
                    <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/60 to-navy/20 lg:to-navy/10" />
                </div>

                {/* CONTENT CONTAINER */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                    <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">

                        {/* LEFT: Cinematic Copywriting */}
                        <div ref={heroRef} className="lg:col-span-7 space-y-7 text-center lg:text-left">

                            {/* Elite Branding Tags */}
                            <div className="hero-text-anim opacity-0 flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/15 border border-gold/30 text-white font-bold text-[10px] sm:text-xs tracking-wide backdrop-blur-md shadow-sm">
                                    <i className="fa-solid fa-star text-gold"></i>
                                    <span>Akreditasi A (Unggul)</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-slate-100 font-semibold text-[10px] sm:text-xs tracking-wide backdrop-blur-md shadow-sm">
                                    <i className="fa-solid fa-award text-emerald-400"></i>
                                    <span>Tahfidz & Adab Focused</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-slate-100 font-semibold text-[10px] sm:text-xs tracking-wide backdrop-blur-md shadow-sm">
                                    <i className="fa-solid fa-earth-asia text-blue-300"></i>
                                    <span>Global Leadership</span>
                                </div>
                            </div>

                            {/* Headline: Fluid & Immersive */}
                            <h1 className="hero-text-anim opacity-0 text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-[1.1] tracking-tight">
                                <span className="text-white">Membangun Generasi</span>
                                <br />
                                <span className="hero-shimmer-text mt-1 block">
                                    Cerdas & Beradab
                                </span>
                            </h1>

                            {/* Subtext: SEO Restored & Balanced Contrast */}
                            <p className="hero-text-anim opacity-0 text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                                <strong className="text-white font-semibold">Al-Muntaha Islamic Boarding School -</strong> adalah tempat di mana potensi tertinggi setiap santri diasah. Kami memadukan keunggulan akademik global dengan kedalaman spiritual untuk membentuk pemimpin masa depan yang bertaqwa.
                            </p>

                            {/* CTA Actions */}
                            <div className="hero-text-anim opacity-0 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
                                <Link
                                    href="/daftar"
                                    className="w-full sm:w-auto px-8 py-3.5 bg-gold text-slate-900 rounded-xl font-bold shadow-lg shadow-gold/20 hover:-translate-y-1 hover:shadow-gold/40 transition-all duration-300 text-center text-sm sm:text-base"
                                >
                                    Amankan Kursi Sekarang
                                </Link>
                                <button
                                    onClick={onOpenVideo}
                                    aria-label="Tonton Profil Sekolah"
                                    className="w-full sm:w-auto px-6 py-3.5 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2.5 group backdrop-blur-md text-sm sm:text-base"
                                >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-gold/20 transition-colors duration-300">
                                        <i className="fa-solid fa-play text-gold text-xs ml-0.5"></i>
                                    </div>
                                    Intip Fasilitas Kami
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: Compact WaveCard */}
                        <div className="hero-card-anim opacity-0 lg:col-span-5 w-full">
                            <WaveCard
                                activeWave={activeWave}
                                onOpenSchedule={handleOpenSchedule}
                            />
                        </div>

                    </div>
                </div>

                {/* Dynamic SVG Divider */}
                <div className="absolute bottom-0 left-0 right-0 z-10 leading-none pointer-events-none translate-y-[1px]">
                    <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[40px] md:h-[72px]">
                        <path d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z" fill="currentColor" className="text-slate-900 dark:text-navy" />
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