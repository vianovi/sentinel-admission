// resources/js/Components/Landing/WaveCard.tsx
import React, { useEffect, useState } from 'react'
import { Link } from '@inertiajs/react'
import { AdmissionWaveData, formatRupiah, remainingQuota } from '@/types/landing'

declare global {
    interface PublicWaveChannel {
        listen(event: string, callback: (payload: { wave: AdmissionWaveData }) => void): PublicWaveChannel
        stopListening(event: string): void
    }

    interface PublicWaveEcho {
        channel(name: string): PublicWaveChannel
        leaveChannel(name: string): void
    }

    interface Window {
        Echo?: PublicWaveEcho;
    }
}

interface WaveCardProps {
    activeWave: AdmissionWaveData | null
    onOpenSchedule: () => void
}

type IdleCapableWindow = Window & typeof globalThis & {
    requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
    cancelIdleCallback?: (handle: number) => void
}

const WaveCard = ({ activeWave: initialWave, onOpenSchedule }: WaveCardProps) => {
    const [wave, setWave] = useState<AdmissionWaveData | null>(initialWave)
    const [isPulsing, setIsPulsing] = useState(false)

    useEffect(() => {
        setWave(initialWave)
    }, [initialWave])

    useEffect(() => {
        let idleId: number | undefined
        let fallbackTimer: number | undefined
        let pulseTimer: number | undefined
        let cleanupChannel: (() => void) | undefined
        const idleWindow = window as IdleCapableWindow

        const subscribeToWaveUpdates = () => {
            if (typeof window === 'undefined' || !window.Echo) return

            const channel = window.Echo.channel('public-waves')

            channel.listen('.wave.updated', (e: { wave: AdmissionWaveData }) => {
                setWave(e.wave)
                setIsPulsing(true)
                if (pulseTimer) window.clearTimeout(pulseTimer)
                pulseTimer = window.setTimeout(() => setIsPulsing(false), 800)
            })

            cleanupChannel = () => {
                channel.stopListening('.wave.updated')
                window.Echo?.leaveChannel('public-waves')
            }
        }

        if (idleWindow.requestIdleCallback) {
            idleId = idleWindow.requestIdleCallback(subscribeToWaveUpdates, { timeout: 2200 })
        } else {
            fallbackTimer = window.setTimeout(subscribeToWaveUpdates, 1200)
        }

        return () => {
            if (idleId !== undefined && idleWindow.cancelIdleCallback) {
                idleWindow.cancelIdleCallback(idleId)
            }
            if (fallbackTimer !== undefined) {
                window.clearTimeout(fallbackTimer)
            }
            if (pulseTimer !== undefined) {
                window.clearTimeout(pulseTimer)
            }
            cleanupChannel?.()
        }
    }, [])

    if (!wave) {
        return (
            <div className="w-full max-w-[540px] mx-auto lg:ml-auto lg:mr-0 bg-white/5 backdrop-blur-md sm:backdrop-blur-xl border border-white/10 p-10 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center gap-4">
                <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-slate-400 border border-white/10 shadow-inner">
                    <i className="fa-solid fa-lock text-xl"></i>
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Pendaftaran Ditutup</h3>
                    <p className="text-slate-400 text-sm">Nantikan informasi pembukaan gelombang berikutnya.</p>
                </div>
            </div>
        )
    }

    const target = wave.quota_target || 0
    const count = wave.candidates_count || 0
    const isFull = target > 0 && count >= target
    const filledPercentage = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0
    const remaining = remainingQuota(target, count)

    return (
        <div className="relative w-full max-w-[540px] mx-auto lg:ml-auto lg:mr-0 group mt-10 lg:mt-0 perspective-1000">
            {/* Ambient Pulse Glow */}
            <div
                className={`absolute -inset-1 hidden rounded-[2.2rem] blur-2xl transition-all duration-700 pointer-events-none z-0 md:block
                ${isPulsing ? 'bg-white/15 opacity-100 scale-102' : 'bg-gradient-to-r from-white/5 to-slate-500/5 opacity-0 group-hover:opacity-100'}`}
            />

            {/* Glassmorphism Card (Wider Layout) */}
            <div
                className={`relative z-10 backdrop-blur-md sm:backdrop-blur-[24px] p-6 sm:p-8 rounded-[2rem] shadow-2xl flex flex-col gap-6 transition-all duration-500 ease-out border
                ${isPulsing ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
            >
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-slate-200 rounded-md border border-white/10 shadow-sm">
                            <i className="fa-solid fa-graduation-cap text-[11px] text-gold"></i>
                            <span className="text-[10px] font-bold tracking-widest uppercase">
                                Tahun Pelajaran {wave.academic_year}
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight leading-tight">
                            {wave.title}
                        </h2>
                    </div>

                    {/* Status Badge */}
                    <div className={`self-start px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-2 border backdrop-blur-md transition-colors duration-300 ${isFull ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                        {!isFull && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />}
                        {isFull ? 'KUOTA PENUH' : 'PENDAFTARAN AKTIF'}
                    </div>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex flex-col justify-center py-1">
                        <span className="text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Biaya Registrasi</span>
                        <span className="text-xl font-bold text-slate-100 tracking-tight">
                            {formatRupiah(wave.registration_fee)}
                        </span>
                    </div>
                    <div className="flex flex-col justify-center py-1 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-5">
                        <span className="text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Sisa Kuota</span>
                        <div className={`flex items-baseline gap-1.5 transition-transform duration-300 ${isPulsing ? 'scale-105 origin-left text-gold' : 'text-white'}`}>
                            <span className="text-2xl font-black leading-none">{remaining}</span>
                            <span className="text-xs font-medium text-slate-400">Kursi Tersedia</span>
                        </div>
                    </div>
                </div>

                {/* CAPACITY PROGRESS LINE */}
                {!isFull && (
                    <div className="w-full space-y-2.5">
                        <div className="flex justify-between items-end">
                            <span className="text-xs text-slate-400 font-medium tracking-wide">Persentase Keterisian</span>
                            <span className="text-xs font-bold text-slate-200">{filledPercentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900/65 rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-gold to-yellow-400 rounded-full transition-all duration-1000 ease-out relative"
                                style={{ width: `${filledPercentage}%` }}
                            >
                                <div className="absolute top-0 right-0 bottom-0 hidden w-8 bg-white/20 blur-[2px] animate-pulse sm:block" />
                            </div>
                        </div>
                    </div>
                )}

                {/* FOOTER ACTIONS (Wider & Balanced Buttons) */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                        href="/daftar"
                        className="group/btn relative flex-1 flex items-center justify-center gap-2 py-3.5 bg-gold text-slate-900 text-sm font-bold rounded-xl overflow-hidden shadow-lg shadow-gold/10 hover:shadow-gold/25 hover:-translate-y-0.5 transition-all duration-300"
                    >
                        <div className="absolute inset-0 bg-white/15 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                        <span className="relative z-10 flex items-center gap-1.5">
                            Isi Formulir
                            <i className="fa-solid fa-arrow-right text-[11px] group-hover/btn:translate-x-1 transition-transform"></i>
                        </span>
                    </Link>

                    <button
                        onClick={onOpenSchedule}
                        className="group/schedule flex-1 py-3.5 flex items-center justify-center gap-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                        aria-label="Lihat Jadwal"
                    >
                        <i className="fa-regular fa-calendar-alt text-sm text-slate-400 group-hover/schedule:text-white transition-colors"></i>
                        <span className="text-sm font-bold">Jadwal</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default React.memo(WaveCard)
