import React, { useState } from "react";
import { useCardSize, CardSize } from "@/context/CardSizeContext";

type ResizableCardProps = {
    title?: React.ReactNode;
    subtitle?: string;
    icon?: string;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    allowCollapse?: boolean;
    allowResize?: boolean;
    allowMaximize?: boolean;
    defaultCollapsed?: boolean;
    initialSize?: CardSize;
};

export default function ResizableCard({
    title,
    subtitle,
    icon,
    badge,
    actions,
    children,
    className = "",
    allowCollapse = true,
    allowResize = true,
    allowMaximize = true,
    defaultCollapsed = false,
    initialSize,
}: ResizableCardProps) {
    const { cardSize: globalSize, getCardPaddingClass } = useCardSize();
    const [localSize, setLocalSize] = useState<CardSize | null>(initialSize ?? null);
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [isMaximized, setIsMaximized] = useState(false);

    const activeSize = localSize ?? globalSize;

    // Size-based styling
    const sizePadding =
        activeSize === "compact"
            ? "p-3 sm:p-4 text-xs"
            : activeSize === "expanded"
                ? "p-6 sm:p-8 text-base"
                : "p-4 sm:p-6 text-sm";

    const cycleLocalSize = () => {
        if (activeSize === "normal") setLocalSize("compact");
        else if (activeSize === "compact") setLocalSize("expanded");
        else setLocalSize("normal");
    };

    if (isMaximized) {
        return (
            <div className="fixed inset-4 z-50 flex flex-col rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                                <i className={icon} />
                            </div>
                        )}
                        <div>
                            {title && <h3 className="text-lg font-black text-white">{title}</h3>}
                            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
                        </div>
                        {badge}
                    </div>
                    <div className="flex items-center gap-2">
                        {actions}
                        <button
                            type="button"
                            onClick={() => setIsMaximized(false)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                            title="Tutup Mode Layar Penuh"
                        >
                            <i className="fa-solid fa-compress text-xs" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        );
    }

    return (
        <section
            className={`relative rounded-2xl border border-slate-200 bg-white transition-all duration-300 dark:border-white/10 dark:bg-[#171f33] ${sizePadding} ${className}`}
        >
            {(title || icon || actions || allowCollapse || allowResize || allowMaximize) && (
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {icon && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400">
                                <i className={`${icon} text-xs`} />
                            </div>
                        )}
                        <div className="min-w-0">
                            {title && <h3 className="truncate font-bold text-slate-900 dark:text-white">{title}</h3>}
                            {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
                        </div>
                        {badge}
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                        {actions}

                        {/* Ukuran Card Switcher Button */}
                        {allowResize && (
                            <button
                                type="button"
                                onClick={cycleLocalSize}
                                className="flex h-7 px-2 items-center gap-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 transition"
                                title={`Ukuran Card: ${activeSize.toUpperCase()}. Klik untuk ubah ukuran (Compact/Normal/Expanded).`}
                            >
                                <i className="fa-solid fa-up-right-and-down-left-from-center text-[10px]" />
                                <span className="uppercase text-[10px] tracking-wider">{activeSize}</span>
                            </button>
                        )}

                        {/* Maximize Fullscreen Button */}
                        {allowMaximize && (
                            <button
                                type="button"
                                onClick={() => setIsMaximized(true)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5 transition"
                                title="Layar Penuh"
                            >
                                <i className="fa-solid fa-expand text-[10px]" />
                            </button>
                        )}

                        {/* Collapse / Expand Content Button */}
                        {allowCollapse && (
                            <button
                                type="button"
                                onClick={() => setIsCollapsed((prev) => !prev)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5 transition"
                                title={isCollapsed ? "Buka Card" : "Tutup/Kecilkan Card"}
                            >
                                <i className={`fa-solid ${isCollapsed ? "fa-chevron-down" : "fa-chevron-up"} text-[10px]`} />
                            </button>
                        )}
                    </div>
                </header>
            )}

            {!isCollapsed && <div className="transition-all">{children}</div>}
        </section>
    );
}
