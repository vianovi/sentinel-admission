import { useState, useEffect } from 'react'
import { Link } from '@inertiajs/react'
import { WelcomeProps } from '@/types/landing'
import { AppConfig } from '@/types'

type NavbarProps = Pick<WelcomeProps, 'auth'> & { app: AppConfig }

function smoothScrollTo(targetId: string) {
    const target = document.querySelector(targetId)
    if (!target) return
    const targetY = target.getBoundingClientRect().top + window.scrollY - 80
    const startY = window.scrollY
    const distance = targetY - startY
    const duration = 1200
    let startTime: number | null = null

    function easeOutExpo(t: number): number {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    }

    function step(timestamp: number) {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)
        window.scrollTo(0, startY + distance * easeOutExpo(progress))
        if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
}

type NavState = 'top' | 'hero' | 'below'

export default function Navbar({ auth, app }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [navState, setNavState] = useState<NavState>('top')

    useEffect(() => {
        const topBarHeight = 40    // estimasi tinggi TopBar
        const navbarHeight = 80
        const heroEl = document.getElementById('home')

        const handleScroll = () => {
            const scrollY = window.scrollY
            const heroBottom = heroEl
                ? heroEl.getBoundingClientRect().bottom + scrollY - navbarHeight
                : window.innerHeight

            if (scrollY < topBarHeight) {
                setNavState('top')
            } else if (scrollY < heroBottom) {
                setNavState('hero')
            } else {
                setNavState('below')
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll()
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault()
        setMobileMenuOpen(false)
        smoothScrollTo(href)
    }

    const navLinks = [
        { href: '#home',      label: 'Beranda'     },
        { href: '#visi',      label: 'Profil'      },
        { href: '#galeri',    label: 'Galeri'      },
        { href: '#fasilitas', label: 'Fasilitas'   },
        { href: '#alur',      label: 'Alur Daftar' },
        { href: '#kontak',    label: 'Kontak'      },
    ]

    // ── State-based style maps ────────────────────────────────────────────────
    const isDark = navState === 'top' || navState === 'hero'

    const navBg =
        navState === 'top'   ? 'bg-navy/90 backdrop-blur-md border-white/10 shadow-none' :
        navState === 'hero'  ? 'bg-navy/70 backdrop-blur-lg border-white/10 shadow-none' :
                               'bg-white/95 backdrop-blur-md border-gray-100 shadow-lg shadow-navy/10'

    const logoTextColor  = isDark ? 'text-white'        : 'text-navy'
    const logoSubColor   = isDark ? 'text-white/50'     : 'text-gray-500'
    const linkColor      = isDark ? 'text-white/75'     : 'text-gray-500'
    const linkHoverColor = isDark ? 'hover:text-white'  : 'hover:text-navy'
    const masukColor     = isDark ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-navy'
    const burgerColor    = isDark ? 'text-white'        : 'text-navy'

    return (
        <nav className={`sticky top-0 z-50 border-b transition-all duration-500 ease-in-out ${navBg}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        {app.logo ? (
                            <img src={app.logo} alt={app.name} className="w-10 h-10 rounded-lg object-cover shadow-lg" />
                        ) : (
                            <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center text-gold shadow-lg">
                                <i className="fa-solid fa-graduation-cap text-xl"></i>
                            </div>
                        )}
                        <div className="leading-tight">
                            <h1 className={`font-display font-bold text-lg md:text-xl tracking-wide uppercase transition-colors duration-500 ${logoTextColor}`}>
                                {app.name}
                            </h1>
                            <p className={`text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-500 ${logoSubColor}`}>
                                {app.tagline}
                            </p>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className={`hidden md:flex items-center gap-8 text-sm font-semibold transition-colors duration-500 ${linkColor}`}>
                        {navLinks.map((link) => (
                            <a key={link.href} href={link.href}
                                onClick={(e) => handleNavClick(e, link.href)}
                                className={`${linkHoverColor} transition-colors duration-300 relative group py-1`}>
                                {link.label}
                                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300 rounded-full"></span>
                            </a>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        {auth.user ? (
                            <Link href="/dashboard" className="px-6 py-2.5 rounded-full bg-gold text-navy text-sm font-bold shadow-lg hover:scale-105 transition transform"
                                style={{ color: '#0f172a' }}>
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/login"
                                    className={`text-sm font-bold px-4 transition-colors duration-500 ${masukColor}`}>
                                    Masuk
                                </Link>
                                <Link href="/daftar"
                                    className="px-6 py-2.5 rounded-full bg-gold text-navy text-sm font-bold shadow-glow hover:bg-goldhover hover:-translate-y-0.5 transition flex items-center gap-2"
                                    style={{ color: '#0f172a' }}>
                                    <i className="fa-solid fa-file-pen"></i> Daftar Sekarang
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Burger */}
                    <div className="flex items-center gap-4 md:hidden">
                        {auth.user ? (
                            <Link href="/dashboard" aria-label="Ke Dashboard"
                                className="w-8 h-8 rounded-full bg-gold text-navy flex items-center justify-center text-xs"
                                style={{ color: '#0f172a' }}>
                                <i className="fa-solid fa-user"></i>
                            </Link>
                        ) : (
                            <Link href="/login"
                                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-colors duration-500 ${
                                    isDark
                                        ? 'text-white bg-white/15 border border-white/20'
                                        : 'text-navy bg-gray-100'
                                }`}>
                                <i className="fa-solid fa-right-to-bracket"></i> Login
                            </Link>
                        )}
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Buka menu navigasi" aria-expanded={mobileMenuOpen}
                            className={`transition-colors duration-500 ${burgerColor} hover:text-gold`}>
                            <i className={`fa-solid ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown */}
            {mobileMenuOpen && (
                <div className={`md:hidden border-t transition-colors duration-500 ${
                    isDark ? 'bg-navy/95 border-white/10' : 'bg-white border-gray-100'
                }`}>
                    <div className="p-4 space-y-1">
                        {navLinks.map((link) => (
                            <a key={link.href} href={link.href}
                                onClick={(e) => handleNavClick(e, link.href)}
                                className={`block py-2.5 px-2 font-semibold rounded-lg transition-colors duration-300 ${
                                    isDark
                                        ? 'text-white/80 hover:text-white hover:bg-white/10'
                                        : 'text-gray-700 hover:text-navy hover:bg-gray-50'
                                }`}>
                                {link.label}
                            </a>
                        ))}
                        <Link href="/daftar"
                            className="block w-full text-center py-3 mt-3 bg-gold rounded-lg font-bold shadow-lg"
                            style={{ color: '#0f172a' }}>
                            Isi Formulir Pendaftaran
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    )
}