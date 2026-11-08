import { useState, useMemo, type FormEvent, type ReactNode } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import DashboardLayout from "@/Layouts/DashboardLayout";
import RichExamText from "@/Components/Exam/Shared/RichExamText";
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
type Question = { id: number; question_text: string; options: string; correct_answer: string; point: number; is_active: boolean };
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

    // Question Manager Modal states
    const [activePackageForQuestions, setActivePackageForQuestions] = useState<Package | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    const [busy, setBusy] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

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
            await axios.post(route("admin.exams.public-bank.packages.store"), {
                exam_public_subject_id: formCategory,
                title: formTitle,
                code: formCode,
            });
            showSuccessToast("Paket dibuat. Import XLSX untuk mengisi soal dan konfigurasi.");
            closePackageModal();
            router.reload();
        } catch (err) {
            showErrorToast(axios.isAxiosError(err) ? err.response?.data?.message ?? "Gagal menyimpan paket." : "Terjadi kesalahan.");
        } finally {
            setBusy(false);
        }
    };

    const importQuestions = async (event: FormEvent) => {
        event.preventDefault();
        if (!activePackageForQuestions || !importFile) return;
        setBusy(true);
        try {
            const data = new FormData();
            data.append("file", importFile);
            const response = await axios.post<{ imported: number; active: number }>(route("admin.exams.public-bank.packages.import", { package: activePackageForQuestions.id }), data);
            showSuccessToast(`${response.data.imported} soal diimpor, ${response.data.active} aktif. Periksa sebelum terbitkan.`);
            setImportFile(null);
            closeQuestionManager();
            router.reload();
        } catch (error) {
            showErrorToast(axios.isAxiosError(error) ? (error.response?.data?.errors?.file?.[0] ?? error.response?.data?.message ?? "Import gagal.") : "File gagal diproses.");
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

    const openQuestionManager = async (pkg: Package) => {
        setActivePackageForQuestions(pkg);
        setImportFile(null);
        setLoadingQuestions(true);
        try {
            const response = await axios.get<{ questions: Question[] }>(route("admin.exams.public-bank.questions.index", { package: pkg.id }));
            setQuestions(response.data.questions);
        } catch {
            showErrorToast("Gagal memuat daftar soal.");
        } finally {
            setLoadingQuestions(false);
        }
    };

    const closeQuestionManager = () => {
        setActivePackageForQuestions(null);
        setQuestions([]);
        setImportFile(null);
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
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-2.5 text-xs font-extrabold hover:bg-amber-500/30 transition-all shadow-lg shadow-amber-500/10"
                                >
                                    <i className="fa-solid fa-layer-group" /> Buat Jenis Mapel Dahulu
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={openCreateModal}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
                                >
                                    <i className="fa-solid fa-plus text-xs" /> Buat Paket Baru
                                </button>
                            )}
                            <Link
                                href="/dashboard/admin/public-exams/sessions"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                Lanjut ke Sesi Publik <i className="fa-solid fa-arrow-right text-xs" />
                            </Link>
                        </div>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.package} />

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Paket Publik</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Paket Diterbitkan</span>
                        <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.published}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Butir Soal</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.total_questions}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jenis Mata Pelajaran</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.total_subjects}</p>
                    </div>
                </div>

                <WorkflowRail
                    items={[
                        {
                            label: "Langkah 1",
                            title: "Kategori Mapel",
                            description: `${stats.total_subjects} mata pelajaran terdaftar (IPAS, PAIBP, MTK, B.INDO).`,
                            icon: "fa-solid fa-layer-group",
                            state: stats.total_subjects >= 4 ? "done" : "active",
                        },
                        {
                            label: "Langkah 2",
                            title: "Buat Paket",
                            description: `${stats.total} paket dibuat (masing-masing 3 paket per mapel).`,
                            icon: "fa-solid fa-box-archive",
                            state: stats.total > 0 ? "done" : "active",
                        },
                        {
                            label: "Langkah 3",
                            title: "Import & Review Soal",
                            description: "Impor XLSX; hanya soal yang ditandai aktif di file yang dipakai.",
                            icon: "fa-solid fa-list-check",
                            state: stats.total_questions > 0 ? "done" : stats.total > 0 ? "active" : "idle",
                        },
                        {
                            label: "Langkah 4",
                            title: "Terbitkan Paket",
                            description: `${stats.published} paket berstatus published dan siap dimasukkan ke sesi.`,
                            icon: "fa-solid fa-circle-check",
                            state: stats.published >= 4 ? "done" : stats.total_questions > 0 ? "active" : "idle",
                        },
                        {
                            label: "Langkah 5",
                            title: "Jadwalkan Sesi",
                            description: "Pilih 4 paket berbeda untuk 1 sesi ujian publik.",
                            icon: "fa-solid fa-calendar-check",
                            state: stats.published >= 4 ? "active" : "idle",
                        },
                    ]}
                />

                {/* Package List Card with Filters, Tabs, and Table/Cards */}
                <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <i className="fa-solid fa-box-open text-amber-500" />
                                    <span>Daftar Paket Soal Ujian Publik</span>
                                    <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {packages.length}
                                    </span>
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Buat paket dari Jenis Mapel, Judul, dan Kode yang sesuai XLSX. Lalu klik <strong>Import XLSX &amp; Review Soal</strong> pada paket untuk mengunggah file. Durasi, ambang lulus, izin ulang, dan visibilitas nilai otomatis dibaca dari file, bukan diisi di formulir ini.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-black text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20 whitespace-nowrap self-start sm:self-auto"
                            >
                                <i className="fa-solid fa-plus text-xs" /> Buat Paket Baru
                            </button>
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
                                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold">
                                    {(["all", "draft", "published", "closed"] as StatusFilter[]).map((tab) => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setStatusFilter(tab)}
                                            className={`rounded-lg px-2.5 py-1 transition-all capitalize ${
                                                statusFilter === tab
                                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                                            }`}
                                        >
                                            {tab === "all" ? "Semua" : tab}
                                        </button>
                                    ))}
                                </div>

                                <select
                                    value={subjectFilter}
                                    onChange={(e) => setSubjectFilter(e.target.value)}
                                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    <option value="all">Semua Kategori</option>
                                    {subjects.map((sub) => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    <option value="newest">Terbaru</option>
                                    <option value="title_asc">Judul (A-Z)</option>
                                    <option value="questions_desc">Soal Terbanyak</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Package Cards Grid */}
                    <div className="p-4 sm:p-5">
                        {filteredPackages.length === 0 ? (
                            <EmptyState
                                icon="fa-solid fa-box-open"
                                title="Tidak ada paket soal yang cocok"
                                description="Coba ubah kata kunci pencarian atau buat paket baru."
                            />
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {filteredPackages.map((pkg) => {
                                    const isComplete = pkg.question_count > 0;
                                    return (
                                        <div
                                            key={pkg.id}
                                            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30 p-4 shadow-sm hover:border-amber-500/50 transition-all flex flex-col justify-between gap-3"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <span className="inline-block rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                                            {pkg.subject_name}
                                                        </span>
                                                        <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate">
                                                            {pkg.title}
                                                        </h3>
                                                        <span className="text-[11px] font-mono text-slate-400">
                                                            Kode: {pkg.code}
                                                        </span>
                                                    </div>
                                                    <StatusPill value={pkg.status} />
                                                </div>

                                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                    <div className="rounded-lg bg-white dark:bg-slate-900 p-2 border border-slate-100 dark:border-white/5">
                                                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">Durasi</span>
                                                        <span className="font-bold">{pkg.duration_minutes} Menit</span>
                                                    </div>
                                                    <div className="rounded-lg bg-white dark:bg-slate-900 p-2 border border-slate-100 dark:border-white/5">
                                                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">Butir Soal</span>
                                                        <span className={`font-bold ${isComplete ? "text-emerald-500" : "text-amber-500"}`}>
                                                            {pkg.question_count} Soal Aktif
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                                                    {pkg.passing_score === null || pkg.allow_retry === null || pkg.show_result_to_participant === null
                                                        ? "Pengaturan paket belum lengkap — import XLSX sebelum paket diterbitkan."
                                                        : `Ambang mapel > ${pkg.passing_score} · Ulang ${pkg.allow_retry ? "aktif" : "nonaktif"} · Nilai peserta ${pkg.show_result_to_participant ? "ditampilkan" : "disembunyikan"}`}
                                                </p>

                                                <div className="mt-2.5">
                                                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${isComplete ? "bg-emerald-500" : "bg-amber-500"}`}
                                                            style={{ width: isComplete ? "100%" : "0%" }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 dark:border-white/5 pt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => void openQuestionManager(pkg)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-200/80 dark:bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
                                                >
                                                    <i className="fa-solid fa-file-import text-xs" />
                                                    <span>Import XLSX &amp; Review Soal ({pkg.question_count})</span>
                                                </button>

                                                <div className="flex items-center gap-1.5">
                                                    {pkg.status === "draft" && isComplete && pkg.passing_score !== null && pkg.allow_retry !== null && pkg.show_result_to_participant !== null && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void handlePublishPackage(pkg)}
                                                            disabled={busy}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all"
                                                        >
                                                            <i className="fa-solid fa-check text-xs" /> Terbitkan
                                                        </button>
                                                    )}
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
                        <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-amber-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <i className="fa-solid fa-box-archive text-amber-500" />
                                    Tambah Paket Soal Publik Baru
                                </h3>
                                <button type="button" onClick={closePackageModal} className="text-slate-400 hover:text-slate-600">
                                    <i className="fa-solid fa-xmark text-sm" />
                                </button>
                            </div>

                            <form onSubmit={handleSavePackage} className="space-y-3.5">
                                <div>
                                    <label className={labelClass}>Jenis Mata Pelajaran</label>
                                    <select
                                        value={formCategory}
                                        onChange={(e) => setFormCategory(Number(e.target.value))}
                                        className={inputClass}
                                        required
                                    >
                                        {subjects.map((sub) => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>Judul Paket</label>
                                    <input
                                        type="text"
                                        required
                                        value={formTitle}
                                        onChange={(e) => setFormTitle(e.target.value)}
                                        placeholder="Contoh: Paket 1 - Matematika Dasar"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                        <label className={labelClass}>Kode Paket</label>
                                        <input
                                            type="text"
                                            required
                                            value={formCode}
                                            onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                            placeholder="MTK-PKT-01"
                                            className={inputClass}
                                        />
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300">Durasi, ambang mapel, izin ulang dan visibilitas hasil diambil dari XLSX saat import.</p>
                                <p className="text-xs text-slate-600 dark:text-slate-300">Kategori pada file XLSX harus sama dengan jenis mapel yang dipilih. Sesuaikan file lama sebelum diunggah.</p>

                                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                                    <button type="button" onClick={closePackageModal} className={secondaryButtonClass}>
                                        Batal
                                    </button>
                                    <button type="submit" disabled={busy} className={primaryButtonClass}>
                                        {busy ? "Menyimpan..." : "Simpan Paket"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Question Manager for a Package */}
                {activePackageForQuestions && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto"
                        onClick={(e) => { if (e.target === e.currentTarget) closeQuestionManager(); }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-amber-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                                        {activePackageForQuestions.subject_name} · KODE: {activePackageForQuestions.code}
                                    </span>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                        Import & Review Soal: {activePackageForQuestions.title}
                                    </h3>
                                </div>
                                <button type="button" onClick={closeQuestionManager} className="text-slate-400 hover:text-slate-600">
                                    <i className="fa-solid fa-xmark text-sm" />
                                </button>
                            </div>

                            {activePackageForQuestions.status === "draft" && questions.length === 0 && <form onSubmit={importQuestions} className="space-y-3 rounded-xl border border-amber-500/20 p-4">
                                <label htmlFor="public-exam-import" className={labelClass}>Import soal dan konfigurasi dari XLSX</label>
                                <input id="public-exam-import" type="file" accept=".xlsx" required onChange={event => setImportFile(event.target.files?.[0] ?? null)} className={inputClass} />
                                <button type="submit" disabled={busy || !importFile} className={primaryButtonClass}>{busy ? "Mengimpor..." : "Validasi & Import XLSX"}</button>
                            </form>}

                            {loadingQuestions ? (
                                <div className="py-12 text-center text-xs text-slate-400">
                                    <i className="fa-solid fa-circle-notch fa-spin text-lg text-amber-500 mb-2" />
                                    <p>Memuat butir soal...</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                                    {/* Existing Questions List */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Daftar Soal ({questions.length} Butir)
                                            </span>
                                            {questions.some((item) => item.is_active) ? (
                                                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                                    <i className="fa-solid fa-circle-check" /> Soal aktif tersedia
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                                                    <i className="fa-solid fa-triangle-exclamation" /> Belum ada soal aktif
                                                </span>
                                            )}
                                        </div>

                                        {questions.length === 0 ? (
                                            <EmptyState
                                                icon="fa-solid fa-list-ol"
                                                title="Belum ada butir soal"
                                                description="Upload XLSX dengan kategori, judul dan kode yang cocok. Konfigurasi serta jumlah soal aktif dibaca dari file."
                                            />
                                        ) : (
                                            <div className="space-y-2">
                                                {questions.map((q, idx) => (
                                                    <div
                                                        key={q.id}
                                                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40 p-3 flex items-start justify-between gap-3"
                                                    >
                                                        <div className="flex items-start gap-2.5 min-w-0">
                                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400">
                                                                {idx + 1}
                                                            </span>
                                                            <div className="text-xs text-slate-900 dark:text-white min-w-0">
                                                                <RichExamText text={q.question_text} />
                                                                <div className="mt-1 text-slate-500">Kunci: {q.correct_answer} · {q.point} poin · {q.is_active ? "Aktif" : "Nonaktif"}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </ExamWorkspace>
        </>
    );
}

PublicPackages.layout = (page: ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
