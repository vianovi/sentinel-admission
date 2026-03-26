// resources/js/Components/UI/FilePreviewModal.tsx
//
// Komponen reusable untuk preview file sebelum/sesudah upload.
// - Gambar (JPG, PNG, WebP) → popup lightbox via yet-another-react-lightbox
// - PDF                     → buka di tab baru
//
// Usage:
//   <FilePreviewModal file={localFile} url={serverUrl} mimeType="image/jpeg" />

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    // File lokal (sebelum upload) — dari input file
    localFile?: File | null;
    // URL file di server (setelah upload)
    serverUrl?: string | null;
    // Label tombol preview
    label?: string;
    // Disabled state
    disabled?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const isImage = (mimeType: string) =>
    ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType);

const isPdf = (mimeType: string) => mimeType === "application/pdf";

const getMimeType = (file?: File | null, url?: string | null): string => {
    if (file) return file.type;
    if (url) {
        if (url.match(/\.(jpg|jpeg)$/i)) return "image/jpeg";
        if (url.match(/\.png$/i))        return "image/png";
        if (url.match(/\.webp$/i))       return "image/webp";
        if (url.match(/\.pdf$/i))        return "application/pdf";
    }
    return "";
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function FilePreviewModal({
    localFile,
    serverUrl,
    label = "Preview",
    disabled = false,
}: Props) {
    const [open, setOpen]       = useState(false);
    const [imgSrc, setImgSrc]   = useState<string | null>(null);

    const mimeType = getMimeType(localFile, serverUrl);
    const hasFile  = !!(localFile || serverUrl);

    if (!hasFile) return null;

    const handlePreview = () => {
        if (disabled) return;

        if (isPdf(mimeType)) {
            // PDF → buka tab baru
            if (localFile) {
                const url = URL.createObjectURL(localFile);
                window.open(url, "_blank");
                // Revoke setelah delay agar tab sempat load
                setTimeout(() => URL.revokeObjectURL(url), 10_000);
            } else if (serverUrl) {
                window.open(serverUrl, "_blank");
            }
            return;
        }

        if (isImage(mimeType)) {
            // Gambar → lightbox
            if (localFile) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImgSrc(e.target?.result as string);
                    setOpen(true);
                };
                reader.readAsDataURL(localFile);
            } else if (serverUrl) {
                setImgSrc(serverUrl);
                setOpen(true);
            }
            return;
        }

        // Fallback: buka di tab baru
        if (serverUrl) window.open(serverUrl, "_blank");
    };

    return (
        <>
            <button
                type="button"
                onClick={handlePreview}
                disabled={disabled || !hasFile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                           text-[11px] font-semibold
                           dark:text-slate-400 text-slate-500
                           dark:hover:text-slate-200 hover:text-slate-700
                           dark:hover:bg-white/[0.06] hover:bg-black/[0.05]
                           border dark:border-white/[0.08] border-black/[0.08]
                           transition-all duration-150 min-h-[32px]
                           disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <i className={`text-[10px] ${
                    isPdf(mimeType)
                        ? "fa-solid fa-arrow-up-right-from-square"
                        : "fa-solid fa-eye"
                }`}></i>
                {isPdf(mimeType) ? "Buka PDF" : label}
            </button>

            {/* Lightbox — hanya untuk gambar */}
            {isImage(mimeType) && imgSrc && (
                <Lightbox
                    open={open}
                    close={() => { setOpen(false); setImgSrc(null); }}
                    slides={[{ src: imgSrc }]}
                    styles={{
                        container: { backgroundColor: "rgba(0,0,0,0.92)" },
                    }}
                    carousel={{ finite: true }}
                    render={{
                        buttonPrev: () => null,
                        buttonNext: () => null,
                    }}
                />
            )}
        </>
    );
}
