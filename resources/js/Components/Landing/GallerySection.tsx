// resources/js/Components/Landing/GallerySection.tsx

import { useEffect, useRef, useState } from 'react'

let animeModulePromise: Promise<typeof import('animejs')> | null = null

function loadAnime() {
    animeModulePromise ??= import('animejs')
    return animeModulePromise
}

// ── Daftar foto galeri ────────────────────────────────────────────────────────
// Letakkan foto di: public/assets/landing/gallery/
// Ganti src dari placehold.co -> '/assets/landing/gallery/nama-file.webp'
//
// ┌───┬──────────────────────────────┬─────────┬───────────────┬─────────────────────────────────────────────┐
// │ # │ Nama file                    │  span   │ Ukuran (px)   │ Keterangan                                  │
// ├───┼──────────────────────────────┼─────────┼───────────────┼─────────────────────────────────────────────┤
// │ 1 │ photo-01-600x800-tall.webp   │ 'tall'  │ 600 × 800 px  │ Portrait — cocok foto orang berdiri, gedung │
// │ 2 │ photo-02-800x500-wide.webp   │ 'wide'  │ 800 × 500 px  │ Landscape — cocok foto lapangan, suasana    │
// │ 3 │ photo-03-600x600-small.webp  │ 'small' │ 600 × 600 px  │ Square — cocok foto ruangan, close-up       │
// │ 4 │ photo-04-600x600-small.webp  │ 'small' │ 600 × 600 px  │ Square — cocok foto ruangan, close-up       │
// │ 5 │ photo-05-600x600-small.webp  │ 'small' │ 600 × 600 px  │ Square — cocok foto ruangan, close-up       │
// │ 6 │ photo-06-600x800-tall.webp   │ 'tall'  │ 600 × 800 px  │ Portrait — cocok foto orang berdiri, gedung │
// │ 7 │ photo-07-800x500-wide.webp   │ 'wide'  │ 800 × 500 px  │ Landscape — cocok foto lapangan, suasana    │
// │ 8 │ photo-08-600x600-small.webp  │ 'small' │ 600 × 600 px  │ Square — cocok foto ruangan, close-up       │
// └───┴──────────────────────────────┴─────────┴───────────────┴─────────────────────────────────────────────┘
// Max ukuran file: 300 KB/foto. Format WebP disarankan.

const photos = [
    { src: '/assets/landing/gallery/photo-01-600x800-tall.webp',  alt: 'Kegiatan santri Al-Muntaha', span: 'tall',  width: 600, height: 800 },
    { src: '/assets/landing/gallery/photo-02-800x500-wide.webp',  alt: 'Upacara bendera',             span: 'wide',  width: 800, height: 500 },
    { src: '/assets/landing/gallery/photo-03-600x600-small.webp', alt: 'Kelas tahfidz',               span: 'small', width: 600, height: 600 },
    { src: '/assets/landing/gallery/photo-04-600x600-small.webp', alt: 'Lab komputer',                span: 'small', width: 600, height: 600 },
    { src: '/assets/landing/gallery/photo-05-600x600-small.webp', alt: 'Perpustakaan',                span: 'small', width: 600, height: 600 },
    { src: '/assets/landing/gallery/photo-06-600x800-tall.webp',  alt: 'Masjid sekolah',              span: 'tall',  width: 600, height: 800 },
    { src: '/assets/landing/gallery/photo-07-800x500-wide.webp',  alt: 'Lapangan olahraga',           span: 'wide',  width: 800, height: 500 },
    { src: '/assets/landing/gallery/photo-08-600x600-small.webp', alt: 'Asrama putra',                span: 'small', width: 600, height: 600 },
]

const desktopSpanClass: Record<string, string> = {
    tall:  'row-span-2',
    wide:  'col-span-2',
    small: '',
}

const desktopHeightClass: Record<string, string> = {
    tall:  'h-full min-h-[420px]',
    wide:  'h-[220px]',
    small: 'h-[200px]',
}

const SIMPLE_REVEAL_QUERY = '(prefers-reduced-motion: reduce), (max-width: 767px)'

export default function GallerySection() {
    const sectionRef   = useRef<HTMLElement>(null)
    const touchStartX  = useRef<number | null>(null)
    const touchStartY  = useRef<number | null>(null)
    const touchStartMs = useRef<number>(0)

    const [lightbox, setLightbox]       = useState<{ src: string; alt: string; index: number } | null>(null)
    const [swipeHintSeen, setSwipeHintSeen] = useState(false)
    const [showSwipeHint, setShowSwipeHint] = useState(false)

    // ── Lightbox open/close ───────────────────────────────────────────────────
    const openLightbox = (photo: typeof photos[0], index: number) => {
        setLightbox({ src: photo.src, alt: photo.alt, index })
        document.body.style.overflow = 'hidden'

        // Tampilkan swipe hint sekali saja di mobile
        if (!swipeHintSeen) {
            setTimeout(() => setShowSwipeHint(true), 600)
            setTimeout(() => {
                setShowSwipeHint(false)
                setSwipeHintSeen(true)
            }, 2800)
        }

        setTimeout(() => {
            void loadAnime().then(({ animate }) => {
                animate('.lightbox-backdrop', { opacity: [0, 1], duration: 250, ease: 'outQuad' })
                animate('.lightbox-card',     { opacity: [0, 1], scale: [0.92, 1], translateY: [24, 0], duration: 380, ease: 'outExpo' })
            })
        }, 10)
    }

    const closeLightbox = () => {
        void loadAnime().then(({ animate }) => {
            animate('.lightbox-card',     { opacity: [1, 0], scale: [1, 0.94], translateY: [0, 16], duration: 220, ease: 'inQuad' })
            animate('.lightbox-backdrop', { opacity: [1, 0], duration: 220, ease: 'inQuad' })
        })
        setTimeout(() => {
            setLightbox(null)
            setShowSwipeHint(false)
            document.body.style.overflow = ''
        }, 220)
    }

    const navigateLightbox = (dir: 1 | -1) => {
        const next = (lightbox!.index + dir + photos.length) % photos.length
        void loadAnime().then(({ animate }) => {
            animate('.lightbox-card', { opacity: [1, 0], translateX: [0, dir * -48], duration: 180, ease: 'inQuad' })
        })
        setTimeout(() => {
            setLightbox({ src: photos[next].src, alt: photos[next].alt, index: next })
            void loadAnime().then(({ animate }) => {
                animate('.lightbox-card', { opacity: [0, 1], translateX: [dir * 48, 0], duration: 260, ease: 'outExpo' })
            })
        }, 180)
    }

    // ── Touch / swipe handlers ────────────────────────────────────────────────
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current  = e.touches[0].clientX
        touchStartY.current  = e.touches[0].clientY
        touchStartMs.current = Date.now()
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return

        const deltaX   = e.changedTouches[0].clientX - touchStartX.current
        const deltaY   = e.changedTouches[0].clientY - touchStartY.current
        const duration = Date.now() - touchStartMs.current

        // Abaikan jika lebih vertikal (scroll) daripada horizontal (swipe)
        if (Math.abs(deltaY) > Math.abs(deltaX)) return

        // ✅ Momentum detection:
        //    - Swipe cepat (< 300ms) → threshold rendah 30px
        //    - Swipe lambat           → threshold standar 60px
        const isFast      = duration < 300
        const threshold   = isFast ? 30 : 60
        const shouldSwipe = Math.abs(deltaX) > threshold

        if (shouldSwipe) {
            const dir = deltaX < 0 ? 1 : -1
            navigateLightbox(dir)
            // Sembunyikan hint begitu user sudah swipe
            if (!swipeHintSeen) {
                setShowSwipeHint(false)
                setSwipeHintSeen(true)
            }
        }

        touchStartX.current = null
        touchStartY.current = null
    }

    // Keyboard nav
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!lightbox) return
            if (e.key === 'Escape')     closeLightbox()
            if (e.key === 'ArrowLeft')  navigateLightbox(-1)
            if (e.key === 'ArrowRight') navigateLightbox(1)
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [lightbox])

    // ── IntersectionObserver — stagger kiri & kanan ───────────────────────────
    useEffect(() => {
        const section = sectionRef.current
        if (!section) return
        let cancelled = false

        const titleTargets = Array.from(section.querySelectorAll<HTMLElement>('.gallery-title'))
        const leftTargets = Array.from(section.querySelectorAll<HTMLElement>('.gallery-item-left'))
        const rightTargets = Array.from(section.querySelectorAll<HTMLElement>('.gallery-item-right'))
        const revealTargets = [...titleTargets, ...leftTargets, ...rightTargets]

        if (window.matchMedia(SIMPLE_REVEAL_QUERY).matches) {
            revealTargets.forEach((target) => {
                target.style.opacity = '1'
                target.style.transform = 'none'
            })
            return
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    observer.unobserve(entry.target)
                    void loadAnime().then(({ animate, stagger }) => {
                        if (cancelled) return
                        animate(titleTargets, {
                            opacity: [0, 1], translateY: [30, 0],
                            duration: 900, ease: 'outExpo',
                        })
                        animate(leftTargets, {
                            opacity: [0, 1], translateX: [-24, 0], scale: [0.96, 1],
                            duration: 800, delay: stagger(120, { start: 200 }), ease: 'outExpo',
                        })
                        animate(rightTargets, {
                            opacity: [0, 1], translateX: [24, 0], scale: [0.96, 1],
                            duration: 800, delay: stagger(120, { start: 280 }), ease: 'outExpo',
                        })
                    })
                }
            })
        }, { threshold: 0.08 })

        observer.observe(section)
        return () => {
            cancelled = true
            observer.disconnect()
        }
    }, [])

    return (
        <>
        <section id="galeri" ref={sectionRef} className="py-24 bg-navy relative scroll-mt-28 overflow-hidden">

            <div className="absolute inset-0 opacity-[0.04] bg-cubes" />

            {/* Wave atas */}
            <div className="absolute top-0 left-0 right-0 z-10 leading-none rotate-180">
                <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[60px] md:h-[72px]">
                    <path d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z" fill="#ffffff" />
                </svg>
            </div>

            {/* Wave bawah */}
            <div className="absolute bottom-0 left-0 right-0 z-10 leading-none">
                <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[60px] md:h-[72px]">
                    <path d="M0,36 C240,0 480,72 720,36 C960,0 1200,72 1440,36 L1440,72 L0,72 Z" fill="#f8fafc" />
                </svg>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="gallery-title opacity-0 text-center mb-12">
                    <span className="text-gold font-bold text-sm tracking-widest uppercase">Kehidupan di Al-Muntaha</span>
                    <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mt-2">
                        Sekilas Aktivitas &amp; Lingkungan
                    </h2>
                    <p className="text-gray-400 mt-4 max-w-xl mx-auto leading-relaxed">
                        Setiap sudut Al-Muntaha dirancang untuk menumbuhkan potensi —
                        dari ruang belajar hingga lapangan, dari asrama hingga masjid.
                    </p>
                </div>

                {/* ── MOBILE: Pinterest CSS columns ── */}
                <div className="columns-2 gap-3 md:hidden">
                    {photos.map((photo, i) => {
                        const isLeft = i % 2 === 0
                        return (
                            <div
                                key={i}
                                onClick={() => openLightbox(photo, i)}
                                className={`
                                    break-inside-avoid mb-3
                                    ${isLeft ? 'gallery-item-left' : 'gallery-item-right'}
                                    opacity-0 relative overflow-hidden rounded-xl
                                    cursor-zoom-in group
                                `}
                                style={{ minHeight: '44px' }}
                            >
                                <img
                                    src={photo.src}
                                    alt={photo.alt}
                                    width={photo.width}
                                    height={photo.height}
                                    className="w-full h-auto object-cover transition duration-500 group-hover:scale-105 group-active:scale-95"
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x600/1e293b/d4a017?text=Foto' }}
                                />
                                <div className="absolute inset-0 bg-navy/0 group-active:bg-navy/30 transition duration-200 flex items-end p-2.5">
                                    <span className="text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-active:opacity-100 translate-y-1 group-hover:translate-y-0 transition duration-300 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20 leading-tight line-clamp-1">
                                        {photo.alt}
                                    </span>
                                </div>
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gold opacity-0 group-hover:opacity-100 group-active:opacity-100 transition duration-300" />
                            </div>
                        )
                    })}
                </div>

                {/* ── DESKTOP: CSS Grid masonry ── */}
                <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 auto-rows-[200px] gap-4">
                    {photos.map((photo, i) => {
                        const isLeft = i % 2 === 0
                        return (
                            <div
                                key={i}
                                onClick={() => openLightbox(photo, i)}
                                className={`
                                    ${isLeft ? 'gallery-item-left' : 'gallery-item-right'}
                                    opacity-0 relative overflow-hidden rounded-2xl group cursor-zoom-in
                                    ${desktopSpanClass[photo.span] ?? ''}
                                `}
                            >
                                <img
                                    src={photo.src}
                                    alt={photo.alt}
                                    width={photo.width}
                                    height={photo.height}
                                    className={`w-full object-cover transition duration-700 group-hover:scale-110 ${desktopHeightClass[photo.span]}`}
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x600/1e293b/d4a017?text=Foto' }}
                                />
                                <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/50 transition duration-500 flex items-end justify-between p-4">
                                    <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition duration-300 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                                        {photo.alt}
                                    </span>
                                    <span className="opacity-0 group-hover:opacity-100 transition duration-300 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-expand text-white text-xs"></i>
                                    </span>
                                </div>
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-gold opacity-0 group-hover:opacity-100 transition duration-300" />
                            </div>
                        )
                    })}
                </div>

            </div>
        </section>

        {/* ── Lightbox ── */}
        {lightbox && (
            <div
                className="fixed inset-0 z-[999] flex items-center justify-center px-4"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Backdrop */}
                <div
                    className="lightbox-backdrop opacity-0 absolute inset-0 bg-navy/90 backdrop-blur-md"
                    onClick={closeLightbox}
                />

                {/* Card */}
                <div className="lightbox-card opacity-0 relative z-10 w-full max-w-4xl">

                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <img
                            src={lightbox.src}
                            alt={lightbox.alt}
                            width={photos[lightbox.index].width}
                            height={photos[lightbox.index].height}
                            className="w-full max-h-[80vh] object-contain bg-navy/80"
                            decoding="async"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x600/1e293b/d4a017?text=Foto' }}
                        />

                        {/* Caption */}
                        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-navy/90 to-transparent">
                            <p className="text-white font-semibold text-sm">{lightbox.alt}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{lightbox.index + 1} / {photos.length}</p>
                        </div>

                        {/* Tombol tutup */}
                        <button
                            onClick={closeLightbox}
                            aria-label="Tutup foto"
                            className="absolute top-3 right-3 w-11 h-11 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center transition backdrop-blur-sm border border-white/20"
                        >
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>

                    {/*
                     * ✅ Swipe hint — muncul sekali saja saat lightbox pertama dibuka.
                     *    Auto-hide setelah 2.8s atau langsung hilang saat user swipe.
                     *    Hanya muncul di mobile (sm:hidden).
                     */}
                    <div className={`
                        sm:hidden absolute bottom-16 left-1/2 -translate-x-1/2
                        flex items-center gap-2 px-4 py-2 rounded-full
                        bg-black/60 backdrop-blur-sm border border-white/15
                        transition-all duration-500 pointer-events-none
                        ${showSwipeHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                    `}>
                        <i className="fa-solid fa-arrow-left text-gold text-[10px]"></i>
                        <span className="text-white/70 text-[10px] font-medium tracking-wide">Geser untuk navigasi</span>
                        <i className="fa-solid fa-arrow-right text-gold text-[10px]"></i>
                    </div>

                    {/* Navigasi prev / next — hidden di mobile, pakai swipe */}
                    <button
                        onClick={() => navigateLightbox(-1)}
                        aria-label="Foto sebelumnya"
                        className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-gold text-white border border-white/20 items-center justify-center transition duration-300 backdrop-blur-sm"
                    >
                        <i className="fa-solid fa-chevron-left text-sm"></i>
                    </button>
                    <button
                        onClick={() => navigateLightbox(1)}
                        aria-label="Foto berikutnya"
                        className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-gold text-white border border-white/20 items-center justify-center transition duration-300 backdrop-blur-sm"
                    >
                        <i className="fa-solid fa-chevron-right text-sm"></i>
                    </button>

                    {/* Dot indicator */}
                    <div className="flex justify-center gap-1.5 mt-4">
                        {photos.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    const dir = i > lightbox.index ? 1 : -1
                                    if (i !== lightbox.index) navigateLightbox(dir)
                                }}
                                aria-label={`Foto ${i + 1}`}
                                className={`rounded-full transition-all duration-300 ${
                                    i === lightbox.index
                                        ? 'w-5 h-2 bg-gold'
                                        : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )}
        </>
    )
}
