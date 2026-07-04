import { useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import CandidateStatusSummaryCard from "@/Components/Dashboard/StatusPendaftaran/CandidateStatusSummaryCard";
import LifecycleStepper from "@/Components/Dashboard/StatusPendaftaran/LifecycleStepper";
import CompletionChecklist from "@/Components/Dashboard/StatusPendaftaran/CompletionChecklist";
import VerificationChecklist from "@/Components/Dashboard/StatusPendaftaran/VerificationChecklist";
import ReviewBlockers from "@/Components/Dashboard/StatusPendaftaran/ReviewBlockers";
import StatusTimeline from "@/Components/Dashboard/StatusPendaftaran/StatusTimeline";
import type { QuickLink, StatusPendaftaranSummary } from "@/Components/Dashboard/StatusPendaftaran/types";

type Props = {
    scope: "staff" | "admin";
    base_path: string;
    status_summary: StatusPendaftaranSummary;
};

export default function InternalStatusPendaftaran({ scope, base_path, status_summary }: Props) {
    useEffect(() => {
        animate(".status-entry", {
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 520,
            delay: stagger(55),
            ease: "outExpo",
        });
    }, [status_summary]);

    const title = `${scope === "admin" ? "Admin" : "Staff"} - Status Pendaftaran`;
    const candidateBase = `${base_path}/candidates/${status_summary.identity.id}`;

    return (
        <DashboardLayout>
            <Head title={title} />

            <div className="flex flex-col gap-5 pb-8">
                <div className="status-entry flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">Status Pendaftaran</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Overview audit-friendly untuk satu kandidat, tanpa menggantikan halaman review.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={`${candidateBase}/data-diri`}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-gold hover:text-amber-700 dark:border-white/10 dark:text-slate-300 dark:hover:text-gold"
                        >
                            <i className="fa-solid fa-id-card text-xs" />
                            Detail Kandidat
                        </Link>
                        <Link
                            href={`${base_path}/candidates`}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-navy transition hover:bg-goldhover"
                        >
                            <i className="fa-solid fa-arrow-left text-xs" />
                            Daftar Kandidat
                        </Link>
                    </div>
                </div>

                <CandidateStatusSummaryCard
                    identity={status_summary.identity}
                    lifecycle={status_summary.lifecycle}
                    completionPercentage={status_summary.progress.completion_percentage}
                    verificationPercentage={status_summary.progress.verification_percentage}
                    selection={status_summary.selection_summary}
                />

                <LifecycleStepper steps={status_summary.lifecycle_steps} />

                <CompletionChecklist
                    items={status_summary.completion_checklist}
                    title="Completion Checklist"
                    description="Syarat kelengkapan yang membentuk status pendaftaran kandidat."
                />

                <VerificationChecklist items={status_summary.verification_checklist} />

                <ReviewBlockers blockers={status_summary.review_blockers} />

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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
                    <i className="fa-solid fa-link text-sm" />
                </div>
                <div>
                    <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Quick Links</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Lompat ke halaman kerja existing.</p>
                </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {links.map((link) => (
                    <Link
                        key={`${link.label}-${link.href}`}
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
