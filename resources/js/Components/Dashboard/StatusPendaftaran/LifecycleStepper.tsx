import type { LifecycleStep } from "./types";

type Props = {
    steps: LifecycleStep[];
};

const STEP_CLASS: Record<LifecycleStep["status"], string> = {
    complete: "border-emerald-500 bg-emerald-500 text-white",
    current: "border-gold bg-gold text-navy",
    upcoming: "border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-500",
    rejected: "border-red-500 bg-red-500 text-white",
};

export default function LifecycleStepper({ steps }: Props) {
    return (
        <section className="status-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-amber-600 dark:text-gold">
                    <i className="fa-solid fa-route text-sm" />
                </div>
                <div>
                    <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Lifecycle Progress</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Urutan status resmi pendaftaran kandidat.</p>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                {steps.map((step, index) => (
                    <div key={step.key} className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black ${STEP_CLASS[step.status]}`}>
                                {step.status === "complete" ? <i className="fa-solid fa-check" /> : index + 1}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{step.label}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
