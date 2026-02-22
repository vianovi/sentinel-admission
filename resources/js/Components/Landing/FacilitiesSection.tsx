import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'

const facilities = [
    { icon: 'fa-chalkboard-teacher', title: 'Ruang Kelas Modern', description: 'Dilengkapi proyektor, AC, dan koneksi internet cepat untuk mendukung pembelajaran aktif.' },
    { icon: 'fa-laptop-code', title: 'Lab Komputer', description: 'Laboratorium komputer lengkap dengan spesifikasi tinggi untuk praktik IT dan coding.' },
    { icon: 'fa-book-open', title: 'Perpustakaan Digital', description: 'Koleksi ribuan buku fisik dan akses ke ribuan e-book serta jurnal ilmiah.' },
    { icon: 'fa-futbol', title: 'Area Olahraga', description: 'Lapangan futsal, basket, dan voli untuk mendukung kesehatan dan sportivitas siswa.' },
    { icon: 'fa-shield-halved', title: 'Keamanan 24 Jam', description: 'Sistem CCTV dan petugas keamanan yang berjaga sepanjang waktu untuk ketenangan bersama.' },
    { icon: 'fa-wifi', title: 'WiFi Seluruh Area', description: 'Koneksi internet berkecepatan tinggi tersedia di seluruh lingkungan sekolah.' },
    { icon: 'fa-flask', title: 'Laboratorium Sains', description: 'Lab fisika, kimia, dan biologi yang lengkap untuk mendukung eksperimen ilmiah siswa.' },
    { icon: 'fa-utensils', title: 'Kantin Sehat', description: 'Menyediakan makanan bergizi yang diawasi ahli gizi untuk mendukung tumbuh kembang optimal.' },
]

export default function FacilitiesSection() {
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animate('.facilities-title', {
                        opacity: [0, 1],
                        translateY: [30, 0],
                        duration: 1000,
                        ease: 'outExpo',
                    })
                    animate('.facility-card', {
                        opacity: [0, 1],
                        translateY: [50, 0],
                        duration: 1000,
                        delay: stagger(120, { start: 200 }),
                        ease: 'outExpo',
                    })
                } else {
                    animate('.facilities-title', { opacity: 0, translateY: 30, duration: 0 })
                    animate('.facility-card', { opacity: 0, translateY: 50, duration: 0 })
                }
            })
        }, { threshold: 0.1 })
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        <section id="fasilitas" ref={sectionRef} className="py-24 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="facilities-title opacity-0 text-center mb-16">
                    <span className="text-gold font-bold text-sm tracking-widest uppercase">Apa yang Kami Sediakan</span>
                    <h2 className="text-3xl lg:text-4xl font-display font-bold text-navy mt-2">Fasilitas Unggulan</h2>
                    <p className="text-gray-500 mt-4 max-w-xl mx-auto leading-relaxed">Kami menyediakan fasilitas modern yang mendukung proses belajar mengajar secara optimal dan menyenangkan.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {facilities.map((item) => (
                        <div key={item.title} className="facility-card opacity-0 bg-light p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 hover:border-gold/30 transition-all duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-navy text-gold flex items-center justify-center text-xl mb-4 group-hover:bg-gold group-hover:text-white transition-colors duration-300 shadow-md">
                                <i className={`fa-solid ${item.icon}`}></i>
                            </div>
                            <h3 className="font-bold text-navy text-base mb-2 group-hover:text-gold transition-colors duration-300">{item.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
