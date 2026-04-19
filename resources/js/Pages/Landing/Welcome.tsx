// resources/js/Pages/Landing/Welcome.tsx

import { Head, usePage } from '@inertiajs/react'
import { useState, lazy, Suspense } from 'react'
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
import GallerySection from '@/Components/Landing/GallerySection'
import Footer from '@/Components/Landing/Footer'
import VideoModal from '@/Components/Landing/VideoModal'

/*
 * ✅ FIX #5: Lazy import CinematicShowcase — component ini berat (35 media items,
 *    double marquee, 3D magnetic effect) dan hanya tampil di layar ≥ 450px.
 *    Dengan React.lazy, bundle-nya tidak ikut di-load saat halaman pertama dibuka.
 *    Baru di-fetch saat browser idle dan component mulai di-render.
 */
const CinematicShowcase = lazy(() => import('@/Components/Landing/CinematicShowcase'))

export default function Welcome({ activeWave, auth }: WelcomeProps) {
    const { props } = usePage<PageProps>()
    const { app } = props
    const [videoModalOpen, setVideoModalOpen] = useState(false)

    return (
        <>
            {/*
             * ✅ PERF: Preload hero image agar browser langsung fetch
             *    sebelum React selesai render — kunci nurunin LCP.
             *    - Mobile (≤768px) → preload versi mobile (18KB)
             *    - Desktop (>768px) → preload versi full (68KB)
             */}
            <Head title={app.name}>
                <link
                    rel="preload"
                    as="image"
                    href="/assets/hero-background-mobile.webp"
                    media="(max-width: 768px)"
                    fetchPriority="high"
                />
                <link
                    rel="preload"
                    as="image"
                    href="/assets/hero-background.webp"
                    media="(min-width: 769px)"
                    fetchPriority="high"
                />
            </Head>

            <div className="font-sans text-navy bg-light antialiased scroll-smooth selection:bg-gold/30 selection:text-gold">
                <TopBar activeWave={activeWave} />
                <Navbar auth={auth} app={app} />
                <HeroSection activeWave={activeWave} onOpenVideo={() => setVideoModalOpen(true)} />
                <ProfileSection onOpenVideo={() => setVideoModalOpen(true)} />
                <VisiMisiSection />
                <HighlightSection />
                <GallerySection />

                {/*
                 * CinematicShowcase hanya tampil di layar ≥ 450px.
                 * Suspense fallback: div kosong — tidak ada loading indicator
                 * karena section ini di bawah fold, user tidak akan melihat flash.
                 */}
                <div className="hidden min-[450px]:block">
                    <Suspense fallback={<div />}>
                        <CinematicShowcase />
                    </Suspense>
                </div>

                <FacilitiesSection />
                <HowToRegisterSection />
                <Footer auth={auth} app={app} />
                <VideoModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} />
            </div>
        </>
    )
}