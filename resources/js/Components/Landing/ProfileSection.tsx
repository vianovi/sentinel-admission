// resources/js/Components/Landing/ProfileSection.tsx

import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'

interface ProfileSectionProps {
    onOpenVideo: () => void
}

export default function ProfileSection({ onOpenVideo }: ProfileSectionProps) {
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animate('.profile-animate', {
                        opacity:    [0, 1],
                        translateY: [40, 0],
                        duration:   1100,
                        delay:      stagger(220),
                        ease:       'outExpo',
                    })
                    animate('.profile-video-animate', {
                        opacity:    [0, 1],
                        translateX: [60, 0],
                        duration:   1300,
                        delay:      300,
                        ease:       'outExpo',
                    })
                } else {
                    animate('.profile-animate',       { opacity: 0, translateY: 40, duration: 0 })
                    animate('.profile-video-animate', { opacity: 0, translateX: 60, duration: 0 })
                }
            })
        }, { threshold: 0.15 })

        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        <section ref={sectionRef} className="py-24 pb-36 bg-navy text-white relative overflow-hidden">

            <div className="absolute inset-0 opacity-10 bg-cubes" />

            {/* Wave divider bawah */}
            <div className="absolute bottom-0 left-0 right-0 z-10 leading-none">
                <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[60px] md:h-[72px]">
                    <path d="M0,36 C240,0 480,72 720,36 C960,0 1200,72 1440,36 L1440,72 L0,72 Z" fill="#ffffff" />
                </svg>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row gap-16 items-center">

                    <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
                        <span className="profile-animate opacity-0 block text-gold font-bold tracking-widest text-sm uppercase">
                            Komunitas Pembelajar Unggul
                        </span>
                        <h2 className="profile-animate opacity-0 text-4xl lg:text-5xl font-display font-bold leading-tight text-white">
                            Meraih Puncak Prestasi, <br /> Membentuk Kemuliaan Hati.
                        </h2>
                        <p className="profile-animate opacity-0 text-gray-400 leading-relaxed text-lg">
                            Bersama Al-Muntaha, setiap santri dibimbing untuk mengejar mimpi setinggi angkasa,
                            namun tetap membumi dengan akhlak mulia melalui ekosistem pendidikan yang holistik.
                        </p>
                        <div className="profile-animate opacity-0 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 hover:-translate-y-0.5 transition duration-300">
                                <i className="fa-solid fa-award text-gold text-2xl mb-3"></i>
                                <h4 className="font-bold text-white">Adab Terpuji</h4>
                                <p className="text-xs text-gray-400 mt-1">Membentuk karakter Islami yang teruji.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 hover:-translate-y-0.5 transition duration-300">
                                <i className="fa-solid fa-atom text-gold text-2xl mb-3"></i>
                                <h4 className="font-bold text-white">Ilmu Mumpuni</h4>
                                <p className="text-xs text-gray-400 mt-1">Kurikulum adaptif berbasis inovasi terkini.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 hover:-translate-y-0.5 transition duration-300">
                                <i className="fa-solid fa-house-user text-gold text-2xl mb-3"></i>
                                <h4 className="font-bold text-white">Asrama Teduh</h4>
                                <p className="text-xs text-gray-400 mt-1">Lingkungan nyaman untuk belajar tangguh.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 hover:-translate-y-0.5 transition duration-300">
                                <i className="fa-solid fa-hand-holding-heart text-gold text-2xl mb-3"></i>
                                <h4 className="font-bold text-white">Cinta Mendidik</h4>
                                <p className="text-xs text-gray-400 mt-1">Guru ahli yang membimbing sepenuh hati.</p>
                            </div>
                        </div>
                    </div>

                    <div className="profile-video-animate opacity-0 lg:w-1/2 relative w-full">
                        <button
                            onClick={onOpenVideo}
                            aria-label="Intip kehidupan santri Al-Muntaha"
                            className="w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 relative group cursor-pointer block"
                        >
                            <img
                                src="/assets/landing/profile/thumbnail.webp"
                                className="w-full object-cover object-center transform group-hover:scale-105 transition duration-700 ease-in-out h-[400px]"
                                alt="Eksplorasi Kehidupan Santri Al-Muntaha Boarding School"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x400/1e293b/d4a017?text=Video+Profil+Al-Muntaha' }}
                            />
                            <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition duration-500 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-gold text-white flex items-center justify-center shadow-glow group-hover:scale-110 transition duration-300">
                                    <i className="fa-solid fa-play text-3xl ml-1"></i>
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-4">
                                <span className="px-4 py-2 bg-black/60 backdrop-blur-md text-white text-xs rounded-full border border-white/20">
                                    <i className="fa-solid fa-clapperboard mr-2 text-gold"></i>Intip Kehidupan Santri
                                </span>
                            </div>
                        </button>
                    </div>

                </div>
            </div>
        </section>
    )
}
