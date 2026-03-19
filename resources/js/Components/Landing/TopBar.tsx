import { AdmissionWaveData, formatDate, remainingQuota } from '@/types/landing'

interface TopBarProps {
    activeWave: AdmissionWaveData | null
}

export default function TopBar({ activeWave }: TopBarProps) {

    // ── Susun teks running dari data activeWave ───────────────────────────────
    const buildTickerItems = (): string[] => {
        if (!activeWave) {
            return [
                '🏫 Selamat datang di Al-Muntaha School',
                '📢 Informasi pendaftaran akan segera dibuka',
                '✉️ Hubungi kami di admin@almuntaha.sch.id',
            ]
        }

        const sisa = remainingQuota(activeWave.quota_target, activeWave.candidates_count)
        const items = [
            `🎓 Pendaftaran ${activeWave.title} · Tahun Ajaran ${activeWave.academic_year} Kini Dibuka!`,
            `📅 Periode: ${formatDate(activeWave.start_date)} s/d ${formatDate(activeWave.end_date)}`,
            `🪑 Sisa Kuota: ${sisa.toLocaleString('id-ID')} Kursi Tersedia — Segera Amankan Posisimu!`,
        ]

        if (activeWave.exam_info) {
            items.push(`📝 Tes Seleksi: ${activeWave.exam_info}`)
        }
        if (activeWave.announcement_info) {
            items.push(`📣 Pengumuman: ${activeWave.announcement_info}`)
        }

        items.push('🌟 Daftar Sekarang di Al-Muntaha School — Menuju Puncak Ilmu & Akhlak!')

        return items
    }

    // Menggunakan pemisah yang jelas antar kalimat
    const tickerText = buildTickerItems().join('   ✦   ')

    return (
        <div className="bg-navy text-gray-300 text-xs py-2.5 border-b border-gray-800 hidden md:block overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-6">

                {/* ========================================================
                    KIRI — Kontak (Diperlebar & Anti Terpotong)
                    ======================================================== */}
                <div className="flex items-center gap-5 flex-shrink-0 border-r border-gray-700 pr-5">
                    <span className="flex items-center gap-2 cursor-default whitespace-nowrap">
                        <i className="fa-solid fa-phone text-gold text-xs"></i>
                        +62 821-0000-1234
                    </span>
                    {/* Penambahan Email Sesuai Request */}
                    <a href="mailto:admin@almuntaha.sch.id" className="flex items-center gap-2 whitespace-nowrap hover:text-white transition">
                        <i className="fa-solid fa-envelope text-gold text-xs"></i>
                        admin@almuntaha.sch.id
                    </a>
                </div>

                {/* ========================================================
                    TENGAH — Running Text (Otomatis Mengisi Sisa Ruang)
                    ======================================================== */}
                <div className="flex-1 min-w-0 overflow-hidden relative flex items-center">
                    {/* Efek Fade Gradasi Kiri & Kanan */}
                    <div className="absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-navy to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-navy to-transparent z-10 pointer-events-none" />

                    <div className="ticker-wrapper flex whitespace-nowrap w-full">
                        <span className="ticker-content text-gray-300 font-medium animate-ticker inline-block">
                            {/* Di-render 2x agar looping tidak putus */}
                            {tickerText}   ✦   {tickerText}
                        </span>
                    </div>
                </div>

                {/* ========================================================
                    KANAN — Sosmed (Anti Terpotong)
                    ======================================================== */}
                <div className="flex items-center gap-4 flex-shrink-0 border-l border-gray-700 pl-5">
                    <span className="font-medium text-gray-500 text-[11px] whitespace-nowrap">Ikuti Kami:</span>
                    <a href="#" aria-label="TikTok" className="text-sm hover:text-gold transition hover:-translate-y-0.5 transform"><i className="fa-brands fa-tiktok"></i></a>
                    <a href="#" aria-label="Instagram" className="text-sm hover:text-gold transition hover:-translate-y-0.5 transform"><i className="fa-brands fa-instagram"></i></a>
                    <a href="#" aria-label="YouTube" className="text-sm hover:text-gold transition hover:-translate-y-0.5 transform"><i className="fa-brands fa-youtube"></i></a>
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
                @keyframes ticker {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-ticker {
                    /* Tambah durasi agar tidak terlalu pusing bacanya */
                    animation: ticker 40s linear infinite;
                }
                .animate-ticker:hover {
                    animation-play-state: paused;
                }
                /* Sembunyikan scrollbar bawaan jika muncul */
                .ticker-wrapper::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    )
}