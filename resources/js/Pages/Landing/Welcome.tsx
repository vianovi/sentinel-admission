import { Head } from '@inertiajs/react'
import { useState } from 'react'
import { WelcomeProps } from '@/types/landing'
import TopBar from '@/Components/Landing/TopBar'
import Navbar from '@/Components/Landing/Navbar'
import HeroSection from '@/Components/Landing/HeroSection'
import ProfileSection from '@/Components/Landing/ProfileSection'
import VisiMisiSection from '@/Components/Landing/VisiMisiSection'
import HighlightSection from '@/Components/Landing/HighlightSection'
import FacilitiesSection from '@/Components/Landing/FacilitiesSection'
import HowToRegisterSection from '@/Components/Landing/HowToRegisterSection'
import Footer from '@/Components/Landing/Footer'
import VideoModal from '@/Components/Landing/VideoModal'

export default function Welcome({ activeWave, auth }: WelcomeProps) {
    const [videoModalOpen, setVideoModalOpen] = useState(false)

    return (
        <>
            <Head title="Sentinel Admission" />

            <div className="font-sans text-navy bg-light antialiased scroll-smooth">
                <TopBar />
                <Navbar auth={auth} />

                <HeroSection
                    activeWave={activeWave}
                    onOpenVideo={() => setVideoModalOpen(true)}
                />

                <ProfileSection onOpenVideo={() => setVideoModalOpen(true)} />

                <VisiMisiSection />

                <HighlightSection />

                <FacilitiesSection />

                <HowToRegisterSection />

                <Footer auth={auth} />

                <VideoModal
                    isOpen={videoModalOpen}
                    onClose={() => setVideoModalOpen(false)}
                />
            </div>
        </>
    )
}
