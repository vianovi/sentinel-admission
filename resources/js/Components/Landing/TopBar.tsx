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
const PHONE_NUMBER = '+62 851-1122-3344';
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
    if (activeWave.announcement_info) items.push(`Info: ${activeWave.announcement_info}`);

    items.push('Daftar sekarang dan amankan peluang terbaikmu');

    return items;
}

const Divider = () => <span className="mx-4 text-slate-500/20 select-none">|</span>;
const TickerDot = () => <span className="mx-4 text-gold/50 select-none text-[8px] tracking-widest">✦</span>;

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

            {/* Container Utama dengan backdrop-blur untuk estetika modern */}
            <div className="hidden md:block w-full border-b border-slate-800/70 bg-[#0b1220] py-2 sm:py-2.5 font-sans text-[11px] text-slate-200 transition-all duration-300 z-50">
                {/* Lebar Container Sesuai Instruksi Baru */}
                <div className="max-w-[108rem] mx-auto px-5 sm:px-7 lg:px-10 xl:px-12 flex items-center justify-between gap-6 sm:gap-8">

                    {/* KIRI: Informasi Kontak */}
                    <div className="hidden shrink-0 items-center border-r border-slate-700/70 pr-5 lg:flex">
                        <a
                            href={`mailto:${EMAIL_ADDRESS}`}
                            className="group flex items-center gap-2 transition-all duration-300 hover:text-white"
                            aria-label={`Kirim email ke ${EMAIL_ADDRESS}`}
                        >
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800/40 border border-slate-500/10 group-hover:border-gold/35 group-hover:bg-gold/5 transition-all duration-300">
                                <i className="fa-solid fa-envelope text-[10px] text-gold/90 transition-transform duration-300 group-hover:scale-105" aria-hidden="true" />
                            </span>
                            <span className="font-semibold tracking-wide text-slate-200 group-hover:text-white transition-colors">{EMAIL_ADDRESS}</span>
                        </a>

                        <Divider />

                        <a
                            href={`tel:${PHONE_NUMBER.replace(/[^\d+]/g, '')}`}
                            className="group flex items-center gap-2 transition-all duration-300 hover:text-white"
                            aria-label={`Hubungi ${PHONE_NUMBER}`}
                        >
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800/40 border border-slate-500/10 group-hover:border-gold/35 group-hover:bg-gold/5 transition-all duration-300">
                                <i className="fa-solid fa-phone text-[9px] text-gold/90 transition-transform duration-300 group-hover:scale-105" aria-hidden="true" />
                            </span>
                            <span className="font-semibold tracking-wide text-slate-200 group-hover:text-white transition-colors">{PHONE_NUMBER}</span>
                        </a>
                    </div>

                    {/* TENGAH: Ticker Teks Berjalan */}
                    <div className="relative flex min-w-0 flex-1 items-center overflow-hidden py-1">
                        {/* Gradasi Halus di Tepi Ticker */}
                        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-[#0b1220] via-[#0b1220]/70 to-transparent" />
                        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-[#0b1220] via-[#0b1220]/70 to-transparent" />

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
                                            <span className="whitespace-nowrap font-medium tracking-wide text-slate-200/90 hover:text-white transition-colors duration-200">
                                                {text}
                                            </span>
                                            <TickerDot />
                                        </span>
                                    ))}
                                </div>
                                {/* Set 2 */}
                                <div className="flex items-center" aria-hidden="true">
                                    {tickerTextArray.map((text, idx) => (
                                        <span key={`set2-${idx}`} className="flex items-center">
                                            <span className="whitespace-nowrap font-medium tracking-wide text-slate-200/90 hover:text-white transition-colors duration-200">
                                                {text}
                                            </span>
                                            <TickerDot />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KANAN: Sosial Media */}
                    <div className="hidden shrink-0 items-center gap-4 border-l border-slate-700/70 pl-5 md:flex">
                        <span className="whitespace-nowrap text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            Sosial Media :
                        </span>
                        <div className="flex items-center gap-2.5">
                            {SOCIAL_LINKS.map((link) => (
                                <a
                                    key={link.ariaLabel}
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={link.ariaLabel}
                                    title={link.title}
                                    className="group flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/35 border border-slate-500/10 text-gray-400 transition-all duration-300 hover:text-gold hover:border-gold/30 hover:bg-gold/5"
                                >
                                    <i className={`${link.iconClassName} text-xs transform transition-transform duration-300 group-hover:-translate-y-0.5`} aria-hidden="true" />
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
