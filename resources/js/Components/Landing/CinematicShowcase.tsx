import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { animate, stagger } from 'animejs';
import GalleryCard, { GalleryItem } from './GalleryCard';

// ─────────────────────────────────────────────────────────────
//  MASTER DATA  —  tambahkan item baru di sini, otomatis terbagi
// ─────────────────────────────────────────────────────────────
const MASTER_DATA: GalleryItem[] = [
    {
        id: 1, type: 'image',
        src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
        title: 'Suasana Kelas Modern',
        category: 'Akademik',
        description: 'Ruang belajar yang nyaman dan dilengkapi teknologi mutakhir untuk menunjang proses pembelajaran mahasiswa secara optimal dan kolaboratif.',
    },
    {
        id: 2, type: 'video',
        src: 'https://www.w3schools.com/html/mov_bbb.mp4',
        title: 'Praktikum di Lab',
        category: 'Laboratorium',
        description: 'Simulasi real-time di laboratorium berstandar industri dengan pengawasan mentor berpengalaman dari praktisi nasional.',
    },
    {
        id: 3, type: 'image',
        src: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
        title: 'Server Utama',
        category: 'Infrastruktur',
        description: 'Infrastruktur pusat data redundan yang andal untuk mendukung seluruh ekosistem sistem akademik dan riset online.',
    },
    {
        id: 4, type: 'image',
        src: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
        title: 'Diskusi Mahasiswa',
        category: 'Kolaborasi',
        description: 'Area kolaborasi terbuka yang mendorong pertukaran ide lintas program studi dan pengembangan soft-skill mahasiswa.',
    },
    {
        id: 5, type: 'video',
        src: 'https://www.w3schools.com/html/mov_bbb.mp4',
        title: 'Ekshibisi Tahunan',
        category: 'Event',
        description: 'Pameran karya dan inovasi mahasiswa yang dihadiri oleh lebih dari 120 mitra industri nasional dan internasional.',
    },
    {
        id: 6, type: 'image',
        src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
        title: 'Area Outdoor',
        category: 'Lingkungan',
        description: 'Lingkungan kampus yang hijau dan asri, memberikan atmosfer belajar yang tenang dan menginspirasi kreativitas.',
    },
    {
        id: 7, type: 'image',
        src: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de',
        title: 'Riset Teknologi',
        category: 'Riset',
        description: 'Fokus pengembangan pada teknologi terapan yang relevan dengan kebutuhan pasar dan tantangan industri masa depan.',
    },
    {
        id: 8, type: 'video',
        src: 'https://www.w3schools.com/html/mov_bbb.mp4',
        title: 'Kunjungan Industri',
        category: 'Program',
        description: 'Program rutin immersive untuk melihat langsung operasional perusahaan mitra terkemuka guna memperluas wawasan profesional.',
    },
];

// ─────────────────────────────────────────────────────────────
//  Word-by-word staggered text reveal for lightbox
// ─────────────────────────────────────────────────────────────
function AnimatedText({ text, className }: { text: string; className?: string }) {
    const ref = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        const words = text.split(' ');
        ref.current.innerHTML = words
            .map(w => `<span style="display:inline-block;overflow:hidden;vertical-align:bottom"><span style="display:inline-block;transform:translateY(110%);opacity:0">${w}&nbsp;</span></span>`)
            .join('');

        const spans = ref.current.querySelectorAll('span > span');
         animate(spans, {
            translateY: ['110%', '0%'],
            opacity: [0, 1],
            delay: stagger(38, { start: 80 }),
            duration: 600,
            easing: 'easeOutQuart',
        });
    }, [text]);

    return <p ref={ref} className={className} />;
}

// ─────────────────────────────────────────────────────────────
//  Lightbox
// ─────────────────────────────────────────────────────────────
interface LightboxProps {
    item: GalleryItem;
    total: number;
    currentIdx: number;
    onClose: () => void;
    onNavigate: (dir: number) => void;
}

function Lightbox({ item, total, currentIdx, onClose, onNavigate }: LightboxProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Entrance animation
    useEffect(() => {

        animate(overlayRef.current, {
            opacity: [0, 1],
            duration: 350,
            easing: 'easeOutQuad',
        });

        animate(panelRef.current, {
            opacity: [0, 1],
            translateY: [40, 0],
            scale: [0.95, 1],
            duration: 500,
            easing: 'easeOutQuart',
        });
    }, []);

    // Re-animate info panel on item change
    const infoRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!infoRef.current) return;
        animate({
            targets: infoRef.current,
            opacity: [0, 1],
            translateX: [-20, 0],
            duration: 450,
            easing: 'easeOutQuart',
        });
    }, [item.id]);

    const handleClose = () => {
        animate({
            targets: [panelRef.current],
            opacity: [1, 0],
            translateY: [0, 30],
            scale: [1, 0.96],
            duration: 320,
            easing: 'easeInQuart',
        });
        animate({
            targets: overlayRef.current,
            opacity: [1, 0],
            duration: 350,
            easing: 'easeInQuad',
            complete: onClose,
        });
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-8 lg:p-12">
            {/* Backdrop */}
            <div
                ref={overlayRef}
                className="absolute inset-0"
                style={{
                    background: 'rgba(2,5,14,0.92)',
                    backdropFilter: 'blur(20px) saturate(0.8)',
                }}
                onClick={handleClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className="relative z-10 w-full max-w-[1100px] flex flex-col lg:flex-row overflow-hidden"
                style={{
                    borderRadius: '2rem',
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'linear-gradient(135deg, rgba(4,10,28,0.98) 0%, rgba(8,14,36,0.95) 100%)',
                    boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
                    maxHeight: '88vh',
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
                    {/* Top: category + close */}
                    <div className="flex items-center justify-between mb-8">
                        {item.category && (
                            <span
                                className="text-[9px] font-extrabold tracking-[0.28em] uppercase px-3 py-1.5 rounded-full"
                                style={{
                                    color: '#D4AF37',
                                    border: '1px solid rgba(212,175,55,0.3)',
                                    background: 'rgba(212,175,55,0.07)',
                                }}
                            >
                                {item.category}
                            </span>
                        )}
                        <button
                            onClick={handleClose}
                            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ml-auto"
                            style={{
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'rgba(255,255,255,0.5)',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.15)';
                                (e.currentTarget as HTMLElement).style.color = '#D4AF37';
                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                            }}
                        >
                            <i className="fa-solid fa-xmark text-xs" />
                        </button>
                    </div>

                    {/* Middle: title + description */}
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

                        {/* Gold divider */}
                        <div className="flex items-center gap-3 mb-6">
                            <div
                                className="h-px flex-1"
                                style={{ background: 'linear-gradient(to right, #D4AF37, rgba(212,175,55,0))' }}
                            />
                            <div
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: '#D4AF37' }}
                            />
                        </div>

                        <AnimatedText
                            key={item.id}
                            text={item.description}
                            className="leading-relaxed text-sm"
                            style={{ color: 'rgba(148,163,184,0.9)', fontWeight: 450 } as React.CSSProperties}
                        />
                    </div>

                    {/* Bottom: nav + counter */}
                    <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onNavigate(-1)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                                    style={{
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.04)',
                                        color: 'rgba(255,255,255,0.6)',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.background = '#D4AF37';
                                        (e.currentTarget as HTMLElement).style.color = '#020508';
                                        (e.currentTarget as HTMLElement).style.borderColor = '#D4AF37';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
                                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                                    }}
                                >
                                    <i className="fa-solid fa-arrow-left text-[11px]" />
                                </button>
                                <button
                                    onClick={() => onNavigate(1)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                                    style={{
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.04)',
                                        color: 'rgba(255,255,255,0.6)',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.background = '#D4AF37';
                                        (e.currentTarget as HTMLElement).style.color = '#020508';
                                        (e.currentTarget as HTMLElement).style.borderColor = '#D4AF37';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
                                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                                    }}
                                >
                                    <i className="fa-solid fa-arrow-right text-[11px]" />
                                </button>
                            </div>

                            {/* Progress counter */}
                            <div className="flex items-center gap-2">
                                <span className="font-bold tabular-nums" style={{ color: '#D4AF37', fontSize: '13px' }}>
                                    {String(currentIdx + 1).padStart(2, '0')}
                                </span>
                                <div className="w-12 h-px" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                    <div
                                        className="h-full transition-all duration-500"
                                        style={{
                                            width: `${((currentIdx + 1) / total) * 100}%`,
                                            background: 'linear-gradient(to right, #D4AF37, #F5E098)',
                                        }}
                                    />
                                </div>
                                <span className="tabular-nums" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                                    {String(total).padStart(2, '0')}
                                </span>
                            </div>
                        </div>

                        {/* Keyboard hint */}
                        <p className="mt-4 text-[10px] tracking-wider" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            <kbd className="px-1.5 py-0.5 rounded text-[9px]" style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}>←</kbd>
                            {' '}&nbsp;
                            <kbd className="px-1.5 py-0.5 rounded text-[9px]" style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}>→</kbd>
                            {' '} Navigate &nbsp;·&nbsp; <kbd className="px-1.5 py-0.5 rounded text-[9px]" style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}>Esc</kbd> Close
                        </p>
                    </div>
                </div>

                {/* ── Right media panel ── */}
                <div
                    className="w-full lg:w-[62%] bg-black flex items-center justify-center overflow-hidden"
                    style={{ minHeight: '320px', position: 'relative' }}
                >
                    {/* Subtle noise overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{ opacity: 0.025, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '128px' }}
                    />

                    {item.type === 'video' ? (
                        <video
                            key={item.id}
                            src={item.src}
                            controls
                            autoPlay
                            muted
                            className="w-full h-full object-contain"
                            style={{ maxHeight: '88vh' }}
                        />
                    ) : (
                        <img
                            key={item.id}
                            src={item.src}
                            alt={item.title}
                            className="w-full h-full object-contain transition-opacity duration-300"
                            style={{ maxHeight: '88vh' }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Stats strip
// ─────────────────────────────────────────────────────────────
const STATS = [
    { value: '12+', label: 'Lab Berstandar Industri' },
    { value: '500+', label: 'Mitra Perusahaan' },
    { value: '98%', label: 'Tingkat Kepuasan' },
    { value: '24/7', label: 'Akses Fasilitas' },
];

// ─────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────
export default function CinematicShowcase() {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    // Auto-split with seamless duplicate
    const { row1, row2 } = useMemo(() => {
        const half = Math.ceil(MASTER_DATA.length / 2);
        const a = MASTER_DATA.slice(0, half);
        const b = MASTER_DATA.slice(half);
        return {
            row1: [...a, ...a],
            row2: [...b, ...b],
        };
    }, []);

    const activeItem    = activeIndex !== null ? MASTER_DATA.find(i => i.id === activeIndex) ?? null : null;
    const currentIdx    = activeIndex !== null ? MASTER_DATA.findIndex(i => i.id === activeIndex) : 0;

    // Header entrance animation on mount
    useEffect(() => {
        if (!headerRef.current) return;
        const children = headerRef.current.querySelectorAll('[data-reveal]');
        animate({
            targets: children,
            opacity: [0, 1],
            translateY: [24, 0],
            delay: stagger(80, { start: 100 }),
            duration: 700,
            easing: 'easeOutQuart',
        });
    }, []);

    // Keyboard nav
    const navigate = useCallback((dir: number) => {
        const idx = MASTER_DATA.findIndex(i => i.id === activeIndex);
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

    const handleCardClick = useCallback((_rect: DOMRect, id: number) => {
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
            {/* ── Ambient orbs (background atmosphere) ── */}
            <div
                className="pointer-events-none absolute -top-48 left-1/4 w-[600px] h-[600px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 65%)',
                    filter: 'blur(60px)',
                }}
            />
            <div
                className="pointer-events-none absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 65%)',
                    filter: 'blur(80px)',
                }}
            />

            {/* ── Inline keyframes ── */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scrollL {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-50%); }
                }
                @keyframes scrollR {
                    from { transform: translateX(-50%); }
                    to   { transform: translateX(0); }
                }
                .anim-l { animation: scrollL 55s linear infinite; }
                .anim-r { animation: scrollR 60s linear infinite; }
                .track:hover .anim-l,
                .track:hover .anim-r { animation-play-state: paused; }
                .mask-edges {
                    mask-image: linear-gradient(
                        to right,
                        transparent 0%,
                        black 12%,
                        black 88%,
                        transparent 100%
                    );
                    -webkit-mask-image: linear-gradient(
                        to right,
                        transparent 0%,
                        black 12%,
                        black 88%,
                        transparent 100%
                    );
                }
            ` }} />

            {/* ─────────────── Header ─────────────── */}
            <div
                ref={headerRef}
                className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 text-center"
            >
                {/* Eyebrow */}
                <div data-reveal className="inline-flex items-center gap-3 mb-5" style={{ opacity: 0 }}>
                    <div className="h-px w-8" style={{ background: 'linear-gradient(to right, transparent, #D4AF37)' }} />
                    <span
                        className="text-[10px] font-extrabold tracking-[0.35em] uppercase"
                        style={{ color: '#D4AF37' }}
                    >
                        Media Showcase
                    </span>
                    <div className="h-px w-8" style={{ background: 'linear-gradient(to left, transparent, #D4AF37)' }} />
                </div>

                {/* Headline */}
                <h2
                    data-reveal
                    className="font-extrabold tracking-tight leading-[1.05] text-white mb-6"
                    style={{
                        fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                        fontFamily: "'Clash Display', 'DM Sans', sans-serif",
                        opacity: 0,
                    }}
                >
                    Eksplorasi Fasilitas{' '}
                    <span
                        className="inline-block"
                        style={{
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            backgroundImage: 'linear-gradient(135deg, #D4AF37 0%, #F5E098 45%, #D4AF37 100%)',
                        }}
                    >
                        Unggulan.
                    </span>
                </h2>

                {/* Subtext */}
                <p
                    data-reveal
                    className="max-w-xl mx-auto leading-relaxed text-[15px]"
                    style={{ color: 'rgba(148,163,184,0.75)', fontWeight: 450, opacity: 0 }}
                >
                    Lihat lebih dekat lingkungan belajar, infrastruktur, dan aktivitas harian
                    yang membentuk profesional masa depan Indonesia.
                </p>

                {/* Stats strip */}
                <div
                    data-reveal
                    className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-px max-w-2xl mx-auto overflow-hidden rounded-2xl"
                    style={{
                        opacity: 0,
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.04)',
                    }}
                >
                    {STATS.map((s, i) => (
                        <div
                            key={i}
                            className="flex flex-col items-center py-4 px-3"
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

            {/* ─────────────── Marquee tracks ─────────────── */}
            <div className="flex flex-col gap-7 mask-edges pb-24">

                {/* Row 1: scroll left */}
                <div className="track overflow-hidden">
                    <div className="flex gap-5 anim-l" style={{ width: 'max-content', paddingBlock: '12px', paddingInline: '12px' }}>
                        {row1.map((item, i) => (
                            <GalleryCard
                                key={`r1-${i}`}
                                item={item}
                                onClick={rect => handleCardClick(rect, item.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Row 2: scroll right */}
                <div className="track overflow-hidden">
                    <div className="flex gap-5 anim-r" style={{ width: 'max-content', paddingBlock: '12px', paddingInline: '12px' }}>
                        {row2.map((item, i) => (
                            <GalleryCard
                                key={`r2-${i}`}
                                item={item}
                                onClick={rect => handleCardClick(rect, item.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ─────────────── Lightbox ─────────────── */}
            {activeItem && (
                <Lightbox
                    item={activeItem}
                    total={MASTER_DATA.length}
                    currentIdx={currentIdx}
                    onClose={() => setActiveIndex(null)}
                    onNavigate={navigate}
                />
            )}
        </section>
    );
}