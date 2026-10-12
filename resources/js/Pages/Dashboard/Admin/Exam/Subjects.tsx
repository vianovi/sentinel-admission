import { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { ExamWorkspace, FlashMessage, PageHeader } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import type { Subject } from "@/Components/Exam/Admin/SubjectFormCard";
import SubjectTable from "@/Components/Exam/Admin/SubjectTable";
import SubjectFormModal from "@/Components/Exam/Admin/SubjectFormModal";
import type { PageProps } from "@/types";

type Props = {
    subjects: Subject[];
};

export default function ExamSubjects({ subjects }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const [editing, setEditing] = useState<Subject | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateNew = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const handleEdit = (subject: Subject) => {
        setEditing(subject);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditing(null);
    };

    const activeCount = subjects.filter((s) => s.is_active).length;
    const totalPackages = subjects.reduce((sum, s) => sum + (s.packages_count || 0), 0);
    const totalQuestions = subjects.reduce((sum, s) => sum + (s.questions_count || 0), 0);

    return (
        <>
            <Head title="Kategori Ujian" />

            <ExamWorkspace active="packages">
                <PageHeader
                    title="Pengaturan Kategori Ujian"
                    badge="LANGKAH 1: KATEGORI & MATA PELAJARAN"
                    description="Kelola kategori soal (misal: Matematika, Bahasa Indonesia, TPA) sebagai prasyarat pembuatan Paket Soal."
                    icon="fa-solid fa-layer-group"
                    actions={
                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={handleCreateNew}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
                            >
                                <i className="fa-solid fa-plus text-xs" /> Kategori Baru
                            </button>
                            <Link
                                href="/dashboard/admin/exams/packages"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                Lanjut ke Paket Soal <i className="fa-solid fa-arrow-right text-xs" />
                            </Link>
                        </div>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.subject} />

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Kategori</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{subjects.length}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Kategori Aktif</span>
                        <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paket Terhubung</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalPackages}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Butir Soal</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalQuestions}</p>
                    </div>
                </div>

                {/* Focused Single Column List with Search/Filter/Sort */}
                <SubjectTable
                    subjects={subjects}
                    onEdit={handleEdit}
                    onCreateNew={handleCreateNew}
                />

                {/* Modal Form */}
                <SubjectFormModal
                    show={isModalOpen}
                    onClose={handleCloseModal}
                    editing={editing}
                />
            </ExamWorkspace>
        </>
    );
}

ExamSubjects.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
