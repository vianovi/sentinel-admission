import React, { useState, useRef, useEffect, useCallback } from "react";

type ResizableSplitGridProps = {
    left: React.ReactNode;
    right: React.ReactNode;
    initialLeftWidth?: number; // width in pixels
    minLeftWidth?: number;
    maxLeftWidth?: number;
    storageKey?: string;
    className?: string;
};

export default function ResizableSplitGrid({
    left,
    right,
    initialLeftWidth = 380,
    minLeftWidth = 260,
    maxLeftWidth = 750,
    storageKey,
    className = "",
}: ResizableSplitGridProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const [leftWidth, setLeftWidth] = useState<number>(() => {
        if (storageKey) {
            const saved = localStorage.getItem(`sentinel-split-${storageKey}`);
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed >= minLeftWidth && parsed <= maxLeftWidth) {
                    return parsed;
                }
            }
        }
        return initialLeftWidth;
    });

    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleTouchStart = () => {
        setIsDragging(true);
    };

    const handleMove = useCallback(
        (clientX: number) => {
            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const relativeX = clientX - containerRect.left;

            // Constrain left width between min and max or 80% container width
            const maxAllowed = Math.min(maxLeftWidth, containerRect.width - 250);
            const newWidth = Math.max(minLeftWidth, Math.min(maxAllowed, relativeX));

            setLeftWidth(newWidth);
        },
        [maxLeftWidth, minLeftWidth]
    );

    useEffect(() => {
        if (!isDragging) return;

        const onMouseMove = (e: MouseEvent) => {
            handleMove(e.clientX);
        };

        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleMove(e.touches[0].clientX);
            }
        };

        const onUp = () => {
            setIsDragging(false);
            if (storageKey) {
                localStorage.setItem(`sentinel-split-${storageKey}`, leftWidth.toString());
            }
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onUp);
        document.addEventListener("touchmove", onTouchMove);
        document.addEventListener("touchend", onUp);

        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";

        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onUp);
            document.removeEventListener("touchmove", onTouchMove);
            document.removeEventListener("touchend", onUp);

            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };
    }, [isDragging, handleMove, storageKey, leftWidth]);

    const resetWidth = () => {
        setLeftWidth(initialLeftWidth);
        if (storageKey) {
            localStorage.removeItem(`sentinel-split-${storageKey}`);
        }
    };

    return (
        <div ref={containerRef} className={`w-full ${className}`}>
            {/* Desktop Draggable Split Layout */}
            <div className="hidden lg:flex items-stretch gap-0 w-full min-w-0">
                {/* Left Card Panel */}
                <div
                    style={{ width: `${leftWidth}px` }}
                    className="shrink-0 min-w-0 transition-[width] duration-75"
                >
                    {left}
                </div>

                {/* Draggable Divider Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onDoubleClick={resetWidth}
                    className="relative group w-4 shrink-0 flex items-center justify-center cursor-col-resize select-none z-10"
                    title="Geser kursor untuk memperlebar / memperkecil card secara manual. Klik dua kali untuk reset."
                >
                    {/* Visual Line Divider */}
                    <div
                        className={`h-full w-1 rounded-full transition-all duration-200 ${
                            isDragging
                                ? "bg-amber-400 shadow-lg shadow-amber-400/50 scale-x-150"
                                : "bg-slate-200 group-hover:bg-amber-400/80 dark:bg-white/10 dark:group-hover:bg-amber-400/60"
                        }`}
                    />

                    {/* Drag Grip Icon Badge */}
                    <div
                        className={`absolute flex h-7 w-5 items-center justify-center rounded-md border border-slate-300 bg-white text-[10px] text-slate-500 shadow-md transition-all dark:border-white/15 dark:bg-slate-900 dark:text-slate-400 ${
                            isDragging
                                ? "border-amber-400 text-amber-400 scale-110 shadow-amber-400/20"
                                : "group-hover:border-amber-400 group-hover:text-amber-400"
                        }`}
                    >
                        <i className="fa-solid fa-[#171f33] fa-ellipsis-vertical text-[9px]" />
                        <i className="fa-solid fa-[#171f33] fa-ellipsis-vertical text-[9px] -ml-1" />
                    </div>
                </div>

                {/* Right Card Panel */}
                <div className="flex-1 min-w-0">
                    {right}
                </div>
            </div>

            {/* Mobile Stacked Layout (Fallback for small screens) */}
            <div className="flex flex-col gap-4 lg:hidden w-full">
                {left}
                {right}
            </div>
        </div>
    );
}
