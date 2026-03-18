import { useEffect } from 'react'
import { animate } from 'animejs'
import { AdmissionWaveData, formatDate } from '@/types/landing'

interface ScheduleModalProps {
    isOpen: boolean
    onClose: () => void
    activeWave: AdmissionWaveData
}

export default function ScheduleModal({ isOpen, onClose, activeWave }: ScheduleModalProps) {

    // ── Scroll lock + animasi saat modal buka/tutup ───────────────────────────
    useEffect(() => {
        if (isOpen) {
            // Lock scroll
            document.body.style.overflow = 'hidden'

            // Animasi backdrop + card masuk
            setTimeout(() => {
                animate('.schedule-backdrop', {
                    opacity: [0, 1],
                    duration: 250,
                    ease: 'outQuad',
                })
                animate('.schedule-card', {
                    opacity:      [0, 1],
                    translateY:   [32, 0],
                    scale:        [0.96, 1],
                    duration:     380,
                    ease:         'outExpo',
                })
            }, 10)
        } else {
            document.body.style.overflow = ''
        }

        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    if (!isOpen) return null

    const handleClose = () => {
        // Animasi keluar sebelum close
        animate('.schedule-card', {
            opacity:    [1, 0],
            translateY: [0, 24],
            scale:      [1, 0.96],
            duration:   220,
            ease:       'inQuad',
        })
        animate('.schedule-backdrop', {
            opacity:  [1, 0],
            duration: 220,
            ease:     'inQuad',
        })
        setTimeout(onClose, 220)
    }

    // Tutup saat tekan Escape
    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') handleClose()
    }

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center px-4"
            onKeyDown={handleKey}
            tabIndex={-1}
        >
            {/* Backdrop */}
            <div
                className="schedule-backdrop opacity-0 absolute inset-0 bg-navy/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal Card */}
            <div className="schedule-card opacity-0 bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">

                {/* Header */}
                <div className="bg-navy p-5 flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-bold text-lg font-display">Timeline Pendaftaran</h3>
                        <p className="text-gray-400 text-xs mt-1">Detail kegiatan {activeWave.title}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        aria-label="Tutup modal jadwal"
                        className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition"
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                {/* Timeline */}
                <div className="p-6 max-h-[65vh] overflow-y-auto">
                    <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">

                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-gold border-4 border-white shadow-sm" />
                            <h4 className="text-sm font-bold text-navy">Periode Pendaftaran</h4>
                            <p className="text-xs text-gray-500 mt-1 mb-2">Pengisian formulir online &amp; pembayaran.</p>
                            <div className="inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded font-medium border border-green-100">
                                {formatDate(activeWave.start_date)} s/d {formatDate(activeWave.end_date)}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-gray-300 border-4 border-white" />
                            <h4 className="text-sm font-bold text-navy">Tes Seleksi Masuk</h4>
                            <p className="text-xs text-gray-500 mt-1 mb-2">Tes akademik &amp; wawancara.</p>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <i className="fa-regular fa-calendar"></i>
                                <span>{activeWave.exam_info ?? 'Menunggu Jadwal'}</span>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-gray-300 border-4 border-white" />
                            <h4 className="text-sm font-bold text-navy">Pengumuman Hasil</h4>
                            <p className="text-xs text-gray-500 mt-1 mb-2">Diumumkan via Website &amp; WhatsApp.</p>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <i className="fa-solid fa-bullhorn"></i>
                                <span className="font-medium text-navy">
                                    {activeWave.announcement_info ?? 'Akan Dikonfirmasi'}
                                </span>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-gray-300 border-4 border-white" />
                            <h4 className="text-sm font-bold text-navy">Daftar Ulang</h4>
                            <p className="text-xs text-gray-500 mt-1 mb-2">Pelunasan biaya masuk &amp; administrasi lanjutan.</p>
                            <div className="text-xs text-navy font-medium flex items-center gap-2">
                                <i className="fa-solid fa-clipboard-check text-gold"></i>
                                {activeWave.reregistration_date
                                    ? `Mulai ${formatDate(activeWave.reregistration_date)}`
                                    : 'Jadwal Menyusul'}
                            </div>
                            <p className="text-[10px] text-red-500 mt-1 italic">*Wajib lapor diri untuk mengunci posisi.</p>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
                    <button
                        onClick={handleClose}
                        aria-label="Tutup jendela jadwal"
                        className="text-xs text-gray-500 hover:text-navy underline transition"
                    >
                        Tutup Jendela
                    </button>
                </div>
            </div>
        </div>
    )
}