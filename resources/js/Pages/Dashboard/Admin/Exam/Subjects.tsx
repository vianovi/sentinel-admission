import { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { BackLink, ExamWorkspace, FlashMessage, PageHeader } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import SubjectFormCard, { Subject } from "@/Components/Exam/Admin/SubjectFormCard";
import SubjectTable from "@/Components/Exam/Admin/SubjectTable";
import type { PageProps } from "@/types";

type Props = {
    subjects: Subject[];
};

export default function ExamSubjects({ subjects }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const [editing, setEditing] = useState<Subject | null>(null);

    return (
        <DashboardLayout>
            <Head title="Kategori Ujian" />

            <ExamWorkspace active="packages">
                <PageHeader
                    title="Pengaturan Kategori Ujian"
                    badge="LANGKAH 1: KATEGORI & MATA PELAJARAN"
                    description="Tambahkan kategori soal (misal: Matematika, Bahasa Indonesia, TPA) sebagai syarat membuat Paket Soal."
                    icon="fa-solid fa-layer-group"
                    actions={
                        <Link
                            href="/dashboard/admin/exams/packages"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
                        >
                            Lanjut ke Paket Soal <i className="fa-solid fa-arrow-right text-xs" />
                        </Link>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.subject} />

                <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
                    <SubjectFormCard
                        editing={editing}
                        onCancelEdit={() => setEditing(null)}
                        onSuccess={() => setEditing(null)}
                    />
                    <SubjectTable subjects={subjects} onEdit={(subject) => setEditing(subject)} />
                </div>
            </ExamWorkspace>
        </DashboardLayout>
    );
}
