import { useEffect, useRef, useState } from 'react'
import { animate, stagger } from 'animejs'

// ── Daftar foto galeri ────────────────────────────────────────────────────────
// Letakkan foto di: public/assets/gallery/
// Lalu ganti nilai src dari URL placehold.co → '/assets/gallery/nama-file.webp'
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
    // Baris 1
    {
        src: '/assets/gallery/photo-01-600x800-tall.webp',
        alt: 'Kegiatan santri Al-Muntaha',
        span: 'tall',   // 600×800px — portrait
    },
    {
        src: '/assets/gallery/photo-02-800x500-wide.webp',
        alt: 'Upacara bendera',
        span: 'wide',   // 800×500px — landscape
    },
    {
        src: '/assets/gallery/photo-03-600x600-small.webp',
        alt: 'Kelas tahfidz',
        span: 'small',  // 600×600px — square
    },
    // Baris 2
    {
        src: '/assets/gallery/photo-04-600x600-small.webp',
        alt: 'Lab komputer',
        span: 'small',  // 600×600px — square
    },
    {
        src: '/assets/gallery/photo-05-600x600-small.webp',
        alt: 'Perpustakaan',
        span: 'small',  // 600×600px — square
    },
    {
        src: '/assets/gallery/photo-06-600x800-tall.webp',
        alt: 'Masjid sekolah',
        span: 'tall',   // 600×800px — portrait
    },
    // Baris 3
    {
        src: '/assets/gallery/photo-07-800x500-wide.webp',
        alt: 'Lapangan olahraga',
        span: 'wide',   // 800×500px — landscape
    },
    {
        src: '/assets/gallery/photo-08-600x600-small.webp',
        alt: 'Asrama putra',
        span: 'small',  // 600×600px — square
    },
]

// ── Tailwind class map per span ───────────────────────────────────────────────
const spanClass: Record<string, string> = {
    tall:  'row-span-2',
    wide:  'col-span-2',
    small: '',
}

const heightClass: Record<string, string> = {
    tall:  'h-full min-h-[420px]',
    wide:  'h-[220px]',
    small: 'h-[200px]',
}

export default function GallerySection() {
    const sectionRef = useRef<HTMLElement>(null)

    // ── Lightbox state ────────────────────────────────────────────────────────
    const [lightbox, setLightbox] = useState<{ src: string; alt: string; index: number } | null>(null)

    const openLightbox = (photo: typeof photos[0], index: number) => {
        setLightbox({ src: photo.src, alt: photo.alt, index })
        document.body.style.overflow = 'hidden'
        setTimeout(() => {
            animate('.lightbox-backdrop', { opacity: [0, 1], duration: 250, ease: 'outQuad' })
            animate('.lightbox-card',     { opacity: [0, 1], scale: [0.92, 1], translateY: [24, 0], duration: 380, ease: 'outExpo' })
        }, 10)
    }

    const closeLightbox = () => {
        animate('.lightbox-card',     { opacity: [1, 0], scale: [1, 0.94], translateY: [0, 16], duration: 220, ease: 'inQuad' })
        animate('.lightbox-backdrop', { opacity: [1, 0], duration: 220, ease: 'inQuad' })
        setTimeout(() => {
            setLightbox(null)
            document.body.style.overflow = ''
        }, 220)
    }

    const navigateLightbox = (dir: 1 | -1) => {
        const next = (lightbox!.index + dir + photos.length) % photos.length
        animate('.lightbox-card', { opacity: [1, 0], translateX: [0, dir * -40], duration: 180, ease: 'inQuad' })
        setTimeout(() => {
            setLightbox({ src: photos[next].src, alt: photos[next].alt, index: next })
            animate('.lightbox-card', { opacity: [0, 1], translateX: [dir * 40, 0], duration: 280, ease: 'outExpo' })
        }, 180)
    }

    // Keyboard: Escape = tutup, ArrowLeft/Right = navigasi
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!lightbox) return
            if (e.key === 'Escape')      closeLightbox()
            if (e.key === 'ArrowLeft')   navigateLightbox(-1)
            if (e.key === 'ArrowRight')  navigateLightbox(1)
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [lightbox])

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animate('.gallery-title', {
                        opacity:    [0, 1],
                        translateY: [30, 0],
                        duration:   900,
                        ease:       'outExpo',
                    })
                    animate('.gallery-item', {
                        opacity:    [0, 1],
                        scale:      [0.95, 1],
                        duration:   900,
                        delay:      stagger(100, { start: 200 }),
                        ease:       'outExpo',
                    })
                } else {
                    animate('.gallery-title', { opacity: 0, translateY: 30, duration: 0 })
                    animate('.gallery-item',  { opacity: 0, scale: 0.95,   duration: 0 })
                }
            })
        }, { threshold: 0.1 })

        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        <>
        <section id="galeri" ref={sectionRef} className="py-24 bg-navy relative overflow-hidden">

            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />

            {/* Wave atas — dari putih/slate Highlight */}
            <div className="absolute top-0 left-0 right-0 z-10 leading-none rotate-180">
                <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[60px] md:h-[72px]">
                    <path d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z" fill="#ffffff" />
                </svg>
            </div>

            {/* Wave bawah — ke slate-50 FacilitiesSection */}
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

                {/* Masonry Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[200px] gap-4">
                    {photos.map((photo, i) => (
                        <div
                            key={i}
                            onClick={() => openLightbox(photo, i)}
                            className={`gallery-item opacity-0 relative overflow-hidden rounded-2xl group cursor-zoom-in
                                ${spanClass[photo.span] ?? ''}`}
                        >
                            <img
                                src={photo.src}
                                alt={photo.alt}
                                className={`w-full object-cover transition duration-700 group-hover:scale-110
                                    ${heightClass[photo.span]}`}
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x600/1e293b/d4a017?text=Foto' }}
                            />
                            {/* Overlay hover */}
                            <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/50 transition duration-500 flex items-end justify-between p-4">
                                <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition duration-300 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                                    {photo.alt}
                                </span>
                                <span className="opacity-0 group-hover:opacity-100 transition duration-300 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0">
                                    <i className="fa-solid fa-expand text-white text-xs"></i>
                                </span>
                            </div>
                            {/* Gold corner accent */}
                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-gold opacity-0 group-hover:opacity-100 transition duration-300" />
                        </div>
                    ))}
                </div>

            </div>
        </section>

        {/* ── Lightbox ── */}
        {lightbox && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">

                {/* Backdrop */}
                <div
                    className="lightbox-backdrop opacity-0 absolute inset-0 bg-navy/90 backdrop-blur-md"
                    onClick={closeLightbox}
                />

                {/* Card */}
                <div className="lightbox-card opacity-0 relative z-10 w-full max-w-4xl">

                    {/* Foto */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <img
                            src={lightbox.src}
                            alt={lightbox.alt}
                            className="w-full max-h-[80vh] object-contain bg-navy/80"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x600/1e293b/d4a017?text=Foto' }}
                        />

                        {/* Caption */}
                        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-navy/90 to-transparent">
                            <p className="text-white font-semibold text-sm">{lightbox.alt}</p>
                            <p className="text-gray-400 text-xs mt-0.5">
                                {lightbox.index + 1} / {photos.length}
                            </p>
                        </div>

                        {/* Tombol tutup */}
                        <button
                            onClick={closeLightbox}
                            aria-label="Tutup foto"
                            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center transition backdrop-blur-sm border border-white/20"
                        >
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>

                    {/* Navigasi prev / next */}
                    <button
                        onClick={() => navigateLightbox(-1)}
                        aria-label="Foto sebelumnya"
                        className="absolute -left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-gold text-white border border-white/20 flex items-center justify-center transition duration-300 backdrop-blur-sm"
                    >
                        <i className="fa-solid fa-chevron-left text-sm"></i>
                    </button>
                    <button
                        onClick={() => navigateLightbox(1)}
                        aria-label="Foto berikutnya"
                        className="absolute -right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-gold text-white border border-white/20 flex items-center justify-center transition duration-300 backdrop-blur-sm"
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