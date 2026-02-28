import { useEffect, useRef } from 'react'
import { Link } from '@inertiajs/react'
import { animate, stagger } from 'animejs'

const steps = [
    { number: '1', title: 'Form Awal', description: 'Isi biodata singkat untuk registrasi akun.', icon: 'fa-pencil' },
    { number: '2', title: 'Login', description: 'Masuk dashboard dengan akun yang dibuat.', icon: 'fa-right-to-bracket' },
    { number: '3', title: 'Lengkapi Data', description: 'Isi data orang tua, wali, & dokumen.', icon: 'fa-file-lines' },
    { number: '4', title: 'Pembayaran', description: 'Bayar biaya formulir & admin memverifikasi.', icon: 'fa-money-bill' },
    { number: '5', title: 'Kartu Ujian', description: 'Cetak kartu ujian otomatis dari dashboard.', icon: 'fa-id-card' },
    { number: '6', title: 'Seleksi', description: 'Ikuti tes seleksi sesuai jadwal.', icon: 'fa-user-graduate' },
    { number: '7', title: 'Pengumuman', description: 'Cek hasil kelulusan secara online.', icon: 'fa-bullhorn' },
]

export default function HowToRegisterSection() {
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animate('.alur-title', {
                        opacity: [0, 1],
                        translateY: [30, 0],
                        duration: 1000,
                        ease: 'outExpo',
                    })
                    animate('.step-card', {
                        opacity: [0, 1],
                        translateY: [50, 0],
                        duration: 900,
                        delay: stagger(120, { start: 200 }),
                        ease: 'outExpo',
                    })
                } else {
                    animate('.alur-title', { opacity: 0, translateY: 30, duration: 0 })
                    animate('.step-card', { opacity: 0, translateY: 50, duration: 0 })
                }
            })
        }, { threshold: 0.1 })
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        <section id="alur" ref={sectionRef} className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="alur-title opacity-0 text-center mb-10 md:mb-16">
                    <span className="text-gold font-bold text-xs uppercase tracking-widest">Proses Mudah</span>
                    <h2 className="text-2xl sm:text-4xl font-display font-bold text-navy mt-2">7 Langkah Pendaftaran</h2>
                    <div className="mt-3 md:hidden flex justify-center items-center gap-2 text-xs text-gray-400 animate-pulse">
                        <i className="fa-solid fa-arrow-left"></i><span>Geser kartu ke samping</span><i className="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
                <div className="flex gap-4 overflow-x-auto [scroll-snap-type:x_mandatory] px-4 -mx-4 pb-8 md:px-0 md:mx-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:overflow-visible">
                    {steps.map((step) => (
                        <div key={step.number} className="step-card opacity-0 [scroll-snap-align:center] min-w-[85%] sm:min-w-[45%] md:min-w-0 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg md:hover:-translate-y-2 transition duration-300 relative group overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 p-4 opacity-5 text-6xl text-navy group-hover:scale-125 group-hover:rotate-12 transition duration-500">
                                <i className={`fa-solid ${step.icon}`}></i>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-navy text-gold font-bold flex items-center justify-center mb-4 text-sm shadow-md z-10 relative group-hover:bg-gold group-hover:text-white transition">{step.number}</div>
                            <h3 className="font-bold text-navy text-lg mb-2 relative z-10 group-hover:text-gold transition-colors">{step.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed relative z-10">{step.description}</p>
                        </div>
                    ))}
                    <div className="step-card opacity-0 [scroll-snap-align:center] min-w-[85%] sm:min-w-[45%] md:min-w-0 bg-navy p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gold/10 group-hover:bg-gold/20 transition" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                                <i className="fa-solid fa-check text-xl"></i>
                            </div>
                            <h3 className="font-bold text-white text-lg mb-1">Sudah Siap?</h3>
                            <p className="text-xs text-gray-400 mb-4">Mulai langkah pertama Anda.</p>
                            <Link href="/daftar" className="inline-block px-6 py-2.5 bg-gold hover:bg-white hover:text-navy text-white font-bold rounded-lg text-sm shadow-lg transition transform hover:scale-105">Daftar Sekarang</Link>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center gap-2 mt-2 md:hidden">
                    <div className="w-16 h-1 rounded-full bg-gold"></div>
                    <div className="w-2 h-1 rounded-full bg-gray-300"></div>
                    <div className="w-2 h-1 rounded-full bg-gray-300"></div>
                </div>
            </div>
        </section>
    )
}
