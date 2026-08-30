import { useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import GoldPageHeader from "@/Components/Dashboard/Candidate/Panel/GoldPageHeader";
import GoldStatCard from "@/Components/Dashboard/Candidate/Panel/GoldStatCard";
import StatusPill from "@/Components/Dashboard/Candidate/Panel/StatusPill";
import EmptyState from "@/Components/Dashboard/Candidate/Panel/EmptyState";

type ResultRow = {
    id: number;
    attempt_number: number;
    status_label: string;
    submitted_at: string | null;
    finalized_at: string | null;
    total_questions: number | null;
    answered_questions: number | null;
    score_visible: boolean;
    percentage_score: number | null;
    passing_score: number | null;
    passed: boolean | null;
    session_title: string | null;
    package_title: string | null;
};

type Props = {
    selection_result: {
        final_status: {
            status: string;
            label: string;
            is_final: boolean;
            description: string;
        };
        summary: {
            attempts_total: number;
            visible_results: number;
            passed_visible: number;
            waiting_results: number;
        };
        results: ResultRow[];
    };
};

export default function CandidateSelectionResult({ selection_result }: Props) {
    useEffect(() => {
        animate(".candidate-panel-entry", {
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 520,
            delay: stagger(45),
            ease: "outExpo",
        });
    }, []);

    return (
        <>
            <Head title="Hasil Seleksi" />

            <div className="flex flex-col gap-5 pb-8">
                <GoldPageHeader
                    eyebrow="Selection Result"
                    title="Hasil Seleksi"
                    description="Lihat hasil ujian yang sudah dibuka untuk kandidat dan status akhir pendaftaran yang diputuskan panitia."
                    icon="fa-solid fa-square-poll-vertical"
                    action={{ label: "Status Seleksi", href: "/dashboard/seleksi/status", icon: "fa-solid fa-clock-rotate-left" }}
                />

                <section className="candidate-panel-entry rounded-2xl border border-gold/20 bg-white p-5 shadow-sm dark:border-gold/15 dark:bg-slate-900 sm:p-6">
                    <StatusPill tone={selection_result.final_status.is_final ? "gold" : "neutral"} label={selection_result.final_status.label} />
                    <h2 className="mt-3 text-lg font-display font-bold text-slate-900 dark:text-white">Status Akhir Pendaftaran</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {selection_result.final_status.description}
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <GoldStatCard label="Attempt Selesai" value={String(selection_result.summary.attempts_total)} icon="fa-solid fa-clipboard-check" />
                    <GoldStatCard label="Hasil Dibuka" value={String(selection_result.summary.visible_results)} icon="fa-solid fa-eye" />
                    <GoldStatCard label="Lulus Terlihat" value={String(selection_result.summary.passed_visible)} icon="fa-solid fa-award" />
                    <GoldStatCard label="Menunggu" value={String(selection_result.summary.waiting_results)} icon="fa-solid fa-hourglass-half" />
                </section>

                {selection_result.results.length === 0 ? (
                    <EmptyState
                        icon="fa-solid fa-square-poll-vertical"
                        title="Belum ada hasil seleksi"
                        description="Hasil akan muncul setelah kamu mengikuti sesi ujian dan panitia membuka visibilitas hasil."
                        actionLabel="Buka Status Seleksi"
                        actionHref="/dashboard/seleksi/status"
                    />
                ) : (
                    <section className="candidate-panel-entry overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
                            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Riwayat Hasil</h2>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Nilai hanya tampil jika sudah dibuka oleh pengaturan sesi/paket.</p>
                        </div>

                        <div className="divide-y divide-slate-200 dark:divide-white/10">
                            {selection_result.results.map((result) => (
                                <article key={result.id} className="p-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap gap-2">
                                                <StatusPill tone={result.score_visible ? "gold" : "muted"} label={result.score_visible ? "Hasil Dibuka" : "Menunggu"} />
                                                <StatusPill tone={result.passed === true ? "success" : result.passed === false ? "danger" : "neutral"} label={result.status_label} />
                                            </div>
                                            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                                                {result.session_title ?? "Sesi Seleksi"} - Attempt #{result.attempt_number}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {result.package_title ?? "Paket ujian"}
                                                {result.submitted_at ? ` - Submit ${result.submitted_at}` : ""}
                                            </p>
                                        </div>
                                        <div className="text-left lg:text-right">
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                                {result.score_visible && result.percentage_score !== null ? `${result.percentage_score}%` : "-"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Passing {result.score_visible && result.passing_score !== null ? `${result.passing_score}%` : "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        <Info label="Soal Terjawab" value={`${result.answered_questions ?? 0}/${result.total_questions ?? 0}`} />
                                        <Info label="Finalisasi" value={result.finalized_at ?? "-"} />
                                        <Info label="Keputusan Ujian" value={result.score_visible ? (result.passed ? "Lulus" : "Belum Lulus") : "Belum dibuka"} />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                <section className="candidate-panel-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Nilai ujian bukan perubahan otomatis ke status diterima/ditolak. Keputusan akhir tetap dicatat oleh panitia melalui status pendaftaran.
                    </p>
                    <Link
                        href="/dashboard/status-pendaftaran"
                        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-gold/30 px-4 text-sm font-bold text-amber-700 transition hover:border-gold hover:bg-gold/10 dark:text-gold"
                    >
                        Buka Status Pendaftaran
                    </Link>
                </section>
            </div>
        </>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    );
}

CandidateSelectionResult.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
