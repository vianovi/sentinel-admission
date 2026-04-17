// resources/js/Components/Landing/HighlightSection.tsx

import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'

export default function HighlightSection() {
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animate('.highlight-animate', {
                        opacity: [0, 1],
                        translateY: [40, 0],
                        duration: 1100,
                        delay: stagger(220),
                        ease: 'outExpo',
                    })
                } else {
                    animate('.highlight-animate', { opacity: 0, translateY: 40, duration: 0 })
                }
            })
        }, { threshold: 0.1 })
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="highlight-animate opacity-0 md:col-span-5 text-center md:text-left">
                        <div className="w-16 h-16 mx-auto md:mx-0 rounded-full bg-light border border-gray-200 text-navy flex items-center justify-center text-3xl mb-6">
                            <i className="fa-solid fa-star-and-crescent"></i>
                        </div>
                        <h2 className="text-3xl font-display font-bold text-navy mb-4">
                            Seleksi yang Adil, <br /> Proses yang Transparan
                        </h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Kami percaya setiap anak berhak mendapat kesempatan yang sama.
                            Proses penerimaan di Al-Muntaha dirancang terbuka, terukur,
                            dan bebas dari diskriminasi — karena masa depan dimulai dari kepercayaan.
                        </p>
                        <a href="#alur" className="inline-block border-b-2 border-gold pb-1 font-bold text-navy hover:text-gold transition">
                            Pelajari Proses Seleksi <i className="fa-solid fa-arrow-right ml-2 text-xs"></i>
                        </a>
                    </div>

                    <div className="highlight-animate opacity-0 md:col-span-3">
                        {/*
                         * ✅ PERF: Tambah loading="lazy" + decoding="async".
                         *    Gambar highlight ada di tengah halaman — tidak perlu di-load awal.
                         */}
                        <img
                            src="/assets/highlight-seleksi.webp"
                            alt="Proses seleksi siswa Al-Muntaha"
                            className="w-full h-[400px] object-cover rounded-2xl shadow-xl transform md:translate-y-8 hover:translate-y-4 transition duration-500"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x600/f1f5f9/0f172a?text=Seleksi' }}
                        />
                    </div>

                    <div className="highlight-animate opacity-0 md:col-span-4 space-y-6">
                        <div className="bg-navy p-8 rounded-2xl text-white text-center shadow-2xl relative overflow-hidden group">
                            <i className="fa-solid fa-list-check absolute top-4 right-4 text-white opacity-5 text-6xl group-hover:opacity-10 transition"></i>
                            <div className="w-12 h-12 mx-auto rounded-lg bg-gold text-navy flex items-center justify-center text-xl mb-4 font-bold shadow-lg">
                                <i className="fa-solid fa-calendar-check"></i>
                            </div>
                            <h3 className="text-xl font-bold font-display mb-2">Pendaftaran Online <br /> Mudah &amp; Cepat</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Daftar dari rumah, pantau status secara realtime, dan terima pengumuman
                                langsung di dashboard kamu. Tanpa antri, tanpa ribet.
                            </p>
                        </div>
                        <img
                            src="/assets/highlight-asrama.webp"
                            alt="Asrama Al-Muntaha Boarding School"
                            className="w-full h-48 object-cover rounded-2xl shadow-lg border-4 border-white"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x200/f1f5f9/0f172a?text=Asrama' }}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}