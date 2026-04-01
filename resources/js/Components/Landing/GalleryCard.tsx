import { useState, useRef, useCallback } from 'react';
import { animate } from 'animejs';

export type GalleryItem = {
    id: number;
    type: 'image' | 'video';
    src: string;
    thumbnail?: string;
    title: string;
    description: string;
    category?: string;
};

interface Props {
    item: GalleryItem;
    onClick: (originRect: DOMRect) => void;
}

// ─────────────────────────────────────────────
//  Ripple effect — gold glass burst on click
// ─────────────────────────────────────────────
function spawnRipple(container: HTMLDivElement, e: React.MouseEvent) {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
        position: absolute;
        left: ${x}px; top: ${y}px;
        width: 8px; height: 8px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(212,175,55,0.7) 0%, rgba(212,175,55,0) 70%);
        transform: translate(-50%, -50%) scale(0);
        pointer-events: none;
        z-index: 50;
    `;
    container.appendChild(ripple);

    animate({
        targets: ripple,
        scale: [0, 28],
        opacity: [1, 0],
        duration: 650,
        easing: 'easeOutExpo',
        complete: () => ripple.remove(),
    });
}

export default function GalleryCard({ item, onClick }: Props) {
    const cardRef   = useRef<HTMLDivElement>(null);
    const innerRef  = useRef<HTMLDivElement>(null);  // inner layer for 3D parallax
    const videoRef  = useRef<HTMLVideoElement>(null);
    const [isHovered, setIsHovered]   = useState(false);
    const [isClicked, setIsClicked]   = useState(false);
    const animFrame = useRef<number>(0);

    // ── Magnetic + 3D Parallax ──
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || !innerRef.current) return;
        cancelAnimationFrame(animFrame.current);

        animFrame.current = requestAnimationFrame(() => {
            const { left, top, width, height } = cardRef.current!.getBoundingClientRect();
            const px = (e.clientX - left) / width;   // 0 → 1
            const py = (e.clientY - top)  / height;  // 0 → 1
            const dx = (px - 0.5) * 2;               // -1 → 1
            const dy = (py - 0.5) * 2;

            const tiltX = dy * -12;   // card tilt
            const tiltY = dx *  12;
            const magX  = dx *  8;    // magnetic translate
            const magY  = dy *  8;

            // Card: magnetic + tilt
            animate({
                targets: cardRef.current,
                translateX: magX,
                translateY: magY,
                rotateX: tiltX,
                rotateY: tiltY,
                duration: 400,
                easing: 'easeOutQuart',
            });

            // Inner media: counter-parallax (3D depth illusion)
            animate({
                targets: innerRef.current,
                translateX: dx * -6,
                translateY: dy * -6,
                scale: 1.06,
                duration: 400,
                easing: 'easeOutQuart',
            });
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        cancelAnimationFrame(animFrame.current);

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }

        animate({
            targets: cardRef.current,
            translateX: 0, translateY: 0,
            rotateX: 0, rotateY: 0,
            duration: 900,
            easing: 'easeOutElastic(1, 0.5)',
        });

        animate({
            targets: innerRef.current,
            translateX: 0, translateY: 0,
            scale: 1,
            duration: 900,
            easing: 'easeOutElastic(1, 0.5)',
        });
    }, []);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
        if (item.type === 'video' && videoRef.current) {
            videoRef.current.play().catch(() => {});
        }
    }, [item.type]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        setIsClicked(true);
        spawnRipple(cardRef.current, e);

        // Brief flash before opening lightbox
        animate({
            targets: cardRef.current,
            scale: [1, 0.96, 1],
            duration: 300,
            easing: 'easeInOutQuad',
        });

        setTimeout(() => {
            setIsClicked(false);
            onClick(cardRef.current!.getBoundingClientRect());
        }, 320);
    }, [onClick]);

    return (
        <div
            ref={cardRef}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative h-[230px] w-auto min-w-[210px] flex-shrink-0 rounded-2xl overflow-hidden cursor-none group"
            style={{
                perspective: '900px',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                boxShadow: isHovered
                    ? '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.25)'
                    : '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
                transition: 'box-shadow 0.4s ease',
            }}
        >
            {/* ── Inner parallax container ── */}
            <div
                ref={innerRef}
                className="absolute inset-0"
                style={{ willChange: 'transform', transformOrigin: 'center center' }}
            >
                {item.type === 'image' ? (
                    <img
                        src={item.src}
                        alt={item.title}
                        className="h-full w-auto min-w-full object-cover"
                        draggable={false}
                    />
                ) : (
                    <video
                        ref={videoRef}
                        src={item.src}
                        poster={item.thumbnail}
                        className="h-full w-auto min-w-full object-cover"
                        muted loop playsInline
                    />
                )}
            </div>

            {/* ── Ambient gradient overlay (always) ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(to top, rgba(4,8,20,0.85) 0%, rgba(4,8,20,0.1) 55%, transparent 100%)',
                }}
            />

            {/* ── Hover glassmorphism panel ── */}
            <div
                className="absolute inset-0 flex flex-col justify-end p-5 transition-opacity duration-500"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: 'linear-gradient(135deg, rgba(4,8,20,0.6) 0%, rgba(10,18,40,0.45) 100%)',
                    backdropFilter: isHovered ? 'blur(4px)' : 'blur(0px)',
                }}
            >
                {/* Category badge */}
                {item.category && (
                    <span
                        className="absolute top-4 left-4 text-[9px] font-extrabold tracking-[0.25em] uppercase px-2.5 py-1 rounded-full"
                        style={{
                            color: '#D4AF37',
                            border: '1px solid rgba(212,175,55,0.35)',
                            background: 'rgba(212,175,55,0.08)',
                            letterSpacing: '0.2em',
                        }}
                    >
                        {item.category}
                    </span>
                )}

                {/* Title */}
                <p
                    className="text-white font-bold text-[13px] leading-snug"
                    style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif", textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
                >
                    {item.title}
                </p>

                {/* Gold accent bar + label */}
                <div className="flex items-center gap-2.5 mt-2.5">
                    <div
                        className="h-[1.5px] rounded-full"
                        style={{
                            width: isHovered ? '2rem' : '0px',
                            background: 'linear-gradient(to right, #D4AF37, #F5E098)',
                            transition: 'width 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.05s',
                        }}
                    />
                    <span
                        className="text-[9px] font-extrabold uppercase tracking-[0.22em]"
                        style={{ color: '#D4AF37', opacity: isHovered ? 1 : 0, transition: 'opacity 0.4s 0.15s' }}
                    >
                        Lihat Detail
                    </span>
                </div>
            </div>

            {/* ── Permanent bottom title (subtle, always visible) ── */}
            <div
                className="absolute bottom-0 left-0 right-0 p-4 pt-8 pointer-events-none"
                style={{
                    opacity: isHovered ? 0 : 1,
                    transition: 'opacity 0.3s ease',
                    background: 'linear-gradient(to top, rgba(4,8,20,0.75) 0%, transparent 100%)',
                }}
            >
                <p className="text-white/80 font-semibold text-[11px] leading-tight truncate">
                    {item.title}
                </p>
            </div>

            {/* ── Video indicator badge ── */}
            {item.type === 'video' && (
                <div
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-300"
                    style={{
                        background: 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        opacity: isHovered ? 0 : 1,
                        transform: isHovered ? 'scale(0.85)' : 'scale(1)',
                        transition: 'opacity 0.3s, transform 0.3s',
                    }}
                >
                    <div
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: '#D4AF37' }}
                    />
                    <span className="text-white/80 text-[8px] font-bold tracking-wider uppercase">Video</span>
                </div>
            )}

            {/* ── Custom cursor dot ── */}
            <div
                className="absolute pointer-events-none z-30 flex items-center justify-center rounded-full"
                style={{
                    width: isHovered ? '48px' : '0px',
                    height: isHovered ? '48px' : '0px',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
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

            {/* ── Corner accent (premium detail) ── */}
            <div
                className="absolute top-0 left-0 w-8 h-8 pointer-events-none"
                style={{
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.4s',
                    borderTop: '1.5px solid rgba(212,175,55,0.5)',
                    borderLeft: '1.5px solid rgba(212,175,55,0.5)',
                    borderRadius: '0.75rem 0 0 0',
                }}
            />
            <div
                className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none"
                style={{
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.4s 0.05s',
                    borderBottom: '1.5px solid rgba(212,175,55,0.5)',
                    borderRight: '1.5px solid rgba(212,175,55,0.5)',
                    borderRadius: '0 0 0.75rem 0',
                }}
            />
        </div>
    );
}