import { Head, Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { BackLink, ExamWorkspace, FlashMessage, PageHeader, StatCard, StatusPill, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import SessionTokenManager, { PublicTokenRow } from "@/Components/Exam/Admin/SessionTokenManager";
import SessionCandidateAssigner, { CandidateRow } from "@/Components/Exam/Admin/SessionCandidateAssigner";
import SessionAssignedTable, { Assignment } from "@/Components/Exam/Admin/SessionAssignedTable";
import type { PageProps } from "@/types";

type SessionDetail = {
    id: number;
    package_title: string | null;
    package_subject: string | null;
    admission_wave: string | null;
    title: string;
    description: string | null;
    instructions: string | null;
    status: string;
    opens_at: string | null;
    closes_at: string | null;
    duration_minutes: number;
    passing_score: number;
    max_attempts: number;
    show_result_to_candidate: boolean;
    is_public: boolean;
    public_access_type: string;
    candidates_count: number;
    attempts_count: number;
};

type Props = {
    session: SessionDetail;
    assigned_candidates: Assignment[];
    available_candidates: CandidateRow[];
    public_tokens?: PublicTokenRow[];
};

export default function ExamSessionShow({ session, assigned_candidates, available_candidates, public_tokens = [] }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;

    return (
        <>
            <Head title={`${session.title} - Sesi Ujian`} />

            <ExamWorkspace active="sessions">
                <PageHeader
                    title={session.title}
                    description={`${session.package_title ?? "Tanpa paket"} · ${session.package_subject ?? "Tanpa kategori"}`}
                    icon="fa-solid fa-calendar-check"
                    actions={
                        <>
                            <BackLink href="/dashboard/admin/exams/sessions" label="Kembali ke Pengaturan Sesi" />
                            <Link href={`/dashboard/admin/exams/results?session=${session.id}`} className={secondaryButtonClass}>
                                <i className="fa-solid fa-chart-simple text-xs" /> Lihat Hasil
                            </Link>
                            <Link href={`/dashboard/admin/exams/sessions/${session.id}/edit`} className={secondaryButtonClass}>
                                <i className="fa-solid fa-pen text-xs" /> Edit
                            </Link>
                        </>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.session ?? pageErrors.candidate_ids} />

                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <StatusPill value={session.status} />
                                <StatusPill value={session.is_public ? "akses umum aktif" : "akses khusus kandidat"} />
                                <StatusPill value={session.show_result_to_candidate ? "hasil kandidat aktif" : "hasil kandidat tersembunyi"} />
                            </div>
                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{session.description || "Belum ada deskripsi sesi."}</p>
                            {session.instructions ? (
                                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">
                                    {session.instructions}
                                </div>
                            ) : null}
                        </div>
                        <div className="min-w-[220px] rounded-lg bg-slate-50 p-3 text-sm dark:bg-white/[0.03]">
                            <p className="font-bold text-slate-900 dark:text-white">Jadwal</p>
                            <p className="mt-2 text-slate-600 dark:text-slate-300">{session.opens_at ?? "-"} sampai {session.closes_at ?? "-"}</p>
                            <p className="mt-2 text-xs text-slate-500">{session.admission_wave ?? "Semua gelombang"}</p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-3 md:grid-cols-5">
                    <StatCard label="Durasi" value={`${session.duration_minutes} menit`} icon="fa-solid fa-clock" tone="text-blue-500" />
                    <StatCard label="Passing" value={`${session.passing_score}%`} icon="fa-solid fa-bullseye" tone="text-emerald-500" />
                    <StatCard label="Attempt" value={session.max_attempts} icon="fa-solid fa-repeat" tone="text-violet-500" />
                    <StatCard label="Kandidat" value={session.candidates_count} icon="fa-solid fa-users" tone="text-amber-500" />
                    <StatCard label="Pengerjaan" value={session.attempts_count} icon="fa-solid fa-clipboard-check" tone="text-gold" />
                </div>

                {/* Public Token Generator Section */}
                <SessionTokenManager sessionId={session.id} tokens={public_tokens} />

                <div className="grid gap-4 xl:grid-cols-[460px_1fr]">
                    <SessionCandidateAssigner sessionId={session.id} availableCandidates={available_candidates} />
                    <SessionAssignedTable assignedCandidates={assigned_candidates} />
                </div>
            </ExamWorkspace>
        </>
    );
}

ExamSessionShow.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
