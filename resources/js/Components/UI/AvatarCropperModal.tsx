// resources/js/Components/UI/AvatarCropperModal.tsx
//
// Enterprise-grade photo adjustment & cropping modal (like WhatsApp/Telegram)
// Supports any aspect ratio input, zoom, pan/drag, 90deg rotate, reset, and exports high-quality image blob.

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";

interface Props {
    isOpen: boolean;
    imageFile: File | null;
    onClose: () => void;
    onCropComplete: (croppedFile: File) => void;
    aspectRatio?: number; // default 1:1
    title?: string;
    maxOutputDimension?: number; // default 800px
}

export default function AvatarCropperModal({
    isOpen,
    imageFile,
    onClose,
    onCropComplete,
    aspectRatio = 1,
    title = "Sesuaikan Foto Profil",
    maxOutputDimension = 800,
}: Props) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [minZoom, setMinZoom] = useState(1);
    const [maxZoom, setMaxZoom] = useState(3);
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isProcessing, setIsProcessing] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const cropBoxSize = 280; // visual crop frame size in px

    // Load file into memory & Image object
    useEffect(() => {
        if (!imageFile) {
            setImageSrc(null);
            setImageElement(null);
            return;
        }

        // Validate type & size
        const validTypes = ["image/jpeg", "image/png", "image/jpg"];
        const ext = imageFile.name.split(".").pop()?.toLowerCase();
        if (!validTypes.includes(imageFile.type) && ext !== "jpg" && ext !== "jpeg" && ext !== "png") {
            Swal.fire({
                icon: "error",
                title: "Format Tidak Didukung",
                text: "Hanya file gambar JPG dan PNG yang diperbolehkan.",
                confirmButtonColor: "#10b981",
            });
            onClose();
            return;
        }

        if (imageFile.size > 3 * 1024 * 1024) {
            Swal.fire({
                icon: "error",
                title: "Ukuran File Terlalu Besar",
                text: "Ukuran foto maksimal adalah 3MB.",
                confirmButtonColor: "#10b981",
            });
            onClose();
            return;
        }

        const objectUrl = URL.createObjectURL(imageFile);
        setImageSrc(objectUrl);

        const img = new Image();
        img.src = objectUrl;
        img.onload = () => {
            setImageElement(img);

            // Compute initial scale so the entire crop area is covered
            const scaleX = cropBoxSize / img.naturalWidth;
            const scaleY = cropBoxSize / img.naturalHeight;
            const initialScale = Math.max(scaleX, scaleY);

            setMinZoom(initialScale * 0.8);
            setMaxZoom(Math.max(initialScale * 4, 3));
            setZoom(initialScale);
            setPosition({ x: 0, y: 0 });
            setRotation(0);
        };

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [imageFile]);

    // Handle touch & mouse dragging
    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        try {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
            /* ignore */
        }
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleReset = () => {
        if (!imageElement) return;
        const scaleX = cropBoxSize / imageElement.naturalWidth;
        const scaleY = cropBoxSize / imageElement.naturalHeight;
        const initialScale = Math.max(scaleX, scaleY);
        setZoom(initialScale);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
    };

    const handleCropAndExport = useCallback(async () => {
        if (!imageElement || !imageFile) return;

        setIsProcessing(true);

        try {
            const canvas = document.createElement("canvas");
            const outputSize = Math.min(maxOutputDimension, 800);
            canvas.width = outputSize;
            canvas.height = outputSize;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                throw new Error("Could not get canvas context");
            }

            // Fill background in case of transparent png or margins
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, outputSize, outputSize);

            ctx.save();

            // Translate canvas to center
            ctx.translate(outputSize / 2, outputSize / 2);

            // Scale factor from visual crop box (280px) to output canvas (outputSize)
            const exportRatio = outputSize / cropBoxSize;

            // Apply position offset scaled to canvas
            ctx.translate(position.x * exportRatio, position.y * exportRatio);

            // Apply rotation
            ctx.rotate((rotation * Math.PI) / 180);

            // Apply zoom
            const drawWidth = imageElement.naturalWidth * zoom * exportRatio;
            const drawHeight = imageElement.naturalHeight * zoom * exportRatio;

            ctx.drawImage(
                imageElement,
                -drawWidth / 2,
                -drawHeight / 2,
                drawWidth,
                drawHeight
            );

            ctx.restore();

            // Determine output mime
            const isPng = imageFile.type === "image/png" || imageFile.name.toLowerCase().endsWith(".png");
            const outputMime = isPng ? "image/png" : "image/jpeg";
            const outputExt = isPng ? "png" : "jpg";

            canvas.toBlob(
                (blob) => {
                    setIsProcessing(false);
                    if (!blob) {
                        Swal.fire({
                            icon: "error",
                            title: "Gagal Memproses Gambar",
                            text: "Terjadi kesalahan saat memotong foto.",
                        });
                        return;
                    }

                    // Create sanitized file name
                    const cleanName = `avatar_${Date.now()}.${outputExt}`;
                    const resultFile = new File([blob], cleanName, { type: outputMime });

                    onCropComplete(resultFile);
                    onClose();
                },
                outputMime,
                0.92
            );
        } catch (err) {
            setIsProcessing(false);
            console.error("Error cropping image:", err);
            Swal.fire({
                icon: "error",
                title: "Gagal Memproses",
                text: "Tidak dapat memotong gambar.",
            });
        }
    }, [imageElement, imageFile, zoom, position, rotation, maxOutputDimension, cropBoxSize, onCropComplete, onClose]);

    if (!isOpen || !imageSrc) return null;

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                onClick={() => !isProcessing && onClose()}
            />

            {/* Modal Box */}
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl text-white z-10 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                            <i className="fa-solid fa-crop-simple text-sm" />
                        </div>
                        <h3 className="text-base font-bold text-slate-100">{title}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                    >
                        <i className="fa-solid fa-xmark text-sm" />
                    </button>
                </div>

                {/* Crop Canvas Workspace */}
                <div className="relative flex flex-col items-center justify-center bg-slate-950 p-6 select-none overflow-hidden min-h-[340px]">
                    {/* Viewport Area */}
                    <div
                        ref={containerRef}
                        className="relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing touch-none"
                        style={{ width: cropBoxSize, height: cropBoxSize }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                    >
                        {/* The Image being transformed */}
                        {imageElement && (
                            <img
                                src={imageSrc}
                                alt="Crop preview"
                                className="pointer-events-none absolute max-w-none origin-center transition-transform duration-75 ease-linear"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                                }}
                                draggable={false}
                            />
                        )}

                        {/* Circular/Square WhatsApp-like Mask Overlay */}
                        <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.85)]" />

                        {/* Center crosshair / grid lines */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
                            <div className="h-full w-px bg-white" />
                            <div className="absolute h-px w-full bg-white" />
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-400 text-center flex items-center gap-1.5 font-medium">
                        <i className="fa-solid fa-arrows-up-down-left-right text-[11px] text-emerald-400" />
                        Geser foto untuk menyesuaikan posisi
                    </p>
                </div>

                {/* Controls toolbar */}
                <div className="flex flex-col gap-4 border-t border-white/10 bg-slate-900/90 p-5">
                    {/* Zoom Slider */}
                    <div className="flex items-center gap-3">
                        <i className="fa-solid fa-magnifying-glass-minus text-xs text-slate-400" />
                        <input
                            type="range"
                            min={minZoom}
                            max={maxZoom}
                            step={(maxZoom - minZoom) / 100}
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-emerald-500 focus:outline-none"
                        />
                        <i className="fa-solid fa-magnifying-glass-plus text-xs text-slate-400" />
                    </div>

                    {/* Quick actions (Rotate, Reset) */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleRotate}
                                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition active:scale-95"
                            >
                                <i className="fa-solid fa-rotate-right text-xs text-emerald-400" />
                                Putar 90°
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition active:scale-95"
                            >
                                <i className="fa-solid fa-arrow-rotate-left text-xs" />
                                Reset
                            </button>
                        </div>

                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Maks. 3MB (JPG/PNG)
                        </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="min-h-11 px-5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleCropAndExport}
                            disabled={isProcessing}
                            className="min-h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin text-xs" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-check text-xs" />
                                    Terapkan Foto
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
