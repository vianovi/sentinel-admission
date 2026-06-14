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
             * ✅ PERF: Preload hero image + SEO Meta → LCP + SEO score
             */}
            <Head title={`${app.name} - Penerimaan Siswa Baru ${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}>
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
                <meta name="description" content="Al-Muntaha Islamic Boarding School - Pendaftaran Siswa Baru Online. Gelombang aktif sekarang. Kuota terbatas." />
                <meta property="og:title" content={`${app.name} - PSB ${new Date().getFullYear()}/${new Date().getFullYear() + 1}`} />
                <meta property="og:description" content="Daftar sekarang di sistem penerimaan siswa baru Al-Muntaha School. Gelombang aktif, kuota terbatas." />
                <meta property="og:image" content="/assets/landing/hero/background.webp" />
                <meta property="og:image:width" content="1920" />
                <meta property="og:image:height" content="1080" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={window.location.origin} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${app.name} - PSB ${new Date().getFullYear()}/${new Date().getFullYear() + 1}`} />
                <meta name="twitter:description" content="Pendaftaran Siswa Baru Al-Muntaha Islamic Boarding School" />
                <meta name="twitter:image" content="/assets/landing/hero/background.webp" />

                {/* Mobile SEO */}
                <meta name="theme-color" content="#0f172a" />
                <link rel="canonical" href={window.location.href} />
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
