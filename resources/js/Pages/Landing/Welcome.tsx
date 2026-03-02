import { Head, usePage } from '@inertiajs/react'
import { useState } from 'react'
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
import Footer from '@/Components/Landing/Footer'
import VideoModal from '@/Components/Landing/VideoModal'

export default function Welcome({ activeWave, auth }: WelcomeProps) {
    const { props } = usePage<PageProps>()
    const { app } = props
    const [videoModalOpen, setVideoModalOpen] = useState(false)

    return (
        <>
            <Head title={app.name} />
            <div className="font-sans text-navy bg-light antialiased scroll-smooth">
                <TopBar />
                <Navbar auth={auth} app={app} />
                <HeroSection activeWave={activeWave} onOpenVideo={() => setVideoModalOpen(true)} />
                <ProfileSection onOpenVideo={() => setVideoModalOpen(true)} />
                <VisiMisiSection />
                <HighlightSection />
                <FacilitiesSection />
                <HowToRegisterSection />
                <Footer auth={auth} app={app} />
                <VideoModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} />
            </div>
        </>
    )
}