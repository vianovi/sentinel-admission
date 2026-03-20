import { useEffect, useRef, useState } from 'react'
import { Head } from '@inertiajs/react'
import { animate } from 'animejs'
import axios from 'axios'

import WizardSidebar      from '@/Components/Wizard/WizardSidebar'
import WizardStep1        from '@/Components/Wizard/WizardStep1'
import WizardStep2        from '@/Components/Wizard/WizardStep2'
import WizardStep3        from '@/Components/Wizard/WizardStep3'
import ResumeModal        from '@/Components/Wizard/ResumeModal'

import {
    readWizardStorage,
    clearWizardStorage,
    saveDraftId,
    saveLastStep,
} from '@/Components/Wizard/useWizardStorage'

import type { Step1Data } from '@/Components/Wizard/WizardStep1'
import type { Step2Data } from '@/Components/Wizard/WizardStep2'
import type { Step3Data } from '@/Components/Wizard/WizardStep3'

// ─── Manual progress bar trigger ─────────────────────────────────────────────
// Wizard pakai state React (bukan Inertia navigate) — GlobalProgressBar tidak
// terpanggil otomatis saat pindah step. Kita trigger manual via DOM attribute.
function triggerProgressBar(action: 'start' | 'finish') {
    const bar  = document.querySelector<HTMLElement>('[data-wizard-bar]')
    const glow = document.querySelector<HTMLElement>('[data-wizard-glow]')
    if (!bar || !glow) return

    if (action === 'start') {
        bar.style.opacity  = '1'
        bar.style.width    = '0%'
        glow.style.opacity = '1'
        glow.style.width   = '0%'
        requestAnimationFrame(() => {
            bar.style.transition  = 'width 400ms cubic-bezier(0.25, 1, 0.5, 1)'
            glow.style.transition = 'width 400ms cubic-bezier(0.25, 1, 0.5, 1)'
            requestAnimationFrame(() => {
                bar.style.width  = '80%'
                glow.style.width = '80%'
            })
        })
    } else {
        bar.style.transition  = 'width 200ms ease-out'
        glow.style.transition = 'width 200ms ease-out'
        bar.style.width  = '100%'
        glow.style.width = '100%'
        setTimeout(() => {
            bar.style.opacity  = '0'
            glow.style.opacity = '0'
            setTimeout(() => {
                bar.style.width  = '0%'
                glow.style.width = '0%'
            }, 300)
        }, 200)
    }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveWave {
    id: number
    title: string
    academic_year: string
    quota_target: number
}

interface FormWizardProps {
    activeWave: ActiveWave | null
    flash?: { error?: string }
}

interface DuplicateInfo {
    status: 'draft' | 'registered'
    data: {
        name: string
        nisn: string
        nik: string
        draft_id?: number
        updated_at?: string
    }
}

// ─── Default state ────────────────────────────────────────────────────────────

const defaultStep1: Step1Data = {
    full_name: '', nisn: '', nik: '',
    gender: '', place_of_birth: '', date_of_birth: '',
}

const defaultStep2: Step2Data = {
    mother_name: '', whatsapp_number: '', email: '', phone_number: '',
    addr_jalan: '', addr_rt: '', addr_rw: '', addr_desa: '',
    addr_kec: '', addr_kab: '', addr_prov: '',
}

const defaultStep3: Step3Data = { school_origin: '' }

// ─── Component ────────────────────────────────────────────────────────────────

export default function FormWizard({ activeWave, flash }: FormWizardProps) {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
    const [step1, setStep1]             = useState<Step1Data>(defaultStep1)
    const [step2, setStep2]             = useState<Step2Data>(defaultStep2)
    const [step3, setStep3]             = useState<Step3Data>(defaultStep3)
    const [draftId, setDraftId]         = useState<string>('')
    const [ready, setReady]             = useState(false) // tunggu cek draft selesai

    const [resumeDraft, setResumeDraft]   = useState<DuplicateInfo | null>(null)
    const pendingNisnNik = useRef<{ nisn: string; nik: string } | null>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    // ── Mount: cek draft di localStorage → validasi ke DB ────────────────────
    useEffect(() => {
        const stored = readWizardStorage()

        const init = async () => {
            if (stored.draftId) {
                try {
                    const { data: res } = await axios.post('/daftar/check-draft', {
                        draft_id: stored.draftId,
                    })

                    if (res.valid) {
                        // Draft masih aktif → restore semua data
                        if (stored.step1)  setStep1({ ...defaultStep1, ...stored.step1 })
                        if (stored.step2)  setStep2({ ...defaultStep2, ...stored.step2 })
                        if (stored.step3)  setStep3({ ...defaultStep3, ...stored.step3 })
                        setDraftId(stored.draftId)

                        if (stored.lastStep && stored.lastStep > 1) {
                            setCurrentStep(stored.lastStep)
                        }
                    } else {
                        // Draft tidak valid (sudah jadi akun / expired) → bersihkan
                        clearWizardStorage()
                    }
                } catch {
                    // Kalau request gagal (network error) → tetap restore lokal
                    // Biar user tidak kehilangan data karena koneksi buruk
                    if (stored.step1)  setStep1({ ...defaultStep1, ...stored.step1 })
                    if (stored.step2)  setStep2({ ...defaultStep2, ...stored.step2 })
                    if (stored.step3)  setStep3({ ...defaultStep3, ...stored.step3 })
                    setDraftId(stored.draftId)
                    if (stored.lastStep && stored.lastStep > 1) {
                        setCurrentStep(stored.lastStep)
                    }
                }
            }

            // Selesai cek → tampilkan form
            setReady(true)

            animate('.wizard-card', {
                opacity: [0, 1],
                translateY: [28, 0],
                duration: 900,
                ease: 'outExpo',
            })
        }

        init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        saveLastStep(currentStep)
    }, [currentStep])

    // ── Animasi transisi ──────────────────────────────────────────────────────
    const animateStepTransition = (nextStep: 1 | 2 | 3, onSwitch: () => void) => {
        const direction = nextStep > currentStep ? -20 : 20

        // Trigger progress bar — wizard pakai state, bukan Inertia navigate
        triggerProgressBar('start')

        animate('.step-content', {
            opacity: [1, 0],
            translateX: [0, direction],
            duration: 200,
            ease: 'inQuad',
            onComplete: () => {
                onSwitch()

                // Scroll to top — handle keduanya: div container & window
                contentRef.current?.scrollTo({ top: 0, behavior: 'instant' })
                window.scrollTo({ top: 0, behavior: 'instant' })

                setTimeout(() => {
                    animate('.step-content', {
                        opacity: [0, 1],
                        translateX: [-direction, 0],
                        duration: 400,
                        ease: 'outExpo',
                    })
                    // Finish progress bar setelah animasi masuk selesai
                    setTimeout(() => triggerProgressBar('finish'), 420)
                }, 30)
            },
        })
    }

    const goToStep = (step: 1 | 2 | 3) => {
        animateStepTransition(step, () => setCurrentStep(step))
    }

    const handleStep1Next = (newDraftId: string) => {
        if (newDraftId !== draftId) {
            setDraftId(newDraftId)
            saveDraftId(newDraftId)
        }
        goToStep(2)
    }

    const handleDuplicateFound = (
        status: 'draft' | 'registered',
        data: DuplicateInfo['data']
    ) => {
        pendingNisnNik.current = { nisn: step1.nisn, nik: step1.nik }
        setResumeDraft({ status, data })
    }

    const handleResume = async () => {
        if (!pendingNisnNik.current) return
        setResumeDraft(null)
        try {
            const { data: res } = await axios.post('/daftar/resume', pendingNisnNik.current)
            setDraftId(String(res.draft_id))
            saveDraftId(String(res.draft_id))
            if (res.step1) setStep1({ ...defaultStep1, ...res.step1 })
            if (res.step2) setStep2({ ...defaultStep2, ...res.step2 })
            if (res.step3) setStep3({ ...defaultStep3, ...res.step3 })
            const targetStep = Math.min(res.current_step + 1, 3) as 1 | 2 | 3
            goToStep(targetStep)
        } catch {
            // Fallback: tetap di step 1
        }
    }

    const handleStartNew = async () => {
        setResumeDraft(null)
        clearWizardStorage()
        setStep2(defaultStep2)
        setStep3(defaultStep3)
        setDraftId('')

        try {
            const { data: res } = await axios.post('/daftar/step1', {
                draft_id:       null,
                full_name:      step1.full_name,
                nisn:           step1.nisn,
                nik:            step1.nik,
                gender:         step1.gender,
                place_of_birth: step1.place_of_birth,
                date_of_birth:  step1.date_of_birth,
                force_new:      true,
            })
            setDraftId(String(res.draft_id))
            saveDraftId(String(res.draft_id))
            goToStep(2)
        } catch {
            // Error ditampilkan WizardStep1
        }
    }

    const handleModalClose = () => setResumeDraft(null)

    // ── Draft tidak valid saat step 3 mount → clear + reset ke step 1 ─────────
    const handleInvalidDraft = () => {
        clearWizardStorage()
        setStep1(defaultStep1)
        setStep2(defaultStep2)
        setStep3(defaultStep3)
        setDraftId('')
        setCurrentStep(1)
    }

    const mobileTab = (step: number) =>
        currentStep === step
            ? 'text-gold font-bold border-b-2 border-gold pb-1 transition-all duration-300'
            : 'text-slate-400 pb-1 transition-all duration-300'

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <Head title="Formulir Pendaftaran" />

            {resumeDraft && (
                <ResumeModal
                    status={resumeDraft.status}
                    data={resumeDraft.data}
                    onResume={handleResume}
                    onStartNew={handleStartNew}
                    onClose={handleModalClose}
                />
            )}

            <div className="min-h-screen w-full bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-start sm:items-center justify-center py-0 sm:py-6 px-0 sm:px-4 md:px-8">
                <div className="wizard-card opacity-0 relative w-full sm:max-w-7xl sm:rounded-3xl overflow-hidden shadow-[0_22px_45px_rgba(15,23,42,0.45)] bg-slate-900/80 border-0 sm:border border-white/5 min-h-screen sm:min-h-0">

                    <div className="pointer-events-none absolute -top-24 -right-16 w-48 sm:w-72 h-48 sm:h-72 bg-gradient-to-br from-amber-400/50 via-rose-400/40 to-sky-500/40 rounded-full blur-3xl opacity-70"
                        style={{ animation: 'glow-move 14s ease-in-out infinite alternate' }} />
                    <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 sm:w-80 h-56 sm:h-80 bg-gradient-to-tr from-emerald-400/35 via-cyan-400/35 to-amber-300/35 rounded-full blur-3xl opacity-70"
                        style={{ animation: 'glow-move 14s ease-in-out infinite alternate' }} />

                    <div className="relative flex flex-col md:grid md:grid-cols-[260px,1fr] lg:grid-cols-[300px,1fr]">

                        <WizardSidebar
                            currentStep={currentStep}
                            academicYear={activeWave?.academic_year}
                            batchName={activeWave?.title}
                        />

                        <div className="flex-1 bg-slate-50/95 flex flex-col min-h-0">

                            <div className="border-b border-slate-200 px-4 sm:px-8 py-2.5 bg-white/80 backdrop-blur sticky top-0 z-10">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <div className="flex gap-3 sm:gap-5">
                                        <span className={mobileTab(1)}>1. Identitas</span>
                                        <span className={mobileTab(2)}>2. Kontak</span>
                                        <span className={mobileTab(3)}>3. Review</span>
                                    </div>
                                    {activeWave && (
                                        <div className="hidden sm:block text-[11px] text-slate-400">
                                            <span className="font-bold text-slate-600">{activeWave.title}</span>
                                            <span className="ml-1">· {activeWave.academic_year}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {flash?.error && (
                                <div className="mx-4 sm:mx-8 mt-4 bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-r-xl text-sm text-red-800 flex gap-3">
                                    <i className="fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0"></i>
                                    <div>
                                        <div className="font-semibold mb-0.5">Terjadi Kesalahan</div>
                                        <p>{flash.error}</p>
                                    </div>
                                </div>
                            )}

                            <div ref={contentRef} className="flex-1 p-4 sm:p-8 md:p-10 overflow-y-auto">
                                <div className="step-content max-w-2xl mx-auto md:max-w-none">

                                    {/* Loading state saat cek draft ke DB */}
                                    {!ready ? (
                                        <div className="flex items-center justify-center py-24">
                                            <div className="flex items-center gap-3 text-slate-400">
                                                <i className="fa-solid fa-spinner fa-spin text-gold text-xl"></i>
                                                <span className="text-sm">Memuat data...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {currentStep === 1 && (
                                                <WizardStep1
                                                    data={step1}
                                                    onChange={setStep1}
                                                    onNext={handleStep1Next}
                                                    onDuplicateFound={handleDuplicateFound}
                                                    currentDraftId={draftId}
                                                />
                                            )}
                                            {currentStep === 2 && (
                                                <WizardStep2
                                                    data={step2}
                                                    draftId={draftId}
                                                    candidateName={step1.full_name}
                                                    onChange={setStep2}
                                                    onNext={() => goToStep(3)}
                                                    onBack={() => goToStep(1)}
                                                />
                                            )}
                                            {currentStep === 3 && (
                                                <WizardStep3
                                                    step1={step1}
                                                    step2={step2}
                                                    data={step3}
                                                    draftId={draftId}
                                                    onChange={setStep3}
                                                    onBack={() => goToStep(2)}
                                                    onGoToStep1={() => goToStep(1)}
                                                    onInvalidDraft={handleInvalidDraft}
                                                />
                                            )}
                                        </>
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