import PublicExamSummary from "@/Components/Exam/Admin/PublicExamSummary";
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
            <Head title="Jenis Mapel Ujian Publik" />

            <main className="min-w-0 space-y-5 pb-8">
                <PageHeader
                    title="Jenis Mapel Ujian Publik"
                    badge="UJIAN PUBLIK · LANGKAH 1: JENIS MAPEL"
                    description="Tentukan jenis mata pelajaran publik. Nilai kategori pada file XLSX harus cocok dengan jenis mapel paket tujuan."
                    icon="fa-solid fa-layer-group"
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                type="button"
                                onClick={handleCreate}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500"
                            >
                                <i className="fa-solid fa-plus text-xs" /> Jenis Mapel Baru
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

                <PublicExamSummary title="Ringkasan mata pelajaran" value={subjects.length} label="jenis mapel" description="Seluruh mata pelajaran ujian publik" items={[
                    { label: "Mapel aktif", value: activeCount, description: "Tersedia untuk paket", tone: "success" },
                    { label: "Paket publik", value: packageCount, description: "Di seluruh mapel" },
                    { label: "Butir soal", value: questionCount, description: "Bank soal publik" },
                ]} progress={{ value: activeCount, total: subjects.length, label: `${activeCount} dari ${subjects.length} mapel aktif` }} />

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
