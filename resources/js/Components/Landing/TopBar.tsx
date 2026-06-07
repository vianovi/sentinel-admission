import { memo, useMemo, useEffect, useRef, useState } from 'react';

import { AdmissionWaveData, formatDate, remainingQuota } from '@/types/landing';

interface TopBarProps {
    activeWave: AdmissionWaveData | null;
}

interface SocialLink {
    ariaLabel: string;
    href: string;
    iconClassName: string;
    title: string;
}

// ── KONSTANTA INFORMASI ───────────────────────────────────────────────────────
const EMAIL_ADDRESS = 'admin@almuntaha.sch.id';
const PHONE_NUMBER = '+62 851-8500-1661';
const DISCORD_USERNAME = 'noviana0515';
const DISCORD_URL = 'https://discord.com/app';

// Kecepatan pixel per detik
const TICKER_SPEED_PX_PER_SECOND = 40;

const FALLBACK_TICKER_ITEMS = [
    'Selamat datang di portal penerimaan santri baru Al-Muntaha',
    'Informasi pendaftaran akan segera dibuka',
    'Hubungi layanan admin untuk konsultasi dan bantuan pendaftaran',
];

const SOCIAL_LINKS: SocialLink[] = [
    {
        ariaLabel: 'TikTok',
        href: 'https://www.tiktok.com/@sillvia_noviana27',
        iconClassName: 'fa-brands fa-tiktok',
        title: 'Kunjungi TikTok',
    },
    {
        ariaLabel: 'Discord',
        href: DISCORD_URL,
        iconClassName: 'fa-brands fa-discord',
        title: `Hubungi via Discord: ${DISCORD_USERNAME}`,
    },
    {
        ariaLabel: 'YouTube',
        href: 'https://youtube.com/@silvia_dewi3211',
        iconClassName: 'fa-brands fa-youtube',
        title: 'Kunjungi YouTube',
    },
];

// ── HELPER FUNCTIONS ──────────────────────────────────────────────────────────
function buildTickerItems(activeWave: AdmissionWaveData | null): string[] {
    if (!activeWave) return FALLBACK_TICKER_ITEMS;

    const remainingSeats = remainingQuota(
        activeWave.quota_target,
        activeWave.candidates_count,
    );

    const items = [
        `Pendaftaran ${activeWave.title} · Tahun Ajaran ${activeWave.academic_year} kini dibuka`,
        `Periode: ${formatDate(activeWave.start_date)} s/d ${formatDate(activeWave.end_date)}`,
        `Sisa kuota: ${remainingSeats.toLocaleString('id-ID')} kursi tersedia`,
    ];

    if (activeWave.exam_info) items.push(`Tes seleksi: ${activeWave.exam_info}`);
    // Info pengumuman
    if (activeWave.announcement_info) items.push(`Info: ${activeWave.announcement_info}`);

    items.push('Daftar sekarang dan amankan peluang terbaikmu');

    return items;
}

// Komponen pemisah estetik
const Divider = () => <span className="mx-3 text-white/10 select-none">|</span>;
// Margin (mx) dikurangi agar spasi tidak terlalu jauh/kepanjangan
const TickerDot = () => <span className="mx-3 text-gold/60 select-none text-[9px]">✦</span>;


// ── KOMPONEN UTAMA ────────────────────────────────────────────────────────────
function TopBar({ activeWave }: TopBarProps) {
    const tickerRef = useRef<HTMLDivElement>(null);
    const [animationDuration, setAnimationDuration] = useState<number>(30);

    const tickerTextArray = useMemo(() => buildTickerItems(activeWave), [activeWave]);

    useEffect(() => {
        if (tickerRef.current) {
            const contentWidth = tickerRef.current.scrollWidth / 2;
            const durationInSeconds = contentWidth / TICKER_SPEED_PX_PER_SECOND;
            setAnimationDuration(durationInSeconds);
        }
    }, [tickerTextArray]);

    return (
        <>
            <style>{`
                @keyframes smooth-marquee {
                    0% { transform: translate3d(0, 0, 0); }
                    100% { transform: translate3d(-50%, 0, 0); }
                }
                .animate-smooth-marquee {
                    animation: smooth-marquee var(--marquee-duration) linear infinite;
                    will-change: transform;
                }
                .animate-smooth-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>

            <div className="w-full border-b border-white/5 bg-navy py-2.5 font-sans text-xs text-gray-300">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:gap-6 lg:px-8">

                    {/* KIRI: Kontak (Email & Telepon) */}
                    <div className="hidden shrink-0 items-center border-r border-white/5 pr-4 md:flex">
                        <a
                            href={`mailto:${EMAIL_ADDRESS}`}
                            className="group flex items-center gap-2 transition-colors duration-300 hover:text-white"
                            aria-label={`Kirim email ke ${EMAIL_ADDRESS}`}
                        >
                            <i className="fa-solid fa-envelope text-[11px] text-gold transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
                            <span className="font-medium tracking-wide">{EMAIL_ADDRESS}</span>
                        </a>

                        <Divider />

                        <a
                            href={`tel:${PHONE_NUMBER.replace(/[^\d+]/g, '')}`}
                            className="group flex items-center gap-2 transition-colors duration-300 hover:text-white"
                            aria-label={`Hubungi ${PHONE_NUMBER}`}
                        >
                            <i className="fa-solid fa-phone text-[10px] text-gold transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
                            <span className="font-medium tracking-wide">{PHONE_NUMBER}</span>
                        </a>
                    </div>

                    {/* TENGAH: Infinite Running Text */}
                    <div className="relative flex min-w-0 flex-1 items-center overflow-hidden">
                        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-navy to-transparent md:w-16" />
                        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-navy to-transparent md:w-16" />

                        <div className="w-full overflow-hidden">
                            <div
                                ref={tickerRef}
                                className="animate-smooth-marquee flex w-max cursor-default items-center"
                                style={{ '--marquee-duration': `${animationDuration}s` } as React.CSSProperties}
                            >
                                {/* Set 1 */}
                                <div className="flex items-center">
                                    {tickerTextArray.map((text, idx) => (
                                        <span key={`set1-${idx}`} className="flex items-center">
                                            <span className="whitespace-nowrap font-medium tracking-wide text-gray-300/90">{text}</span>
                                            <TickerDot />
                                        </span>
                                    ))}
                                </div>
                                {/* Set 2 */}
                                <div className="flex items-center" aria-hidden="true">
                                    {tickerTextArray.map((text, idx) => (
                                        <span key={`set2-${idx}`} className="flex items-center">
                                            <span className="whitespace-nowrap font-medium tracking-wide text-gray-300/90">{text}</span>
                                            <TickerDot />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KANAN: Sosial Media */}
                    <div className="hidden shrink-0 items-center gap-4 border-l border-white/5 pl-4 md:flex">
                        {/* Diubah jadi Title Case & ukuran font sedikit disesuaikan agar rapi */}
                        <span className="whitespace-nowrap text-[11px] font-medium tracking-wide text-gray-400/90">
                            Tetap Terhubung :
                        </span>
                        <div className="flex items-center gap-3.5">
                            {SOCIAL_LINKS.map((link) => (
                                <a
                                    key={link.ariaLabel}
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={link.ariaLabel}
                                    title={link.title}
                                    className="group relative flex items-center justify-center text-gray-400 transition-all duration-300 hover:text-gold hover:drop-shadow-glow"
                                >
                                    <i className={`${link.iconClassName} text-[13px] transform transition-transform duration-300 group-hover:-translate-y-0.5`} aria-hidden="true" />
                                </a>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

export default memo(TopBar);