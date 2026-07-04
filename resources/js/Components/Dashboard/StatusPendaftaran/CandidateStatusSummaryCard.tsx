import type { SelectionSummary, StatusIdentity, LifecycleState } from "./types";
import { tonePillClass } from "./styles";

type Props = {
    identity: StatusIdentity;
    lifecycle: LifecycleState;
    completionPercentage: number;
    verificationPercentage: number;
    selection: SelectionSummary;
};

export default function CandidateStatusSummaryCard({
    identity,
    lifecycle,
    completionPercentage,
    verificationPercentage,
    selection,
}: Props) {
    return (
        <section className="status-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${tonePillClass[lifecycle.tone]}`}>
                        {lifecycle.label}
                    </span>
                    <h1 className="mt-4 text-2xl font-display font-bold leading-tight text-slate-900 dark:text-white">
                        {identity.full_name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {identity.candidate_code ?? "-"} {identity.nisn ? `- ${identity.nisn}` : ""}
                    </p>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {lifecycle.description} {lifecycle.waiting_side_description}
                    </p>
                </div>

                <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:w-[440px]">
                    <Metric label="Completion" value={`${completionPercentage}%`} />
                    <Metric label="Verification" value={`${verificationPercentage}%`} />
                    <Metric label="Attempt" value={String(selection.attempts_count)} />
                </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Info label="Email" value={identity.email ?? "-"} />
                <Info label="Gelombang" value={identity.admission_wave?.title ?? "-"} />
                <Info label="Seleksi" value={selection.latest_attempt?.status_label ?? selection.latest_assignment?.status_label ?? selection.label} />
            </div>
        </section>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    );
}
