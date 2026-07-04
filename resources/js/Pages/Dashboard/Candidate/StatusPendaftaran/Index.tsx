import { useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import StatusHero from "@/Components/Dashboard/StatusPendaftaran/StatusHero";
import LifecycleStepper from "@/Components/Dashboard/StatusPendaftaran/LifecycleStepper";
import CompletionChecklist from "@/Components/Dashboard/StatusPendaftaran/CompletionChecklist";
import NextActionPanel from "@/Components/Dashboard/StatusPendaftaran/NextActionPanel";
import StatusTimeline from "@/Components/Dashboard/StatusPendaftaran/StatusTimeline";
import type { QuickLink, StatusPendaftaranSummary } from "@/Components/Dashboard/StatusPendaftaran/types";

type Props = {
    status_summary: StatusPendaftaranSummary | null;
};

export default function CandidateStatusPendaftaran({ status_summary }: Props) {
    useEffect(() => {
        if (!status_summary) return;

        animate(".status-entry", {
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 520,
            delay: stagger(55),
            ease: "outExpo",
        });
    }, [status_summary]);

    if (!status_summary) {
        return (
            <DashboardLayout>
                <Head title="Status Pendaftaran" />
                <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                        <i className="fa-solid fa-list-check text-2xl text-gold" />
                    </div>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white">Belum Ada Data Pendaftaran</h1>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Akun ini belum memiliki data kandidat yang bisa diringkas.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-gold px-6 py-2.5 text-sm font-bold text-navy transition hover:bg-goldhover"
                    >
                        Ke Halaman Utama
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Head title="Status Pendaftaran" />

            <div className="flex flex-col gap-5 pb-8">
                <StatusHero
                    identity={status_summary.identity}
                    lifecycle={status_summary.lifecycle}
                    primaryAction={status_summary.primary_action}
                />

                <LifecycleStepper steps={status_summary.lifecycle_steps} />

                <CompletionChecklist items={status_summary.completion_checklist} />

                <NextActionPanel
                    primaryAction={status_summary.primary_action}
                    secondaryActions={status_summary.secondary_actions}
                />

                <StatusTimeline items={status_summary.timeline} />

                <QuickLinks links={status_summary.quick_links} />
            </div>
        </DashboardLayout>
    );
}

function QuickLinks({ links }: { links: QuickLink[] }) {
    return (
        <section className="status-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-amber-600 dark:text-gold">
                    <i className="fa-solid fa-arrow-up-right-from-square text-sm" />
                </div>
                <div>
                    <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Shortcut Halaman Terkait</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Akses cepat ke halaman sumber data status.</p>
                </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:border-gold hover:bg-gold/10 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200"
                    >
                        <i className={`${link.icon} w-4 text-center text-amber-600 dark:text-gold`} />
                        {link.label}
                    </Link>
                ))}
            </div>
        </section>
    );
}
