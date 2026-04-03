import { useState, useRef, useCallback, useEffect } from 'react';
import { animate } from 'animejs';

export type GalleryItem = {
    id: number;
    type: 'image' | 'video';
    src: string;
    title: string;
    description: string;
    category?: string;
    size?: 'narrow' | 'normal' | 'wide';
};

export type OriginRect = { top: number; left: number; width: number; height: number };

interface Props {
    item: GalleryItem;
    onClick: (origin: OriginRect) => void;
    lightboxActive?: boolean;
}

const SIZE_WIDTH: Record<NonNullable<GalleryItem['size']>, { mobile: string; desktop: string }> = {
    narrow: { mobile: '130px', desktop: '180px' },
    normal: { mobile: '180px', desktop: '260px' },
    wide:   { mobile: '240px', desktop: '360px' },
};

// ─────────────────────────────────────────────
//  Ripple
// ─────────────────────────────────────────────
function spawnRipple(container: HTMLDivElement, e: React.MouseEvent) {
    const rect   = container.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.style.cssText = `
        position:absolute;
        left:${e.clientX - rect.left}px;
        top:${e.clientY - rect.top}px;
        width:8px;height:8px;border-radius:50%;
        background:radial-gradient(circle,rgba(212,175,55,0.7) 0%,rgba(212,175,55,0) 70%);
        transform:translate(-50%,-50%) scale(0);
        pointer-events:none;z-index:99;
    `;
    container.appendChild(ripple);
    animate(ripple, {
        scale: [0, 28], opacity: [1, 0],
        duration: 650, ease: 'easeOutExpo',
        onComplete: () => ripple.remove(),
    });
}

export default function GalleryCard({ item, onClick, lightboxActive = false }: Props) {
    const cardRef  = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const animFrame = useRef<number>(0);

    const [isHovered, setIsHovered] = useState(false);
    const [isLoaded,  setIsLoaded]  = useState(false);

    const sizeKey   = item.size ?? 'normal';
    const cardWidth = `clamp(${SIZE_WIDTH[sizeKey].mobile}, 15vw, ${SIZE_WIDTH[sizeKey].desktop})`;

    // Reset loaded state kalau src berubah
    useEffect(() => { setIsLoaded(false); }, [item.src]);

    // ── Magnetic + 3D ──
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || !innerRef.current || lightboxActive) return;
        cancelAnimationFrame(animFrame.current);
        animFrame.current = requestAnimationFrame(() => {
            const { left, top, width, height } = cardRef.current!.getBoundingClientRect();
            const dx = ((e.clientX - left) / width  - 0.5) * 2;
            const dy = ((e.clientY - top)  / height - 0.5) * 2;
            animate(cardRef.current!, {
                translateX: dx * 8, translateY: dy * 8,
                rotateX: dy * -12,  rotateY: dx * 12,
                duration: 400, ease: 'easeOutQuart',
            });
            animate(innerRef.current!, {
                translateX: dx * -6, translateY: dy * -6, scale: 1.06,
                duration: 400, ease: 'easeOutQuart',
            });
        });
    }, [lightboxActive]);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
        if (item.type === 'video' && videoRef.current && !lightboxActive) {
            videoRef.current.play().catch(() => {});
        }
    }, [item.type, lightboxActive]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        cancelAnimationFrame(animFrame.current);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
        if (lightboxActive) return;
        animate(cardRef.current!, {
            translateX: 0, translateY: 0, rotateX: 0, rotateY: 0,
            duration: 900, ease: 'easeOutElastic(1, 0.5)',
        });
        animate(innerRef.current!, {
            translateX: 0, translateY: 0, scale: 1,
            duration: 900, ease: 'easeOutElastic(1, 0.5)',
        });
    }, [lightboxActive]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        spawnRipple(cardRef.current, e);
        animate(cardRef.current, {
            scale: [1, 0.96, 1], duration: 300, ease: 'easeInOutQuad',
        });
        // Kirim origin rect ke parent untuk animasi lightbox
        const rect = cardRef.current.getBoundingClientRect();
        setTimeout(() => onClick({
            top:    rect.top,
            left:   rect.left,
            width:  rect.width,
            height: rect.height,
        }), 180);
    }, [onClick]);

    return (
        <div
            ref={cardRef}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative h-[160px] sm:h-[200px] md:h-[230px] flex-shrink-0 rounded-2xl overflow-hidden cursor-none group"
            style={{
                width: cardWidth,
                perspective: '900px',
                transformStyle: 'preserve-3d',
                willChange: lightboxActive ? 'auto' : 'transform',
                boxShadow: isHovered
                    ? '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.25)'
                    : '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
                transition: 'box-shadow 0.4s ease',
            }}
        >
            {/* ── Dark placeholder saat loading ── */}
            {!isLoaded && (
                <div className="absolute inset-0" style={{ background: '#080d1a', zIndex: 5 }} />
            )}

            {/* ── Media ── */}
            <div ref={innerRef} className="absolute inset-0" style={{ willChange: lightboxActive ? 'auto' : 'transform' }}>
                {item.type === 'image' ? (
                    <img
                        src={item.src}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        draggable={false}
                        onLoad={() => setIsLoaded(true)}
                    />
                ) : (
                    <video
                        ref={videoRef}
                        src={item.src}
                        className="h-full w-full object-cover"
                        muted loop playsInline
                        preload="metadata"
                        controls={false}
                        disablePictureInPicture
                        onLoadedMetadata={() => setIsLoaded(true)}
                    />
                )}
            </div>

            {/* ── Permanent dark gradient — kontras teks ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(to top, rgba(4,8,20,0.85) 0%, rgba(4,8,20,0.15) 50%, transparent 100%)',
                    zIndex: 6,
                }}
            />

            {/* ── Hover overlay ── */}
            <div
                className="absolute inset-0 flex flex-col justify-end p-5"
                style={{
                    zIndex: 7,
                    opacity: isHovered ? 1 : 0,
                    background: 'linear-gradient(135deg, rgba(4,8,20,0.6) 0%, rgba(10,18,40,0.45) 100%)',
                    backdropFilter: isHovered ? 'blur(4px)' : 'blur(0px)',
                    transition: 'opacity 0.5s ease, backdropFilter 0.5s ease',
                }}
            >
                {item.category && (
                    <span
                        className="absolute top-4 left-4 text-[9px] font-extrabold tracking-[0.25em] uppercase px-2.5 py-1 rounded-full"
                        style={{ color: '#D4AF37', border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.08)' }}
                    >
                        {item.category}
                    </span>
                )}
                <p
                    className="text-white font-bold text-[13px] leading-snug"
                    style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif", textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
                >
                    {item.title}
                </p>
                <div className="flex items-center gap-2.5 mt-2.5">
                    <div className="h-[1.5px] rounded-full" style={{
                        width: isHovered ? '2rem' : '0px',
                        background: 'linear-gradient(to right, #D4AF37, #F5E098)',
                        transition: 'width 0.55s cubic-bezier(0.16,1,0.3,1) 0.05s',
                    }} />
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.22em]"
                        style={{ color: '#D4AF37', opacity: isHovered ? 1 : 0, transition: 'opacity 0.4s 0.15s' }}>
                        Lihat Detail
                    </span>
                </div>
            </div>

            {/* ── Permanent bottom title (idle) ── */}
            <div
                className="absolute bottom-0 left-0 right-0 p-4 pt-8 pointer-events-none"
                style={{
                    zIndex: 7,
                    opacity: isHovered ? 0 : 1,
                    transition: 'opacity 0.3s ease',
                    background: 'linear-gradient(to top, rgba(4,8,20,0.75) 0%, transparent 100%)',
                }}
            >
                <p className="text-white/80 font-semibold text-[11px] leading-tight truncate">{item.title}</p>
            </div>

            {/* ── Video badge ── */}
            {item.type === 'video' && (
                <div
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
                    style={{
                        zIndex: 8,
                        background: 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        opacity: isHovered ? 0 : 1,
                        transform: isHovered ? 'scale(0.85)' : 'scale(1)',
                        transition: 'opacity 0.3s, transform 0.3s',
                    }}
                >
                    <div className="relative w-1.5 h-1.5">
                        <div className="absolute inset-0 rounded-full" style={{
                            background: '#D4AF37',
                            animation: lightboxActive ? 'none' : 'video-pulse-ring 2s ease-out infinite',
                        }} />
                        <div className="w-1.5 h-1.5 rounded-full relative" style={{ background: '#D4AF37' }} />
                    </div>
                    <span className="text-white/80 text-[8px] font-bold tracking-wider uppercase">Video</span>
                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes video-pulse-ring {
                            0%   { transform: scale(1);   opacity: 0.8; }
                            70%  { transform: scale(2.8); opacity: 0;   }
                            100% { transform: scale(1);   opacity: 0;   }
                        }
                    ` }} />
                </div>
            )}

            {/* ── Custom cursor ── */}
            <div
                className="absolute pointer-events-none flex items-center justify-center rounded-full"
                style={{
                    zIndex: 9,
                    width: isHovered ? '48px' : '0px',
                    height: isHovered ? '48px' : '0px',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    background: 'rgba(212,175,55,0.12)',
                    border: isHovered ? '1.5px solid rgba(212,175,55,0.5)' : '0px solid transparent',
                    backdropFilter: 'blur(6px)',
                    transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1), height 0.4s cubic-bezier(0.34,1.56,0.64,1), border 0.3s',
                }}
            >
                <i
                    className={`fa-solid ${item.type === 'video' ? 'fa-play' : 'fa-expand'} text-[10px]`}
                    style={{ color: '#D4AF37', opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s 0.1s' }}
                />
            </div>

            {/* ── Corner accents ── */}
            <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none" style={{
                zIndex: 8,
                opacity: isHovered ? 1 : 0, transition: 'opacity 0.4s',
                borderTop: '1.5px solid rgba(212,175,55,0.5)',
                borderLeft: '1.5px solid rgba(212,175,55,0.5)',
                borderRadius: '0.75rem 0 0 0',
            }} />
            <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none" style={{
                zIndex: 8,
                opacity: isHovered ? 1 : 0, transition: 'opacity 0.4s 0.05s',
                borderBottom: '1.5px solid rgba(212,175,55,0.5)',
                borderRight: '1.5px solid rgba(212,175,55,0.5)',
                borderRadius: '0 0 0.75rem 0',
            }} />
        </div>
    );
}