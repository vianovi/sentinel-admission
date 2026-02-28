import { useEffect, useRef } from 'react'
import { Link } from '@inertiajs/react'
import { animate, stagger } from 'animejs'
import { AdmissionWaveData } from '@/types/landing'
import WaveCard from './WaveCard'

interface HeroSectionProps {
    activeWave: AdmissionWaveData | null
    onOpenVideo: () => void
}

export default function HeroSection({ activeWave, onOpenVideo }: HeroSectionProps) {
    const currentYear = new Date().getFullYear()
    const heroRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        animate('.hero-animate', {
            opacity: [0, 1],
            translateY: [40, 0],
            duration: 1200,
            delay: stagger(180, { start: 200 }),
            ease: 'outExpo',
        })
        animate('.wave-card-animate', {
            opacity: [0, 1],
            translateX: [60, 0],
            duration: 1300,
            delay: 600,
            ease: 'outExpo',
        })
    }, [])

    return (
        <header id="home" className="relative min-h-[90vh] flex items-center pt-10">
            <div className="absolute inset-0 z-0">
                <img
                    src="/assets/header.jpg"
                    alt="Latar belakang halaman utama"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent lg:to-white/30" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div ref={heroRef} className="space-y-6 text-center lg:text-left">
                        <div className="hero-animate opacity-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 text-navy text-xs font-bold uppercase tracking-wider">
                            <span className="fa-solid fa-circle text-[8px] text-green-500 mr-2"></span>
                            Penerimaan Siswa Baru {currentYear}/{currentYear + 1}
                        </div>
                        <h1 className="hero-animate opacity-0 text-4xl lg:text-6xl font-display font-bold text-navy leading-tight">
                            Membangun Generasi <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-gold">
                                Cerdas &amp; Beradab
                            </span>
                        </h1>
                        <p className="hero-animate opacity-0 text-gray-600 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                            Sistem penerimaan siswa baru yang modern, transparan, dan mudah digunakan.
                            Dirancang untuk semua jenis sekolah — SMP, SMA, dan SMK.
                        </p>
                        <div className="hero-animate flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            <Link href="/daftar" className="w-full sm:w-auto px-8 py-3.5 bg-navy text-white rounded-xl font-semibold shadow-xl hover:-translate-y-1 transition duration-300 text-center">
                                Daftar Gelombang Ini
                            </Link>
                            <button onClick={onOpenVideo} aria-label="Tonton video profil sekolah" className="w-full sm:w-auto px-6 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2 group">
                                <i className="fa-solid fa-play-circle text-gold text-xl group-hover:scale-110 transition"></i>
                                Tonton Profil
                            </button>
                        </div>
                        <div className="hero-animate pt-6 flex items-center gap-6 justify-center lg:justify-start grayscale opacity-60">
                            <div className="flex items-center gap-2 font-bold text-sm"><i className="fa-solid fa-medal"></i> Akreditasi A</div>
                            <div className="flex items-center gap-2 font-bold text-sm"><i className="fa-solid fa-check-shield"></i> Kemdikbud</div>
                        </div>
                    </div>
                    <div className="wave-card-animate opacity-0">
                        <WaveCard activeWave={activeWave} />
                    </div>
                </div>
            </div>
        </header>
    )
}
