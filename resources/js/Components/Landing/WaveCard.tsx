// resources/js/Components/Landing/WaveCard.tsx
import React, { useEffect, useState } from 'react'
import { Link } from '@inertiajs/react'
import { AdmissionWaveData, formatRupiah, remainingQuota } from '@/types/landing'

declare global {
    interface Window {
        Echo: any;
    }
}

interface WaveCardProps {
    activeWave: AdmissionWaveData | null
    onOpenSchedule: () => void
}

const WaveCard = ({ activeWave: initialWave, onOpenSchedule }: WaveCardProps) => {
    const [wave, setWave] = useState<AdmissionWaveData | null>(initialWave)
    const [isPulsing, setIsPulsing] = useState(false)

    useEffect(() => {
        setWave(initialWave)
    }, [initialWave])

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Echo) {
            const channel = window.Echo.channel('public-waves')

            channel.listen('.wave.updated', (e: { wave: AdmissionWaveData }) => {
                setWave(e.wave)
                setIsPulsing(true)
                // Pulse transisi yang lebih elegan, tidak terlalu menguning
                const timer = setTimeout(() => setIsPulsing(false), 800)
                return () => clearTimeout(timer)
            })

            return () => {
                channel.stopListening('.wave.updated')
                window.Echo.leaveChannel('public-waves')
            }
        }
    },[])

    if (!wave) {
        return (
            <div className="w-full max-w-[380px] mx-auto lg:ml-auto lg:mr-0 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-slate-400 border border-white/10 shadow-inner">
                    <i className="fa-solid fa-lock text-lg"></i>
                </div>
                <h3 className="text-base font-bold text-white mt-1">Pendaftaran Ditutup</h3>
                <p className="text-slate-400 text-xs">Nantikan informasi gelombang berikutnya.</p>
            </div>
        )
    }

    const target = wave.quota_target || 0
    const count = wave.candidates_count || 0
    const isFull = target > 0 && count >= target
    const filledPercentage = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0
    const remaining = remainingQuota(target, count)

    return (
        <div className="relative w-full max-w-[380px] mx-auto lg:ml-auto lg:mr-0 group mt-10 lg:mt-0 perspective-1000">
            {/* Ambient Pulse (Diturunkan intensitas warna emasnya agar tidak terkesan kotor) */}
            <div
                className={`absolute -inset-1 rounded-[2.2rem] blur-2xl transition-all duration-700 pointer-events-none z-0
                ${isPulsing ? 'bg-white/20 opacity-100 scale-105' : 'bg-gradient-to-r from-white/5 to-slate-500/10 opacity-0 group-hover:opacity-100'}`}
            />

            {/* Compact Glassmorphism Card */}
            <div
                className={`relative z-10 backdrop-blur-[24px] p-6 sm:p-7 rounded-[2rem] shadow-2xl flex flex-col gap-6 transition-all duration-500 ease-out border
                ${isPulsing ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
            >
                {/* HEADER */}
                <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 text-slate-200 rounded border border-white/10 shadow-sm">
                            <i className="fa-solid fa-graduation-cap text-[10px] text-gold"></i>
                            <span className="text-[10px] font-bold tracking-widest uppercase">
                                TP {wave.academic_year}
                            </span>
                        </div>
                        <h2 className="text-2xl font-display font-extrabold text-white tracking-tight leading-none">
                            {wave.title}
                        </h2>
                    </div>

                    {/* Live Badge */}
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1.5 border backdrop-blur-md transition-colors duration-300 ${isFull ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                        {!isFull && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />}
                        {isFull ? 'PENUH' : 'LIVE'}
                    </div>
                </div>

                {/* BODY: Stats Grid */}
                <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex flex-col">
                        <span className="text-[11px] text-slate-400 font-medium mb-1 uppercase tracking-wide">Biaya Pendaftaran:</span>
                        <span className="text-sm font-bold text-slate-100 tracking-tight">
                            {formatRupiah(wave.registration_fee)}
                        </span>
                    </div>
                    <div className="flex flex-col border-l border-white/10 pl-4">
                        <span className="text-[11px] text-slate-400 font-medium mb-1 uppercase tracking-wide">Kuota Tersisa</span>
                        <div className={`flex items-baseline gap-1 transition-transform duration-300 ${isPulsing ? 'scale-110 origin-left text-gold' : 'text-white'}`}>
                            <span className="text-xl font-black leading-none">{remaining}</span>
                            <span className="text-[10px] font-medium text-slate-400">Kursi</span>
                        </div>
                    </div>
                </div>

                {/* Progress Line */}
                {!isFull && (
                    <div className="w-full space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] text-slate-400 font-medium tracking-wide">Kapasitas Terisi</span>
                            <span className="text-[11px] font-bold text-slate-200">{filledPercentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-gold to-yellow-400 rounded-full transition-all duration-1000 ease-out relative"
                                style={{ width: `${filledPercentage}%` }}
                            >
                                <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/40 blur-[2px] animate-pulse" />
                            </div>
                        </div>
                    </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="flex gap-3 pt-1">
                    <Link
                        href="/daftar"
                        className="group/btn relative flex-1 flex items-center justify-center gap-2 py-3 bg-gold text-slate-900 text-sm font-bold rounded-xl overflow-hidden shadow-md hover:shadow-gold/30 hover:-translate-y-0.5 transition-all duration-300"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                        <span className="relative z-10 flex items-center gap-1.5">
                            Isi Formulir
                            <i className="fa-solid fa-arrow-right text-[11px] group-hover/btn:translate-x-1 transition-transform"></i>
                        </span>
                    </Link>

                    <button
                        onClick={onOpenSchedule}
                        className="px-4 py-3 flex items-center justify-center text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300"
                        aria-label="Lihat Jadwal"
                    >
                        <i className="fa-regular fa-calendar-alt text-sm"></i>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default React.memo(WaveCard)