// resources/js/Components/Landing/HeroSection.tsx
import { lazy, Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { Link } from '@inertiajs/react'
import { AdmissionWaveData } from '@/types/landing'
import WaveCard from './WaveCard'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const MOBILE_VIEWPORT_QUERY = '(max-width: 767px)'
const HERO_WORDS = ['Generasi', 'Santri', 'Pemimpin', 'Insan', 'Pribadi'] as const
const ScheduleModal = lazy(() => import('./ScheduleModal'))

type TypingPhase = 'typing' | 'holding' | 'deleting'

interface HeroSectionProps {
    activeWave: AdmissionWaveData | null
    onOpenVideo: () => void
}

function usePrefersReducedMotion() {
    const [reducedMotion, setReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.matchMedia(REDUCED_MOTION_QUERY).matches
    })

    useEffect(() => {
        const media = window.matchMedia(REDUCED_MOTION_QUERY)
        const handleChange = () => setReducedMotion(media.matches)

        handleChange()
        media.addEventListener('change', handleChange)

        return () => media.removeEventListener('change', handleChange)
    }, [])

    return reducedMotion
}

function useViewportMatch(query: string) {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.matchMedia(query).matches
    })

    useEffect(() => {
        const media = window.matchMedia(query)
        const handleChange = () => setMatches(media.matches)

        handleChange()
        media.addEventListener('change', handleChange)

        return () => media.removeEventListener('change', handleChange)
    }, [query])

    return matches
}

function useTypingWords(words: readonly string[], enabled: boolean) {
    const [wordIndex, setWordIndex] = useState(0)
    const [visibleWord, setVisibleWord] = useState(words[0] ?? '')
    const [phase, setPhase] = useState<TypingPhase>('holding')

    useEffect(() => {
        if (!enabled) {
            setWordIndex(0)
            setVisibleWord(words[0] ?? '')
            setPhase('holding')
            return
        }

        const currentWord = words[wordIndex] ?? words[0] ?? ''
        let timeoutId: number | undefined

        if (phase === 'holding') {
            timeoutId = window.setTimeout(() => setPhase('deleting'), 1600)
        }

        if (phase === 'deleting') {
            if (visibleWord.length > 0) {
                timeoutId = window.setTimeout(() => {
                    setVisibleWord(currentWord.slice(0, visibleWord.length - 1))
                }, 58)
            } else {
                timeoutId = window.setTimeout(() => {
                    setWordIndex((current) => (current + 1) % words.length)
                    setPhase('typing')
                }, 260)
            }
        }

        if (phase === 'typing') {
            if (visibleWord.length < currentWord.length) {
                timeoutId = window.setTimeout(() => {
                    setVisibleWord(currentWord.slice(0, visibleWord.length + 1))
                }, 92)
            } else {
                setPhase('holding')
            }
        }

        return () => {
            if (timeoutId) window.clearTimeout(timeoutId)
        }
    }, [enabled, phase, visibleWord, wordIndex, words])

    return {
        visibleWord,
        activeWord: words[wordIndex] ?? words[0] ?? '',
    }
}

export default function HeroSection({ activeWave, onOpenVideo }: HeroSectionProps) {
    const heroRef = useRef<HTMLElement>(null)
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
    const [heroReady, setHeroReady] = useState(false)
    const [typingReady, setTypingReady] = useState(false)
    const reducedMotion = usePrefersReducedMotion()
    const isMobileViewport = useViewportMatch(MOBILE_VIEWPORT_QUERY)
    const typingEnabled = typingReady && !reducedMotion && !isMobileViewport
    const { visibleWord, activeWord } = useTypingWords(HERO_WORDS, typingEnabled)

    // Memoize callback untuk menghindari re-render tidak berguna pada WaveCard
    const handleOpenSchedule = useCallback(() => {
        setScheduleModalOpen(true)
    },[])

    useEffect(() => {
        if (reducedMotion) {
            setHeroReady(true)
            return
        }

        let secondFrame = 0
        const firstFrame = window.requestAnimationFrame(() => {
            secondFrame = window.requestAnimationFrame(() => setHeroReady(true))
        })

        return () => {
            window.cancelAnimationFrame(firstFrame)
            window.cancelAnimationFrame(secondFrame)
        }
    },[reducedMotion])

    useEffect(() => {
        setTypingReady(false)

        if (reducedMotion || isMobileViewport) return

        const timer = window.setTimeout(() => setTypingReady(true), 1200)
        return () => window.clearTimeout(timer)
    }, [isMobileViewport, reducedMotion])

    const textMotionClass = heroReady || reducedMotion
        ? 'translate-y-0 opacity-100'
        : 'translate-y-7 opacity-0'
    const cardMotionClass = heroReady || reducedMotion
        ? 'translate-x-0 translate-y-0 opacity-100'
        : 'translate-y-7 opacity-0 lg:translate-x-10 lg:translate-y-0'

    return (
        <>
            <header ref={heroRef} id="home" className="relative -mt-24 flex min-h-[calc(80vh+6rem)] scroll-mt-28 items-center overflow-hidden bg-navy pt-48 pb-16 lg:pt-52 lg:pb-20">

                {/* BACKGROUND: Bersih dari filter blend yang mengotori warna */}
                <div className="absolute inset-0 z-0">
                    <picture>
                        <source media="(max-width: 768px)" srcSet="/assets/landing/hero/background-mobile.webp" type="image/webp" />
                        <source media="(min-width: 769px)" srcSet="/assets/landing/hero/background.webp" type="image/webp" />
                        <img
                            src="/assets/landing/hero/background.webp"
                            alt="Lingkungan Al-Muntaha Boarding School"
                            width="1920"
                            height="1080"
                            className="w-full h-full object-cover"
                            fetchPriority="high"
                            loading="eager"
                            decoding="async"
                        />
                    </picture>
                    {/* Gradien Deep Navy yang mengembalikan nyawa biru pada gambar */}
                    <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/60 to-navy/24 lg:to-navy/10" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_42%,rgba(212,160,23,0.12),transparent_39%),radial-gradient(ellipse_at_82%_30%,rgba(15,23,42,0.56),transparent_54%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_23%_76%,rgba(15,23,42,0.72),rgba(15,23,42,0.34)_42%,transparent_68%)]" />
                </div>

                {/* CONTENT CONTAINER */}
                <div className="max-w-[100rem] mx-auto px-5 sm:px-7 lg:px-8 xl:px-10 relative z-10 w-full">
                    <div className="grid lg:grid-cols-[minmax(0,1.64fr)_minmax(330px,0.76fr)] gap-10 lg:gap-12 xl:gap-16 items-center">

                        {/* LEFT: Cinematic Copywriting */}
                        <div className="space-y-5 lg:space-y-6 text-center lg:text-left">

                            {/* Elite Branding Tags */}
                            <div className={`hero-text-anim flex flex-wrap items-center justify-center gap-2.5 transition-all duration-700 ease-out lg:justify-start ${textMotionClass}`}>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/15 border border-gold/30 text-white font-bold text-[10px] sm:text-xs tracking-wide backdrop-blur-md shadow-sm">
                                    <i className="fa-solid fa-star text-gold"></i>
                                    <span>Akreditasi A (Unggul)</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-slate-100 font-semibold text-[10px] sm:text-xs tracking-wide backdrop-blur-md shadow-sm">
                                    <i className="fa-solid fa-award text-emerald-400"></i>
                                    <span>Tahfidz & Adab Focused</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-slate-100 font-semibold text-[10px] sm:text-xs tracking-wide backdrop-blur-md shadow-sm">
                                    <i className="fa-solid fa-earth-asia text-blue-300"></i>
                                    <span>Global Leadership</span>
                                </div>
                            </div>

                            {/* Headline: Fluid & Immersive */}
                            <h1
                                className="text-3xl sm:text-[2.7rem] lg:text-[2.25rem] xl:text-[3.05rem] 2xl:text-[3.4rem] font-display font-extrabold leading-[1.03] tracking-normal"
                                aria-label={`Menyiapkan ${activeWord} Unggul dalam Ilmu dan Akhlak`}
                            >
                                <span className="block lg:whitespace-nowrap text-white">
                                    Menyiapkan{' '}
                                    <span className="inline-flex min-w-[8.6ch] items-baseline text-gold" aria-hidden="true">
                                        <span>{visibleWord}</span>
                                        <span className="hero-typing-caret ml-1 inline-block h-[0.78em] w-[2px] translate-y-[0.08em] rounded-full bg-gold/80" />
                                    </span>
                                </span>
                                <span className="mt-2 block lg:whitespace-nowrap text-white/95">
                                    <span>Unggul dalam</span>{' '}
                                    <span className="hero-emphasis-text">
                                        Ilmu &amp; Akhlak
                                        <svg
                                            className="hero-organic-underline"
                                            viewBox="0 0 260 22"
                                            aria-hidden="true"
                                            focusable="false"
                                            preserveAspectRatio="none"
                                        >
                                            <defs>
                                                <linearGradient id="hero-underline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#b5850b" stopOpacity="0.72" />
                                                    <stop offset="48%" stopColor="#f5d06a" stopOpacity="1" />
                                                    <stop offset="100%" stopColor="#d4a017" stopOpacity="0.72" />
                                                </linearGradient>
                                            </defs>
                                            <path d="M5 13.8 C44 22 75 4 116 12.2 C158 20.7 196 9.6 255 13.4" />
                                        </svg>
                                    </span>
                                </span>
                            </h1>

                            {/* Subtext: SEO Restored & Balanced Contrast */}
                            <p className={`hero-text-anim mx-auto max-w-2xl text-base leading-relaxed text-slate-300 transition-all delay-100 duration-700 ease-out sm:text-lg lg:mx-0 ${textMotionClass}`}>
                                <strong className="text-white font-semibold">Al-Muntaha Islamic Boarding School -</strong> adalah tempat di mana potensi tertinggi setiap santri diasah. Kami memadukan keunggulan akademik global dengan kedalaman spiritual untuk membentuk pemimpin masa depan yang bertaqwa.
                            </p>

                            {/* CTA Actions */}
                            <div className={`hero-text-anim flex flex-col items-center justify-center gap-3 pt-2 transition-all delay-150 duration-700 ease-out lg:items-start ${textMotionClass}`}>
                                <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-center lg:justify-start">
                                    <Link
                                        href="/daftar"
                                        aria-label="Daftar penerimaan siswa baru Al-Muntaha"
                                        className="w-full sm:w-auto px-8 py-3.5 bg-gold text-slate-900 rounded-xl font-bold shadow-lg shadow-gold/20 hover:-translate-y-1 hover:shadow-gold/40 transition-all duration-300 text-center text-sm sm:text-base"
                                    >
                                        Amankan Kursi Sekarang
                                    </Link>
                                    <button
                                        onClick={onOpenVideo}
                                        aria-label="Tonton Profil Sekolah"
                                        className="w-full sm:w-auto px-6 py-3.5 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2.5 group backdrop-blur-md text-sm sm:text-base"
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-gold/20 transition-colors duration-300">
                                            <i className="fa-solid fa-play text-gold text-xs ml-0.5"></i>
                                        </div>
                                        Intip Fasilitas Kami
                                    </button>
                                </div>
                                <a
                                    href="https://wa.me/6285185001661"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group/help inline-flex items-center gap-2 rounded-full bg-navy/38 px-3 py-1.5 text-xs sm:text-[13px] font-semibold text-slate-100 ring-1 ring-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-navy/58 hover:text-white hover:ring-emerald-300/30"
                                    aria-label="Chat WhatsApp layanan bantuan pendaftaran"
                                >
                                    <i className="fa-brands fa-whatsapp text-emerald-300"></i>
                                    <span>
                                        Butuh bantuan?
                                        <span className="ml-1 text-white">Chat admin</span>
                                    </span>
                                    <i className="fa-solid fa-arrow-right text-[10px] text-slate-300 transition-transform duration-300 group-hover/help:translate-x-0.5 group-hover/help:text-emerald-300"></i>
                                </a>
                            </div>
                        </div>

                        {/* RIGHT: Compact WaveCard */}
                        <div className={`hero-card-anim w-full transition-all delay-200 duration-700 ease-out ${cardMotionClass}`}>
                            <WaveCard
                                activeWave={activeWave}
                                onOpenSchedule={handleOpenSchedule}
                            />
                        </div>

                    </div>
                </div>

                {/* Dynamic SVG Divider */}
                <div className="absolute bottom-0 left-0 right-0 z-10 leading-none pointer-events-none translate-y-[1px]">
                    <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[40px] md:h-[72px]">
                        <path d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z" fill="currentColor" className="text-slate-900 dark:text-navy" />
                    </svg>
                </div>
            </header>

            {activeWave && scheduleModalOpen && (
                <Suspense fallback={null}>
                    <ScheduleModal
                        isOpen={scheduleModalOpen}
                        onClose={() => setScheduleModalOpen(false)}
                        activeWave={activeWave}
                    />
                </Suspense>
            )}
        </>
    )
}
