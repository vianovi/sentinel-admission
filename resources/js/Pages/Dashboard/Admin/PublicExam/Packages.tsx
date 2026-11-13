import { useState, useMemo, type FormEvent, type ReactNode } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import Select from "react-select";
import { makeSelectStyles } from "@/Components/UI/selectStyles";
import { useTheme } from "@/context/ThemeContext";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    ExamWorkspace,
    FlashMessage,
    PageHeader,
    WorkflowRail,
    EmptyState,
    StatusPill,
    inputClass,
    labelClass,
    primaryButtonClass,
    secondaryButtonClass,
} from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { confirmAction, showSuccessToast, showErrorToast } from "@/utils/swal";
import type { PageProps } from "@/types";

type Package = {
    id: number;
    title: string;
    code: string;
    status: string;
    duration_minutes: number;
    passing_score: number | null;
    allow_retry: boolean | number | null;
    show_result_to_participant: boolean | number | null;
    exam_public_subject_id: number;
    subject_name: string;
    question_count: number;
};
type Subject = { id: number; name: string };
type Props = {
    packages: Package[];
    subjects: Subject[];
    stats: {
        total: number;
        published: number;
        total_questions: number;
        total_subjects: number;
    };
};


type StatusFilter = "all" | "draft" | "published" | "closed";
type SortOption = "newest" | "title_asc" | "questions_desc";

export default function PublicPackages({ packages, subjects, stats }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const { theme } = useTheme();
    const selectStyles = makeSelectStyles(false, theme === "dark");

    // Filter & search states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [subjectFilter, setSubjectFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<SortOption>("newest");

    // Package Form Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formCategory, setFormCategory] = useState<number>(0);
    const [formTitle, setFormTitle] = useState("");
    const [formCode, setFormCode] = useState("");

    const [busy, setBusy] = useState(false);
    const hasPackages = stats.total > 0;
    const hasQuestions = stats.total_questions > 0;
    const hasPublishedPackages = stats.published > 0;

    const filteredPackages = useMemo(() => {
        return packages
            .filter((pkg) => {
                const q = search.trim().toLowerCase();
                const matchesSearch =
                    !q ||
                    pkg.title.toLowerCase().includes(q) ||
                    (pkg.code && pkg.code.toLowerCase().includes(q)) ||
                    (pkg.subject_name && pkg.subject_name.toLowerCase().includes(q));

                const matchesStatus =
                    statusFilter === "all" ||
                    pkg.status.toLowerCase() === statusFilter;

                const matchesSubject =
                    subjectFilter === "all" ||
                    pkg.exam_public_subject_id.toString() === subjectFilter;

                return matchesSearch && matchesStatus && matchesSubject;
            })
            .sort((a, b) => {
                if (sortBy === "title_asc") return a.title.localeCompare(b.title);
                if (sortBy === "questions_desc") return b.question_count - a.question_count;
                return b.id - a.id;
            });
    }, [packages, search, statusFilter, subjectFilter, sortBy]);

    const openCreateModal = () => {
        setFormCategory(subjects[0]?.id ?? 0);
        setFormTitle("");
        setFormCode("");
        setIsCreateModalOpen(true);
    };

    const closePackageModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleSavePackage = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        try {
            const response = await axios.post<{ id: number }>(route("admin.exams.public-bank.packages.store"), {
                exam_public_subject_id: formCategory,
                title: formTitle,
                code: formCode,
            });
            showSuccessToast("Paket dibuat. Import XLSX untuk mengisi soal dan konfigurasi.");
            closePackageModal();
            router.visit(route("admin.public-exams.packages.show", { package: response.data.id }));
        } catch (err) {
            showErrorToast(axios.isAxiosError(err) ? err.response?.data?.message ?? "Gagal menyimpan paket." : "Terjadi kesalahan.");
        } finally {
            setBusy(false);
        }
    };

    const handlePublishPackage = async (pkg: Package) => {
        const confirmed = await confirmAction(
            "Terbitkan Paket Ujian?",
            `Paket "${pkg.title}" akan diterbitkan dan siap dimasukkan ke dalam sesi ujian publik.`,
            "Ya, Terbitkan"
        );
        if (!confirmed) return;

        setBusy(true);
        try {
            await axios.post(route("admin.exams.public-bank.packages.publish", { package: pkg.id }));
            showSuccessToast("Paket berhasil diterbitkan.");
            router.reload();
        } catch (err) {
            showErrorToast(axios.isAxiosError(err) ? err.response?.data?.message ?? "Gagal menerbitkan paket." : "Terjadi kesalahan.");
        } finally {
            setBusy(false);
        }
    };

    const handleDeletePackage = async (pkg: Package) => {
        const confirmed = await confirmAction(
            "Hapus Paket Soal Publik?",
            `Paket “${pkg.title}” dan soalnya akan dihapus permanen. Sesi yang memakainya kembali draft dan seluruh token ruangnya dicabut. Hanya dapat dilakukan sebelum peserta mulai mengerjakan.`,
            "Ya, Hapus Paket"
        );
        if (!confirmed) return;

        setBusy(true);
        try {
            const response = await axios.delete<{ sessions_reset: number }>(route("admin.exams.public-bank.packages.destroy", { package: pkg.id }));
            showSuccessToast(`Paket dihapus. ${response.data.sessions_reset} sesi kembali draft; buat token baru setelah diterbitkan ulang.`);
            router.reload();
        } catch (error) {
            showErrorToast(axios.isAxiosError(error) ? (error.response?.data?.message ?? "Paket tidak dapat dihapus.") : "Gagal menghapus paket.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Head title="Paket Ujian Publik" />

            <ExamWorkspace active="packages">
                <PageHeader
                    title="Pengaturan Paket Soal Ujian Publik"
                    badge="LANGKAH 2: BANK SOAL & PAKET UJIAN"
                    description="Buat paket menurut jenis mapel, import XLSX berisi soal dan konfigurasi, lalu review sebelum terbitkan."
                    icon="fa-solid fa-box-archive"
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            {subjects.length === 0 ? (
                                <Link
                                    href="/dashboard/admin/public-exams/categories"
                                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-600/30 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25"
                                >
                                    <i className="fa-solid fa-layer-group" /> Buat Jenis Mapel Dahulu
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={openCreateModal}
                                    className={primaryButtonClass}
                                >
                                    <i className="fa-solid fa-plus text-xs" /> Buat Paket Baru
                                </button>
                            )}
                            <Link
                                href="/dashboard/admin/public-exams/sessions"
                                className={`${secondaryButtonClass} bg-white dark:bg-slate-900`}
                            >
                                Lanjut ke Sesi Publik <i className="fa-solid fa-arrow-right text-xs" />
                            </Link>
                        </div>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.package} />

                <WorkflowRail
                    items={[
                        {
                            label: "Langkah 1",
                            title: "Buat Paket",
                            description: `${stats.total.toLocaleString("id-ID")} paket, ${stats.total_subjects.toLocaleString("id-ID")} jenis mapel tersedia.`,
                            icon: "fa-solid fa-box-archive",
                            state: hasPackages ? "done" : "active",
                        },
                        {
                            label: "Langkah 2",
                            title: "Siapkan XLSX",
                            description: "Samakan jenis mapel, judul, dan kode pada file dengan paket.",
                            icon: "fa-solid fa-file-excel",
                            state: hasPackages ? "done" : "idle",
                        },
                        {
                            label: "Langkah 3",
                            title: "Import Soal",
                            description: `${stats.total_questions.toLocaleString("id-ID")} soal aktif telah diimpor.`,
                            icon: "fa-solid fa-file-import",
                            state: hasQuestions ? "done" : hasPackages ? "active" : "idle",
                        },
                        {
                            label: "Langkah 4",
                            title: "Review Bank Soal",
                            description: "Periksa isi soal dan konfigurasi paket sebelum terbit.",
                            icon: "fa-solid fa-list-check",
                            state: hasPublishedPackages ? "done" : hasQuestions ? "active" : "idle",
                        },
                        {
                            label: "Langkah 5",
                            title: "Terbitkan Paket",
                            description: `${stats.published.toLocaleString("id-ID")} paket siap dimasukkan ke sesi.`,
                            icon: "fa-solid fa-circle-check",
                            state: hasPublishedPackages ? "done" : hasQuestions ? "active" : "idle",
                        },
                        {
                            label: "Langkah 6",
                            title: "Jadwalkan Sesi",
                            description: "Pilih 1–5 paket dari mapel berbeda untuk satu sesi publik.",
                            icon: "fa-solid fa-calendar-check",
                            state: hasPublishedPackages ? "active" : "idle",
                        },
                    ]}
                />

                {/* Package List Card with Filters, Tabs, and Table/Cards */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Daftar Paket Soal Ujian Publik</span>
                                    <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {packages.length}
                                    </span>
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Buat paket dari Jenis Mapel, Judul, dan Kode yang sesuai XLSX. Lalu klik <strong>Import XLSX &amp; Review Soal</strong> pada paket untuk mengunggah file. Durasi, ambang lulus, izin ulang, dan visibilitas nilai otomatis dibaca dari file, bukan diisi di formulir ini.
                                </p>
                            </div>

                            {subjects.length > 0 && <button
                                type="button"
                                onClick={openCreateModal}
                                className={`${primaryButtonClass} self-start whitespace-nowrap sm:self-auto`}
                            >
                                <i className="fa-solid fa-plus text-xs" /> Buat Paket Baru
                            </button>}
                        </div>

                        {/* Search & Filter Toolbar */}
                        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
                            <div className="relative flex-1">
                                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari judul paket, kode, mata pelajaran..."
                                    className={`${inputClass} pl-9`}
                                    aria-label="Cari paket soal publik"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold">
                                    {(["all", "draft", "published", "closed"] as StatusFilter[]).map((tab) => (
                                                <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setStatusFilter(tab)}
                                                    aria-pressed={statusFilter === tab}
                                            className={`rounded-lg px-2.5 py-1 transition-all capitalize ${
                                                statusFilter === tab
                                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                                            : "text-slate-700 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900"
                                            }`}
                                        >
                                            {tab === "all" ? "Semua" : tab}
                                        </button>
                                    ))}
                                </div>

                                <div className="min-w-[180px]">
                                    <Select
                                        aria-label="Filter jenis mapel"
                                        options={[{ value: "all", label: "Semua Jenis Mapel" }, ...subjects.map(sub => ({ value: String(sub.id), label: sub.name }))]}
                                        value={[{ value: "all", label: "Semua Jenis Mapel" }, ...subjects.map(sub => ({ value: String(sub.id), label: sub.name }))].find(option => option.value === subjectFilter)}
                                        onChange={option => setSubjectFilter(option?.value ?? "all")}
                                        styles={selectStyles}
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                                    />
                                </div>

                                <div className="min-w-[165px]">
                                    <Select
                                        aria-label="Urutkan paket"
                                        options={[{ value: "newest", label: "Terbaru" }, { value: "title_asc", label: "Judul (A-Z)" }, { value: "questions_desc", label: "Soal Terbanyak" }]}
                                        value={[{ value: "newest", label: "Terbaru" }, { value: "title_asc", label: "Judul (A-Z)" }, { value: "questions_desc", label: "Soal Terbanyak" }].find(option => option.value === sortBy)}
                                        onChange={option => setSortBy((option?.value ?? "newest") as SortOption)}
                                        styles={selectStyles}
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Full-width package list follows the internal package workflow. */}
                    <div>
                        {filteredPackages.length === 0 ? (
                            <div className="p-8">
                                <EmptyState
                                    icon="fa-solid fa-box-open"
                                    title={packages.length === 0 ? "Belum ada paket soal publik" : "Tidak ada paket soal yang cocok"}
                                    description={packages.length === 0 ? "Buat jenis mapel, lalu buat paket untuk mengimpor XLSX." : "Coba ubah filter atau kata kunci pencarian."}
                                />
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200 dark:divide-white/10">
                                {filteredPackages.map((pkg) => {
                                    const isComplete = pkg.question_count > 0;
                                    return (
                                        <div
                                            key={pkg.id}
                                            className="flex flex-col gap-4 p-4 transition-colors hover:bg-slate-50/70 sm:p-5 lg:flex-row lg:items-start lg:justify-between dark:hover:bg-slate-800/40"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{pkg.title}</h3>
                                                    <StatusPill value={pkg.status} />
                                                    <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">{pkg.subject_name}</span>
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">{pkg.code}</span>
                                                </div>

                                                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                    <span><i className="fa-solid fa-list-check mr-1 text-slate-400" />{pkg.question_count} soal aktif</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span><i className="fa-solid fa-clock mr-1 text-slate-400" />{pkg.passing_score === null ? "Durasi belum diimpor" : `${pkg.duration_minutes} menit`}</span>
                                                    {pkg.passing_score !== null && <>
                                                        <span aria-hidden="true">·</span>
                                                        <span><i className="fa-solid fa-bullseye mr-1 text-slate-400" />Ambang &gt; {pkg.passing_score}</span>
                                                    </>}
                                                </div>
                                                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                                                    {pkg.passing_score === null || pkg.allow_retry === null || pkg.show_result_to_participant === null
                                                        ? "Pengaturan paket belum lengkap — import XLSX sebelum paket diterbitkan."
                                                        : `Ulang ${pkg.allow_retry ? "aktif" : "nonaktif"} · Nilai peserta ${pkg.show_result_to_participant ? "ditampilkan" : "disembunyikan"}`}
                                                </p>

                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 lg:max-w-[380px] lg:shrink-0 lg:justify-end lg:border-0 lg:pt-0 dark:border-white/10">
                                                <Link
                                                    href={route("admin.public-exams.packages.show", { package: pkg.id })}
                                                    className="inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                                >
                                                    <i className="fa-solid fa-file-import text-xs" />
                                                    <span>Kelola Soal</span>
                                                </Link>
                                                <a
                                                    href={route("admin.exams.public-bank.packages.template.download", { package: pkg.id })}
                                                    download
                                                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                                >
                                                    <i className="fa-solid fa-file-arrow-down text-xs" /> Template XLSX
                                                </a>

                                                <div className="flex items-center gap-1.5">
                                                    {pkg.status === "draft" && isComplete && pkg.passing_score !== null && pkg.allow_retry !== null && pkg.show_result_to_participant !== null && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void handlePublishPackage(pkg)}
                                                            disabled={busy}
                                                            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                                        >
                                                            <i className="fa-solid fa-check text-xs" /> Terbitkan
                                                        </button>
                                                    )}
                                                    <button type="button" onClick={() => void handleDeletePackage(pkg)} disabled={busy} className="inline-flex min-h-10 items-center rounded-lg border border-red-500/30 bg-red-50 px-3 text-xs font-bold text-red-800 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-50 dark:bg-red-500/10 dark:text-red-300" aria-label={`Hapus paket ${pkg.title}`}>
                                                        <i className="fa-solid fa-trash-can mr-1" aria-hidden="true" /> Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Modal Create / Edit Package */}
                {isCreateModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) closePackageModal(); }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="my-8 max-h-[90vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <i className="fa-solid fa-box-archive text-amber-500" />
                                    Tambah Paket Soal Publik Baru
                                </h3>
                                <button type="button" onClick={closePackageModal} aria-label="Tutup formulir paket" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:text-slate-300 dark:hover:bg-slate-800">
                                    <i className="fa-solid fa-xmark text-sm" />
                                </button>
                            </div>

                            <form onSubmit={handleSavePackage} className="space-y-3.5">
                                <div>
                                    <label className={labelClass} htmlFor="public-package-subject">Jenis Mata Pelajaran</label>
                                    <Select
                                        inputId="public-package-subject"
                                        options={subjects.map(sub => ({ value: sub.id, label: sub.name }))}
                                        value={subjects.map(sub => ({ value: sub.id, label: sub.name })).find(option => option.value === formCategory)}
                                        onChange={option => setFormCategory(option?.value ?? 0)}
                                        styles={selectStyles}
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass} htmlFor="public-package-title">Judul Paket</label>
                                    <input
                                        id="public-package-title"
                                        type="text"
                                        required
                                        value={formTitle}
                                        onChange={(e) => setFormTitle(e.target.value)}
                                        placeholder="Contoh: Paket 1 - Matematika Dasar"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                        <label className={labelClass} htmlFor="public-package-code">Kode Paket</label>
                                        <input
                                            id="public-package-code"
                                            type="text"
                                            required
                                            value={formCode}
                                            onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                            placeholder="MTK-PKT-01"
                                            className={inputClass}
                                        />
                                </div>
                                <div className="rounded-lg border border-amber-500/30 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
                                    <p className="font-bold">Langkah berikutnya: import XLSX.</p>
                                    <p>Durasi, ambang mapel, izin ulang dan visibilitas hasil diambil dari file. Kategori, judul, dan kode pada file harus cocok dengan paket ini.</p>
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                                    <button type="button" onClick={closePackageModal} className={secondaryButtonClass}>
                                        Batal
                                    </button>
                                <button type="submit" disabled={busy || !formCategory} className={primaryButtonClass}>
                                        {busy ? "Menyimpan..." : "Simpan Paket"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Question Manager for a Package */}
            </ExamWorkspace>
        </>
    );
}

PublicPackages.layout = (page: ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
