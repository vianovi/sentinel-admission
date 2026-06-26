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
import { createPortal } from "react-dom";
import { animate } from "animejs";

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
// LIGHTBOX COMPONENT — full-window style aligned with homepage gallery
// ─────────────────────────────────────────────────────────────────────────────

function ImageLightbox({
    src,
    alt,
    onClose,
}: {
    src: string;
    alt: string;
    onClose: () => void;
}) {
    const backdropRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!backdropRef.current || !cardRef.current) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        animate(backdropRef.current, { opacity: [0, 1], duration: 200, ease: "outQuad" });
        animate(cardRef.current, {
            opacity: [0, 1],
            scale: [0.92, 1],
            translateY: [24, 0],
            duration: 380,
            ease: "outExpo",
        });

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    const handleClose = useCallback(() => {
        if (!backdropRef.current || !cardRef.current) {
            onClose();
            return;
        }

        animate(cardRef.current, {
            opacity: [1, 0],
            scale: [1, 0.94],
            translateY: [0, 16],
            duration: 220,
            ease: "inQuad",
        });
        animate(backdropRef.current, { opacity: [1, 0], duration: 200, ease: "inQuad" });
        setTimeout(onClose, 200);
    }, [onClose]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [handleClose]);

    return createPortal(
        <div
            ref={backdropRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ backgroundColor: "rgba(15, 23, 42, 0.90)", backdropFilter: "blur(12px)" }}
            onClick={handleClose}
        >
            <div
                ref={cardRef}
                className="relative z-10 w-full max-w-4xl opacity-0"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                    <img
                        src={src}
                        alt={alt}
                        draggable={false}
                        className="w-full max-h-[80vh] select-none object-contain bg-slate-950/80"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent px-6 py-4">
                        <p className="text-sm font-semibold text-white">{alt}</p>
                    </div>

                    <button
                        onClick={handleClose}
                        aria-label="Tutup foto"
                        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/80"
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
            </div>
        </div>,
        document.body
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
