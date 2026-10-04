import { memo, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { Metric, StatusPill } from "@/Components/Dashboard/Candidate/Exam/ExamCandidateUi";
import { confirmAction } from "@/utils/swal";

export type CandidateMeta = {
    id: number;
    candidate_code: string | null;
    full_name: string | null;
    nisn: string | null;
    program_choice: string | null;
    status: string | null;
    admission_wave: { title: string; academic_year: string | null } | null;
};

export type PackageAssignment = {
    id: number;
    title: string | null;
    subject_name: string | null;
    duration_minutes: number | null;
    passing_score: number | null;
    max_attempts: number | null;
    status: string | null;
    can_start: boolean;
    block_reason: string | null;
    attempts_remaining: number;
    active_attempt_url: string | null;
};

export type CandidateAssignment = {
    id: number;
    status: string;
    has_active_attempt: boolean;
    session: {
        id: number;
        title: string;
        description: string | null;
        instructions: string | null;
        status: string;
        schedule_state: string;
        opens_at: string | null;
        closes_at: string | null;
        package_order_type: string | null;
    };
    packages: PackageAssignment[];
};

type Props = {
    candidate: CandidateMeta;
    assignment: CandidateAssignment;
};

export const CandidateSessionCard = memo(function CandidateSessionCard({ candidate, assignment }: Props) {
    const [processingPackage, setProcessingPackage] = useState<number | null>(null);

    const startExam = async (pkg: PackageAssignment) => {
        if (!pkg.can_start || processingPackage !== null || assignment.has_active_attempt) return;

        const confirmed = await confirmAction(
            "Mulai Ujian?",
            `Mulai ujian paket "${pkg.title}" sekarang? Timer akan berjalan berdasarkan waktu server.`,
            "Ya, Mulai Ujian"
        );
        if (!confirmed) return;

        setProcessingPackage(pkg.id);
        router.post(`/dashboard/seleksi/sesi/${assignment.session.id}/start`, { package_id: pkg.id }, {
            preserveScroll: true,
            onFinish: () => setProcessingPackage(null),
        });
    };

    return (
        <div className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <StatusPill value={assignment.session.schedule_state} />
                            <StatusPill value={assignment.status} />
                            {assignment.session.package_order_type === 'sequential' && (
                                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                    Urutan Pengerjaan Wajib
                                </span>
                            )}
                        </div>
                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {assignment.session.description || "Sesi ujian seleksi online. Pastikan koneksi stabil dan semua jawaban tersimpan sebelum mengumpulkan."}
                        </p>
                        {assignment.session.instructions ? (
                            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">
                                {assignment.session.instructions}
                            </div>
                        ) : null}
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-white/[0.03]">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Identitas</p>
                        <h2 className="mt-2 text-base font-black text-slate-900 dark:text-white">{candidate.full_name ?? "-"}</h2>
                        <p className="mt-1 text-sm text-slate-500">{candidate.candidate_code ?? "-"} · NISN {candidate.nisn ?? "-"}</p>
                        <p className="mt-1 text-sm text-slate-500">{candidate.program_choice ?? "Program belum dipilih"}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <StatusPill value={candidate.status} />
                            <StatusPill value={candidate.admission_wave?.title ?? "tanpa gelombang"} />
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-3 md:grid-cols-2">
                <Metric label="Sesi Dibuka" value={assignment.session.opens_at ?? "-"} icon="fa-solid fa-door-open" />
                <Metric label="Sesi Ditutup" value={assignment.session.closes_at ?? "-"} icon="fa-solid fa-door-closed" />
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daftar Paket Ujian</h3>
                {assignment.packages.map((pkg, index) => (
                    <section key={pkg.id} className={`rounded-lg border p-4 transition-all ${pkg.active_attempt_url ? 'border-amber-500/50 bg-amber-500/5 shadow-md dark:bg-amber-500/10' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900'}`}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {index + 1}
                                    </span>
                                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">{pkg.title}</h2>
                                    <StatusPill value={pkg.status} />
                                </div>
                                <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                                    <span><i className="fa-solid fa-book text-slate-400 mr-1" /> {pkg.subject_name}</span>
                                    <span><i className="fa-solid fa-clock text-slate-400 mr-1" /> {pkg.duration_minutes} Menit</span>
                                    <span><i className="fa-solid fa-bullseye text-slate-400 mr-1" /> Passing Grade: {pkg.passing_score ?? 0}</span>
                                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                                        <i className="fa-solid fa-repeat text-slate-400 mr-1" /> Sisa {pkg.attempts_remaining} Attempt
                                    </span>
                                </div>
                                {!pkg.can_start && !pkg.active_attempt_url && pkg.block_reason && (
                                    <p className="mt-2 text-[11px] font-medium text-red-500 dark:text-red-400">
                                        <i className="fa-solid fa-lock mr-1" /> {pkg.block_reason}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 lg:justify-end">
                                {pkg.active_attempt_url ? (
                                    <Link href={pkg.active_attempt_url} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-500 px-5 text-sm font-bold text-white hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20">
                                        <i className="fa-solid fa-play text-xs" /> Lanjutkan Pengerjaan
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => startExam(pkg)}
                                        disabled={!pkg.can_start || processingPackage !== null || (assignment.has_active_attempt && !pkg.active_attempt_url)}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-white px-5 text-sm font-bold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                    >
                                        {processingPackage === pkg.id ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-pen-to-square text-xs" />}
                                        Mulai Paket
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
});

export default CandidateSessionCard;
