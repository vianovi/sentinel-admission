import { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { ExamWorkspace, FlashMessage, PageHeader, WorkflowRail } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { PackageOption, SessionRow, WaveOption } from "@/Components/Exam/Admin/SessionFormCard";
import SessionListCard from "@/Components/Exam/Admin/SessionListCard";
import SessionFormModal from "@/Components/Exam/Admin/SessionFormModal";
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

    const [isModalOpen, setIsModalOpen] = useState(Boolean(editing_session || mode === "edit"));
    const [selectedSession, setSelectedSession] = useState<SessionRow | null>(editing_session);

    const assignedCandidateTotal = sessions.reduce((total, session) => total + session.candidates_count, 0);
    const attemptTotal = sessions.reduce((total, session) => total + session.attempts_count, 0);
    const sessionsWithCandidates = sessions.filter((session) => session.candidates_count > 0).length;
    const monitoredSessions = sessions.filter((session) => session.attempts_count > 0).length;
    const publishedSessions = sessions.filter((session) => session.status === "published").length;

    const handleCreateNew = () => {
        setSelectedSession(null);
        setIsModalOpen(true);
    };

    const handleEdit = (session: SessionRow) => {
        setSelectedSession(session);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSession(null);
    };

    return (
        <>
            <Head title="Sesi Ujian" />

            <ExamWorkspace active="sessions">
                <PageHeader
                    title="Pengaturan Sesi Ujian Internal"
                    badge="LANGKAH 3: JADWAL & AKSES KANDIDAT"
                    description="Jadwalkan sesi ujian internal, hubungkan dengan paket soal, dan alokasikan peserta seleksi."
                    icon="fa-solid fa-calendar-check"
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {packages.length === 0 ? (
                                <Link
                                    href="/dashboard/admin/exams/packages"
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-2.5 text-xs font-extrabold hover:bg-amber-500/30 transition-all shadow-lg shadow-amber-500/10"
                                >
                                    <i className="fa-solid fa-box-open" /> Buat Paket Soal Dahulu
                                </Link>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleCreateNew}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        <i className="fa-solid fa-plus text-xs" /> Buat Sesi Baru
                                    </button>
                                </>
                            )}
                        </div>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.session} />

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Sesi</span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                                <i className="fa-solid fa-calendar-check text-xs" />
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{sessions.length}</span>
                            <span className="text-[11px] font-medium text-emerald-500">
                                {publishedSessions} aktif
                            </span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Paket Tersedia</span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                                <i className="fa-solid fa-box-archive text-xs" />
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{packages.length}</span>
                            <span className="text-[11px] font-medium text-slate-500">paket soal</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kandidat Dialokasi</span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                <i className="fa-solid fa-users text-xs" />
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{assignedCandidateTotal}</span>
                            <span className="text-[11px] font-medium text-slate-500">di {sessionsWithCandidates} sesi</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pengerjaan Selesai</span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                                <i className="fa-solid fa-chart-simple text-xs" />
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{attemptTotal}</span>
                            <span className="text-[11px] font-medium text-slate-500">di {monitoredSessions} sesi</span>
                        </div>
                    </div>
                </div>

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

                {/* Single Column Session List with Search, Filter & Actions */}
                <SessionListCard
                    sessions={sessions}
                    waves={waves}
                    onEdit={handleEdit}
                    onCreateNew={handleCreateNew}
                />

                {/* Modal Form for Create / Edit Session */}
                <SessionFormModal
                    show={isModalOpen}
                    onClose={handleCloseModal}
                    packages={packages}
                    waves={waves}
                    editingSession={selectedSession}
                />
            </ExamWorkspace>
        </>
    );
}

ExamSessions.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
