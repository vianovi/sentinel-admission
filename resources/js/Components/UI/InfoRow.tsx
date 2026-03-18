// resources/js/Components/UI/InfoRow.tsx

type Props = {
    label:     string;
    value?:    string | number | null;
    required?: boolean;
};

export default function InfoRow({ label, value, required }: Props) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1">
                {label}
                {required && <span className="text-red-400 normal-case tracking-normal font-normal"> *</span>}
            </p>
            <p className="text-sm font-medium text-slate-200 leading-snug">
                {value ?? <span className="text-slate-600 italic text-xs">Belum diisi</span>}
            </p>
        </div>
    );
}
