import { Head, Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { ExamWorkspace, FlashMessage, PageHeader, WorkflowRail, primaryButtonClass, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import SessionFormCard, { PackageOption, SessionRow, WaveOption } from "@/Components/Exam/Admin/SessionFormCard";
import SessionListCard from "@/Components/Exam/Admin/SessionListCard";
import type { PageProps } from "@/types";

type Props = {
    sessions: SessionRow[];
    packages: PackageOption[];
    waves: WaveOption[];
    editing_session: SessionRow | null;
    mode?: "create" | "edit";
};

export default function ExamSessions({ sessions, packages, waves, editing_session, mode }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;

    const assignedCandidateTotal = sessions.reduce((total, session) => total + session.candidates_count, 0);
    const attemptTotal = sessions.reduce((total, session) => total + session.attempts_count, 0);
    const sessionsWithCandidates = sessions.filter((session) => session.candidates_count > 0).length;
    const monitoredSessions = sessions.filter((session) => session.attempts_count > 0).length;

    return (
        <DashboardLayout>
            <Head title="Sesi Ujian" />

            <ExamWorkspace active="sessions">
                <PageHeader
                    title="Pengaturan Sesi"
                    description="Kelola jadwal, penugasan kandidat, monitoring pengerjaan, dan akses hasil ujian."
                    icon="fa-solid fa-calendar-check"
                    actions={
                        <>
                            <Link href="/dashboard/admin/exams/results" className={secondaryButtonClass}>
                                <i className="fa-solid fa-square-poll-vertical text-xs" /> Hasil Ujian
                            </Link>
                            <Link href="/dashboard/admin/exams/sessions/create" className={primaryButtonClass}>
                                <i className="fa-solid fa-plus text-xs" /> Buat Sesi Ujian
                            </Link>
                        </>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.session} />

                <WorkflowRail
                    items={[
                        {
                            label: "Langkah 1",
                            title: "Buat Sesi",
                            description: `${sessions.length.toLocaleString("id-ID")} sesi dari ${packages.length.toLocaleString("id-ID")} paket yang dapat dipilih.`,
                            icon: "fa-solid fa-calendar-plus",
                            state: sessions.length > 0 ? "done" : "active",
                        },
                        {
                            label: "Langkah 2",
                            title: "Pilih Paket Aktif",
                            description: `${packages.length.toLocaleString("id-ID")} paket tersedia sebagai sumber soal dan aturan sesi.`,
                            icon: "fa-solid fa-box-archive",
                            state: sessions.length > 0 ? "done" : packages.length > 0 ? "active" : "idle",
                        },
                        {
                            label: "Langkah 3",
                            title: "Atur Peserta",
                            description: `${assignedCandidateTotal.toLocaleString("id-ID")} kandidat sudah ditempatkan di ${sessionsWithCandidates.toLocaleString("id-ID")} sesi.`,
                            icon: "fa-solid fa-users",
                            state: assignedCandidateTotal > 0 ? "done" : sessions.length > 0 ? "active" : "idle",
                        },
                        {
                            label: "Langkah 4",
                            title: "Monitor Pengerjaan",
                            description: `${monitoredSessions.toLocaleString("id-ID")} sesi sudah memiliki aktivitas pengerjaan.`,
                            icon: "fa-solid fa-desktop",
                            state: monitoredSessions > 0 ? "done" : assignedCandidateTotal > 0 ? "active" : "idle",
                        },
                        {
                            label: "Langkah 5",
                            title: "Review Hasil",
                            description: `${attemptTotal.toLocaleString("id-ID")} attempt tersedia untuk direview.`,
                            icon: "fa-solid fa-square-poll-vertical",
                            state: attemptTotal > 0 ? "done" : monitoredSessions > 0 ? "active" : "idle",
                        },
                    ]}
                />

                <div className="grid gap-4 xl:grid-cols-[440px_1fr]">
                    <SessionFormCard packages={packages} waves={waves} editingSession={editing_session} mode={mode} />
                    <SessionListCard sessions={sessions} />
                </div>
            </ExamWorkspace>
        </DashboardLayout>
    );
}
