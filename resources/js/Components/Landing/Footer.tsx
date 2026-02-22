import { Link } from '@inertiajs/react'
import { WelcomeProps } from '@/types/landing'

type FooterProps = Pick<WelcomeProps, 'auth'>

export default function Footer({ auth: _auth }: FooterProps) {
    return (
        <footer id="kontak" className="bg-navy text-white pt-24 pb-10 mt-12 relative rounded-t-[3rem]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 border-b border-gray-700 pb-16">

                    {/* Brand */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-graduation-cap text-4xl text-gold"></i>
                            <div>
                                <h3 className="font-display font-bold text-2xl uppercase tracking-wide">Sentinel</h3>
                                <p className="text-xs tracking-[0.3em] opacity-60">ADMISSION SYSTEM</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed pr-6">
                            Sistem penerimaan siswa baru yang modern dan universal. Dirancang untuk semua jenis lembaga pendidikan.
                        </p>
                        <div className="pt-4">
                            <a
                                href="/assets/brosur.pdf"
                                className="inline-flex items-center gap-3 bg-gray-800 border border-gray-600 px-6 py-3 rounded-xl hover:border-gold hover:text-gold transition group"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-gold group-hover:text-navy transition">
                                    <i className="fa-solid fa-file-pdf"></i>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-gray-400">Informasi Lengkap</p>
                                    <p className="font-bold text-xs">Download Brosur PDF</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Navigasi */}
                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="font-bold text-lg text-white font-display">Akses Cepat</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><a href="#home" className="hover:text-gold transition">Beranda Utama</a></li>
                            <li><a href="#visi" className="hover:text-gold transition">Profil Sekolah</a></li>
                            <li><a href="#fasilitas" className="hover:text-gold transition">Fasilitas</a></li>
                            <li><a href="#alur" className="hover:text-gold transition">Info Pendaftaran</a></li>
                            <li><Link href="/login" className="hover:text-gold transition">Login Siswa</Link></li>
                            <li><Link href="/register" className="hover:text-gold transition">Buat Akun Baru</Link></li>
                        </ul>
                    </div>

                    {/* Kontak */}
                    <div className="lg:col-span-3 space-y-6">
                        <h4 className="font-bold text-lg text-white font-display">Sekretariat</h4>
                        <div className="space-y-4 text-sm text-gray-400">
                            <div className="flex items-start gap-3">
                                <i className="fa-solid fa-location-dot mt-1 text-gold"></i>
                                <span className="leading-relaxed">Jl. Raya Pendidikan No. 404, Kota Teknologi, Jawa Tengah.</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <i className="fa-regular fa-envelope text-gold"></i>
                                <span>psb@sekolah.sch.id</span>
                            </div>
                            <div className="pt-2">
                                <a
                                    href="https://wa.me/628123456789"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-2 transition shadow-lg"
                                >
                                    <i className="fa-brands fa-whatsapp text-lg"></i>
                                    Chat Sekretariat
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Maps */}
                    <div className="lg:col-span-3 space-y-6">
                        <h4 className="font-bold text-lg text-white font-display">Lokasi Kami</h4>
                        <div className="w-full h-40 rounded-xl overflow-hidden shadow-lg border border-gray-600 bg-gray-800">
                            <iframe
                                title="Lokasi Sekolah di Google Maps"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.298059876246!2d110.42232937587635!3d-6.974108868288599!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e708c90327f2f11%3A0xc644c138c227318!2sSemarang!5e0!3m2!1sen!2sid!4v1709282384722!5m2!1sen!2sid"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="grayscale hover:grayscale-0 transition duration-500"
                            />
                        </div>
                        <a
                            href="https://maps.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gold hover:underline flex items-center gap-1"
                        >
                            Buka di Google Maps <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </div>
                </div>

                {/* Copyright */}
                <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Sentinel Admission System. All rights reserved.</p>
                    <div className="flex gap-4 mt-2 md:mt-0">
                        <a href="#" className="hover:text-white">Kebijakan Privasi</a>
                        <a href="#" className="hover:text-white">Syarat &amp; Ketentuan</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
