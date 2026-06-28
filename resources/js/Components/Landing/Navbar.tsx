import { useState, useEffect, useRef } from 'react'
import { Link } from '@inertiajs/react'
import { WelcomeProps } from '@/types/landing'
import { AppConfig } from '@/types'

type NavbarProps = Pick<WelcomeProps, 'auth'> & { app: AppConfig }
type NavState = 'top' | 'hero' | 'below'

const NAV_LINKS = [
    { href: '#home', label: 'Beranda' },
    { href: '#visi', label: 'Profil' },
    { href: '#galeri', label: 'Galeri' },
    { href: '#fasilitas', label: 'Fasilitas' },
    { href: '#alur', label: 'Alur Daftar' },
    { href: '#kontak', label: 'Kontak' },
]

export default function Navbar({ auth, app }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [navState, setNavState] = useState<NavState>('top')
    const navStateRef = useRef<NavState>('top')

    useEffect(() => {
        const topBarHeight = 40    // estimasi tinggi TopBar
        const navbarHeight = 80
        const heroEl = document.getElementById('home')
        let ticking = false
        let frameId = 0

        const updateNavState = () => {
            const scrollY = window.scrollY
            const heroBottom = heroEl
                ? heroEl.getBoundingClientRect().bottom + scrollY - navbarHeight
                : window.innerHeight

            const nextState: NavState = scrollY < topBarHeight
                ? 'top'
                : scrollY < heroBottom
                    ? 'hero'
                    : 'below'

            if (navStateRef.current !== nextState) {
                navStateRef.current = nextState
                setNavState(nextState)
            }
        }

        const handleScroll = () => {
            if (ticking) return

            ticking = true
            frameId = window.requestAnimationFrame(() => {
                ticking = false
                updateNavState()
            })
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        window.addEventListener('resize', handleScroll, { passive: true })
        updateNavState()

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', handleScroll)
            window.cancelAnimationFrame(frameId)
        }
    }, [])

    const handleNavClick = () => {
        setMobileMenuOpen(false)
    }

    const isDark = navState === 'top' || navState === 'hero'
    const isBelow = navState === 'below'

    // Pemilihan Kelas Warna Berdasarkan State
    const logoTextColor  = isDark ? 'text-white'        : 'text-navy'
    const logoSubColor   = isDark ? 'text-white/55'     : 'text-slate-500'
    const linkColor      = isDark ? 'text-white/80'     : 'text-slate-700'
    const masukColor     = isDark ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-navy'
    const burgerColor    = isDark ? 'text-white'        : 'text-navy'
    const shellClassName = isDark
        ? 'max-w-[108rem] translate-y-2.5 rounded-[26px] border-white/10 bg-slate-900/60 px-4 sm:px-8 md:px-[34px] shadow-2xl shadow-black/25 backdrop-blur-md md:backdrop-blur-xl backdrop-saturate-150'
        : 'max-w-[1320px] translate-y-2 rounded-[18px] border-slate-200/80 bg-white/[0.88] px-4 sm:px-7 md:px-7 shadow-[0_12px_34px_rgba(15,23,42,0.1)] backdrop-blur-md md:backdrop-blur-xl backdrop-saturate-150'

    return (
        <nav className="sticky top-0 z-50 w-full border-none bg-transparent pointer-events-none">
            {/* Wrapper penahan lebar yang mendukung fungsionalitas scroll Lenis */}
            <div className="max-w-[108rem] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pointer-events-auto">

                {/* Visual Card Utama (Ref yang dianimasikan secara dinamis) */}
                <div
                    className={`mx-auto flex w-full flex-col justify-center overflow-hidden border transition-[max-width,transform,border-radius,background-color,border-color,box-shadow,padding] duration-500 ease-out ${shellClassName}`}
                >
                    <div className={`flex justify-between items-center transition-all duration-500 ${isBelow ? 'h-[72px]' : 'h-20'}`}>

                        {/* SISI KIRI: Logo + Info Status Aktif (Mencegah Kekosongan) */}
                        <div className={`flex items-center transition-all duration-500 ${isBelow ? 'gap-6 min-w-[270px]' : 'gap-5'}`}>
                            <div className="flex items-center gap-3">
                                {app.logo ? (
                                    <img
                                        src={app.logo}
                                        alt={app.name}
                                        width="40"
                                        height="40"
                                        loading="eager"
                                        decoding="async"
                                        className={`rounded-lg object-cover shadow-lg transition-all duration-500 ${isBelow ? 'w-9 h-9' : 'w-10 h-10'}`}
                                    />
                                ) : (
                                    <div className={`bg-navy rounded-lg flex items-center justify-center text-gold shadow-lg transition-all duration-500 ${isBelow ? 'w-9 h-9' : 'w-10 h-10'}`}>
                                        <i className="fa-solid fa-graduation-cap text-xl"></i>
                                    </div>
                                )}
                                <div className="leading-tight">
                                    <span className={`block font-display font-extrabold tracking-wide uppercase transition-all duration-500 ${isBelow ? 'text-base' : 'text-base md:text-lg'} ${logoTextColor}`}>
                                        {app.name}
                                    </span>
                                    <p className={`text-[8px] md:text-[9px] font-bold tracking-[0.2em] uppercase transition-colors duration-400 ${logoSubColor}`}>
                                        {app.tagline}
                                    </p>
                                </div>
                            </div>

                            {/* Badge Pengisi Ruang Kosong (Kiri) */}
                            <div className={`hidden xl:flex items-center h-8 pl-5 border-l transition-all duration-500 ${
                                isBelow
                                    ? 'w-0 overflow-hidden border-transparent p-0 opacity-0'
                                    : isDark
                                        ? 'border-slate-400/15 opacity-100'
                                        : 'border-slate-200 opacity-100'
                            }`}>
                                <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full text-[9px] font-bold tracking-wider uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    Portal SPMB Online
                                </span>
                            </div>
                        </div>

                        {/* BAGIAN TENGAH: Menu Kapsul Terpusat */}
                        <div className={`hidden md:flex items-center transition-all duration-500 ${isBelow ? 'flex-1 justify-center px-8' : ''}`}>
                            <div className={`flex items-center transition-all duration-500 ${
                                isBelow
                                    ? 'gap-8 rounded-none border-0 bg-transparent p-0 shadow-none'
                                    : isDark
                                        ? 'gap-2 rounded-full border border-slate-300/10 bg-slate-950/26 p-2 shadow-inner shadow-black/10'
                                        : 'gap-2 rounded-full border border-slate-200 bg-slate-100/88 p-2'
                            }`}>
                                {NAV_LINKS.map((link) => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        onClick={handleNavClick}
                                        className={`relative rounded-full text-[11px] font-bold tracking-wider uppercase transition-all duration-300 active:scale-[0.97] group ${isBelow ? 'px-0 py-2' : 'px-5 py-1.5'} ${linkColor}`}
                                    >
                                        <span className="relative z-10 transition-colors duration-300 group-hover:text-gold">{link.label}</span>
                                        <span className={`absolute transition-all duration-300 ${
                                            isBelow
                                                ? 'left-0 right-0 -bottom-0.5 h-[2px] origin-center scale-x-0 rounded-full bg-gold group-hover:scale-x-100 group-active:scale-x-100'
                                                : `inset-0 rounded-full scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-active:scale-100 group-active:opacity-100 ${isDark ? 'bg-slate-700/45' : 'bg-navy/5'}`
                                        }`} />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* SISI KANAN: Tombol Aksi */}
                        <div className={`hidden md:flex items-center border-l transition-all duration-500 ${
                            isDark ? 'border-white/10 pl-6' : 'border-slate-200 pl-7'
                        }`}>
                            <div className="flex items-center gap-4">
                                {auth.user ? (
                                    <Link href="/dashboard" className="px-5 py-2 rounded-full bg-gold text-navy text-[11px] font-bold tracking-wider uppercase shadow-lg hover:scale-105 transition transform"
                                        style={{ color: '#0f172a' }}>
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="/login"
                                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold tracking-wider uppercase transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] ${
                                                isDark
                                                    ? 'border-white/12 bg-white/7 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/22 hover:bg-white/12'
                                                    : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50'
                                            } ${masukColor}`}>
                                            <i className="fa-solid fa-right-to-bracket text-[10px]"></i>
                                            Masuk
                                        </Link>
                                        <Link href="/daftar"
                                            className="px-5 py-2.5 rounded-full bg-gold text-navy text-[11px] font-bold tracking-wider uppercase shadow-glow hover:bg-goldhover hover:-translate-y-0.5 transition flex items-center gap-2"
                                            style={{ color: '#0f172a' }}>
                                            <i className="fa-solid fa-file-pen text-[10px]"></i> Daftar Sekarang
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Hamburger Menu (Mobile Only) */}
                        <div className="flex items-center gap-4 md:hidden">
                            {auth.user ? (
                                <Link href="/dashboard" aria-label="Ke Dashboard"
                                    className="w-11 h-11 rounded-full bg-gold text-navy flex items-center justify-center text-xs"
                                    style={{ color: '#0f172a' }}>
                                    <i className="fa-solid fa-user"></i>
                                </Link>
                            ) : (
                                <Link href="/login"
                                    className={`flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors duration-500 ${
                                        isDark
                                            ? 'text-white bg-white/15 border border-white/20'
                                            : 'text-navy bg-gray-100'
                                    }`}>
                                    <i className="fa-solid fa-right-to-bracket"></i> Login
                                </Link>
                            )}
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                aria-label="Buka menu navigasi" aria-expanded={mobileMenuOpen}
                                className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-500 ${burgerColor} hover:text-gold`}>
                                <i className={`fa-solid ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Dropdown Terbuka di Dalam Kapsul */}
                    {mobileMenuOpen && (
                        <div className={`md:hidden border-t transition-colors duration-500 py-3 ${
                            isDark ? 'bg-navy/95 border-white/10' : 'bg-white border-gray-100'
                        }`}>
                            <div className="p-4 space-y-1">
                                {NAV_LINKS.map((link) => (
                                    <a key={link.href} href={link.href}
                                        onClick={handleNavClick}
                                        className={`block py-2.5 px-3 font-semibold text-xs rounded-lg transition-colors duration-300 ${
                                            isDark
                                                ? 'text-white/80 hover:text-white hover:bg-white/10'
                                                : 'text-gray-700 hover:text-navy hover:bg-gray-50'
                                        }`}>
                                        {link.label}
                                    </a>
                                ))}
                                <Link href="/daftar"
                                    className="block w-full text-center py-3 mt-4 bg-gold rounded-lg font-bold text-xs"
                                    style={{ color: '#0f172a' }}>
                                    Isi Formulir Pendaftaran
                                </Link>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </nav>
    )
}
