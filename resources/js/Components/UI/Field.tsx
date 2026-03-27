// resources/js/Components/UI/Field.tsx

type Props = {
    label:      string;
    children:   React.ReactNode;
    error?:     string;
    hint?:      string;
    required?:  boolean;
    className?: string;
};

export default function Field({ label, children, error, hint, required, className = "" }: Props) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label className="text-xs font-semibold dark:text-slate-300 text-slate-700 flex items-center gap-1">
                {label}
                {required && <span className="text-red-400">*</span>}
            </label>
            {children}
            {hint  && <p className="text-[11px] dark:text-slate-500 text-slate-400 leading-tight">{hint}</p>}
            {error && (
                <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation text-[10px]"></i> {error}
                </p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared input/textarea class helpers
// Mendukung dark mode + light mode secara eksplisit
// ─────────────────────────────────────────────────────────────────────────────

export const inputCls = (err?: string) => err
    ? "w-full dark:bg-red-500/5 bg-red-50 border border-red-500/60 rounded-xl px-4 py-2.5 text-sm dark:text-slate-200 text-slate-800 outline-none focus:border-gold transition dark:placeholder:text-slate-600 placeholder:text-slate-400 min-h-[44px]"
    : "w-full dark:bg-slate-900/60 bg-white border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-sm dark:text-slate-200 text-slate-800 outline-none focus:border-gold dark:focus:bg-slate-900/80 focus:bg-white transition dark:placeholder:text-slate-600 placeholder:text-slate-400 min-h-[44px]";

export const textareaCls = (err?: string) => err
    ? "w-full dark:bg-red-500/5 bg-red-50 border border-red-500/60 rounded-xl px-4 py-3 text-sm dark:text-slate-200 text-slate-800 outline-none focus:border-gold transition dark:placeholder:text-slate-600 placeholder:text-slate-400 resize-none"
    : "w-full dark:bg-slate-900/60 bg-white border dark:border-white/10 border-black/10 rounded-xl px-4 py-3 text-sm dark:text-slate-200 text-slate-800 outline-none focus:border-gold transition dark:placeholder:text-slate-600 placeholder:text-slate-400 resize-none";