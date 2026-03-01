import { useEffect, useRef, useState } from 'react'
import { Head } from '@inertiajs/react'
import { animate } from 'animejs'
import axios from 'axios'

import WizardSidebar      from '@/Components/Wizard/WizardSidebar'
import WizardProgressBar  from '@/Components/Wizard/WizardProgressBar'
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

    // Resume modal
    const [resumeDraft, setResumeDraft]   = useState<DuplicateInfo | null>(null)
    const pendingNisnNik = useRef<{ nisn: string; nik: string } | null>(null)

    const contentRef = useRef<HTMLDivElement>(null)

    // ── Restore dari localStorage saat pertama mount ──────────────────────────
    useEffect(() => {
        const stored = readWizardStorage()

        if (stored.step1) setStep1({ ...defaultStep1, ...stored.step1 })
        if (stored.step2) setStep2({ ...defaultStep2, ...stored.step2 })
        if (stored.step3) setStep3({ ...defaultStep3, ...stored.step3 })
        if (stored.draftId) setDraftId(stored.draftId)

        // Kalau ada progress di localStorage, mulai dari step terakhir
        if (stored.lastStep && stored.lastStep > 1 && stored.draftId) {
            setCurrentStep(stored.lastStep)
        }

        // Entrance animation card
        animate('.wizard-card', {
            opacity: [0, 1],
            translateY: [28, 0],
            duration: 900,
            ease: 'outExpo',
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Simpan lastStep ke localStorage setiap kali step berubah ─────────────
    useEffect(() => {
        saveLastStep(currentStep)
    }, [currentStep])

    // ── Animasi transisi antar step ───────────────────────────────────────────
    const animateStepTransition = (nextStep: 1 | 2 | 3, onSwitch: () => void) => {
        const direction = nextStep > currentStep ? -20 : 20
        animate('.step-content', {
            opacity: [1, 0],
            translateX: [0, direction],
            duration: 200,
            ease: 'inQuad',
            onComplete: () => {
                onSwitch()
                // Scroll ke atas saat ganti step
                contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                // Fade in konten baru
                setTimeout(() => {
                    animate('.step-content', {
                        opacity: [0, 1],
                        translateX: [-direction, 0],
                        duration: 400,
                        ease: 'outExpo',
                    })
                }, 30)
            },
        })
    }

    const goToStep = (step: 1 | 2 | 3) => {
        animateStepTransition(step, () => setCurrentStep(step))
    }

    // ── Handler dari WizardStep1 ──────────────────────────────────────────────
    // Dipanggil setelah step1 POST ke server berhasil → dapat draft_id
    const handleStep1Next = (newDraftId: string) => {
        setDraftId(newDraftId)
        saveDraftId(newDraftId)
        goToStep(2)
    }

    // Dipanggil saat server detect NISN/NIK sudah ada → tampilkan modal
    const handleDuplicateFound = (
        status: 'draft' | 'registered',
        data: DuplicateInfo['data']
    ) => {
        pendingNisnNik.current = { nisn: step1.nisn, nik: step1.nik }
        setResumeDraft({ status, data })
    }

    // ── Handler Resume Modal ──────────────────────────────────────────────────

    // User pilih "Lanjutkan" → load data draft lama dari server
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

    // User pilih "Mulai Baru" → reset semua state + delete draft lama + insert baru
    const handleStartNew = async () => {
        setResumeDraft(null)
        clearWizardStorage()

        // Reset semua React state ke default
        setStep2(defaultStep2)
        setStep3(defaultStep3)
        setDraftId('')

        try {
            const { data: res } = await axios.post('/daftar/step1', {
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
            // Error akan ditampilkan oleh WizardStep1
        }
    }

    // User tutup modal tanpa aksi (saat status = registered)
    const handleModalClose = () => setResumeDraft(null)

    // ── Mobile stepper tab style ──────────────────────────────────────────────
    const mobileTab = (step: number) =>
        currentStep === step
            ? 'text-gold font-bold border-b-2 border-gold pb-1 transition-all duration-300'
            : 'text-slate-400 pb-1 transition-all duration-300'

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <Head title="Formulir Pendaftaran" />

            {/* Progress bar — fixed top */}
            <WizardProgressBar currentStep={currentStep} />

            {/* Resume modal — portal-style overlay */}
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

                    {/* Glow effects */}
                    <div
                        className="pointer-events-none absolute -top-24 -right-16 w-48 sm:w-72 h-48 sm:h-72 bg-gradient-to-br from-amber-400/50 via-rose-400/40 to-sky-500/40 rounded-full blur-3xl opacity-70"
                        style={{ animation: 'glow-move 14s ease-in-out infinite alternate' }}
                    />
                    <div
                        className="pointer-events-none absolute -bottom-24 -left-16 w-56 sm:w-80 h-56 sm:h-80 bg-gradient-to-tr from-emerald-400/35 via-cyan-400/35 to-amber-300/35 rounded-full blur-3xl opacity-70"
                        style={{ animation: 'glow-move 14s ease-in-out infinite alternate' }}
                    />

                    {/* Layout: stack mobile, side-by-side md+ */}
                    <div className="relative flex flex-col md:grid md:grid-cols-[260px,1fr] lg:grid-cols-[300px,1fr]">

                        {/* Sidebar */}
                        <WizardSidebar
                            currentStep={currentStep}
                            academicYear={activeWave?.academic_year}
                            batchName={activeWave?.title}
                        />

                        {/* Content area */}
                        <div className="flex-1 bg-slate-50/95 flex flex-col min-h-0">

                            {/* Mobile stepper tabs */}
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

                            {/* Flash error dari server */}
                            {flash?.error && (
                                <div className="mx-4 sm:mx-8 mt-4 bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-r-xl text-sm text-red-800 flex gap-3">
                                    <i className="fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0"></i>
                                    <div>
                                        <div className="font-semibold mb-0.5">Terjadi Kesalahan</div>
                                        <p>{flash.error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Form steps */}
                            <div
                                ref={contentRef}
                                className="flex-1 p-4 sm:p-8 md:p-10 overflow-y-auto"
                            >
                                <div className="step-content max-w-2xl mx-auto md:max-w-none">
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
                                        />
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
