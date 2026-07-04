type Props = {
    label: string;
    value: string;
    icon: string;
    hint?: string;
};

export default function GoldStatCard({ label, value, icon, hint }: Props) {
    return (
        <div className="candidate-panel-entry rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{value}</p>
                    {hint && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</p>}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-amber-600 dark:text-gold">
                    <i className={`${icon} text-sm`} />
                </div>
            </div>
        </div>
    );
}
