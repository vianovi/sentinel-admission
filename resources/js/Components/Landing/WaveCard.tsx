import { useState } from 'react'
import { Link } from '@inertiajs/react'
import { AdmissionWaveData, formatRupiah, remainingQuota } from '@/types/landing'
import ScheduleModal from './ScheduleModal'

interface WaveCardProps {
    activeWave: AdmissionWaveData | null
}

export default function WaveCard({ activeWave }: WaveCardProps) {
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false)

    return (
        <>
            <div className="relative w-full max-w-sm ml-auto mr-0 md:mr-8 group mt-8 lg:mt-0">
                <div className="absolute -inset-2 bg-gradient-to-r from-gold/40 to-blue-600/40 rounded-3xl blur-2xl opacity-40 group-hover:opacity-70 transition duration-500" />
                <div className="relative bg-white/70 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />

                    {activeWave ? (
                        <>
                            <div className="relative z-10 flex justify-between items-start mb-5 pb-4 border-b border-navy/10">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 bg-navy/10 px-2.5 py-1 rounded-full mb-2 border border-white/20">
                                        <i className="fa-solid fa-graduation-cap text-navy text-[10px]"></i>
                                        <span className="text-[10px] font-bold text-navy tracking-wide">
                                            TP {activeWave.academic_year}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-display font-bold text-navy leading-tight">
                                        {activeWave.title}
                                    </h2>
                                </div>
                                <div className="bg-green-500/10 border border-green-500/20 text-green-800 font-bold px-3 py-1 rounded-full text-[10px] flex items-center gap-1.5">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600" />
                                    </span>
                                    BUKA
                                </div>
                            </div>

                            <div className="relative z-10 grid grid-cols-2 gap-3 mb-5">
                                <div className="bg-white/50 p-3 rounded-xl border border-white/60 shadow-sm hover:bg-white/80 transition">
                                    <span className="text-[10px] text-gray-500 font-medium block mb-1">Biaya Masuk</span>
                                    <span className="text-sm font-bold text-navy block tracking-tight">
                                        {formatRupiah(activeWave.registration_fee)}
                                    </span>
                                </div>
                                <div className="bg-white/50 p-3 rounded-xl border border-white/60 shadow-sm hover:bg-white/80 transition">
                                    <span className="text-[10px] text-gray-500 font-medium block mb-1">Sisa Kuota</span>
                                    <span className="text-sm font-bold text-navy block">
                                        {remainingQuota(activeWave.quota_target, activeWave.candidates_count).toLocaleString('id-ID')}
                                        <span className="text-[10px] font-normal text-gray-500"> Kursi</span>
                                    </span>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-2">
                                <Link
                                    href="/daftar"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-gold to-yellow-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-gold/30 hover:shadow-gold/50 hover:-translate-y-0.5 transition transform"
                                >
                                    <span>Isi Formulir</span>
                                    <i className="fa-solid fa-arrow-right text-xs"></i>
                                </Link>
                                <button
                                    onClick={() => setScheduleModalOpen(true)}
                                    aria-label="Lihat rincian jadwal pendaftaran"
                                    className="w-full py-2.5 text-xs font-semibold text-navy/70 hover:text-navy hover:bg-white/50 rounded-xl transition border border-transparent hover:border-white/50"
                                >
                                    <i className="fa-regular fa-calendar-alt mr-1.5"></i>
                                    Lihat Rincian Jadwal
                                </button>
                            </div>

                            <p className="relative z-10 text-center text-[10px] text-gray-400 mt-3">
                                *Segera amankan posisi Anda sebelum kuota penuh.
                            </p>
                        </>
                    ) : (
                        <div className="relative z-10 text-center py-8">
                            <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 text-lg shadow-sm border border-white/50">
                                <i className="fa-solid fa-store-slash"></i>
                            </div>
                            <h3 className="text-lg font-bold text-navy">Pendaftaran Ditutup</h3>
                            <p className="text-gray-500 text-xs mt-1">Nantikan informasi gelombang berikutnya.</p>
                        </div>
                    )}
                </div>
            </div>

            {activeWave && (
                <ScheduleModal
                    isOpen={scheduleModalOpen}
                    onClose={() => setScheduleModalOpen(false)}
                    activeWave={activeWave}
                />
            )}
        </>
    )
}
