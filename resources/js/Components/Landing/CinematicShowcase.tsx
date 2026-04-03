import { useEffect, useState, useMemo, useRef, useCallback, CSSProperties } from 'react';
import { animate, stagger } from 'animejs';
import { route } from 'ziggy-js';
import GalleryCard, { GalleryItem, OriginRect } from './GalleryCard';

// ─────────────────────────────────────────────────────────────
//  Helper — generate Ziggy route untuk media
// ─────────────────────────────────────────────────────────────
const img   = (file: string) => route('media.gallery', { filename: `images/${file}` });
const vid   = (file: string) => route('media.gallery', { filename: `videos/${file}` });
const thumb = (file: string) => route('media.gallery', { filename: `images/${file}` });


// MASTER_DATA — 134 foto + 4 video
// Generate otomatis, edit title/description sesuai kebutuhan
// MASTER_DATA — 31 foto + 4 video = 35 items total
const MASTER_DATA: GalleryItem[] = [
    {
        id: 1, type: 'image', size: 'wide',
        src: img('photo-01.webp'),
        title: 'Suasana Kelas Modern',
        category: 'Akademik',
        description: 'Proses pembelajaran interaktif berbasis teknologi terkini.',
    },
    {
        id: 2, type: 'image', size: 'normal',
        src: img('photo-02.webp'),
        title: 'Praktikum di Lab',
        category: 'Laboratorium',
        description: 'Fasilitas lab berstandar industri untuk praktik langsung.',
    },
    {
        id: 3, type: 'image', size: 'narrow',
        src: img('photo-03.webp'),
        title: 'Server Utama',
        category: 'Lingkungan',
        description: 'Suasana kampus hijau dan asri yang menginspirasi kreativitas.',
    },
    {
        id: 4, type: 'image', size: 'normal',
        src: img('photo-04.webp'),
        title: 'Diskusi Mahasiswa',
        category: 'Fasilitas',
        description: 'Sarana lengkap untuk menunjang kehidupan akademik kampus.',
    },
    {
        id: 5, type: 'image', size: 'wide',
        src: img('photo-05.webp'),
        title: 'Perpustakaan Digital',
        category: 'Event',
        description: 'Momen berkesan dari berbagai kegiatan dan acara kampus.',
    },
    {
        id: 6, type: 'image', size: 'normal',
        src: img('photo-06.webp'),
        title: 'Aula Utama',
        category: 'Kolaborasi',
        description: 'Area diskusi dan kerja sama lintas program studi.',
    },
    {
        id: 7, type: 'image', size: 'normal',
        src: img('photo-07.webp'),
        title: 'Workshop Design',
        category: 'Riset',
        description: 'Pengembangan inovasi dan teknologi terapan bersama para ahli.',
    },
    {
        id: 8, type: 'image', size: 'narrow',
        src: img('photo-08.webp'),
        title: 'Lounge Mahasiswa',
        category: 'Program',
        description: 'Kegiatan terstruktur yang memperluas wawasan dan kompetensi.',
    },
    {
        id: 9, type: 'image', size: 'wide',
        src: img('photo-09.webp'),
        title: 'Studio Multimedia',
        category: 'Boarding',
        description: 'Kehidupan asrama yang nyaman dan penuh semangat kebersamaan.',
    },
    {
        id: 10, type: 'image', size: 'normal',
        src: img('photo-10.webp'),
        title: 'Lab Jaringan',
        category: 'Olahraga',
        description: 'Fasilitas olahraga untuk menjaga keseimbangan fisik dan mental.',
    },
    {
        id: 11, type: 'image', size: 'normal',
        src: img('photo-11.webp'),
        title: 'Fasilitas Olahraga',
        category: 'Akademik',
        description: 'Proses pembelajaran interaktif berbasis teknologi terkini.',
    },
    {
        id: 12, type: 'image', size: 'wide',
        src: img('photo-12.webp'),
        title: 'Masjid Kampus',
        category: 'Laboratorium',
        description: 'Fasilitas lab berstandar industri untuk praktik langsung.',
    },
    {
        id: 13, type: 'image', size: 'normal',
        src: img('photo-13.webp'),
        title: 'Asrama Modern',
        category: 'Lingkungan',
        description: 'Suasana kampus hijau dan asri yang menginspirasi kreativitas.',
    },
    {
        id: 14, type: 'image', size: 'narrow',
        src: img('photo-14.webp'),
        title: 'Galeri Prestasi',
        category: 'Fasilitas',
        description: 'Sarana lengkap untuk menunjang kehidupan akademik kampus.',
    },
    {
        id: 15, type: 'image', size: 'normal',
        src: img('photo-15.webp'),
        title: 'Taman Belajar',
        category: 'Event',
        description: 'Momen berkesan dari berbagai kegiatan dan acara kampus.',
    },
    {
        id: 16, type: 'image', size: 'wide',
        src: img('photo-16.webp'),
        title: 'Ruang Dosen',
        category: 'Kolaborasi',
        description: 'Area diskusi dan kerja sama lintas program studi.',
    },
    {
        id: 17, type: 'image', size: 'normal',
        src: img('photo-17.webp'),
        title: 'Lab Bahasa',
        category: 'Riset',
        description: 'Pengembangan inovasi dan teknologi terapan bersama para ahli.',
    },
    {
        id: 18, type: 'image', size: 'normal',
        src: img('photo-18.webp'),
        title: 'Ruang Sidang',
        category: 'Program',
        description: 'Kegiatan terstruktur yang memperluas wawasan dan kompetensi.',
    },
    {
        id: 19, type: 'image', size: 'narrow',
        src: img('photo-19.webp'),
        title: 'Koridor Utama',
        category: 'Boarding',
        description: 'Kehidupan asrama yang nyaman dan penuh semangat kebersamaan.',
    },
    {
        id: 20, type: 'image', size: 'wide',
        src: img('photo-20.webp'),
        title: 'Ruang Komputer',
        category: 'Olahraga',
        description: 'Fasilitas olahraga untuk menjaga keseimbangan fisik dan mental.',
    },
    {
        id: 21, type: 'image', size: 'normal',
        src: img('photo-21.webp'),
        title: 'Gerbang Utama',
        category: 'Akademik',
        description: 'Proses pembelajaran interaktif berbasis teknologi terkini.',
    },
    {
        id: 22, type: 'image', size: 'normal',
        src: img('photo-22.webp'),
        title: 'Area Parkir',
        category: 'Laboratorium',
        description: 'Fasilitas lab berstandar industri untuk praktik langsung.',
    },
    {
        id: 23, type: 'image', size: 'wide',
        src: img('photo-23.webp'),
        title: 'Kantin Modern',
        category: 'Lingkungan',
        description: 'Suasana kampus hijau dan asri yang menginspirasi kreativitas.',
    },
    {
        id: 24, type: 'image', size: 'normal',
        src: img('photo-24.webp'),
        title: 'Studio Rekaman',
        category: 'Fasilitas',
        description: 'Sarana lengkap untuk menunjang kehidupan akademik kampus.',
    },
    {
        id: 25, type: 'image', size: 'narrow',
        src: img('photo-25.webp'),
        title: 'Lapangan Utama',
        category: 'Event',
        description: 'Momen berkesan dari berbagai kegiatan dan acara kampus.',
    },
    {
        id: 26, type: 'image', size: 'normal',
        src: img('photo-26.webp'),
        title: 'Lab Fisika',
        category: 'Kolaborasi',
        description: 'Area diskusi dan kerja sama lintas program studi.',
    },
    {
        id: 27, type: 'image', size: 'wide',
        src: img('photo-27.webp'),
        title: 'Ruang Seni',
        category: 'Riset',
        description: 'Pengembangan inovasi dan teknologi terapan bersama para ahli.',
    },
    {
        id: 28, type: 'image', size: 'normal',
        src: img('photo-28.webp'),
        title: 'Klinik Kampus',
        category: 'Program',
        description: 'Kegiatan terstruktur yang memperluas wawasan dan kompetensi.',
    },
    {
        id: 29, type: 'image', size: 'normal',
        src: img('photo-29.webp'),
        title: 'Greenhouse Kampus',
        category: 'Boarding',
        description: 'Kehidupan asrama yang nyaman dan penuh semangat kebersamaan.',
    },
    {
        id: 30, type: 'image', size: 'narrow',
        src: img('photo-30.webp'),
        title: 'Lab Elektronika',
        category: 'Olahraga',
        description: 'Fasilitas olahraga untuk menjaga keseimbangan fisik dan mental.',
    },
    {
        id: 31, type: 'image', size: 'wide',
        src: img('photo-31.webp'),
        title: 'Kolam Renang',
        category: 'Akademik',
        description: 'Proses pembelajaran interaktif berbasis teknologi terkini.',
    },
    {
        id: 32, type: 'video', size: 'wide',
        src: vid('video-01.mp4'),
        title: 'Kehidupan Kampus',
        category: 'Event',
        description: 'Momen terbaik kehidupan kampus yang dinamis dan penuh semangat.',
    },
    {
        id: 33, type: 'video', size: 'normal',
        src: vid('video-02.mp4'),
        title: 'Ekshibisi Tahunan',
        category: 'Event',
        description: 'Pameran karya inovasi mahasiswa dihadiri 120+ mitra industri.',
    },
    {
        id: 34, type: 'video', size: 'wide',
        src: vid('video-03.mp4'),
        title: 'Kunjungan Industri',
        category: 'Program',
        description: 'Immersive visit ke perusahaan mitra untuk wawasan profesional.',
    },
    {
        id: 35, type: 'video', size: 'normal',
        src: vid('video-04.mp4'),
        title: 'Wisuda Akbar',
        category: 'Event',
        description: 'Perayaan kelulusan mahasiswa bersama keluarga tercinta.',
    },
];


// ─────────────────────────────────────────────────────────────
//  SeamlessTrack — Pure CSS infinite marquee
//
//  Pendekatan: render [set-A | set-B], keduanya identik.
//  CSS animation gerakkan translateX dari 0 → -50%.
//  Kenapa -50% bekerja sempurna di sini:
//    - Inner wrapper punya `width: max-content`
//    - Kedua set identik, jadi -50% dari total width
//      = persis lebar satu set = pixel-exact loop
//    - Reset dari -50% ke 0 terjadi instan di keyframe boundary
//    - Mata tidak bisa melihat reset karena posisi visual identik
//
//  Keunggulan vs ResizeObserver approach:
//    - Zero JavaScript measurement = zero timing bug
//    - CSS handles sub-pixel rendering natively
//    - Tidak ada flash/jump saat ResizeObserver belum ready
// ─────────────────────────────────────────────────────────────

// Counter untuk stable unique CSS class per instance
let instanceCount = 0;

interface SeamlessTrackProps {
    items: GalleryItem[];
    direction: 'left' | 'right';
    /** Durasi satu siklus penuh dalam detik */
    duration: number;
    gap: number;
    onItemClick: (id: number, rect: OriginRect) => void;
    lightboxActive: boolean;
}

function SeamlessTrack({ items, direction, duration, gap, onItemClick, lightboxActive }: SeamlessTrackProps) {
    // Stable class name — tidak re-generate saat re-render
    const cls      = useRef(`smq-${++instanceCount}`).current;
    const [paused, setPaused] = useState(false);

    // Inject CSS keyframes sekali per instance
    useEffect(() => {
        const from = direction === 'left' ? '0%'   : '-50%';
        const to   = direction === 'left' ? '-50%' : '0%';

        const style = document.createElement('style');
        style.id    = `${cls}-style`;
        style.textContent = `
            @keyframes ${cls} {
                from { transform: translateX(${from}); }
                to   { transform: translateX(${to});   }
            }
            .${cls}-inner {
                display: flex;
                flex-wrap: nowrap;
                width: max-content;
                will-change: transform;
                animation: ${cls} ${duration}s linear infinite;
                animation-play-state: running;
            }
            .${cls}-inner.paused {
                animation-play-state: paused;
            }
            .${cls}-set {
                display: flex;
                flex-shrink: 0;
                gap: ${gap}px;
            }
        `;
        document.head.appendChild(style);

        return () => style.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally run once

    // Pause when hovered OR lightbox active
    useEffect(() => {
        const el = document.querySelector<HTMLDivElement>(`.${cls}-inner`);
        if (!el) return;
        el.classList.toggle('paused', paused || lightboxActive);
    }, [paused, lightboxActive, cls]);

    const renderSet = (prefix: string) =>
        items.map((item, i) => (
            <GalleryCard
                key={`${prefix}-${i}`}
                item={item}
                onClick={(rect) => onItemClick(item.id, rect)}
                lightboxActive={lightboxActive}
            />
        ));

    return (
        <div
            className="overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
        >
            <div className={`${cls}-inner`} style={{ paddingBlock: '12px' }}>
                {/* Set A */}
                <div className={`${cls}-set`}>{renderSet('a')}</div>
                {/* Set B */}
                <div className={`${cls}-set`} style={{ marginLeft: `${gap}px` }}>{renderSet('b')}</div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Word-by-word staggered text reveal
// ─────────────────────────────────────────────────────────────
interface AnimatedTextProps {
    text: string;
    className?: string;
    style?: CSSProperties;
}

function AnimatedText({ text, className, style }: AnimatedTextProps) {
    const ref = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        ref.current.innerHTML = text.split(' ')
            .map(w => `<span style="display:inline-block;overflow:hidden;vertical-align:bottom"><span style="display:inline-block;transform:translateY(110%);opacity:0">${w}&nbsp;</span></span>`)
            .join('');

        animate(ref.current.querySelectorAll<HTMLElement>('span > span'), {
            translateY: ['110%', '0%'],
            opacity:    [0, 1],
            delay:      stagger(38, { start: 80 }),
            duration:   600,
            ease:       'easeOutQuart',
        });
    }, [text]);

    return <p ref={ref} className={className} style={style} />;
}

// ─────────────────────────────────────────────────────────────
//  Lightbox — dengan swipe gesture support (mobile premium)
// ─────────────────────────────────────────────────────────────
interface LightboxProps {
    item: GalleryItem;
    total: number;
    currentIdx: number;
    originRect: OriginRect | null;
    onClose: () => void;
    onNavigate: (dir: number) => void;
}

function Lightbox({ item, total, currentIdx, originRect, onClose, onNavigate }: LightboxProps) {
    const panelRef   = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const infoRef    = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(null);

    // Mount animation — muncul dari posisi card yang diklik
    useEffect(() => {
        animate(overlayRef.current!, { opacity: [0, 1], duration: 350, ease: 'easeOutQuad' });

        if (originRect && panelRef.current) {
            // Hitung offset dari tengah viewport ke posisi card
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const originCX = originRect.left + originRect.width  / 2;
            const originCY = originRect.top  + originRect.height / 2;
            const dx = originCX - vw / 2;
            const dy = originCY - vh / 2;
            const scaleX = originRect.width  / (Math.min(vw * 0.9, 1100));
            const scaleY = originRect.height / (Math.min(vh * 0.88, 700));
            const initScale = Math.max(Math.min(scaleX, scaleY), 0.05);

            animate(panelRef.current, {
                opacity:    [0, 1],
                translateX: [dx, 0],
                translateY: [dy, 0],
                scale:      [initScale, 1],
                duration: 520,
                ease: 'easeOutQuart',
            });
        } else {
            animate(panelRef.current!, {
                opacity: [0, 1], translateY: [40, 0], scale: [0.95, 1],
                duration: 500, ease: 'easeOutQuart',
            });
        }
    }, []);

    // Info slide-in on item change
    useEffect(() => {
        if (!infoRef.current) return;
        animate(infoRef.current, { opacity: [0, 1], translateX: [-20, 0], duration: 450, ease: 'easeOutQuart' });
    }, [item.id]);

    const handleClose = () => {
        if (originRect && panelRef.current) {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const dx = (originRect.left + originRect.width  / 2) - vw / 2;
            const dy = (originRect.top  + originRect.height / 2) - vh / 2;
            animate(panelRef.current, {
                opacity: [1, 0], translateX: [0, dx], translateY: [0, dy], scale: [1, 0.08],
                duration: 380, ease: 'easeInQuart',
            });
        } else {
            animate(panelRef.current!, {
                opacity: [1, 0], translateY: [0, 30], scale: [1, 0.96],
                duration: 320, ease: 'easeInQuart',
            });
        }
        animate(overlayRef.current!, { opacity: [1, 0], duration: 380, ease: 'easeInQuad', onComplete: onClose });
    };

    // Touch swipe handlers
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) > 50) onNavigate(delta < 0 ? 1 : -1);
        touchStartX.current = null;
    };

    const btnBase: CSSProperties = {
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.04)',
        color: 'rgba(255,255,255,0.5)',
        transition: 'background 0.2s, color 0.2s, border-color 0.2s',
    };
    const applyHover    = (el: HTMLElement) => { el.style.background = 'rgba(212,175,55,0.15)'; el.style.color = '#D4AF37'; el.style.borderColor = 'rgba(212,175,55,0.4)'; };
    const removeHover   = (el: HTMLElement) => { el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = 'rgba(255,255,255,0.5)'; el.style.borderColor = 'rgba(255,255,255,0.1)'; };
    const applyNavHover = (el: HTMLElement) => { el.style.background = '#D4AF37'; el.style.color = '#020508'; el.style.borderColor = '#D4AF37'; };

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-8 lg:p-12"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Overlay */}
            <div
                ref={overlayRef}
                className="absolute inset-0"
                style={{ background: 'rgba(2,5,14,0.92)', backdropFilter: 'blur(20px) saturate(0.8)', opacity: 0 }}
                onClick={handleClose}
            />

            <div
                ref={panelRef}
                className="relative z-10 w-full max-w-[1100px] flex flex-col lg:flex-row overflow-hidden"
                style={{
                    borderRadius: '2rem',
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'linear-gradient(135deg, rgba(4,10,28,0.98) 0%, rgba(8,14,36,0.95) 100%)',
                    boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
                    maxHeight: '88vh',
                    opacity: 0,
                }}
            >
                {/* ── Left info panel ── */}
                <div
                    ref={infoRef}
                    className="relative w-full lg:w-[38%] flex flex-col justify-between overflow-y-auto"
                    style={{
                        padding: '3rem 3rem 2.5rem',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                        background: 'linear-gradient(160deg, rgba(8,16,40,0.6) 0%, rgba(4,8,20,0.3) 100%)',
                        minHeight: '280px',
                    }}
                >
                    <div className="flex items-center justify-between mb-8">
                        {item.category && (
                            <span
                                className="text-[9px] font-extrabold tracking-[0.28em] uppercase px-3 py-1.5 rounded-full"
                                style={{ color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.07)' }}
                            >
                                {item.category}
                            </span>
                        )}
                        <button
                            className="w-9 h-9 rounded-full flex items-center justify-center ml-auto"
                            style={btnBase}
                            onClick={handleClose}
                            onMouseEnter={e => applyHover(e.currentTarget)}
                            onMouseLeave={e => removeHover(e.currentTarget)}
                        >
                            <i className="fa-solid fa-xmark text-xs" />
                        </button>
                    </div>

                    <div className="flex-1">
                        <h3
                            className="text-white font-extrabold leading-tight mb-5"
                            style={{
                                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                                fontFamily: "'Clash Display', 'DM Sans', sans-serif",
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {item.title}
                        </h3>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, #D4AF37, rgba(212,175,55,0))' }} />
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#D4AF37' }} />
                        </div>

                        <AnimatedText
                            key={item.id}
                            text={item.description}
                            className="leading-relaxed text-sm"
                            style={{ color: 'rgba(148,163,184,0.9)', fontWeight: 450 }}
                        />
                    </div>

                    <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {([{ icon: 'fa-arrow-left', dir: -1 }, { icon: 'fa-arrow-right', dir: 1 }] as const).map(({ icon, dir }) => (
                                    <button
                                        key={icon}
                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                        style={btnBase}
                                        onClick={() => onNavigate(dir)}
                                        onMouseEnter={e => applyNavHover(e.currentTarget)}
                                        onMouseLeave={e => removeHover(e.currentTarget)}
                                    >
                                        <i className={`fa-solid ${icon} text-[11px]`} />
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="font-bold tabular-nums text-[13px]" style={{ color: '#D4AF37' }}>
                                    {String(currentIdx + 1).padStart(2, '0')}
                                </span>
                                <div className="w-12 h-px relative" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                    <div
                                        className="absolute inset-y-0 left-0 transition-all duration-500"
                                        style={{
                                            width: `${((currentIdx + 1) / total) * 100}%`,
                                            background: 'linear-gradient(to right, #D4AF37, #F5E098)',
                                        }}
                                    />
                                </div>
                                <span className="tabular-nums text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                    {String(total).padStart(2, '0')}
                                </span>
                            </div>
                        </div>

                        {/* Keyboard hints — desktop only */}
                        <p className="mt-4 text-[10px] tracking-wider hidden sm:block" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            {(['←', '→'] as const).map(k => (
                                <kbd key={k} className="px-1.5 py-0.5 rounded text-[9px] mr-1" style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}>
                                    {k}
                                </kbd>
                            ))}
                            Navigate &nbsp;·&nbsp;
                            <kbd className="px-1.5 py-0.5 rounded text-[9px]" style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}>
                                Esc
                            </kbd>
                            {' '}Close
                        </p>

                        {/* Swipe hint — mobile only */}
                        <p className="mt-4 text-[10px] tracking-wider flex items-center gap-1.5 sm:hidden" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            <i className="fa-solid fa-hand-pointer text-[9px]" />
                            Geser kiri / kanan untuk navigasi
                        </p>
                    </div>
                </div>

                {/* ── Right media panel ── */}
                <div
                    className="w-full lg:w-[62%] bg-black flex items-center justify-center overflow-hidden relative"
                    style={{ minHeight: '320px' }}
                >
                    {item.type === 'video' ? (
                        <video
                            key={item.id}
                            src={item.src}
                            controls autoPlay muted
                            className="w-full h-full object-contain"
                            style={{ maxHeight: '88vh' }}
                        />
                    ) : (
                        <img
                            key={item.id}
                            src={item.src}
                            alt={item.title}
                            className="w-full h-full object-contain"
                            style={{ maxHeight: '88vh' }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Stats
// ─────────────────────────────────────────────────────────────
const STATS = [
    { value: '12+',  label: 'Lab Berstandar Industri' },
    { value: '500+', label: 'Mitra Perusahaan'        },
    { value: '98%',  label: 'Tingkat Kepuasan'        },
    { value: '24/7', label: 'Akses Fasilitas'         },
];

// ─────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────
export default function CinematicShowcase() {
    const [activeIndex,  setActiveIndex]  = useState<number | null>(null);
    const [originRect,   setOriginRect]   = useState<OriginRect | null>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    // Row 1: foto saja (16 item), Row 2: sisa foto + 4 video tersebar
    const { row1, row2 } = useMemo(() => {
        const photos = MASTER_DATA.filter(i => i.type === 'image').slice(0, 31);
        const videos = MASTER_DATA.filter(i => i.type === 'video');
        const half   = Math.ceil(photos.length / 2); // 16 foto row1

        // Sebar video merata di antara foto row2
        const row2Photos = photos.slice(half);
        const step       = Math.floor(row2Photos.length / videos.length);
        const mixed: GalleryItem[] = [];
        row2Photos.forEach((photo, idx) => {
            mixed.push(photo);
            const vidIdx = Math.floor(idx / step);
            if ((idx + 1) % step === 0 && videos[vidIdx]) {
                mixed.push(videos[vidIdx]);
            }
        });

        return { row1: photos.slice(0, half), row2: mixed };
    }, []);

    const activeItem = activeIndex !== null
        ? (MASTER_DATA.find(i => i.id === activeIndex) ?? null)
        : null;
    const currentIdx = activeIndex !== null
        ? MASTER_DATA.findIndex(i => i.id === activeIndex)
        : 0;

    // Header entrance
    useEffect(() => {
        if (!headerRef.current) return;
        animate(
            headerRef.current.querySelectorAll<HTMLElement>('[data-reveal]'),
            { opacity: [0, 1], translateY: [24, 0], delay: stagger(80, { start: 100 }), duration: 700, ease: 'easeOutQuart' }
        );
    }, []);

    // Keyboard nav
    const navigate = useCallback((dir: number) => {
        const idx  = MASTER_DATA.findIndex(i => i.id === activeIndex);
        const next = (idx + dir + MASTER_DATA.length) % MASTER_DATA.length;
        setActiveIndex(MASTER_DATA[next].id);
    }, [activeIndex]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!activeItem) return;
            if (e.key === 'ArrowRight') navigate(1);
            if (e.key === 'ArrowLeft')  navigate(-1);
            if (e.key === 'Escape')     setActiveIndex(null);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activeItem, navigate]);

    const handleItemClick = useCallback((id: number, rect: OriginRect) => {
        setOriginRect(rect);
        setActiveIndex(id);
    }, []);

    return (
        <section
            className="relative overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, #020508 0%, #040c1e 40%, #030a18 100%)',
                borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
        >
            {/* Ambient orbs */}
            <div className="pointer-events-none absolute -top-48 left-1/4 w-[600px] h-[600px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 65%)', filter: 'blur(60px)' }} />
            <div className="pointer-events-none absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 65%)', filter: 'blur(80px)' }} />

            {/* Edge-fade mask + title shimmer keyframe */}
            <style dangerouslySetInnerHTML={{ __html: `
                .smq-mask {
                    mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
                    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
                }
                @keyframes title-shimmer {
                    0%   { background-position: 100% 0; }
                    50%  { background-position: -100% 0; }
                    100% { background-position: 100% 0; }
                }
            ` }} />

            {/* ── Header ── */}
            <div ref={headerRef} className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
                <div data-reveal className="inline-flex items-center gap-3 mb-5" style={{ opacity: 0 }}>
                    <div className="h-px w-8" style={{ background: 'linear-gradient(to right, transparent, #D4AF37)' }} />
                    <span className="text-[10px] font-extrabold tracking-[0.35em] uppercase" style={{ color: '#D4AF37' }}>Media Showcase</span>
                    <div className="h-px w-8" style={{ background: 'linear-gradient(to left, transparent, #D4AF37)' }} />
                </div>

                <h2
                    data-reveal
                    className="font-extrabold tracking-tight leading-[1.05] mb-6"
                    style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontFamily: "'Clash Display', 'DM Sans', sans-serif", opacity: 0 }}
                >
                    {/* Seluruh judul = satu sweep shimmer gold, konsisten */}
                    <span
                        style={{
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            backgroundImage: 'linear-gradient(110deg, #D4AF37 0%, #F5E098 20%, #fffbe6 38%, #F5E098 50%, #D4AF37 62%, #b8892a 80%, #D4AF37 100%)',
                            backgroundSize: '300% 100%',
                            animation: 'title-shimmer 5s ease-in-out infinite',
                            display: 'inline',
                        }}
                    >
                        Eksplorasi Fasilitas Unggulan.
                    </span>
                </h2>

                <p
                    data-reveal
                    className="max-w-xl mx-auto leading-relaxed text-[15px]"
                    style={{ color: 'rgba(148,163,184,0.75)', fontWeight: 450, opacity: 0 }}
                >
                    Lihat lebih dekat lingkungan belajar, infrastruktur, dan aktivitas harian
                    yang membentuk profesional masa depan Indonesia.
                </p>

                <div
                    data-reveal
                    className="mt-12 grid grid-cols-2 lg:grid-cols-4 max-w-2xl mx-auto overflow-hidden rounded-2xl"
                    style={{ opacity: 0, border: '1px solid rgba(255,255,255,0.06)' }}
                >
                    {STATS.map((s, i) => (
                        <div
                            key={i}
                            className="flex flex-col items-center py-5 px-3"
                            style={{
                                background: 'rgba(4,10,28,0.6)',
                                borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            }}
                        >
                            <span
                                className="font-extrabold tabular-nums"
                                style={{
                                    fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                                    fontFamily: "'Clash Display', sans-serif",
                                    color: '#D4AF37',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {s.value}
                            </span>
                            <span
                                className="text-[10px] font-medium tracking-wide mt-1 text-center"
                                style={{ color: 'rgba(148,163,184,0.6)', lineHeight: 1.3 }}
                            >
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Double Marquee — pause saat lightbox aktif ── */}
            <div className="smq-mask flex flex-col gap-7 pb-24">
                <SeamlessTrack
                    items={row1}
                    direction="left"
                    duration={120}
                    gap={20}
                    onItemClick={handleItemClick}
                    lightboxActive={activeIndex !== null}
                />
                <SeamlessTrack
                    items={row2}
                    direction="right"
                    duration={140}
                    gap={20}
                    onItemClick={handleItemClick}
                    lightboxActive={activeIndex !== null}
                />
            </div>

            {/* ── Lightbox ── */}
            {activeItem && (
                <Lightbox
                    item={activeItem}
                    total={MASTER_DATA.length}
                    currentIdx={currentIdx}
                    originRect={originRect}
                    onClose={() => { setActiveIndex(null); setOriginRect(null); }}
                    onNavigate={navigate}
                />
            )}
        </section>
    );
}