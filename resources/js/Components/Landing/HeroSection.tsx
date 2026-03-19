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

    return (
        <>
            <header id="home" className="relative min-h-[90vh] flex items-center pt-10">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/assets/hero-background.webp"
                        alt="Lingkungan Al-Muntaha Boarding School"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent lg:to-white/30" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div ref={heroRef} className="space-y-6 text-center lg:text-left">
                            <div className="hero-animate opacity-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 text-navy text-xs font-bold uppercase tracking-wider">
                                <span className="relative flex h-2 w-2 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Penerimaan Siswa Baru {currentYear}/{currentYear + 1}
                            </div>

                            <h1 className="hero-animate opacity-0 text-4xl lg:text-6xl font-display font-bold text-navy leading-tight">
                                Membangun Generasi <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-gold">
                                    Cerdas &amp; Beradab
                                </span>
                            </h1>

                            <p className="hero-animate opacity-0 text-gray-600 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                                Al-Muntaha Islamic Boarding School — tempat tumbuhnya generasi unggul
                                yang berilmu, berkarakter, dan siap menghadapi tantangan zaman.
                            </p>

                            <div className="hero-animate flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <Link
                                    href="/daftar"
                                    className="w-full sm:w-auto px-8 py-3.5 bg-navy text-white rounded-xl font-semibold shadow-xl hover:-translate-y-1 transition duration-300 text-center"
                                >
                                    Daftar Gelombang Ini
                                </Link>
                                <button
                                    onClick={onOpenVideo}
                                    aria-label="Tonton video profil sekolah"
                                    className="w-full sm:w-auto px-6 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2 group"
                                >
                                    <i className="fa-solid fa-play-circle text-gold text-xl group-hover:scale-110 transition"></i>
                                    Tonton Profil
                                </button>
                            </div>

                            <div className="hero-animate pt-6 flex items-center gap-3 justify-center lg:justify-start">
                                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gold/10 border border-gold/30 text-navy font-bold text-xs shadow-sm">
                                    <i className="fa-solid fa-medal text-gold text-sm"></i>
                                    <span>Akreditasi <span className="text-gold">A</span></span>
                                </div>
                                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy/5 border border-navy/15 text-navy font-bold text-xs shadow-sm">
                                    <i className="fa-solid fa-check-shield text-navy text-sm"></i>
                                    <span>Kemdikbud</span>
                                </div>
                                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy/5 border border-navy/15 text-navy font-bold text-xs shadow-sm">
                                    <i className="fa-solid fa-mosque text-navy text-sm"></i>
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
