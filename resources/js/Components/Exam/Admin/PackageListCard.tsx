import { memo, useMemo } from "react";
import { Link, router } from "@inertiajs/react";
import { EmptyState, StatusPill, dangerButtonClass, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { confirmAction } from "@/utils/swal";
import { useSessionState } from "@/hooks/useSessionState";
import type { PackageRow, SubjectOption } from "./PackageFormCard";

type Props = {
    packages: PackageRow[];
    subjects?: SubjectOption[];
    onEdit?: (item: PackageRow) => void;
    onCreateNew?: () => void;
};

type SortOption = "newest" | "title_asc" | "title_desc" | "questions_desc" | "sessions_desc";
type StatusFilter = "all" | "draft" | "published" | "closed";

export const PackageListCard = memo(function PackageListCard({ packages, subjects = [], onEdit, onCreateNew }: Props) {
    const [search, setSearch] = useSessionState("admin:exams:packages:search", "");
    const [statusFilter, setStatusFilter] = useSessionState<StatusFilter>("admin:exams:packages:status", "all");
    const [subjectFilter, setSubjectFilter] = useSessionState<string>("admin:exams:packages:subject", "all");
    const [sortBy, setSortBy] = useSessionState<SortOption>("admin:exams:packages:sort", "newest");

    const publish = (item: PackageRow) => {
        router.post(`/dashboard/admin/exams/packages/${item.id}/publish`, {}, { preserveScroll: true });
    };

    const close = async (item: PackageRow) => {
        const confirmed = await confirmAction("Tutup Paket Ujian?", `Apakah Anda yakin ingin menutup paket "${item.title}"?`, "Ya, Tutup Paket");
        if (!confirmed) return;
        router.post(`/dashboard/admin/exams/packages/${item.id}/close`, {}, { preserveScroll: true });
    };

    const destroy = async (item: PackageRow) => {
        const confirmed = await confirmAction("Hapus Paket Ujian?", `Apakah Anda yakin ingin menghapus paket "${item.title}"?`, "Ya, Hapus Paket");
        if (!confirmed) return;
        router.delete(`/dashboard/admin/exams/packages/${item.id}`, { preserveScroll: true });
    };

    const filteredPackages = useMemo(() => {
        return packages
            .filter((pkg) => {
                const q = search.trim().toLowerCase();
                const matchesSearch =
                    !q ||
                    pkg.title.toLowerCase().includes(q) ||
                    (pkg.code && pkg.code.toLowerCase().includes(q)) ||
                    (pkg.subject_name && pkg.subject_name.toLowerCase().includes(q)) ||
                    (pkg.description && pkg.description.toLowerCase().includes(q));

                const matchesStatus =
                    statusFilter === "all" ||
                    pkg.status.toLowerCase() === statusFilter;

                const matchesSubject =
                    subjectFilter === "all" ||
                    pkg.exam_subject_id.toString() === subjectFilter;

                return matchesSearch && matchesStatus && matchesSubject;
            })
            .sort((a, b) => {
                if (sortBy === "title_asc") return a.title.localeCompare(b.title);
                if (sortBy === "title_desc") return b.title.localeCompare(a.title);
                if (sortBy === "questions_desc") return b.questions_count - a.questions_count;
                if (sortBy === "sessions_desc") return b.sessions_count - a.sessions_count;
                return b.id - a.id;
            });
    }, [packages, search, statusFilter, subjectFilter, sortBy]);

    return (
        <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Daftar Paket Ujian</span>
                            <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                                {packages.length}
                            </span>
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Unduh template resmi XLSX per paket, lalu import bank soal agar siap dipakai di sesi ujian.
                        </p>
                    </div>

                    {onCreateNew && (
                        <button
                            type="button"
                            onClick={onCreateNew}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-black text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20 whitespace-nowrap"
                        >
                            <i className="fa-solid fa-plus text-xs" /> Buat Paket Baru
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari judul, kode paket, kategori..."
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

                        {subjects.length > 0 && (
                            <select
                                value={subjectFilter}
                                onChange={(e) => setSubjectFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
                            >
                                <option value="all">Semua Kategori</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id.toString()}>{s.name}</option>
                                ))}
                            </select>
                        )}

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
                        >
                            <option value="newest">Terbaru</option>
                            <option value="title_asc">Judul A-Z</option>
                            <option value="title_desc">Judul Z-A</option>
                            <option value="questions_desc">Soal Terbanyak</option>
                            <option value="sessions_desc">Sesi Terbanyak</option>
                        </select>
                    </div>
                </div>
            </div>

            {filteredPackages.length === 0 ? (
                <div className="p-8">
                    <EmptyState
                        icon="fa-solid fa-box-open"
                        title={packages.length === 0 ? "Belum ada paket ujian" : "Tidak ada paket yang cocok"}
                        description="Sesuaikan kata kunci pencarian atau buat paket baru."
                    />
                </div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredPackages.map((item) => (
                        <div key={item.id} className="p-4 sm:p-5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{item.title}</h3>
                                        <StatusPill value={item.status} />
                                        {item.code && (
                                            <span className="rounded-md bg-slate-100 dark:bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                {item.code}
                                            </span>
                                        )}
                                        {item.subject_name && (
                                            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                {item.subject_name}
                                            </span>
                                        )}
                                    </div>
                                    {item.description && (
                                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                                            {item.description}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
                                        <span><i className="fa-solid fa-list-check mr-1 text-slate-400" />{item.questions_count} Soal</span>
                                        <span>·</span>
                                        <span><i className="fa-solid fa-clock mr-1 text-slate-400" />{item.duration_minutes} Min</span>
                                        <span>·</span>
                                        <span><i className="fa-solid fa-bullseye mr-1 text-slate-400" />Passing {item.passing_score}%</span>
                                        <span>·</span>
                                        <span><i className="fa-solid fa-calendar-check mr-1 text-slate-400" />{item.sessions_count} Sesi</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
                                    <a
                                        href={`/dashboard/admin/exams/packages/${item.id}/template`}
                                        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-500/20 transition-all"
                                    >
                                        <i className="fa-solid fa-file-excel" /> Template XLSX
                                    </a>

                                    <Link
                                        href={`/dashboard/admin/exams/packages/${item.id}`}
                                        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-3.5 py-1.5 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
                                    >
                                        <i className="fa-solid fa-file-import text-xs" /> Kelola Soal
                                    </Link>

                                    {onEdit ? (
                                        <button
                                            type="button"
                                            onClick={() => onEdit(item)}
                                            className={secondaryButtonClass}
                                        >
                                            <i className="fa-solid fa-pen text-xs" /> Edit
                                        </button>
                                    ) : (
                                        <Link href={`/dashboard/admin/exams/packages/${item.id}/edit`} className={secondaryButtonClass}>
                                            <i className="fa-solid fa-pen text-xs" /> Edit
                                        </Link>
                                    )}

                                    {item.status === "draft" && item.questions_count > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => publish(item)}
                                            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold hover:bg-emerald-500/20 transition-all"
                                        >
                                            <i className="fa-solid fa-check text-xs" /> Publish
                                        </button>
                                    ) : null}

                                    {item.status === "published" ? (
                                        <button
                                            type="button"
                                            onClick={() => close(item)}
                                            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1.5 text-xs font-bold hover:bg-amber-500/20 transition-all"
                                        >
                                            <i className="fa-solid fa-lock text-xs" /> Tutup
                                        </button>
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={() => destroy(item)}
                                        className={dangerButtonClass}
                                    >
                                        <i className="fa-solid fa-trash text-xs" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
});

export default PackageListCard;
