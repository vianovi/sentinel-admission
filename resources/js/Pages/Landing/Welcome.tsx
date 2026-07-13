// resources/js/Pages/Landing/Welcome.tsx

import { Head, usePage } from '@inertiajs/react'
import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { WelcomeProps } from '@/types/landing'
import { PageProps } from '@/types'
import TopBar from '@/Components/Landing/TopBar'
import Navbar from '@/Components/Landing/Navbar'
import HeroSection from '@/Components/Landing/HeroSection'
import ProfileSection from '@/Components/Landing/ProfileSection'
import VisiMisiSection from '@/Components/Landing/VisiMisiSection'
import HighlightSection from '@/Components/Landing/HighlightSection'
import FacilitiesSection from '@/Components/Landing/FacilitiesSection'
import HowToRegisterSection from '@/Components/Landing/HowToRegisterSection'
import TrustCooperationSection from '@/Components/Landing/TrustCooperationSection'
import GallerySection from '@/Components/Landing/GallerySection'
import Footer from '@/Components/Landing/Footer'
import VideoModal from '@/Components/Landing/VideoModal'
import { useLandingLenis } from '@/hooks/useLandingLenis'

/*
 * ✅ FIX #5: Lazy import CinematicShowcase — component ini berat (35 media items,
 *    double marquee, 3D magnetic effect) dan hanya tampil di layar ≥ 450px.
 *    Dengan React.lazy, bundle-nya tidak ikut di-load saat halaman pertama dibuka.
 *    Baru di-fetch saat browser idle dan component mulai di-render.
 */
const CinematicShowcase = lazy(() => import('@/Components/Landing/CinematicShowcase'))

type IdleCapableWindow = Window & typeof globalThis & {
    requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
    cancelIdleCallback?: (handle: number) => void
}

function DeferredCinematicShowcase() {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [shouldRender, setShouldRender] = useState(false)

    useEffect(() => {
        const media = window.matchMedia('(min-width: 450px)')

        if (!media.matches) return

        const wrapper = wrapperRef.current

        if (!wrapper) return

        let idleId: number | undefined
        let fallbackTimer: number | undefined
        const idleWindow = window as IdleCapableWindow

        const renderWhenIdle = () => {
            if (idleWindow.requestIdleCallback) {
                idleId = idleWindow.requestIdleCallback(() => setShouldRender(true), { timeout: 1800 })
                return
            }

            fallbackTimer = window.setTimeout(() => setShouldRender(true), 700)
        }

        if (!('IntersectionObserver' in window)) {
            renderWhenIdle()
            return () => {
                if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer)
                if (idleId !== undefined && idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(idleId)
            }
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                observer.disconnect()
                renderWhenIdle()
            }
        }, { rootMargin: '900px 0px' })

        observer.observe(wrapper)

        return () => {
            observer.disconnect()
            if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer)
            if (idleId !== undefined && idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(idleId)
        }
    }, [])

    return (
        <div ref={wrapperRef} className="hidden min-[450px]:block">
            {shouldRender && (
                <Suspense fallback={<div />}>
                    <CinematicShowcase />
                </Suspense>
            )}
        </div>
    )
}

export default function Welcome({ activeWave, auth }: WelcomeProps) {
    const { props } = usePage<PageProps>()
    const { app } = props
    const [videoModalOpen, setVideoModalOpen] = useState(false)
    useLandingLenis()
    const currentYear = new Date().getFullYear()
    const canonicalUrl = typeof window === 'undefined'
        ? undefined
        : `${window.location.origin}${window.location.pathname}`

    return (
        <>
            {/*
             * ✅ PERF: Preload hero image + SEO Meta → LCP + SEO score
             */}
            <Head title={`${app.name} - Penerimaan Santri Baru ${currentYear}/${currentYear + 1}`}>
                {/* Preload hero */}
                <link
                    rel="preload"
                    as="image"
                    href="/assets/landing/hero/background-mobile.webp"
                    media="(max-width: 768px)"
                    fetchPriority="high"
                />
                <link
                    rel="preload"
                    as="image"
                    href="/assets/landing/hero/background.webp"
                    media="(min-width: 769px)"
                    fetchPriority="high"
                />

                {/* SEO Meta - Boost SEO score 90+ */}
                <meta name="description" content="Penerimaan santri baru Al-Muntaha Islamic Boarding School dengan pendaftaran online, informasi gelombang aktif, jadwal seleksi, dan kuota tersedia." />
                <meta name="robots" content="index, follow" />
                <meta property="og:title" content={`${app.name} - Penerimaan Santri Baru ${currentYear}/${currentYear + 1}`} />
                <meta property="og:description" content="Daftar di sistem penerimaan santri baru Al-Muntaha School. Cek gelombang aktif, jadwal seleksi, fasilitas, dan alur pendaftaran online." />
                <meta property="og:image" content="/assets/landing/hero/background.webp" />
                <meta property="og:image:width" content="1920" />
                <meta property="og:image:height" content="1080" />
                <meta property="og:type" content="website" />
                {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
                <meta property="og:locale" content="id_ID" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${app.name} - Penerimaan Santri Baru ${currentYear}/${currentYear + 1}`} />
                <meta name="twitter:description" content="Pendaftaran online Al-Muntaha Islamic Boarding School dengan informasi gelombang, jadwal seleksi, dan fasilitas." />
                <meta name="twitter:image" content="/assets/landing/hero/background.webp" />

                {/* Mobile SEO */}
                <meta name="theme-color" content="#0f172a" />
                {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
            </Head>

            <div className="font-sans text-navy bg-light antialiased selection:bg-gold/30 selection:text-gold">
                <TopBar activeWave={activeWave} />
                <Navbar auth={auth} app={app} />
                <HeroSection activeWave={activeWave} onOpenVideo={() => setVideoModalOpen(true)} />
                <ProfileSection onOpenVideo={() => setVideoModalOpen(true)} />
                <VisiMisiSection />
                <HighlightSection />
                <GallerySection />

                <DeferredCinematicShowcase />

                <FacilitiesSection />
                <HowToRegisterSection />
                <TrustCooperationSection app={app} />
                <Footer auth={auth} app={app} />
                <VideoModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} />
            </div>
        </>
    )
}
