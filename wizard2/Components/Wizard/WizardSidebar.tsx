import { useEffect } from 'react'
import { Link } from '@inertiajs/react'
import { animate, stagger } from 'animejs'

interface WizardSidebarProps {
    currentStep: 1 | 2 | 3
    academicYear?: string
    batchName?: string
}

const steps = [
    { number: 1, label: 'Langkah 1', title: 'Identitas Siswa', desc: 'Data diri utama calon siswa.' },
    { number: 2, label: 'Langkah 2', title: 'Kontak & Alamat', desc: 'Domisili dan kontak orang tua.' },
    { number: 3, label: 'Langkah 3', title: 'Review & Akun', desc: 'Cek kembali data sebelum final.' },
]

export default function WizardSidebar({ currentStep, academicYear, batchName }: WizardSidebarProps) {
    useEffect(() => {
        animate('.sidebar-item', {
            opacity: [0, 1],
            translateX: [-20, 0],
            duration: 600,
            delay: stagger(120, { start: 300 }),
            ease: 'outExpo',
        })
    }, [])

    // Animate step indicator when step changes
    useEffect(() => {
        animate('.step-indicator', {
            scale: [0.8, 1],
            duration: 400,
            ease: 'outBack',
        })
    }, [currentStep])

    return (
        <aside className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-5 sm:px-8 py-6 sm:py-8 flex flex-col border-r border-white/5">
            {/* Back link */}
            <Link href="/" className="sidebar-item opacity-0 inline-flex items-center gap-2 text-xs font-semibold text-amber-200/80 hover:text-amber-300 transition w-fit">
                <i className="fa-solid fa-arrow-left text-[11px]"></i>
                <span>Kembali ke Home</span>
            </Link>

            {/* Title */}
            <div className="sidebar-item opacity-0 mt-6 sm:mt-8">
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Formulir Online</p>
                <h1 className="text-2xl sm:text-4xl font-display font-bold leading-tight mt-2">
                    Formulir<br />
                    <span className="text-gold">Pendaftaran</span>
                </h1>
                <p className="text-xs text-slate-400 mt-2 sm:mt-3">
                    Tahun Ajaran{' '}
                    <span className="font-semibold text-amber-200">{academicYear ?? 'Terbaru'}</span>
                </p>
            </div>

            {/* Stepper — hidden on very small, visible md+ */}
            <div className="hidden sm:block space-y-5 mt-8 sm:mt-10">
                {steps.map((step, i) => {
                    const done   = currentStep > step.number
                    const active = currentStep === step.number
                    return (
                        <div key={step.number} className="sidebar-item opacity-0 flex items-start gap-3 sm:gap-4">
                            <div className="relative flex-shrink-0">
                                <div className={`step-indicator w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                                    done   ? 'bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-400/40'
                                    : active ? 'bg-gold text-slate-900 shadow-lg shadow-amber-400/40'
                                    : 'bg-slate-800 text-slate-500'
                                }`}>
                                    {done ? <i className="fa-solid fa-check text-[10px]"></i> : step.number}
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`absolute top-7 sm:top-8 left-1/2 -translate-x-1/2 w-px h-10 sm:h-12 transition-all duration-500 ${
                                        currentStep > step.number ? 'bg-gold' : 'bg-slate-700'
                                    }`} />
                                )}
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase tracking-[0.18em] transition-colors duration-300 ${active || done ? 'text-amber-300' : 'text-slate-500'}`}>
                                    {step.label}
                                </p>
                                <p className={`text-xs sm:text-sm font-semibold transition-colors duration-300 ${active || done ? 'text-white' : 'text-slate-400'}`}>
                                    {step.title}
                                </p>
                                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">{step.desc}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="sidebar-item opacity-0 mt-auto pt-6 text-[10px] text-slate-500">
                &copy; {new Date().getFullYear()} Sentinel Admission System.
            </div>
        </aside>
    )
}
