import { memo, useState } from "react";

type QuickDateTimePickerProps = {
    type: "opens" | "closes";
    currentValue: string;
    baseOpensAt?: string;
    onSelect: (formattedDateTime: string) => void;
};

const formatToLocalDateTime = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export const QuickDateTimePicker = memo(function QuickDateTimePicker({
    type,
    currentValue,
    baseOpensAt,
    onSelect,
}: QuickDateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelectDay = (offset: number) => {
        const currentVal = currentValue ? new Date(currentValue) : new Date();
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + offset);
        newDate.setHours(currentVal.getHours(), currentVal.getMinutes(), 0, 0);
        onSelect(formatToLocalDateTime(newDate));
        setIsOpen(false);
    };

    const handleSelectTime = (timeStr: string | null) => {
        const newDate = currentValue ? new Date(currentValue) : new Date();
        if (timeStr) {
            const [h, m] = timeStr.split(":").map(Number);
            newDate.setHours(h, m, 0, 0);
        } else {
            const now = new Date();
            newDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
        }
        onSelect(formatToLocalDateTime(newDate));
        setIsOpen(false);
    };

    const handleAddHours = (hours: number) => {
        const baseStr = baseOpensAt || formatToLocalDateTime(new Date());
        const baseDate = new Date(baseStr);
        baseDate.setHours(baseDate.getHours() + hours);
        onSelect(formatToLocalDateTime(baseDate));
        setIsOpen(false);
    };

    const handleAddDays = (days: number) => {
        const baseStr = baseOpensAt || formatToLocalDateTime(new Date());
        const baseDate = new Date(baseStr);
        baseDate.setDate(baseDate.getDate() + days);
        onSelect(formatToLocalDateTime(baseDate));
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-500 transition-all hover:scale-105 active:scale-95 border border-amber-500/20"
                title="Pilihan Cepat"
            >
                <i className="fa-solid fa-bolt animate-pulse text-amber-500" /> Cepat
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-6 z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800 dark:text-slate-100">
                        {type === "opens" ? (
                            <>
                                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    1. Pilih Hari
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 mb-3">
                                    {[
                                        { label: "Hari Ini", offset: 0 },
                                        { label: "Besok", offset: 1 },
                                        { label: "Lusa", offset: 2 },
                                        { label: "+1 Minggu", offset: 7 },
                                    ].map((item) => (
                                        <button
                                            key={item.label}
                                            type="button"
                                            onClick={() => handleSelectDay(item.offset)}
                                            className="rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 px-2 py-1 text-xs font-medium text-left border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 transition-all"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    2. Pilih Jam
                                </div>
                                <div className="grid grid-cols-3 gap-1 mb-1">
                                    {[
                                        { label: "Sekarang", time: null },
                                        { label: "07:30", time: "07:30" },
                                        { label: "08:00", time: "08:00" },
                                        { label: "09:00", time: "09:00" },
                                        { label: "10:00", time: "10:00" },
                                        { label: "13:00", time: "13:00" },
                                        { label: "14:00", time: "14:00" },
                                        { label: "16:00", time: "16:00" },
                                        { label: "19:00", time: "19:00" },
                                    ].map((item) => (
                                        <button
                                            key={item.label}
                                            type="button"
                                            onClick={() => handleSelectTime(item.time)}
                                            className="rounded-md bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 px-1 py-1 text-[11px] font-medium text-center border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 transition-all"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Tambah Jam (Waktu Buka)
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 mb-3">
                                    {[
                                        { label: "+1 Jam", hours: 1 },
                                        { label: "+2 Jam", hours: 2 },
                                        { label: "+3 Jam", hours: 3 },
                                        { label: "+4 Jam", hours: 4 },
                                        { label: "+6 Jam", hours: 6 },
                                        { label: "+8 Jam", hours: 8 },
                                        { label: "+12 Jam", hours: 12 },
                                        { label: "+18 Jam", hours: 18 },
                                        { label: "+24 Jam", hours: 24 },
                                    ].map((item) => (
                                        <button
                                            key={item.label}
                                            type="button"
                                            onClick={() => handleAddHours(item.hours)}
                                            className="rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 px-1 py-1 text-xs font-medium text-center border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 transition-all"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Tambah Hari
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[
                                        { label: "+1 Hari", days: 1 },
                                        { label: "+2 Hari", days: 2 },
                                        { label: "+3 Hari", days: 3 },
                                        { label: "+7 Hari", days: 7 },
                                    ].map((item) => (
                                        <button
                                            key={item.label}
                                            type="button"
                                            onClick={() => handleAddDays(item.days)}
                                            className="rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 px-2 py-1 text-xs font-medium text-left border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 transition-all"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
});

export default QuickDateTimePicker;
