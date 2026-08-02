import { useState } from "react";
import { Head, usePage } from "@inertiajs/react";
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
                    title="Kategori Ujian"
                    description="Kelola subject atau kategori soal yang akan dipakai paket ujian."
                    icon="fa-solid fa-layer-group"
                    actions={<BackLink href="/dashboard/admin/exams/packages" label="Kembali ke Pengaturan Paket" />}
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
