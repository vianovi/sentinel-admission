// resources/js/Components/Landing/CinematicShowcase.tsx

import { useEffect, useState, useMemo, useRef, useCallback, useId } from 'react';
import { animate, stagger } from 'animejs';
import { route } from 'ziggy-js';
import GalleryCard from './GalleryCard';
import type { GalleryItem } from './GalleryCard';

// FIX DEAD CODE: OriginRect import dihapus — tidak lagi dipakai di handleItemClick

// ─── Route helpers ────────────────────────────────────────────────────────────
// Semua media showcase disajikan lewat route privat agar lokasi file fisiknya
// bisa dipindah tanpa mengubah struktur komponen.

const showcaseMedia = (bucket: 'images' | 'videos', file: string) =>
    route('media.gallery', { filename: `${bucket}/${file}` });

const img = (file: string) => showcaseMedia('images', file);
const vid = (file: string) => showcaseMedia('videos', file);

// ─── Data ─────────────────────────────────────────────────────────────────────

const MASTER_DATA: GalleryItem[] = [
    { id: 1,  type: 'image', size: 'wide',   src: img('photo-01.webp'), title: 'Suasana Kelas Modern',   category: 'Akademik',     description: 'Proses pembelajaran interaktif berbasis teknologi terkini.' },
    { id: 2,  type: 'image', size: 'normal', src: img('photo-02.webp'), title: 'Praktikum di Lab',       category: 'Laboratorium', description: 'Fasilitas lab berstandar industri untuk praktik langsung.' },
    { id: 3,  type: 'image', size: 'narrow', src: img('photo-03.webp'), title: 'Server Utama',           category: 'Lingkungan',   description: 'Suasana kampus hijau dan asri yang menginspirasi kreativitas.' },
    { id: 4,  type: 'image', size: 'normal', src: img('photo-04.webp'), title: 'Diskusi Mahasiswa',      category: 'Fasilitas',    description: 'Sarana lengkap untuk menunjang kehidupan akademik kampus.' },
    { id: 5,  type: 'image', size: 'wide',   src: img('photo-05.webp'), title: 'Perpustakaan Digital',   category: 'Event',        description: 'Momen berkesan dari berbagai kegiatan dan acara kampus.' },
    { id: 6,  type: 'image', size: 'normal', src: img('photo-06.webp'), title: 'Aula Utama',             category: 'Kolaborasi',   description: 'Area diskusi dan kerja sama lintas program studi.' },
    { id: 7,  type: 'image', size: 'normal', src: img('photo-07.webp'), title: 'Workshop Design',        category: 'Riset',        description: 'Pengembangan inovasi dan teknologi terapan bersama para ahli.' },
    { id: 8,  type: 'image', size: 'narrow', src: img('photo-08.webp'), title: 'Lounge Mahasiswa',       category: 'Program',      description: 'Kegiatan terstruktur yang memperluas wawasan dan kompetensi.' },
    { id: 9,  type: 'image', size: 'wide',   src: img('photo-09.webp'), title: 'Studio Multimedia',      category: 'Boarding',     description: 'Kehidupan asrama yang nyaman dan penuh semangat kebersamaan.' },
    { id: 10, type: 'image', size: 'normal', src: img('photo-10.webp'), title: 'Lab Jaringan',           category: 'Olahraga',     description: 'Fasilitas olahraga untuk menjaga keseimbangan fisik dan mental.' },
    { id: 11, type: 'image', size: 'normal', src: img('photo-11.webp'), title: 'Fasilitas Olahraga',     category: 'Akademik',     description: 'Proses pembelajaran interaktif berbasis teknologi terkini.' },
    { id: 12, type: 'image', size: 'wide',   src: img('photo-12.webp'), title: 'Masjid Kampus',          category: 'Laboratorium', description: 'Fasilitas lab berstandar industri untuk praktik langsung.' },
    { id: 13, type: 'image', size: 'normal', src: img('photo-13.webp'), title: 'Asrama Modern',          category: 'Lingkungan',   description: 'Suasana kampus hijau dan asri yang menginspirasi kreativitas.' },
    { id: 14, type: 'image', size: 'narrow', src: img('photo-14.webp'), title: 'Galeri Prestasi',        category: 'Fasilitas',    description: 'Sarana lengkap untuk menunjang kehidupan akademik kampus.' },
    { id: 15, type: 'image', size: 'normal', src: img('photo-15.webp'), title: 'Taman Belajar',          category: 'Event',        description: 'Momen berkesan dari berbagai kegiatan dan acara kampus.' },
    { id: 16, type: 'image', size: 'wide',   src: img('photo-16.webp'), title: 'Ruang Dosen',            category: 'Kolaborasi',   description: 'Area diskusi dan kerja sama lintas program studi.' },
    { id: 17, type: 'image', size: 'normal', src: img('photo-17.webp'), title: 'Lab Bahasa',             category: 'Riset',        description: 'Pengembangan inovasi dan teknologi terapan bersama para ahli.' },
    { id: 18, type: 'image', size: 'normal', src: img('photo-18.webp'), title: 'Ruang Sidang',           category: 'Program',      description: 'Kegiatan terstruktur yang memperluas wawasan dan kompetensi.' },
    { id: 19, type: 'image', size: 'narrow', src: img('photo-19.webp'), title: 'Koridor Utama',          category: 'Boarding',     description: 'Kehidupan asrama yang nyaman dan penuh semangat kebersamaan.' },
    { id: 20, type: 'image', size: 'wide',   src: img('photo-20.webp'), title: 'Ruang Komputer',         category: 'Olahraga',     description: 'Fasilitas olahraga untuk menjaga keseimbangan fisik dan mental.' },
    { id: 21, type: 'image', size: 'normal', src: img('photo-21.webp'), title: 'Gerbang Utama',          category: 'Akademik',     description: 'Proses pembelajaran interaktif berbasis teknologi terkini.' },
    { id: 22, type: 'image', size: 'normal', src: img('photo-22.webp'), title: 'Area Parkir',            category: 'Laboratorium', description: 'Fasilitas lab berstandar industri untuk praktik langsung.' },
    { id: 23, type: 'image', size: 'wide',   src: img('photo-23.webp'), title: 'Kantin Modern',          category: 'Lingkungan',   description: 'Suasana kampus hijau dan asri yang menginspirasi kreativitas.' },
    { id: 24, type: 'image', size: 'normal', src: img('photo-24.webp'), title: 'Studio Rekaman',         category: 'Fasilitas',    description: 'Sarana lengkap untuk menunjang kehidupan akademik kampus.' },
    { id: 25, type: 'image', size: 'narrow', src: img('photo-25.webp'), title: 'Lapangan Utama',         category: 'Event',        description: 'Momen berkesan dari berbagai kegiatan dan acara kampus.' },
    { id: 26, type: 'image', size: 'normal', src: img('photo-26.webp'), title: 'Lab Fisika',             category: 'Kolaborasi',   description: 'Area diskusi dan kerja sama lintas program studi.' },
    { id: 27, type: 'image', size: 'wide',   src: img('photo-27.webp'), title: 'Ruang Seni',             category: 'Riset',        description: 'Pengembangan inovasi dan teknologi terapan bersama para ahli.' },
    { id: 28, type: 'image', size: 'normal', src: img('photo-28.webp'), title: 'Klinik Kampus',          category: 'Program',      description: 'Kegiatan terstruktur yang memperluas wawasan dan kompetensi.' },
    { id: 29, type: 'image', size: 'normal', src: img('photo-29.webp'), title: 'Greenhouse Kampus',      category: 'Boarding',     description: 'Kehidupan asrama yang nyaman dan penuh semangat kebersamaan.' },
    { id: 30, type: 'image', size: 'narrow', src: img('photo-30.webp'), title: 'Lab Elektronika',        category: 'Olahraga',     description: 'Fasilitas olahraga untuk menjaga keseimbangan fisik dan mental.' },
    { id: 31, type: 'image', size: 'wide',   src: img('photo-31.webp'), title: 'Kolam Renang',           category: 'Akademik',     description: 'Proses pembelajaran interaktif berbasis teknologi terkini.' },
    { id: 32, type: 'video', size: 'wide',   src: vid('video-01.mp4'),  title: 'Kehidupan Kampus',       category: 'Event',        description: 'Momen terbaik kehidupan kampus yang dinamis dan penuh semangat.' },
    { id: 33, type: 'video', size: 'normal', src: vid('video-02.mp4'),  title: 'Ekshibisi Tahunan',      category: 'Event',        description: 'Pameran karya inovasi mahasiswa dihadiri 120+ mitra industri.' },
    { id: 34, type: 'video', size: 'wide',   src: vid('video-03.mp4'),  title: 'Kunjungan Industri',     category: 'Program',      description: 'Immersive visit ke perusahaan mitra untuk wawasan profesional.' },
    { id: 35, type: 'video', size: 'normal', src: vid('video-04.mp4'),  title: 'Wisuda Akbar',           category: 'Event',        description: 'Perayaan kelulusan mahasiswa bersama keluarga tercinta.' },
];

const STATS = [
    { value: '12+',  label: 'Lab Berstandar Industri' },
    { value: '500+', label: 'Mitra Perusahaan'        },
    { value: '98%',  label: 'Tingkat Kepuasan'        },
    { value: '24/7', label: 'Akses Fasilitas'         },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SeamlessTrack — Pure CSS marquee
//  FIX PERF #8: pakai useRef untuk inner element, bukan document.querySelector
//  FIX BUG #2: ref langsung ke inner div agar toggle paused selalu tepat
// ─────────────────────────────────────────────────────────────────────────────

interface SeamlessTrackProps {
    items:          GalleryItem[];
    direction:      'left' | 'right';
    duration:       number;
    gap:            number;
    onItemClick:    (id: number) => void;
    lightboxActive: boolean;
    loading?:       'eager' | 'lazy';
}

function SeamlessTrack({
    items,
    direction,
    duration,
    gap,
    onItemClick,
    lightboxActive,
    loading = 'lazy',
}: SeamlessTrackProps) {
    const reactId  = useId();
    // cls stable — tidak berubah antar render
    const cls      = useRef(`smq-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`).current;
    // FIX PERF #8: ref langsung ke inner div — tidak perlu querySelector
    const innerRef = useRef<HTMLDivElement>(null);
    const [paused, setPaused] = useState(false);

    // Inject keyframes ke <head> — hanya sekali saat mount
    // FIX PERF #2 NOTE: ideally pindah ke app.css dengan CSS custom properties,
    // tapi karena direction & duration per-instance, kita pertahankan inject ini
    // namun pastikan cleanup berjalan dengan benar.
    useEffect(() => {
        // Hapus style lama jika ada (safety guard)
        document.getElementById(`${cls}-style`)?.remove();

        const from        = direction === 'left' ? '0%' : '-50%';
        const to          = direction === 'left' ? '-50%' : '0%';
        const styleEl     = document.createElement('style');
        styleEl.id        = `${cls}-style`;
        styleEl.textContent = [
            `@keyframes ${cls} {`,
            `  from { transform: translateX(${from}); }`,
            `  to   { transform: translateX(${to}); }`,
            `}`,
            `.${cls}-inner {`,
            `  display: flex; flex-wrap: nowrap; width: max-content;`,
            `  will-change: transform;`,
            `  animation: ${cls} ${duration}s linear infinite;`,
            `  animation-play-state: running;`,
            `}`,
            `.${cls}-inner.paused { animation-play-state: paused; }`,
            `.${cls}-set { display: flex; flex-shrink: 0; gap: ${gap}px; }`,
        ].join('\n');
        document.head.appendChild(styleEl);

        return () => {
            document.getElementById(`${cls}-style`)?.remove();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // FIX BUG #2: gunakan innerRef langsung — bukan querySelector yang bisa
    // mengambil elemen dari track lain jika selector tidak unik
    useEffect(() => {
        if (!innerRef.current) return;
        innerRef.current.classList.toggle('paused', paused || lightboxActive);
    }, [paused, lightboxActive]);

    const renderSet = (prefix: string) =>
        items.map((item, i) => (
            <GalleryCard
                key={`${prefix}-${item.id}`}
                item={item}
                // FIX DEAD CODE: onClick tidak lagi passing OriginRect
                onClick={() => onItemClick(item.id)}
                lightboxActive={lightboxActive}
                loading={loading}
                shimmerDelay={i}
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
            {/* FIX PERF #8: ref={innerRef} — tidak perlu document.querySelector */}
            <div
                ref={innerRef}
                className={`${cls}-inner`}
                style={{ paddingBlock: '12px' }}
            >
                <div className={`${cls}-set`}>
                    {renderSet('a')}
                </div>
                <div
                    className={`${cls}-set`}
                    style={{ marginLeft: `${gap}px` }}
                >
                    {renderSet('b')}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  AnimatedText — word-by-word reveal
// ─────────────────────────────────────────────────────────────────────────────

interface AnimatedTextProps {
    text:       string;
    className?: string;
    style?:     React.CSSProperties;
}

function AnimatedText({ text, className, style }: AnimatedTextProps) {
    const ref = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        // innerHTML aman karena text adalah data hardcoded, bukan user input
        ref.current.innerHTML = text
            .split(' ')
            .map(
                (w) =>
                    `<span style="display:inline-block;overflow:hidden;vertical-align:bottom">` +
                    `<span style="display:inline-block;transform:translateY(110%);opacity:0">${w}&nbsp;</span>` +
                    `</span>`,
            )
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

// ─────────────────────────────────────────────────────────────────────────────
//  FullSizePopup — foto full size di atas lightbox (hanya image)
// ─────────────────────────────────────────────────────────────────────────────

interface FullSizePopupProps {
    src:     string;
    alt:     string;
    onClose: () => void;
}

function FullSizePopup({ src, alt, onClose }: FullSizePopupProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        animate(overlayRef.current!, {
            opacity:  [0, 1],
            duration: 250,
            ease:     'easeOutQuad',
        });
        animate(containerRef.current!, {
            opacity:  [0, 1],
            scale:    [0.92, 1],
            duration: 350,
            ease:     'easeOutQuart',
        });

        const handler = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClose = (): void => {
        animate(containerRef.current!, {
            opacity:  [1, 0],
            scale:    [1, 0.94],
            duration: 200,
            ease:     'easeInQuart',
        });
        animate(overlayRef.current!, {
            opacity:    [1, 0],
            duration:   220,
            ease:       'easeInQuad',
            onComplete: onClose,
        });
    };

    return (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                ref={overlayRef}
                className="absolute inset-0 cursor-zoom-out"
                style={{
                    background: 'rgba(2,5,14,0.96)',
                    // FIX PERF #9: backdropFilter dihapus dari overlay popup juga
                    // background sudah cukup opaque (0.96), blur tidak menambah nilai visual
                    opacity:    0,
                }}
                onClick={handleClose}
            />

            <div
                ref={containerRef}
                className="relative z-10 max-w-[95vw] max-h-[95vh]"
                style={{ opacity: 0 }}
            >
                <img
                    src={src}
                    alt={alt}
                    className="max-w-full max-h-[95vh] object-contain rounded-xl shadow-2xl"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    decoding="async"
                />

                {/* Tombol close */}
                <button
                    type="button"
                    aria-label="Tutup foto ukuran penuh"
                    onClick={handleClose}
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                    style={{
                        background:     'rgba(15,23,42,0.95)',
                        border:         '1px solid rgba(255,255,255,0.15)',
                        color:          'rgba(255,255,255,0.7)',
                        backdropFilter: 'blur(8px)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(212,175,55,0.9)';
                        e.currentTarget.style.color      = '#020508';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(15,23,42,0.95)';
                        e.currentTarget.style.color      = 'rgba(255,255,255,0.7)';
                    }}
                >
                    <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
                </button>

                {/* Label foto */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                    <span
                        className="text-[10px] font-medium tracking-wide px-3 py-1 rounded-full"
                        style={{
                            background:     'rgba(2,5,14,0.8)',
                            color:          'rgba(255,255,255,0.5)',
                            backdropFilter: 'blur(8px)',
                            border:         '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        {alt}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Lightbox
//  FIX BUG #2: navy konsisten untuk semua type (image & video)
//  FIX BUG #3: video tidak lagi gelap — overlay navy dihapus untuk video
//  FIX BUG #4: satu token warna base untuk info panel
//  FIX BUG #5: fog-image di panel kanan cover area hitam akibat aspect ratio
//  FIX PERF #9: backdropFilter dihapus dari overlay fullscreen
// ─────────────────────────────────────────────────────────────────────────────

interface LightboxProps {
    item:       GalleryItem;
    total:      number;
    currentIdx: number;
    onClose:    () => void;
    onNavigate: (dir: number) => void;
}

function Lightbox({ item, total, currentIdx, onClose, onNavigate }: LightboxProps) {
    const panelRef    = useRef<HTMLDivElement>(null);
    const overlayRef  = useRef<HTMLDivElement>(null);
    const infoRef     = useRef<HTMLDivElement>(null);

    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const touchStartT = useRef<number>(0);

    const [fullSizeSrc, setFullSizeSrc] = useState<string | null>(null);

    // Entrance animation — fade + scale dari tengah
    useEffect(() => {
        animate(overlayRef.current!, {
            opacity:  [0, 1],
            duration: 300,
            ease:     'easeOutQuad',
        });
        animate(panelRef.current!, {
            opacity:  [0, 1],
            scale:    [0.96, 1],
            duration: 380,
            ease:     'easeOutQuart',
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Info panel slide-in setiap item berganti
    useEffect(() => {
        if (!infoRef.current) return;
        animate(infoRef.current, {
            opacity:    [0, 1],
            translateX: [-16, 0],
            duration:   380,
            ease:       'easeOutQuart',
        });
    }, [item.id]);

    // Reset fullsize popup saat item berganti
    useEffect(() => {
        setFullSizeSrc(null);
    }, [item.id]);

    const handleClose = useCallback((): void => {
        animate(panelRef.current!, {
            opacity:  [1, 0],
            scale:    [1, 0.96],
            duration: 260,
            ease:     'easeInQuart',
        });
        animate(overlayRef.current!, {
            opacity:    [1, 0],
            duration:   280,
            ease:       'easeInQuad',
            onComplete: onClose,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onClose]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent): void => {
            // Jika fullsize popup aktif, biarkan FullSizePopup handle Escape-nya
            if (fullSizeSrc) return;
            if (e.key === 'Escape')     handleClose();
            if (e.key === 'ArrowLeft')  onNavigate(-1);
            if (e.key === 'ArrowRight') onNavigate(1);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [fullSizeSrc, onNavigate, handleClose]);

    // Swipe dengan momentum detection
    const onTouchStart = (e: React.TouchEvent): void => {
        if (fullSizeSrc) return;
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        touchStartT.current = Date.now();
    };

    const onTouchEnd = (e: React.TouchEvent): void => {
        if (fullSizeSrc || touchStartX.current === null || touchStartY.current === null) return;
        const deltaX    = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY    = e.changedTouches[0].clientY - touchStartY.current;
        const deltaTime = Date.now() - touchStartT.current;
        // Jika swipe lebih ke arah vertikal, abaikan
        if (Math.abs(deltaY) > Math.abs(deltaX)) return;
        // Threshold lebih rendah untuk swipe cepat (< 300ms)
        const threshold = deltaTime < 300 ? 30 : 60;
        if (Math.abs(deltaX) > threshold) onNavigate(deltaX < 0 ? 1 : -1);
        touchStartX.current = null;
        touchStartY.current = null;
    };

    // ── Button styles ─────────────────────────────────────────────────────────

    const btnStyle: React.CSSProperties = {
        border:     '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.06)',
        color:      'rgba(255,255,255,0.55)',
        transition: 'background 0.2s, color 0.2s, border-color 0.2s',
    };

    // nav=true → full gold (tombol prev/next)
    // nav=false → subtle gold (tombol close)
    const onBtnHover = (e: React.MouseEvent<HTMLButtonElement>, nav = false): void => {
        const el = e.currentTarget;
        if (nav) {
            el.style.background   = '#D4AF37';
            el.style.color        = '#020508';
            el.style.borderColor  = '#D4AF37';
        } else {
            el.style.background   = 'rgba(212,175,55,0.15)';
            el.style.color        = '#D4AF37';
            el.style.borderColor  = 'rgba(212,175,55,0.4)';
        }
    };

    const onBtnLeave = (e: React.MouseEvent<HTMLButtonElement>): void => {
        const el = e.currentTarget;
        el.style.background  = 'rgba(255,255,255,0.06)';
        el.style.color       = 'rgba(255,255,255,0.55)';
        el.style.borderColor = 'rgba(255,255,255,0.12)';
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <div
                className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-8 lg:p-12"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {/* ── Overlay backdrop
                    FIX PERF #9: backdropFilter blur(20px) DIHAPUS dari overlay fullscreen.
                    Blur fullscreen adalah operasi GPU terberat — drop ke 15fps di mobile.
                    Background opacity dinaikkan dari 0.92 ke 0.95 sebagai kompensasi visual. */}
                <div
                    ref={overlayRef}
                    className="absolute inset-0"
                    style={{
                        background: 'rgba(2,5,14,0.95)',
                        opacity:    0,
                    }}
                    onClick={handleClose}
                />

                {/* ── Panel utama ────────────────────────────────────────── */}
                <div
                    ref={panelRef}
                    className="relative z-10 w-full max-w-[1100px] flex flex-col lg:flex-row overflow-hidden"
                    style={{
                        borderRadius: '2rem',
                        border:       '1px solid rgba(255,255,255,0.07)',
                        // FIX BUG #4: base background panel KONSISTEN untuk image & video
                        // Fog hanya jadi aksen via img blur di belakang — bukan penentu warna utama
                        background:   'rgba(10,15,30,0.98)',
                        boxShadow:    '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
                        maxHeight:    '90vh',
                        opacity:      0,
                    }}
                >
                    {/* ── Panel kiri — info ─────────────────────────────── */}
                    <div
                        className="relative w-full lg:w-[38%] flex flex-col justify-between overflow-hidden"
                        style={{
                            borderRight: '1px solid rgba(255,255,255,0.05)',
                            minHeight:   '280px',
                            maxHeight:   '88vh',
                        }}
                    >
                        {/* ── Fog-image background panel kiri
                            FIX BUG #2 & #4: KONSISTEN untuk image dan video.
                            - Image: fog dari foto itu sendiri (natural, unik per foto)
                            - Video: fog dari gradient navy — tidak ada thumbnail video
                            Overlay navy SAMA untuk keduanya → tema konsisten.
                            brightness(0.18) membuat fog sangat gelap → teks tetap terbaca. */}
                        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                            {item.type === 'image' ? (
                                <img
                                    src={item.src}
                                    alt=""
                                    aria-hidden={true}
                                    className="w-full h-full object-cover"
                                    style={{
                                        filter:    'blur(50px) saturate(1.4) brightness(0.18)',
                                        transform: 'scale(1.25)',
                                    }}
                                />
                            ) : (
                                // Video tidak punya thumbnail — pakai gradient gelap
                                <div
                                    style={{
                                        width:      '100%',
                                        height:     '100%',
                                        background: 'linear-gradient(145deg, rgba(20,30,60,0.9) 0%, rgba(8,12,28,0.95) 100%)',
                                    }}
                                />
                            )}
                            {/* Overlay navy — SAMA untuk image dan video → konsistensi tema
                                FIX BUG #4: satu nilai overlay untuk semua type */}
                            <div
                                className="absolute inset-0"
                                style={{ background: 'rgba(10,18,40,0.82)' }}
                            />
                        </div>

                        {/* Konten info panel */}
                        <div
                            ref={infoRef}
                            className="relative flex flex-col justify-between h-full overflow-y-auto"
                            style={{ zIndex: 1, padding: '3rem 3rem 2.5rem' }}
                        >
                            {/* Category chip + close button */}
                            <div className="flex items-center justify-between mb-8">
                                {item.category ? (
                                    <span
                                        className="text-[9px] font-extrabold tracking-[0.28em] uppercase px-3 py-1.5 rounded-full"
                                        style={{
                                            color:      '#D4AF37',
                                            border:     '1px solid rgba(212,175,55,0.3)',
                                            background: 'rgba(212,175,55,0.07)',
                                        }}
                                    >
                                        {item.category}
                                    </span>
                                ) : (
                                    // Placeholder agar tombol close tetap di kanan saat tidak ada category
                                    <span />
                                )}
                                <button
                                    type="button"
                                    aria-label="Tutup lightbox"
                                    className="w-9 h-9 rounded-full flex items-center justify-center ml-auto"
                                    style={btnStyle}
                                    onClick={handleClose}
                                    onMouseEnter={(e) => onBtnHover(e)}
                                    onMouseLeave={onBtnLeave}
                                >
                                    <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="flex-1">
                                <h3
                                    className="text-white font-extrabold leading-tight mb-5"
                                    style={{
                                        fontSize:      'clamp(1.4rem, 3vw, 2rem)',
                                        fontFamily:    "'Clash Display', 'DM Sans', sans-serif",
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {item.title}
                                </h3>
                                <div className="flex items-center gap-3 mb-6">
                                    <div
                                        className="h-px flex-1"
                                        style={{
                                            background: 'linear-gradient(to right, #D4AF37, rgba(212,175,55,0))',
                                        }}
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
                                    style={{
                                        color:      'rgba(148,163,184,0.9)',
                                        fontWeight: 450,
                                    }}
                                />
                            </div>

                            {/* Nav + counter */}
                            <div
                                className="mt-10 pt-6"
                                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {(
                                            [
                                                { icon: 'fa-arrow-left',  dir: -1 as const, label: 'Foto sebelumnya' },
                                                { icon: 'fa-arrow-right', dir:  1 as const, label: 'Foto berikutnya'  },
                                            ] as const
                                        ).map(({ icon, dir, label }) => (
                                            <button
                                                key={icon}
                                                type="button"
                                                aria-label={label}
                                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                                style={btnStyle}
                                                onClick={() => onNavigate(dir)}
                                                onMouseEnter={(e) => onBtnHover(e, true)}
                                                onMouseLeave={onBtnLeave}
                                            >
                                                <i className={`fa-solid ${icon} text-[11px]`} aria-hidden="true" />
                                            </button>
                                        ))}
                                    </div>

                                    {/* FIX DEAD CODE #4: currentIdx dihitung sekali di parent
                                        dan di-pass sebagai prop — tidak ada findIndex dobel */}
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="font-bold tabular-nums text-[13px]"
                                            style={{ color: '#D4AF37' }}
                                        >
                                            {String(currentIdx + 1).padStart(2, '0')}
                                        </span>
                                        <div
                                            className="w-12 h-px relative"
                                            style={{ background: 'rgba(255,255,255,0.15)' }}
                                        >
                                            <div
                                                className="absolute inset-y-0 left-0 transition-all duration-500"
                                                style={{
                                                    width:      `${((currentIdx + 1) / total) * 100}%`,
                                                    background: 'linear-gradient(to right, #D4AF37, #F5E098)',
                                                }}
                                            />
                                        </div>
                                        <span
                                            className="tabular-nums text-[13px]"
                                            style={{ color: 'rgba(255,255,255,0.3)' }}
                                        >
                                            {String(total).padStart(2, '0')}
                                        </span>
                                    </div>
                                </div>

                                {/* Keyboard hint — desktop only */}
                                <p
                                    className="mt-4 text-[10px] tracking-wider hidden sm:block"
                                    style={{ color: 'rgba(255,255,255,0.2)' }}
                                >
                                    {(['←', '→'] as const).map((k) => (
                                        <kbd
                                            key={k}
                                            className="px-1.5 py-0.5 rounded text-[9px] mr-1"
                                            style={{
                                                border:     '1px solid rgba(255,255,255,0.15)',
                                                background: 'rgba(255,255,255,0.05)',
                                            }}
                                        >
                                            {k}
                                        </kbd>
                                    ))}
                                    Navigate &nbsp;·&nbsp;
                                    <kbd
                                        className="px-1.5 py-0.5 rounded text-[9px]"
                                        style={{
                                            border:     '1px solid rgba(255,255,255,0.15)',
                                            background: 'rgba(255,255,255,0.05)',
                                        }}
                                    >
                                        Esc
                                    </kbd>
                                    {' '}Close
                                </p>

                                {/* Swipe hint — mobile only */}
                                <p
                                    className="mt-4 text-[10px] tracking-wider flex items-center gap-1.5 sm:hidden"
                                    style={{ color: 'rgba(255,255,255,0.2)' }}
                                >
                                    <i className="fa-solid fa-hand-pointer text-[9px]" aria-hidden="true" />
                                    Geser kiri / kanan untuk navigasi
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Panel kanan — media ── */}
                    <div
                        className="w-full lg:w-[62%] flex items-center justify-center overflow-hidden relative"
                        style={{
                            minHeight:  '200px',
                            height:     '55vh',
                            flex:       '1 1 auto',
                            // Background netral — untuk image akan ditimpa fog, untuk video tetap terlihat
                            background: item.type === 'video' ? '#050810' : 'rgba(6,10,22,0.98)',
                        }}
                    >
                        {/* Fog background — HANYA untuk image, cover area hitam dari aspect ratio */}
                        {item.type === 'image' && (
                            <>
                                <img
                                    src={item.src}
                                    alt=""
                                    aria-hidden={true}
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                    style={{
                                        filter:    'blur(50px) saturate(1.3) brightness(0.25)',
                                        transform: 'scale(1.25)',
                                    }}
                                />
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ background: 'rgba(6,10,22,0.18)', zIndex: 1 }}
                                />
                            </>
                        )}

                        {/* Media utama — video dan image sama-sama di z-10 */}
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                            {item.type === 'video' ? (
                                <video
                                    key={item.id}
                                    src={item.src}
                                    controls
                                    autoPlay
                                    muted
                                    className="w-full h-full"
                                    style={{
                                        // object-contain agar video tidak terpotong
                                        // background transparan — tidak ada layer gelap di atas video
                                        objectFit:   'contain',
                                        maxHeight:   '55vh',
                                        background:  'transparent',
                                        display:     'block',
                                    }}
                                />
                            ) : (
                                <img
                                    key={item.id}
                                    src={item.src}
                                    alt={item.title}
                                    className="w-full h-full object-contain transition-opacity duration-200 hover:opacity-90"
                                    style={{ maxHeight: '55vh', cursor: 'zoom-in' }}
                                    onClick={() => setFullSizeSrc(item.src)}
                                    title="Klik untuk melihat ukuran penuh"
                                />
                            )}
                        </div>

                        {/* Hint zoom — hanya untuk image */}
                        {item.type === 'image' && (
                            <div
                                className="absolute bottom-3 right-3 z-10 pointer-events-none"
                                style={{
                                    background:     'rgba(2,5,14,0.7)',
                                    backdropFilter: 'blur(8px)',
                                    border:         '1px solid rgba(255,255,255,0.1)',
                                    borderRadius:   '999px',
                                    padding:        '4px 10px',
                                    display:        'flex',
                                    alignItems:     'center',
                                    gap:            '5px',
                                }}
                            >
                                <i
                                    className="fa-solid fa-magnifying-glass-plus text-[9px]"
                                    style={{ color: '#D4AF37' }}
                                    aria-hidden="true"
                                />
                                <span
                                    className="text-[9px] font-medium"
                                    style={{ color: 'rgba(255,255,255,0.5)' }}
                                >
                                    Klik untuk perbesar
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FullSizePopup — z-[1001] di atas lightbox z-[999] */}
            {fullSizeSrc !== null && (
                <FullSizePopup
                    src={fullSizeSrc}
                    alt={item.title}
                    onClose={() => setFullSizeSrc(null)}
                />
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CinematicShowcase — Main component
//  FIX DEAD CODE #3: empty state check dihapus (MASTER_DATA selalu ada 35 items)
//  FIX DEAD CODE #4: currentIdx di-memoize, navigate pakai currentIdx langsung
// ─────────────────────────────────────────────────────────────────────────────

export default function CinematicShowcase() {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const { row1, row2 } = useMemo(() => {
        const photos     = MASTER_DATA.filter((i) => i.type === 'image').slice(0, 31);
        const videos     = MASTER_DATA.filter((i) => i.type === 'video');
        const half       = Math.ceil(photos.length / 2);
        const row2Photos = photos.slice(half);
        const step       = Math.floor(row2Photos.length / videos.length);
        const mixed: GalleryItem[] = [];
        row2Photos.forEach((photo, idx) => {
            mixed.push(photo);
            const vidIdx = Math.floor(idx / step);
            if ((idx + 1) % step === 0 && videos[vidIdx] !== undefined) {
                mixed.push(videos[vidIdx]);
            }
        });
        return { row1: photos.slice(0, half), row2: mixed };
    }, []);

    // FIX DEAD CODE #4: currentIdx di-memoize di sini — tidak dihitung ulang
    // di dalam navigate() dengan findIndex kedua
    const currentIdx = useMemo(
        () => (activeIndex !== null ? MASTER_DATA.findIndex((i) => i.id === activeIndex) : -1),
        [activeIndex],
    );

    const activeItem = currentIdx >= 0 ? (MASTER_DATA[currentIdx] ?? null) : null;

    // Header reveal animation — sekali saat mount
    useEffect(() => {
        if (!headerRef.current) return;
        animate(
            headerRef.current.querySelectorAll<HTMLElement>('[data-reveal]'),
            {
                opacity:    [0, 1],
                translateY: [24, 0],
                delay:      stagger(80, { start: 100 }),
                duration:   700,
                ease:       'easeOutQuart',
            },
        );
    }, []);

    // FIX DEAD CODE #4: navigate menggunakan currentIdx yang sudah ada
    // Tidak ada findIndex kedua di dalam navigate
    const navigate = useCallback(
        (dir: number): void => {
            if (currentIdx < 0) return;
            const next = (currentIdx + dir + MASTER_DATA.length) % MASTER_DATA.length;
            setActiveIndex(MASTER_DATA[next].id);
        },
        [currentIdx],
    );

    const handleItemClick = useCallback((id: number): void => {
        setActiveIndex(id);
    }, []);

    return (
        <section
            className="relative overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, #020508 0%, #040c1e 40%, #030a18 100%)',
                borderTop:  '1px solid rgba(255,255,255,0.04)',
            }}
        >
            {/* Ambient glow decorators — pointer-events-none, tidak interaktif */}
            <div
                className="pointer-events-none absolute -top-48 left-1/4 w-[600px] h-[600px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 65%)',
                    filter:     'blur(60px)',
                }}
            />
            <div
                className="pointer-events-none absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 65%)',
                    filter:     'blur(80px)',
                }}
            />

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div
                ref={headerRef}
                className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 text-center"
            >
                <div
                    data-reveal
                    className="inline-flex items-center gap-3 mb-5"
                    style={{ opacity: 0 }}
                >
                    <div
                        className="h-px w-8"
                        style={{ background: 'linear-gradient(to right, transparent, #D4AF37)' }}
                    />
                    <span
                        className="text-[10px] font-extrabold tracking-[0.35em] uppercase"
                        style={{ color: '#D4AF37' }}
                    >
                        Media Showcase
                    </span>
                    <div
                        className="h-px w-8"
                        style={{ background: 'linear-gradient(to left, transparent, #D4AF37)' }}
                    />
                </div>

                <h2
                    data-reveal
                    className="font-extrabold tracking-tight leading-[1.05] mb-6"
                    style={{
                        fontSize:   'clamp(2rem, 5vw, 3.25rem)',
                        fontFamily: "'Clash Display', 'DM Sans', sans-serif",
                        opacity:    0,
                    }}
                >
                    <span className="cinematic-title-shimmer">
                        Eksplorasi Fasilitas Unggulan.
                    </span>
                </h2>

                <p
                    data-reveal
                    className="max-w-xl mx-auto leading-relaxed text-[15px]"
                    style={{
                        color:      'rgba(148,163,184,0.75)',
                        fontWeight: 450,
                        opacity:    0,
                    }}
                >
                    Lihat lebih dekat lingkungan belajar, infrastruktur, dan aktivitas harian
                    yang membentuk profesional masa depan Indonesia.
                </p>

                {/* Stats grid */}
                <div
                    data-reveal
                    className="mt-12 grid grid-cols-2 lg:grid-cols-4 max-w-2xl mx-auto overflow-hidden rounded-2xl"
                    style={{
                        opacity: 0,
                        border:  '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    {STATS.map((s, i) => (
                        <div
                            key={s.label}
                            className="flex flex-col items-center py-5 px-3"
                            style={{
                                background:  'rgba(4,10,28,0.6)',
                                borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            }}
                        >
                            <span
                                className="font-extrabold tabular-nums"
                                style={{
                                    fontSize:      'clamp(1.25rem, 3vw, 1.5rem)',
                                    fontFamily:    "'Clash Display', sans-serif",
                                    color:         '#D4AF37',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {s.value}
                            </span>
                            <span
                                className="text-[10px] font-medium tracking-wide mt-1 text-center"
                                style={{
                                    color:      'rgba(148,163,184,0.6)',
                                    lineHeight: '1.3',
                                }}
                            >
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Double Marquee ─────────────────────────────────────────── */}
            <div className="smq-mask flex flex-col gap-7 pb-24">
                <SeamlessTrack
                    items={row1}
                    direction="left"
                    duration={120}
                    gap={20}
                    onItemClick={handleItemClick}
                    lightboxActive={activeIndex !== null}
                    loading="eager"
                />
                <SeamlessTrack
                    items={row2}
                    direction="right"
                    duration={140}
                    gap={20}
                    onItemClick={handleItemClick}
                    lightboxActive={activeIndex !== null}
                    loading="lazy"
                />
            </div>

            {/* ── Lightbox ───────────────────────────────────────────────── */}
            {activeItem !== null && (
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
