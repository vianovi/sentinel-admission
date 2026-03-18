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
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                {label}
                {required && <span className="text-red-400">*</span>}
            </label>
            {children}
            {hint  && <p className="text-[11px] text-slate-500 leading-tight">{hint}</p>}
            {error && (
                <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation text-[10px]"></i> {error}
                </p>
            )}
        </div>
    );
}

// Shared input class helper — ekspor biar bisa dipakai di semua tab
export const inputCls = (err?: string) =>
    `w-full bg-slate-900/60 border ${err ? "border-red-500/60 bg-red-500/5" : "border-white/10"} rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-gold focus:bg-slate-900/80 transition placeholder:text-slate-600`;

export const textareaCls = (err?: string) =>
    `w-full bg-slate-900/60 border ${err ? "border-red-500/60" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-gold transition placeholder:text-slate-600 resize-none`;
