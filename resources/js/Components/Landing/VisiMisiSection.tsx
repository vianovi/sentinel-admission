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
        <section id="visi" ref={sectionRef} className="py-20 relative border-y border-gray-200" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="visimisi-animate opacity-0 text-center mb-12">
                    <span className="text-gold font-bold text-sm tracking-widest uppercase">Komitmen Kami</span>
                    <h2 className="text-3xl lg:text-4xl font-display font-bold text-navy mt-1">Visi &amp; Misi</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8 items-stretch">
                    <div className="visimisi-animate opacity-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 hover:shadow-lg transition duration-300">
                        <div className="h-48 rounded-xl overflow-hidden bg-gray-200 relative">
                            <img src="/assets/about-1.jpg" alt="Visi sekolah" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x300/0f172a/ffffff?text=Visi' }} />
                            <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                                <h3 className="text-2xl font-display font-bold text-white tracking-widest uppercase">Visi</h3>
                            </div>
                        </div>
                        <div className="p-6 text-center">
                            <p className="text-gray-600 text-lg leading-relaxed">"Menjadi sistem penerimaan siswa baru yang modern, terpercaya, dan dapat digunakan oleh semua jenis lembaga pendidikan."</p>
                        </div>
                    </div>
                    <div className="visimisi-animate opacity-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 hover:shadow-lg transition duration-300">
                        <div className="h-48 rounded-xl overflow-hidden bg-gray-200 relative">
                            <img src="/assets/room-2.jpg" alt="Misi sekolah" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x300/0f172a/ffffff?text=Misi' }} />
                            <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                                <h3 className="text-2xl font-display font-bold text-white tracking-widest uppercase">Misi</h3>
                            </div>
                        </div>
                        <div className="p-6 text-left">
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-3"><i className="fa-solid fa-check text-gold mt-1"></i>Menyediakan platform pendaftaran yang mudah dan transparan.</li>
                                <li className="flex items-start gap-3"><i className="fa-solid fa-check text-gold mt-1"></i>Mengintegrasikan manajemen data siswa secara digital dan aman.</li>
                                <li className="flex items-start gap-3"><i className="fa-solid fa-check text-gold mt-1"></i>Mendukung semua jenis sekolah — SMP, SMA, SMK, negeri &amp; swasta.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
