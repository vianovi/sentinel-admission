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
                        opacity: [0, 1],
                        translateY: [40, 0],
                        duration: 1100,
                        delay: stagger(220),
                        ease: 'outExpo',
                    })
                    animate('.profile-video-animate', {
                        opacity: [0, 1],
                        translateX: [60, 0],
                        duration: 1300,
                        delay: 300,
                        ease: 'outExpo',
                    })
                } else {
                    animate('.profile-animate', { opacity: 0, translateY: 40, duration: 0 })
                    animate('.profile-video-animate', { opacity: 0, translateX: 60, duration: 0 })
                }
            })
        }, { threshold: 0.15 })
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        <section ref={sectionRef} className="py-24 bg-navy text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row gap-16 items-center">
                    <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
                        <span className="profile-animate opacity-0 block text-gold font-bold tracking-widest text-sm">KENAPA KAMI?</span>
                        <h2 className="profile-animate opacity-0 text-4xl lg:text-5xl font-display font-bold leading-tight">
                            Mendidik dengan Hati, <br /> Menguasai Teknologi.
                        </h2>
                        <p className="profile-animate opacity-0 text-gray-400 leading-relaxed text-lg">
                            Program pendidikan kami memastikan setiap siswa mendapatkan pengawasan yang humanis.
                            Kami mendorong siswa untuk memiliki nalar kritis melalui kurikulum sains &amp; teknologi.
                        </p>
                        <div className="profile-animate opacity-0 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition">
                                <i className="fa-solid fa-book-open text-gold text-2xl mb-3"></i>
                                <h4 className="font-bold">Kurikulum Unggulan</h4>
                                <p className="text-xs text-gray-400 mt-1">Terintegrasi dengan standar nasional.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition">
                                <i className="fa-solid fa-laptop-code text-gold text-2xl mb-3"></i>
                                <h4 className="font-bold">IT &amp; Teknologi</h4>
                                <p className="text-xs text-gray-400 mt-1">Cyber Security &amp; Web Development.</p>
                            </div>
                        </div>
                    </div>
                    <div className="profile-video-animate opacity-0 lg:w-1/2 relative w-full">
                        <button onClick={onOpenVideo} aria-label="Tonton video profil sekolah" className="w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 relative group cursor-pointer block">
                            <img src="/assets/thumbnail-video.jpg" className="w-full object-cover object-center transform group-hover:scale-105 transition duration-700 ease-in-out h-[400px]" alt="Thumbnail video profil sekolah" onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x400/1e293b/d4a017?text=Video+Profil' }} />
                            <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition duration-500 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-gold text-white flex items-center justify-center shadow-glow group-hover:scale-110 transition duration-300">
                                    <i className="fa-solid fa-play text-3xl ml-1"></i>
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-4">
                                <span className="px-4 py-2 bg-black/60 backdrop-blur-md text-white text-xs rounded-full border border-white/20">
                                    <i className="fa-solid fa-circle-play mr-2 text-gold"></i>Tonton Video Profil
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
