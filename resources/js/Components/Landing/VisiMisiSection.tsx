// resources/js/Components/Landing/VisiMisiSection.tsx

import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'

export default function VisiMisiSection() {
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animate('.visimisi-animate', {
                        opacity: [0, 1],
                        translateY: [40, 0],
                        duration: 1100,
                        delay: stagger(280),
                        ease: 'outExpo',
                    })
                } else {
                    animate('.visimisi-animate', { opacity: 0, translateY: 40, duration: 0 })
                }
            })
        }, { threshold: 0.1 })
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        /*
         * ✅ PERF: Ganti inline style backgroundImage ke Tailwind class bg-dotted.
         *    Didefinisikan sekali di app.css, di-cache browser, tidak di-parse ulang tiap render.
         */
        <section id="visi" ref={sectionRef} className="py-20 relative border-y border-gray-200 bg-dotted">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="visimisi-animate opacity-0 text-center mb-12">
                    <span className="text-gold font-bold text-sm tracking-widest uppercase">Komitmen Kami</span>
                    <h2 className="text-3xl lg:text-4xl font-display font-bold text-navy mt-1">Visi &amp; Misi</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8 items-stretch">

                    {/* Visi */}
                    <div className="visimisi-animate opacity-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 hover:shadow-lg transition duration-300">
                        <div className="h-48 rounded-xl overflow-hidden bg-gray-200 relative">
                            {/*
                             * ✅ PERF: Tambah loading="lazy" + decoding="async".
                             *    Gambar visi/misi ada di bawah fold — tidak perlu di-load awal.
                             */}
                            <img
                                src="/assets/visi-section.webp"
                                alt="Visi Al-Muntaha Boarding School"
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x300/0f172a/ffffff?text=Visi' }}
                            />
                            <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                                <h3 className="text-2xl font-display font-bold text-white tracking-widest uppercase">Visi</h3>
                            </div>
                        </div>
                        <div className="p-6 text-center">
                            <p className="text-gray-600 text-lg leading-relaxed">
                                "Menjadi lembaga pendidikan boarding terkemuka yang melahirkan generasi Muslim
                                berilmu tinggi, berakhlak mulia, dan siap memimpin di era global."
                            </p>
                        </div>
                    </div>

                    {/* Misi */}
                    <div className="visimisi-animate opacity-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 hover:shadow-lg transition duration-300">
                        <div className="h-48 rounded-xl overflow-hidden bg-gray-200 relative">
                            <img
                                src="/assets/misi-section.webp"
                                alt="Misi Al-Muntaha Boarding School"
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x300/0f172a/ffffff?text=Misi' }}
                            />
                            <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                                <h3 className="text-2xl font-display font-bold text-white tracking-widest uppercase">Misi</h3>
                            </div>
                        </div>
                        <div className="p-6 text-left">
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check text-gold mt-1 flex-shrink-0"></i>
                                    Menyelenggarakan pendidikan Islami yang integratif antara ilmu agama dan ilmu umum.
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check text-gold mt-1 flex-shrink-0"></i>
                                    Membina karakter siswa melalui kehidupan asrama yang terstruktur dan penuh nilai.
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check text-gold mt-1 flex-shrink-0"></i>
                                    Mengembangkan potensi akademik, seni, dan olahraga setiap siswa secara optimal.
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check text-gold mt-1 flex-shrink-0"></i>
                                    Membangun ekosistem belajar yang aman, nyaman, dan modern berbasis teknologi.
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}