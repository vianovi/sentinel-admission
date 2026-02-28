import { useEffect, useRef, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { animate } from 'animejs'
import WizardSidebar from '@/Components/Wizard/WizardSidebar'
import WizardStep1 from '@/Components/Wizard/WizardStep1'
import WizardStep2 from '@/Components/Wizard/WizardStep2'
import WizardStep3 from '@/Components/Wizard/WizardStep3'

interface ActiveWave {
    id: number; title: string; academic_year: string
    quota_target: number; candidates_count: number
}

interface FormWizardProps {
    activeWave: ActiveWave | null
    flash?: { error?: string }
}

const defaultStep1 = { full_name: '', nisn: '', gender: '' as 'L' | 'P' | '', place_of_birth: '', date_of_birth: '' }
const defaultStep2 = {
    mother_name: '', whatsapp_number: '', email: '', phone_number: '',
    addr_jalan: '', addr_rt: '', addr_rw: '', addr_desa: '',
    addr_kec: '', addr_kab: '', addr_prov: '',
}

export default function FormWizard({ activeWave, flash }: FormWizardProps) {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
    const [step1, setStep1] = useState(defaultStep1)
    const [step2, setStep2] = useState(defaultStep2)
    const [loadingBar, setLoadingBar] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)
    const loadingBarRef = useRef<HTMLDivElement>(null)

    // Entrance animation
    useEffect(() => {
        animate('.wizard-card', {
            opacity: [0, 1],
            translateY: [28, 0],
            duration: 900,
            ease: 'outExpo',
        })
    }, [])

    // NProgress-style loading bar
    const showLoadingBar = (onDone: () => void) => {
        setLoadingBar(true)
        if (loadingBarRef.current) {
            loadingBarRef.current.style.width = '0%'
            loadingBarRef.current.style.opacity = '1'
        }
        animate(loadingBarRef.current!, {
            width: ['0%', '85%'],
            duration: 400,
            ease: 'outQuad',
            onComplete: () => {
                animate(loadingBarRef.current!, {
                    width: ['85%', '100%'],
                    opacity: [1, 0],
                    duration: 300,
                    ease: 'outQuad',
                    onComplete: () => {
                        setLoadingBar(false)
                        onDone()
                    },
                })
            },
        })
    }

    const animateStepIn = () => {
        animate('.step-content', {
            opacity: [0, 1],
            translateX: [24, 0],
            duration: 450,
            ease: 'outExpo',
        })
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const goToStep = (step: 1 | 2 | 3) => {
        animate('.step-content', {
            opacity: [1, 0],
            translateX: [0, step > currentStep ? -20 : 20],
            duration: 200,
            ease: 'inQuad',
            onComplete: () => {
                showLoadingBar(() => {
                    setCurrentStep(step)
                    setTimeout(animateStepIn, 30)
                })
            },
        })
    }

    const handleNext = () => { if (currentStep < 3) goToStep((currentStep + 1) as 2 | 3) }
    const handleBack = () => { if (currentStep > 1) goToStep((currentStep - 1) as 1 | 2) }
    const handleGoToStep1 = () => goToStep(1)

    const mobileTab = (step: number) => currentStep === step
        ? 'text-gold font-bold border-b-2 border-gold pb-1 transition-all duration-300'
        : 'text-slate-400 pb-1 transition-all duration-300'

    return (
        <>
            <Head title="Formulir Pendaftaran" />

            {/* NProgress-style loading bar */}
            <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
                <div
                    ref={loadingBarRef}
                    className="h-full bg-gradient-to-r from-gold to-amber-300 shadow-[0_0_8px_rgba(212,160,23,0.7)]"
                    style={{ width: '0%', opacity: 0 }}
                />
            </div>

            <div className="min-h-screen w-full bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-start sm:items-center justify-center py-0 sm:py-6 px-0 sm:px-4 md:px-8">
                <div className="wizard-card opacity-0 relative w-full sm:max-w-7xl sm:rounded-3xl overflow-hidden shadow-[0_22px_45px_rgba(15,23,42,0.45)] bg-slate-900/80 border-0 sm:border border-white/5 min-h-screen sm:min-h-0">

                    {/* Glow effects */}
                    <div className="pointer-events-none absolute -top-24 -right-16 w-48 sm:w-72 h-48 sm:h-72 bg-gradient-to-br from-amber-400/50 via-rose-400/40 to-sky-500/40 rounded-full blur-3xl opacity-70" style={{animation: 'glow-move 14s ease-in-out infinite alternate'}}></div>
                    <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 sm:w-80 h-56 sm:h-80 bg-gradient-to-tr from-emerald-400/35 via-cyan-400/35 to-amber-300/35 rounded-full blur-3xl opacity-70" style={{animation: 'glow-move 14s ease-in-out infinite alternate'}}></div>

                    {/* Layout: stack on mobile, side-by-side on md+ */}
                    <div className="relative flex flex-col md:grid md:grid-cols-[260px,1fr] lg:grid-cols-[300px,1fr]">

                        {/* Sidebar */}
                        <WizardSidebar
                            currentStep={currentStep}
                            academicYear={activeWave?.academic_year}
                            batchName={activeWave?.title}
                        />

                        {/* Content */}
                        <div className="flex-1 bg-slate-50/95 flex flex-col min-h-0">

                            {/* Mobile stepper tabs */}
                            <div className="border-b border-slate-200 px-4 sm:px-8 py-2.5 sm:py-3 bg-white/80 backdrop-blur sticky top-0 z-10">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <div className="flex gap-3 sm:gap-4">
                                        <span className={mobileTab(1)}>1. Identitas</span>
                                        <span className={mobileTab(2)}>2. Kontak</span>
                                        <span className={mobileTab(3)}>3. Review</span>
                                    </div>
                                    {activeWave && (
                                        <div className="hidden sm:block text-[11px] text-slate-400">
                                            <span className="font-bold text-slate-700">{activeWave.title}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Flash error */}
                            {flash?.error && (
                                <div className="mx-4 sm:mx-8 mt-4 bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-r-xl text-sm text-red-800 flex gap-3">
                                    <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                                    <div><div className="font-semibold mb-0.5">Terjadi Kesalahan</div><p>{flash.error}</p></div>
                                </div>
                            )}

                            {/* Form area */}
                            <div ref={contentRef} className="flex-1 p-4 sm:p-8 md:p-10 overflow-y-auto">
                                <div className="step-content max-w-2xl mx-auto md:max-w-none">
                                    {currentStep === 1 && (
                                        <WizardStep1 data={step1} onChange={setStep1} onNext={handleNext} />
                                    )}
                                    {currentStep === 2 && (
                                        <WizardStep2 data={step2} candidateName={step1.full_name} onChange={setStep2} onNext={handleNext} onBack={handleBack} />
                                    )}
                                    {currentStep === 3 && (
                                        <WizardStep3 step1={step1} step2={step2} waveId={activeWave?.id} onBack={handleBack} onGoToStep1={handleGoToStep1} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
