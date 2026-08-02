import { Head, Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { ExamWorkspace, FlashMessage, PageHeader, WorkflowRail, primaryButtonClass, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import PackageFormCard, { PackageRow, SubjectOption } from "@/Components/Exam/Admin/PackageFormCard";
import PackageListCard from "@/Components/Exam/Admin/PackageListCard";
import type { PageProps } from "@/types";

type Props = {
    packages: PackageRow[];
    subjects: SubjectOption[];
    editing_package: PackageRow | null;
    mode?: "create" | "edit";
};

export default function ExamPackages({ packages, subjects, editing_package, mode }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;

    const packagesWithQuestions = packages.filter((item) => item.questions_count > 0).length;
    const readyPackages = packages.filter((item) => item.status === "published" && item.questions_count > 0).length;
    const packagesInSessions = packages.filter((item) => item.sessions_count > 0).length;
    const totalQuestions = packages.reduce((total, item) => total + item.questions_count, 0);

    return (
        <DashboardLayout>
            <Head title="Paket Ujian" />

            <ExamWorkspace active="packages">
                <PageHeader
                    title="Pengaturan Paket"
                    description="Kelola paket, unduh template, import soal, dan pastikan bank soal siap dipakai sesi."
                    icon="fa-solid fa-box-archive"
                    actions={
                        <>
                            <Link href="/dashboard/admin/exams/subjects" className={secondaryButtonClass}>
                                <i className="fa-solid fa-layer-group text-xs" /> Kategori
                            </Link>
                            <Link href="/dashboard/admin/exams/packages/create" className={primaryButtonClass}>
                                <i className="fa-solid fa-plus text-xs" /> Buat Paket Ujian
                            </Link>
                        </>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.package} />

                <WorkflowRail
                    items={[
                        {
                            label: "Langkah 1",
                            title: "Buat Paket",
                            description: `${packages.length.toLocaleString("id-ID")} paket, ${subjects.length.toLocaleString("id-ID")} kategori tersedia.`,
                            icon: "fa-solid fa-clipboard-list",
                            state: packages.length > 0 ? "done" : "active",
                        },
                        {
                            label: "Langkah 2",
                            title: "Unduh Template",
                            description: "Template resmi tersedia dari aksi unduh pada setiap paket yang sudah dibuat.",
                            icon: "fa-solid fa-file-arrow-down",
                            state: packages.length > 0 ? "done" : "idle",
                        },
                        {
                            label: "Langkah 3",
                            title: "Guru Mengisi",
                            description: "Guru mengisi konfigurasi ujian dan daftar soal pada file XLSX paket.",
                            icon: "fa-solid fa-pen-to-square",
                            state: packagesWithQuestions > 0 ? "done" : packages.length > 0 ? "active" : "idle",
                        },
                        {
                            label: "Langkah 4",
                            title: "Import Soal",
                            description: `${packagesWithQuestions.toLocaleString("id-ID")} paket sudah memiliki soal hasil import.`,
                            icon: "fa-solid fa-file-import",
                            state: packagesWithQuestions > 0 ? "done" : packages.length > 0 ? "active" : "idle",
                        },
                        {
                            label: "Langkah 5",
                            title: "Review Bank Soal",
                            description: `${readyPackages.toLocaleString("id-ID")} paket publish dengan total ${totalQuestions.toLocaleString("id-ID")} soal.`,
                            icon: "fa-solid fa-list-check",
                            state: readyPackages > 0 ? "done" : packagesWithQuestions > 0 ? "active" : "idle",
                        },
                        {
                            label: "Langkah 6",
                            title: "Siap Masuk Sesi",
                            description: `${packagesInSessions.toLocaleString("id-ID")} paket sudah terhubung ke sesi ujian.`,
                            icon: "fa-solid fa-calendar-check",
                            state: packagesInSessions > 0 ? "done" : readyPackages > 0 ? "active" : "idle",
                        },
                    ]}
                />

                <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
                    <PackageFormCard subjects={subjects} editingPackage={editing_package} mode={mode} />
                    <PackageListCard packages={packages} />
                </div>
            </ExamWorkspace>
        </DashboardLayout>
    );
}
