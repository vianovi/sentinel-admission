import { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { FlashMessage, PageHeader } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import PublicExamCategoryTable from "@/Components/Exam/Admin/PublicExamCategoryTable";
import PublicExamCategoryModal from "@/Components/Exam/Admin/PublicExamCategoryModal";
import type { PageProps } from "@/types";

export type PublicExamSubject = {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
    packages_count: number;
    questions_count: number;
    created_at: string | null;
};

type Props = {
    subjects: PublicExamSubject[];
};

export default function PublicExamCategories({ subjects }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const [editing, setEditing] = useState<PublicExamSubject | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreate = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const handleEdit = (subject: PublicExamSubject) => {
        setEditing(subject);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditing(null);
    };

    const activeCount = subjects.filter((subject) => subject.is_active).length;
    const packageCount = subjects.reduce((total, subject) => total + subject.packages_count, 0);
    const questionCount = subjects.reduce((total, subject) => total + subject.questions_count, 0);

    return (
        <>
            <Head title="Kategori Ujian Publik" />

            <main className="min-w-0 space-y-5 pb-8">
                <PageHeader
                    title="Kategori Ujian Publik"
                    badge="UJIAN PUBLIK · LANGKAH 1: KATEGORI"
                    description="Kelola kategori mata pelajaran yang terisolasi dari kategori ujian internal. Paket dan bank soal publik hanya terhubung ke kategori di halaman ini."
                    icon="fa-solid fa-layer-group"
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                type="button"
                                onClick={handleCreate}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500"
                            >
                                <i className="fa-solid fa-plus text-xs" /> Kategori Baru
                            </button>
                            <Link
                                href="/dashboard/admin/public-exams/packages"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Lanjut ke Paket Publik <i className="fa-solid fa-arrow-right text-xs" />
                            </Link>
                        </div>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.subject ?? pageErrors.name ?? pageErrors.code} />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Kategori Publik</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{subjects.length}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Kategori Aktif</span>
                        <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paket Publik</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{packageCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Butir Soal Publik</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{questionCount}</p>
                    </div>
                </div>

                <PublicExamCategoryTable
                    subjects={subjects}
                    onEdit={handleEdit}
                    onCreate={handleCreate}
                />

                <PublicExamCategoryModal
                    show={isModalOpen}
                    editing={editing}
                    onClose={handleClose}
                />
            </main>
        </>
    );
}

PublicExamCategories.layout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;