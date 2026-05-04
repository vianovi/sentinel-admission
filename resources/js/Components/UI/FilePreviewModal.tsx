// resources/js/Components/UI/FilePreviewModal.tsx
//
// Preview file inline:
//   - Gambar (JPG, PNG, WebP, GIF) → custom lightbox modal inline (no library)
//   - PDF                           → buka tab baru (browser PDF viewer)
//   - URL tanpa ekstensi            → fetch HEAD untuk deteksi Content-Type
//
// Usage:
//   <FilePreviewModal localFile={file} />
//   <FilePreviewModal serverUrl={url} mimeType="image/jpeg" />
//   <FilePreviewModal serverUrl={route('...')} />   ← auto HEAD fetch

import { useCallback, useEffect, useRef, useState } from "react";
import { animate }                                    from "animejs";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    localFile?: File | null;
    serverUrl?: string | null;
    // Pass mime secara eksplisit kalau URL tidak punya ekstensi
    // (mis: route preview Inertia, atau file UUID di storage)
    mimeType?:  string | null;
    label?:     string;
    disabled?:  boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const isImage = (mime: string) => IMAGE_TYPES.includes(mime.split(";")[0].trim());
const isPdf   = (mime: string) => mime.split(";")[0].trim() === "application/pdf";

/** Deteksi mime dari ekstensi URL — return "" kalau tidak ada ekstensi */
const mimeFromUrl = (url: string): string => {
    const clean = url.split("?")[0].toLowerCase();
    if (clean.match(/\.(jpg|jpeg)$/)) return "image/jpeg";
    if (clean.match(/\.png$/))        return "image/png";
    if (clean.match(/\.webp$/))       return "image/webp";
    if (clean.match(/\.gif$/))        return "image/gif";
    if (clean.match(/\.pdf$/))        return "application/pdf";
    return "";
};

/** Fetch HEAD untuk dapat Content-Type dari server */
const fetchMimeType = async (url: string): Promise<string> => {
    try {
        const res = await fetch(url, { method: "HEAD", credentials: "same-origin" });
        const ct  = res.headers.get("Content-Type") ?? "";
        return ct.split(";")[0].trim();
    } catch {
        return "";
    }
};

/** Buat object URL dari File, revoke otomatis setelah N ms */
const createTempUrl = (file: File, revokeAfterMs = 60_000): string => {
    const url = URL.createObjectURL(file);
    setTimeout(() => URL.revokeObjectURL(url), revokeAfterMs);
    return url;
};

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTBOX COMPONENT — inline, zero dependency
// ─────────────────────────────────────────────────────────────────────────────

function ImageLightbox({
    src,
    alt,
    onClose,
}: {
    src:     string;
    alt:     string;
    onClose: () => void;
}) {
    const backdropRef = useRef<HTMLDivElement>(null);
    const panelRef    = useRef<HTMLDivElement>(null);
    const [zoom, setZoom]         = useState(1);
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset]     = useState({ x: 0, y: 0 });
    const dragStart               = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

    // ── Entrance animation ────────────────────────────────────────────────────
    useEffect(() => {
        if (!backdropRef.current || !panelRef.current) return;
        animate(backdropRef.current, { opacity: [0, 1], duration: 200, ease: "outQuad" });
        animate(panelRef.current,    { opacity: [0, 1], scale: [0.92, 1], duration: 280, ease: "outExpo" });
    }, []);

    // ── Close dengan animasi ──────────────────────────────────────────────────
    const handleClose = useCallback(() => {
        if (!backdropRef.current || !panelRef.current) { onClose(); return; }
        animate(panelRef.current,    { opacity: [1, 0], scale: [1, 0.94], duration: 180, ease: "inQuad" });
        animate(backdropRef.current, { opacity: [1, 0], duration: 200, ease: "inQuad" });
        setTimeout(onClose, 200);
    }, [onClose]);

    // ── Keyboard ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape")                   handleClose();
            if (e.key === "+" || e.key === "=")       setZoom(z => Math.min(z + 0.25, 4));
            if (e.key === "-")                         setZoom(z => Math.max(z - 0.25, 0.5));
            if (e.key === "0")                        { setZoom(1); setOffset({ x: 0, y: 0 }); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [handleClose]);

    // ── Wheel zoom ────────────────────────────────────────────────────────────
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(z => Math.min(Math.max(z - e.deltaY * 0.001, 0.5), 4));
    }, []);

    // ── Drag pan ──────────────────────────────────────────────────────────────
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (zoom <= 1) return;
        setDragging(true);
        dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
    }, [zoom, offset]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragging) return;
        setOffset({
            x: dragStart.current.ox + (e.clientX - dragStart.current.mx),
            y: dragStart.current.oy + (e.clientY - dragStart.current.my),
        });
    }, [dragging]);

    const handleMouseUp = useCallback(() => setDragging(false), []);

    useEffect(() => {
        if (zoom <= 1) setOffset({ x: 0, y: 0 });
    }, [zoom]);

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: "rgba(4, 8, 20, 0.88)", backdropFilter: "blur(6px)" }}
            onClick={handleClose}
        >
            <div
                ref={panelRef}
                className="relative flex flex-col items-center"
                style={{ maxWidth: "90vw", maxHeight: "90vh" }}
                onClick={e => e.stopPropagation()}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Gambar */}
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    className="rounded-xl object-contain shadow-2xl select-none"
                    style={{
                        maxWidth:   "85vw",
                        maxHeight:  "80vh",
                        transform:  `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                        transition: dragging ? "none" : "transform 0.15s ease",
                        cursor:     zoom > 1 ? (dragging ? "grabbing" : "grab") : "default",
                    }}
                />

                {/* Toolbar bawah */}
                <div className="absolute bottom-[-48px] left-1/2 -translate-x-1/2
                                flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                bg-slate-900/90 border border-white/[0.08] backdrop-blur-sm">
                    <button
                        onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg
                                   text-slate-400 hover:bg-white/[0.08] transition-colors duration-100"
                        title="Perkecil (−)"
                    >
                        <i className="fa-solid fa-minus text-[10px]"></i>
                    </button>
                    <button
                        onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
                        className="min-w-[40px] h-7 px-2 rounded-lg text-[11px] font-mono
                                   text-slate-300 hover:bg-white/[0.08] transition-colors duration-100"
                        title="Reset zoom (0)"
                    >
                        {Math.round(zoom * 100)}%
                    </button>
                    <button
                        onClick={() => setZoom(z => Math.min(z + 0.25, 4))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg
                                   text-slate-400 hover:bg-white/[0.08] transition-colors duration-100"
                        title="Perbesar (+)"
                    >
                        <i className="fa-solid fa-plus text-[10px]"></i>
                    </button>
                    <div className="w-px h-4 bg-white/[0.12] mx-0.5"></div>
                    <button
                        onClick={handleClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg
                                   text-slate-400 hover:bg-red-500/20 hover:text-red-400
                                   transition-colors duration-100"
                        title="Tutup (Esc)"
                    >
                        <i className="fa-solid fa-xmark text-[11px]"></i>
                    </button>
                </div>

                {/* Close pojok kanan atas */}
                <button
                    onClick={handleClose}
                    className="absolute -top-10 -right-2
                               w-8 h-8 flex items-center justify-center rounded-full
                               bg-white/[0.08] hover:bg-white/[0.16]
                               text-slate-300 hover:text-white transition-all duration-150"
                    title="Tutup"
                >
                    <i className="fa-solid fa-xmark text-xs"></i>
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function FilePreviewModal({
    localFile,
    serverUrl,
    mimeType,
    label    = "Preview",
    disabled = false,
}: Props) {
    const [lightboxSrc,  setLightboxSrc]  = useState<string | null>(null);
    // "idle" | "loading" | "done"
    const [loadState,    setLoadState]    = useState<"idle" | "loading" | "done">("idle");
    // Mime yang sudah diresolved (dari prop, ekstensi, atau HEAD fetch)
    const [resolvedMime, setResolvedMime] = useState<string>(() => {
        if (mimeType)   return mimeType;
        if (localFile)  return localFile.type;
        if (serverUrl)  return mimeFromUrl(serverUrl);
        return "";
    });

    const hasFile = !!(localFile || serverUrl);

    // Alt text untuk lightbox
    const fileAlt = localFile?.name
        ?? serverUrl?.split("/").pop()?.split("?")[0]
        ?? "Preview";

    // ── Resolve mime via HEAD kalau belum diketahui ───────────────────────────
    // Dipanggil sekali saat serverUrl ada tapi mime belum ketahuan dari ekstensi/prop
    const resolveMime = useCallback(async (): Promise<string> => {
        // Sudah resolved sebelumnya
        if (resolvedMime) return resolvedMime;
        if (!serverUrl)   return "";

        setLoadState("loading");
        const mime = await fetchMimeType(serverUrl);
        setResolvedMime(mime);
        setLoadState("done");
        return mime;
    }, [resolvedMime, serverUrl]);

    // ── Handle preview ────────────────────────────────────────────────────────
    const handlePreview = useCallback(async () => {
        if (disabled || !hasFile) return;

        // Kalau lokal file — mime langsung tahu dari File.type
        if (localFile) {
            const mime = localFile.type;
            if (isPdf(mime)) {
                window.open(createTempUrl(localFile), "_blank", "noopener,noreferrer");
                return;
            }
            if (isImage(mime)) {
                const reader = new FileReader();
                reader.onload = e => setLightboxSrc(e.target?.result as string);
                reader.readAsDataURL(localFile);
                return;
            }
            // Fallback
            window.open(createTempUrl(localFile), "_blank", "noopener,noreferrer");
            return;
        }

        if (!serverUrl) return;

        // Resolve mime — dari prop, ekstensi, atau HEAD fetch
        const mime = await resolveMime();

        if (isPdf(mime)) {
            window.open(serverUrl, "_blank", "noopener,noreferrer");
            return;
        }

        if (isImage(mime)) {
            setLightboxSrc(serverUrl);
            return;
        }

        // Mime masih kosong setelah HEAD — buka tab baru sebagai fallback
        window.open(serverUrl, "_blank", "noopener,noreferrer");
    }, [disabled, hasFile, localFile, serverUrl, resolveMime]);

    if (!hasFile) return null;

    // Untuk tombol: kalau mime sudah diketahui PDF → icon tab baru, else → icon mata
    const knownPdf   = isPdf(resolvedMime);
    const knownImage = isImage(resolvedMime);
    const isLoading  = loadState === "loading";

    return (
        <>
            <button
                type="button"
                onClick={handlePreview}
                disabled={disabled || !hasFile || isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                           text-[10px] font-semibold min-h-[30px]
                           dark:bg-white/[0.04] bg-white
                           dark:text-slate-400 text-slate-500
                           dark:hover:text-slate-200 hover:text-slate-700
                           dark:hover:bg-white/[0.08] hover:bg-black/[0.05]
                           border dark:border-white/[0.08] border-black/[0.08]
                           transition-all duration-150 active:scale-95
                           disabled:opacity-40 disabled:cursor-not-allowed"
                title={knownPdf ? "Buka PDF di tab baru" : "Lihat file"}
            >
                {isLoading ? (
                    <i className="fa-solid fa-spinner fa-spin text-[9px]"></i>
                ) : (
                    <i className={`text-[9px] fa-solid ${
                        knownPdf ? "fa-arrow-up-right-from-square" : "fa-eye"
                    }`}></i>
                )}
                {label && (
                    <span className="hidden sm:inline">
                        {isLoading ? "..." : knownPdf ? "Buka" : label}
                    </span>
                )}
            </button>

            {/* Lightbox — hanya untuk gambar */}
            {lightboxSrc && (
                <ImageLightbox
                    src={lightboxSrc}
                    alt={fileAlt}
                    onClose={() => setLightboxSrc(null)}
                />
            )}
        </>
    );
}