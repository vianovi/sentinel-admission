// resources/js/Components/Landing/GalleryCard.tsx

import { useState, useRef, useCallback, useEffect } from 'react';
import { animate } from 'animejs';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GalleryItem = {
    id:          number;
    type:        'image' | 'video';
    src:         string;
    title:       string;
    description: string;
    category?:   string;
    size?:       'narrow' | 'normal' | 'wide';
};

// DEAD CODE REMOVED: OriginRect tidak pernah dipakai di handleItemClick
// Props onClick disederhanakan menjadi () => void
interface Props {
    item:            GalleryItem;
    onClick:         () => void;
    lightboxActive?: boolean;
    loading?:        'eager' | 'lazy';
    shimmerDelay?:   number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Tinggi card tetap. Lebar berdasarkan size prop — landscape lebih lebar, portrait lebih sempit.
// Ini mempertahankan "crop window" feel: gambar terpotong natural di dalam bingkai.
const CARD_HEIGHT = '230px';

const SIZE_WIDTH: Record<NonNullable<GalleryItem['size']>, string> = {
    narrow: 'clamp(140px, 12vw, 190px)',  // foto portrait — lebih sempit
    normal: 'clamp(200px, 17vw, 280px)',  // foto square/landscape standar
    wide:   'clamp(280px, 24vw, 380px)',  // foto landscape lebar / video
};

// MAGNETIC_THROTTLE: 50ms → max 20 calls/detik per card (sudah efisien)
const MAGNETIC_THROTTLE = 50;

// ─── Ripple — DOM mutation pada klik, bukan per-hover ─────────────────────────
// Tetap pakai createElement karena ripple butuh posisi mouse yang presisi
// dan hanya terjadi saat klik (bukan continuous), jadi impact-nya minimal.
function spawnRipple(container: HTMLDivElement, e: React.MouseEvent): void {
    const rect   = container.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.style.cssText = [
        'position:absolute',
        `left:${e.clientX - rect.left}px`,
        `top:${e.clientY - rect.top}px`,
        'width:8px',
        'height:8px',
        'border-radius:50%',
        'background:radial-gradient(circle,rgba(212,175,55,0.7) 0%,rgba(212,175,55,0) 70%)',
        'transform:translate(-50%,-50%) scale(0)',
        'pointer-events:none',
        'z-index:99',
    ].join(';');
    container.appendChild(ripple);
    animate(ripple, {
        scale:      [0, 28],
        opacity:    [1, 0],
        duration:   650,
        ease:       'easeOutExpo',
        onComplete: () => ripple.remove(),
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GalleryCard({
    item,
    onClick,
    lightboxActive = false,
    loading        = 'lazy',
    shimmerDelay   = 0,
}: Props) {
    const cardRef      = useRef<HTMLDivElement>(null);
    const innerRef     = useRef<HTMLDivElement>(null);
    const videoRef     = useRef<HTMLVideoElement>(null);
    const shimmerRef   = useRef<HTMLDivElement>(null);
    // useRef untuk timer agar tidak trigger re-render
    const shimmerTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    // Throttle timestamp — useRef bukan useState agar tidak re-render
    const lastMagneticCall = useRef<number>(0);

    const [isHovered, setIsHovered] = useState(false);
    const [isLoaded,  setIsLoaded]  = useState(false);

    // Reset loaded state saat src berubah
    useEffect(() => { setIsLoaded(false); }, [item.src]);

    // ── Gold shimmer sweep — SATU layer saja, silver dihapus ─────────────────
    // FIX BUG #1: silver skeleton dihapus, hanya gold sweep yang jalan
    // FIX BUG #6: lightboxActive ditambahkan ke cek stop + deps array
    useEffect(() => {
        const el = shimmerRef.current;
        if (!el) return;

        const baseInterval = 4500;
        const jitter       = shimmerDelay * 600;

        const runShimmer = (): void => {
            // Stop jika hover ATAU lightbox aktif (hemat CPU saat modal open)
            if (!el || isHovered || lightboxActive) return;
            el.style.animation = 'none';
            // Force reflow untuk reset animation
            void el.offsetWidth;
            el.style.animation = 'gallery-shimmer 1.1s cubic-bezier(0.4,0,0.2,1) forwards';
            shimmerTimer.current = setTimeout(runShimmer, baseInterval + Math.random() * 2000);
        };

        shimmerTimer.current = setTimeout(runShimmer, jitter + 800);

        return () => {
            clearTimeout(shimmerTimer.current);
        };
    // lightboxActive ditambahkan agar timer stop saat lightbox buka
    }, [shimmerDelay, isHovered, lightboxActive]);

    // ── Magnetic 3D — direct CSS transform (PERF #3 fix) ─────────────────────
    // Sebelum: animate() buat animation instance baru tiap 50ms
    // Sekarang: langsung set style.transform → jauh lebih ringan, tidak ada
    //           overhead animejs object creation di mousemove
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
        if (!cardRef.current || !innerRef.current || lightboxActive) return;

        const now = Date.now();
        if (now - lastMagneticCall.current < MAGNETIC_THROTTLE) return;
        lastMagneticCall.current = now;

        const { left, top, width, height } = cardRef.current.getBoundingClientRect();
        const dx = ((e.clientX - left) / width  - 0.5) * 2;
        const dy = ((e.clientY - top)  / height - 0.5) * 2;

        // Direct CSS transform — tidak buat animation instance baru
        cardRef.current.style.transform =
            `perspective(800px) translateX(${dx * 8}px) translateY(${dy * 8}px) rotateX(${dy * -12}deg) rotateY(${dx * 12}deg)`;
        cardRef.current.style.transition = 'transform 0.35s cubic-bezier(0.22,1,0.36,1)';

        innerRef.current.style.transform =
            `translateX(${dx * -6}px) translateY(${dy * -6}px) scale(1.06)`;
        innerRef.current.style.transition = 'transform 0.35s cubic-bezier(0.22,1,0.36,1)';
    }, [lightboxActive]);

    const handleMouseEnter = useCallback((): void => {
        setIsHovered(true);
        if (item.type === 'video' && videoRef.current && !lightboxActive) {
            videoRef.current.play().catch(() => {
                // Autoplay dibatasi browser — abaikan error ini (expected behavior)
            });
        }
    }, [item.type, lightboxActive]);

    const handleMouseLeave = useCallback((): void => {
        setIsHovered(false);

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }

        if (lightboxActive) return;

        // Reset dengan animejs untuk spring physics — ini tetap pakai animejs
        // karena easeOutElastic tidak bisa di-replicate dengan CSS transition
        if (cardRef.current) {
            // Reset style.transform dulu agar animejs bisa override
            cardRef.current.style.transition = '';
            animate(cardRef.current, {
                translateX: 0, translateY: 0, rotateX: 0, rotateY: 0,
                duration:   700,
                ease:       'easeOutElastic(1, 0.4)',
            });
        }
        if (innerRef.current) {
            innerRef.current.style.transition = '';
            animate(innerRef.current, {
                translateX: 0, translateY: 0, scale: 1,
                duration:   700,
                ease:       'easeOutElastic(1, 0.4)',
            });
        }
    }, [lightboxActive]);

    // FIX DEAD CODE: onClick tidak lagi passing OriginRect
    // rect calculation dihapus, delay 180ms dipertahankan untuk ripple visual
    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
        if (!cardRef.current) return;
        spawnRipple(cardRef.current, e);
        animate(cardRef.current, {
            scale:    [1, 0.96, 1],
            duration: 300,
            ease:     'easeInOutQuad',
        });
        // Delay agar ripple sempat terlihat sebelum lightbox buka
        setTimeout(() => onClick(), 180);
    }, [onClick]);

    // onKeyDown — cast ke MouseEvent adalah workaround valid untuk keyboard-click
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Keyboard tidak punya koordinat mouse, ripple spawn di tengah card
            if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect();
                const syntheticEvent = {
                    clientX: rect.left + rect.width  / 2,
                    clientY: rect.top  + rect.height / 2,
                } as React.MouseEvent;
                spawnRipple(cardRef.current, syntheticEvent);
            }
            animate(cardRef.current!, {
                scale:    [1, 0.96, 1],
                duration: 300,
                ease:     'easeInOutQuad',
            });
            setTimeout(() => onClick(), 180);
        }
    }, [onClick]);

    return (
        <div
            ref={cardRef}
            role="button"
            tabIndex={0}
            aria-label={`Lihat ${item.type === 'video' ? 'video' : 'foto'} ${item.title}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                position:       'relative',
                flexShrink:     0,
                // Tinggi tetap, lebar mengikuti size prop (narrow/normal/wide)
                // → foto portrait terlihat sempit, landscape terlihat lebar
                // → semua foto di-crop dengan object-cover, bukan ditampilkan penuh
                height:         CARD_HEIGHT,
                width:          SIZE_WIDTH[item.size ?? 'normal'],
                borderRadius:   '1rem',
                overflow:       'hidden',
                cursor:         'pointer',
                willChange:     lightboxActive ? 'auto' : 'transform',
                transformStyle: 'preserve-3d',
                perspective:    '800px',
            }}
        >
            {/* ── Skeleton placeholder — dark base tanpa sweep animation ──────
                FIX BUG #1: gallery-placeholder-sweep DIHAPUS (silver yang samar-samar)
                Cukup dark background solid — lebih clean, tidak ada shimmer dobel.
                Gold shimmer sweep (shimmerRef di bawah) sudah cukup sebagai loading indicator. */}
            {!isLoaded && (
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(135deg, rgba(8,16,40,0.95) 0%, rgba(4,8,20,0.9) 100%)',
                        zIndex:     5,
                    }}
                />
            )}

            {/* ── Media layer ────────────────────────────────────────────────── */}
            <div
                ref={innerRef}
                className="absolute inset-0"
                style={{ willChange: lightboxActive ? 'auto' : 'transform' }}
            >
                {item.type === 'image' ? (
                    <img
                        src={item.src}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        draggable={false}
                        loading={loading}
                        decoding="async"
                        onLoad={() => setIsLoaded(true)}
                    />
                ) : (
                    <video
                        ref={videoRef}
                        src={item.src}
                        className="h-full w-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        disablePictureInPicture
                        onLoadedMetadata={() => setIsLoaded(true)}
                    />
                )}
            </div>

            {/* ── Gold shimmer sweep (SATU-SATUNYA shimmer) ─────────────────
                FIX BUG #1: Hanya layer ini yang jalan. Silver placeholder-sweep dihapus.
                Opacity ke 0 saat hover — tidak perlu shimmer saat user sedang interaksi. */}
            <div
                ref={shimmerRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                    zIndex:     8,
                    background: 'linear-gradient(105deg, transparent 20%, rgba(212,175,55,0.22) 50%, rgba(245,224,152,0.10) 60%, transparent 80%)',
                    opacity:    isHovered ? 0 : 1,
                    transition: 'opacity 0.3s',
                }}
            />

            {/* ── Permanent dark gradient (bottom shadow untuk teks) ────────── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(to top, rgba(4,8,20,0.85) 0%, rgba(4,8,20,0.15) 50%, transparent 100%)',
                    zIndex:     6,
                }}
            />

            {/* ── Hover overlay ───────────────────────────────────────────────
                FIX BUG #5 NOTE: backdropFilter dihapus dari sini.
                Blur effect di lightbox sudah ditangani oleh fog-image layer di CinematicShowcase.
                Di card sendiri, hover tidak perlu blur — cukup dark overlay + konten teks. */}
            <div
                className="absolute inset-0 flex flex-col justify-end p-5"
                style={{
                    zIndex:     7,
                    opacity:    isHovered ? 1 : 0,
                    background: 'linear-gradient(135deg, rgba(4,8,20,0.65) 0%, rgba(10,18,40,0.50) 100%)',
                    transition: 'opacity 0.5s ease',
                }}
            >
                {item.category && (
                    <span
                        className="absolute top-4 left-4 text-[9px] font-extrabold tracking-[0.25em] uppercase px-2.5 py-1 rounded-full"
                        style={{
                            color:      '#D4AF37',
                            border:     '1px solid rgba(212,175,55,0.35)',
                            background: 'rgba(212,175,55,0.08)',
                        }}
                    >
                        {item.category}
                    </span>
                )}
                <p
                    className="text-white font-bold text-[13px] leading-snug"
                    style={{
                        fontFamily: "'Clash Display', 'DM Sans', sans-serif",
                        textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                    }}
                >
                    {item.title}
                </p>
                <div className="flex items-center gap-2.5 mt-2.5">
                    <div
                        className="h-[1.5px] rounded-full"
                        style={{
                            width:      isHovered ? '2rem' : '0px',
                            background: 'linear-gradient(to right, #D4AF37, #F5E098)',
                            transition: 'width 0.55s cubic-bezier(0.16,1,0.3,1) 0.05s',
                        }}
                    />
                    <span
                        className="text-[9px] font-extrabold uppercase tracking-[0.22em]"
                        style={{
                            color:      '#D4AF37',
                            opacity:    isHovered ? 1 : 0,
                            transition: 'opacity 0.4s 0.15s',
                        }}
                    >
                        Lihat Detail
                    </span>
                </div>
            </div>

            {/* ── Idle bottom title (saat tidak hover) ────────────────────── */}
            <div
                className="absolute bottom-0 left-0 right-0 p-4 pt-8 pointer-events-none"
                style={{
                    zIndex:     7,
                    opacity:    isHovered ? 0 : 1,
                    transition: 'opacity 0.3s ease',
                    background: 'linear-gradient(to top, rgba(4,8,20,0.75) 0%, transparent 100%)',
                }}
            >
                <p className="text-white/80 font-semibold text-[11px] leading-tight truncate">
                    {item.title}
                </p>
            </div>

            {/* ── Video badge ─────────────────────────────────────────────────
                backdropFilter blur(8px) di sini tetap dipertahankan karena
                badge kecil (bukan fullscreen) — impact GPU sangat minimal. */}
            {item.type === 'video' && (
                <div
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
                    style={{
                        zIndex:         8,
                        background:     'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(8px)',
                        border:         '1px solid rgba(255,255,255,0.12)',
                        opacity:        isHovered ? 0 : 1,
                        transform:      isHovered ? 'scale(0.85)' : 'scale(1)',
                        transition:     'opacity 0.3s, transform 0.3s',
                    }}
                >
                    <div className="relative w-1.5 h-1.5">
                        <div
                            className="absolute inset-0 rounded-full gallery-video-pulse"
                            style={{
                                background:         '#D4AF37',
                                animationPlayState: lightboxActive ? 'paused' : 'running',
                            }}
                        />
                        <div
                            className="w-1.5 h-1.5 rounded-full relative"
                            style={{ background: '#D4AF37' }}
                        />
                    </div>
                    <span className="text-white/80 text-[8px] font-bold tracking-wider uppercase">
                        Video
                    </span>
                </div>
            )}

            {/* ── Custom cursor (center ring saat hover) ───────────────────── */}
            <div
                className="absolute pointer-events-none flex items-center justify-center rounded-full"
                style={{
                    zIndex:     9,
                    width:      isHovered ? '48px' : '0px',
                    height:     isHovered ? '48px' : '0px',
                    top:        '50%',
                    left:       '50%',
                    transform:  'translate(-50%,-50%)',
                    background: 'rgba(212,175,55,0.12)',
                    border:     isHovered ? '1.5px solid rgba(212,175,55,0.5)' : '0px solid transparent',
                    // backdropFilter dihapus dari cursor ring — tidak ada visual benefit
                    // tapi ada overhead blur per-card
                    transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1), height 0.4s cubic-bezier(0.34,1.56,0.64,1), border 0.3s',
                }}
            >
                <i
                    className={`fa-solid ${item.type === 'video' ? 'fa-play' : 'fa-expand'} text-[10px]`}
                    style={{
                        color:      '#D4AF37',
                        opacity:    isHovered ? 1 : 0,
                        transition: 'opacity 0.2s 0.1s',
                    }}
                />
            </div>

            {/* ── Corner accents ──────────────────────────────────────────── */}
            <div
                className="absolute top-0 left-0 w-8 h-8 pointer-events-none"
                style={{
                    zIndex:       8,
                    opacity:      isHovered ? 1 : 0,
                    transition:   'opacity 0.4s',
                    borderTop:    '1.5px solid rgba(212,175,55,0.5)',
                    borderLeft:   '1.5px solid rgba(212,175,55,0.5)',
                    borderRadius: '0.75rem 0 0 0',
                }}
            />
            <div
                className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none"
                style={{
                    zIndex:        8,
                    opacity:       isHovered ? 1 : 0,
                    transition:    'opacity 0.4s 0.05s',
                    borderBottom:  '1.5px solid rgba(212,175,55,0.5)',
                    borderRight:   '1.5px solid rgba(212,175,55,0.5)',
                    borderRadius:  '0 0 0.75rem 0',
                }}
            />
        </div>
    );
}