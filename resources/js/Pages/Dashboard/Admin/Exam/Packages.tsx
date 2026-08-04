import { Head, Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { ExamWorkspace, FlashMessage, PageHeader, WorkflowRail, primaryButtonClass, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import PackageFormCard, { PackageRow, SubjectOption } from "@/Components/Exam/Admin/PackageFormCard";
import PackageListCard from "@/Components/Exam/Admin/PackageListCard";
import ResizableSplitGrid from "@/Components/Dashboard/Shared/ResizableSplitGrid";
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
                    title="Pengaturan Paket Soal Ujian"
                    badge="LANGKAH 2: BANK SOAL & PAKET UJIAN"
                    description="Kelola paket soal, unduh template resmi XLSX, import bank soal, dan persiapkan materi ujian."
                    icon="fa-solid fa-box-archive"
                    actions={
                        subjects.length === 0 ? (
                            <Link
                                href="/dashboard/admin/exams/subjects"
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-2.5 text-xs font-extrabold hover:bg-amber-500/30 transition-all shadow-lg shadow-amber-500/10"
                            >
                                <i className="fa-solid fa-layer-group" /> Buat Kategori Ujian Dahulu
                            </Link>
                        ) : (
                            <Link
                                href="/dashboard/admin/exams/sessions"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
                            >
                                Lanjut ke Sesi Ujian <i className="fa-solid fa-arrow-right text-xs" />
                            </Link>
                        )
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

                <ResizableSplitGrid
                    storageKey="packages"
                    initialLeftWidth={420}
                    minLeftWidth={300}
                    maxLeftWidth={700}
                    left={<PackageFormCard subjects={subjects} editingPackage={editing_package} mode={mode} />}
                    right={<PackageListCard packages={packages} />}
                />
            </ExamWorkspace>
        </DashboardLayout>
    );
}
