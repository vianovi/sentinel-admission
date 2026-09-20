import { useState, useRef, useEffect } from "react";

export type Option<T extends string | number> = {
    value: T;
    label: string;
    description?: string;
    badge?: string;
};

type SentinelSelectProps<T extends string | number> = {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    placeholder?: string;
    label?: string;
    icon?: string;
    disabled?: boolean;
    className?: string;
};

export default function SentinelSelect<T extends string | number>({
    options,
    value,
    onChange,
    placeholder = "Pilih opsi...",
    label,
    icon,
    disabled = false,
    className = "",
}: SentinelSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    {icon && <i className={`${icon} text-amber-600 dark:text-amber-400`} />}
                    {label}
                </label>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-white dark:bg-slate-950 px-3.5 py-2 text-xs transition-all ${
                    isOpen
                        ? "border-amber-500 ring-2 ring-amber-500/20 text-slate-900 dark:text-white shadow-lg shadow-amber-500/10"
                        : "border-slate-300 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-slate-900"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption ? (
                        <>
                            <span className="font-semibold text-slate-900 dark:text-white truncate">{selectedOption.label}</span>
                            {selectedOption.badge && (
                                <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    {selectedOption.badge}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-normal">{placeholder}</span>
                    )}
                </div>
                <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-amber-500" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-amber-500/30 bg-white dark:bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    {options.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500">Tidak ada pilihan</div>
                    ) : (
                        options.map((opt) => {
                            const isSelected = opt.value === value;
                            return (
                                <button
                                    key={String(opt.value)}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-all ${
                                        isSelected
                                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30"
                                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                >
                                    <div className="truncate">
                                        <div className="truncate font-semibold">{opt.label}</div>
                                        {opt.description && <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">{opt.description}</div>}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {opt.badge && (
                                            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                                                {opt.badge}
                                            </span>
                                        )}
                                        {isSelected && <i className="fa-solid fa-check text-amber-600 dark:text-amber-400 text-xs" />}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
