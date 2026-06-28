import { memo } from "react";
import type { DashboardIdentity } from "./types";
import { stateClasses } from "./ui";

type Props = {
    identity: DashboardIdentity;
};

function IdentityHero({ identity }: Props) {
    return (
        <section className="rounded-2xl bg-navy p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                        Admission Journey Center
                    </p>
                    <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                        {identity.full_name}
                    </h1>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                        <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                            Kode: <strong className="font-semibold text-white">{identity.candidate_code ?? "-"}</strong>
                        </span>
                        {identity.registration_code && (
                            <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                                Registrasi: <strong className="font-semibold text-white">{identity.registration_code}</strong>
                            </span>
                        )}
                        <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                            NISN: <strong className="font-semibold text-white">{identity.nisn ?? "-"}</strong>
                        </span>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</p>
                        <span className={`mt-2 inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${identity.status === "rejected" ? stateClasses.warning : identity.status === "draft" ? stateClasses.incomplete : stateClasses.complete}`}>
                            {identity.status_label}
                        </span>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Gelombang</p>
                        <p className="mt-2 text-sm font-semibold text-white">{identity.admission_wave?.title ?? "-"}</p>
                        <p className="mt-1 text-xs text-slate-400">{identity.admission_wave?.academic_year ?? ""}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Program</p>
                        <p className="mt-2 text-sm font-semibold text-white">{identity.program_choice ?? "-"}</p>
                        {identity.major_choice && <p className="mt-1 text-xs text-slate-400">{identity.major_choice}</p>}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Kontak</p>
                        <p className="mt-2 truncate text-sm font-semibold text-white">{identity.email}</p>
                        <p className="mt-1 text-xs text-slate-400">{identity.phone_number ?? "Nomor HP belum diisi"}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(IdentityHero);
