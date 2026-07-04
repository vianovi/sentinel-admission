import { Link } from "@inertiajs/react";
import type { StatusAction, StatusIdentity, LifecycleState } from "./types";
import { tonePillClass } from "./styles";

type Props = {
    identity: StatusIdentity;
    lifecycle: LifecycleState;
    primaryAction: StatusAction | null;
};

export default function StatusHero({ identity, lifecycle, primaryAction }: Props) {
    return (
        <section className="status-entry overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_280px]">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${tonePillClass[lifecycle.tone]}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {lifecycle.label}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                            Menunggu: {lifecycle.waiting_side_label}
                        </span>
                    </div>

                    <h1 className="mt-4 text-2xl font-display font-bold leading-tight text-slate-900 dark:text-white sm:text-3xl">
                        Status Pendaftaran
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {lifecycle.description} {lifecycle.waiting_side_description}
                    </p>

                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                        <Info label="Kandidat" value={identity.full_name} />
                        <Info label="Kode" value={identity.candidate_code ?? "-"} />
                        <Info label="Program" value={identity.program_choice ?? "-"} />
                        <Info label="Gelombang" value={identity.admission_wave?.title ?? "-"} />
                    </div>
                </div>

                <div className="rounded-2xl border border-gold/20 bg-gold/10 p-4 dark:bg-gold/10">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-gold">
                        Aksi Berikutnya
                    </p>
                    {primaryAction ? (
                        <>
                            <div className="mt-3 flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-gold dark:bg-white/10">
                                    <i className={`${primaryAction.icon} text-sm`} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{primaryAction.title}</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{primaryAction.description}</p>
                                </div>
                            </div>
                            {primaryAction.href && (
                                <Link
                                    href={primaryAction.href}
                                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy transition hover:bg-goldhover"
                                >
                                    <i className="fa-solid fa-arrow-right text-xs" />
                                    Buka Aksi
                                </Link>
                            )}
                        </>
                    ) : (
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Tidak ada aksi wajib dari sisi kandidat saat ini.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    );
}
