import { useState, useEffect } from 'react'
import { Link } from '@inertiajs/react'
import { WelcomeProps } from '@/types/landing'

type NavbarProps = Pick<WelcomeProps, 'auth'>

function smoothScrollTo(targetId: string) {
    const target = document.querySelector(targetId)
    if (!target) return

    const targetY = target.getBoundingClientRect().top + window.scrollY - 80
    const startY = window.scrollY
    const distance = targetY - startY
    const duration = 1200
    let startTime: number | null = null

    // easeOutExpo easing — santai di akhir
    function easeOutExpo(t: number): number {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    }

    function step(timestamp: number) {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = easeOutExpo(progress)

        window.scrollTo(0, startY + distance * eased)

        if (progress < 1) {
            requestAnimationFrame(step)
        }
    }

    requestAnimationFrame(step)
}

export default function Navbar({ auth }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault()
        setMobileMenuOpen(false)
        smoothScrollTo(href)
    }

    const navLinks = [
        { href: '#home', label: 'Beranda' },
        { href: '#visi', label: 'Profil' },
        { href: '#fasilitas', label: 'Fasilitas' },
        { href: '#alur', label: 'Alur Daftar' },
        { href: '#kontak', label: 'Kontak' },
    ]

    return (
        <nav className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all duration-300 ${
            scrolled ? 'shadow-lg shadow-navy/10' : 'shadow-sm'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center text-gold shadow-lg">
                            <i className="fa-solid fa-graduation-cap text-xl"></i>
                        </div>
                        <div className="leading-tight">
                            <h1 className="font-display font-bold text-lg md:text-xl tracking-wide text-navy uppercase">Sentinel</h1>
                            <p className="text-[9px] md:text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">Admission System</p>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={(e) => handleNavClick(e, link.href)}
                                className="hover:text-navy transition relative group py-1"
                            >
                                {link.label}
                                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300 rounded-full"></span>
                            </a>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        {auth.user ? (
                            <Link href="/dashboard" className="px-6 py-2.5 rounded-full bg-navy text-white text-sm font-bold shadow-lg hover:scale-105 transition transform">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-navy px-4">Masuk</Link>
                                <Link href="/register" className="px-6 py-2.5 rounded-full bg-gold text-white text-sm font-bold shadow-glow hover:bg-goldhover hover:-translate-y-0.5 transition flex items-center gap-2">
                                    <i className="fa-solid fa-file-pen"></i> Daftar Sekarang
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Burger */}
                    <div className="flex items-center gap-4 md:hidden">
                        {auth.user ? (
                            <Link href="/dashboard" aria-label="Ke Dashboard" className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs">
                                <i className="fa-solid fa-user"></i>
                            </Link>
                        ) : (
                            <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-navy bg-gray-100 px-3 py-1.5 rounded-full">
                                <i className="fa-solid fa-right-to-bracket"></i> Login
                            </Link>
                        )}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Buka menu navigasi"
                            aria-expanded={mobileMenuOpen}
                            className="text-navy hover:text-gold transition"
                        >
                            <i className={`fa-solid ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100">
                    <div className="p-4 space-y-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={(e) => handleNavClick(e, link.href)}
                                className="block py-2.5 px-2 font-semibold text-gray-700 hover:text-navy hover:bg-gray-50 rounded-lg transition"
                            >
                                {link.label}
                            </a>
                        ))}
                        <Link href="/register" className="block w-full text-center py-3 mt-3 bg-navy text-white rounded-lg font-bold shadow-lg">
                            Isi Formulir Pendaftaran
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    )
}
