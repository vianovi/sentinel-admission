import { Link } from '@inertiajs/react'
import { WelcomeProps } from '@/types/landing'
import { AppConfig } from '@/types'

type FooterProps = Pick<WelcomeProps, 'auth'> & { app: AppConfig }

export default function Footer({ auth: _auth, app }: FooterProps) {
    return (
        <footer id="kontak" className="bg-navy text-white pt-24 pb-10 relative scroll-mt-28 rounded-t-[3rem]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 border-b border-gray-700 pb-16">

                    {/* Brand colum*/}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Brand Logo & Title */}
                        <div className="flex items-center gap-3">
                            {app.logo ? (
                                <img
                                    src={app.logo}
                                    alt={app.name}
                                    width="44"
                                    height="44"
                                    loading="lazy"
                                    decoding="async"
                                    className="w-11 h-11 rounded-xl object-cover shadow-lg shadow-black/10 border border-white/5 transition-transform duration-300 hover:scale-105"
                                />
                            ) : (
                                <div className="w-11 h-11 bg-navy rounded-xl flex items-center justify-center text-gold shadow-lg shadow-black/10 border border-white/5">
                                    <i className="fa-solid fa-graduation-cap text-lg"></i>
                                </div>
                            )}
                            <div className="space-y-0.5">
                                <h3 className="font-display font-extrabold text-xl sm:text-2xl uppercase tracking-wide text-white leading-none">
                                    {app.name}
                                </h3>
                                <p className="text-[9px] font-bold tracking-[0.25em] text-gold/80 uppercase leading-none">
                                    {app.tagline}
                                </p>
                            </div>
                        </div>

                        {/* Brand Description */}
                        <p className="text-gray-400/95 text-sm leading-relaxed pr-6 max-w-sm">
                            Al-Muntaha Islamic Boarding School — membentuk generasi Muslim yang
                            unggul dalam ilmu, kokoh dalam iman, dan siap berkontribusi untuk umat.
                        </p>

                        {/* Brochure Download Action */}
                        <div className="pt-2">
                            <a
                                href="/assets/landing/brochure/brosur.jpg"
                                target="_blank"
                                rel="noopener noreferrer"
                                download="Brosur_Al_Muntaha.pdf"
                                className="inline-flex items-center gap-4 bg-white/[0.02] border border-white/10 hover:border-gold/30 px-5 py-3.5 rounded-xl hover:bg-gold/5 hover:shadow-lg hover:shadow-gold/5 transition-all duration-300 group"
                                aria-label="Unduh Brosur Informasi Lengkap Al-Muntaha PDF"
                            >
                                {/* PDF Icon Wrapper with Micro-rotations on Hover */}
                                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-300 group-hover:bg-gold group-hover:text-navy group-hover:border-gold/10 transition-all duration-300 transform group-hover:scale-105 group-hover:rotate-3">
                                    <i className="fa-solid fa-file-pdf text-sm"></i>
                                </div>

                                {/* Action Text */}
                                <div className="text-left space-y-0.5">
                                    <p className="text-[10px] text-gray-400/80 font-bold tracking-wider uppercase">Informasi Lengkap</p>
                                    <p className="font-bold text-xs text-white group-hover:text-gold transition-colors">Download Brosur PDF</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Navigasi colum */}
                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="font-bold text-lg text-white font-display">Akses Cepat</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><a href="#home" className="hover:text-gold transition">Beranda Utama</a></li>
                            <li><a href="#visi" className="hover:text-gold transition">Profil Sekolah</a></li>
                            <li><a href="#fasilitas" className="hover:text-gold transition">Fasilitas</a></li>
                            <li><a href="#alur" className="hover:text-gold transition">Info Pendaftaran</a></li>
                            <li><Link href="/login" className="hover:text-gold transition">Login Siswa</Link></li>
                            <li><Link href="/daftar" className="hover:text-gold transition">Buat Akun Baru</Link></li>
                        </ul>
                    </div>

                    {/* Kontak */}
                    <div className="lg:col-span-3 space-y-6">
                        <h4 className="font-bold text-lg text-white font-display">Sekretariat</h4>
                        <div className="space-y-4 text-sm text-gray-400">
                            <div className="flex items-start gap-3">
                                <i className="fa-solid fa-location-dot mt-1 text-gold"></i>
                                <span className="leading-relaxed">Jl. Raya Pendidikan No. 1, Kota Ilmu, Jawa Tengah 50000</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <i className="fa-regular fa-envelope text-gold"></i>
                                <span>info@almuntaha.sch.id</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-phone text-gold"></i>
                                <span>+62 851-1122-3344</span>
                            </div>
                            <div className="pt-2">
                                <a href="https://wa.me/6285111223344" target="_blank" rel="noopener noreferrer"
                                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-2 transition shadow-lg">
                                    <i className="fa-brands fa-whatsapp text-lg"></i>
                                    Chat Sekretariat
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Maps */}
                    <div className="lg:col-span-3 space-y-6">
                        <h4 className="font-bold text-lg text-white font-display">Lokasi Kami</h4>
                        <div className="w-full h-52 rounded-xl overflow-hidden shadow-lg border border-gray-600 bg-gray-800 relative group">
                            <iframe
                                title="Lokasi Al-Muntaha Boarding School di Google Maps"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.0!2d106.8227!3d-6.1701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5d2e764b12d%3A0x3d2ad6e1e0e9a521!2sIstana+Negara!5e1!3m2!1sid!2sid!4v1709282384722!5m2!1sid!2sid"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full h-full transition duration-500"
                            />
                            {/* Hover hint */}
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full border border-white/20 flex items-center gap-1 pointer-events-none opacity-100 group-hover:opacity-0 transition duration-300">
                                <i className="fa-solid fa-hand-pointer text-gold text-[9px]"></i>
                                Geser & zoom peta
                            </div>
                            {/* Satellite badge */}
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full border border-white/20 flex items-center gap-1 pointer-events-none">
                                <i className="fa-solid fa-satellite text-gold text-[9px]"></i>
                                Satelit
                            </div>
                        </div>
                        <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
                            className="text-xs text-gold hover:underline flex items-center gap-1">
                            Buka di Google Maps <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </div>
                </div>

                {/* Copyright */}
                <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                    <p>&copy; {new Date().getFullYear()} {app.name}. All rights reserved.</p>
                    <div className="flex gap-4 mt-2 md:mt-0">
                        <a href="#" className="hover:text-white">Kebijakan Privasi</a>
                        <a href="#" className="hover:text-white">Syarat &amp; Ketentuan</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
