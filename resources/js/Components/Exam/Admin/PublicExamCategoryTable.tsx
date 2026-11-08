import { memo, useMemo } from "react";
import { router } from "@inertiajs/react";
import { EmptyState, StatusPill, inputClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { confirmAction } from "@/utils/swal";
import { useSessionState } from "@/hooks/useSessionState";
import type { PublicExamSubject } from "@/Pages/Dashboard/Admin/PublicExam/Categories";

type Props = {
    subjects: PublicExamSubject[];
    onEdit: (subject: PublicExamSubject) => void;
    onCreate: () => void;
};

type SortOption = "newest" | "name_asc" | "packages_desc" | "questions_desc";
type StatusFilter = "all" | "active" | "inactive";

const routeRoot = "/dashboard/admin/public-exams/categories";

export const PublicExamCategoryTable = memo(function PublicExamCategoryTable({ subjects, onEdit, onCreate }: Props) {
    const [search, setSearch] = useSessionState("admin:public-exams:categories:search", "");
    const [statusFilter, setStatusFilter] = useSessionState<StatusFilter>("admin:public-exams:categories:status", "all");
    const [sortBy, setSortBy] = useSessionState<SortOption>("admin:public-exams:categories:sort", "newest");

    const filteredAndSorted = useMemo(() => {
        let result = [...subjects];
        if (search.trim()) {
            const query = search.toLowerCase().trim();
            result = result.filter((subject) => subject.name.toLowerCase().includes(query) || subject.code.toLowerCase().includes(query));
        }
        if (statusFilter === "active") result = result.filter((subject) => subject.is_active);
        if (statusFilter === "inactive") result = result.filter((subject) => !subject.is_active);

        result.sort((a, b) => {
            if (sortBy === "name_asc") return a.name.localeCompare(b.name);
            if (sortBy === "packages_desc") return b.packages_count - a.packages_count;
            if (sortBy === "questions_desc") return b.questions_count - a.questions_count;
            return b.id - a.id;
        });

        return result;
    }, [subjects, search, statusFilter, sortBy]);

    const destroy = async (subject: PublicExamSubject) => {
        const confirmed = await confirmAction(
            "Hapus Jenis Mapel Ujian Publik?",
            `Hapus jenis mapel “${subject.name}”? Jenis mapel yang masih memiliki paket publik tidak bisa dihapus.`,
            "Ya, Hapus"
        );
        if (!confirmed) return;
        router.delete(`${routeRoot}/${subject.id}`, { preserveScroll: true });
    };

    return (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-2.5">
                    <div className="relative min-w-[200px] max-w-sm flex-1">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari jenis mapel atau kode..."
                            className={`${inputClass} h-9 pl-8 pr-7 text-xs`}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                aria-label="Hapus pencarian"
                            >
                                <i className="fa-solid fa-xmark text-xs" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-[11px] dark:border-white/10 dark:bg-white/[0.03]">
                        <button
                            type="button"
                            onClick={() => setStatusFilter("all")}
                            className={`rounded-lg px-2.5 py-1 font-bold ${statusFilter === "all" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500"}`}
                        >
                            Semua ({subjects.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("active")}
                            className={`rounded-lg px-2.5 py-1 font-bold ${statusFilter === "active" ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-400" : "text-slate-500"}`}
                        >
                            Aktif ({subjects.filter((subject) => subject.is_active).length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("inactive")}
                            className={`rounded-lg px-2.5 py-1 font-bold ${statusFilter === "inactive" ? "bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-300" : "text-slate-500"}`}
                        >
                            Nonaktif ({subjects.filter((subject) => !subject.is_active).length})
                        </button>
                    </div>

                    <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value as SortOption)}
                        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                        aria-label="Urutkan jenis mapel"
                    >
                        <option value="newest">Terbaru</option>
                        <option value="name_asc">Nama (A-Z)</option>
                        <option value="packages_desc">Paket Terbanyak</option>
                        <option value="questions_desc">Soal Terbanyak</option>
                    </select>
                </div>

                <button
                    type="button"
                    onClick={onCreate}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:from-amber-400"
                >
                    <i className="fa-solid fa-plus text-xs" /> Tambah Jenis Mapel
                </button>
            </div>

            {filteredAndSorted.length === 0 ? (
                <EmptyState
                    icon="fa-solid fa-layer-group"
                    title={subjects.length === 0 ? "Belum ada jenis mapel" : "Tidak ada hasil"}
                    description={subjects.length === 0 ? "Buat jenis mapel pertama untuk mulai menyusun paket." : "Coba ubah kata kunci atau filter jenis mapel."}
                />
            ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3 text-left">Jenis Mapel Publik</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-right">Paket</th>
                                <th className="px-4 py-3 text-right">Soal Aktif</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                            {filteredAndSorted.map((subject) => (
                                <tr key={subject.id} className="align-middle hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                                    <td className="px-4 py-3">
                                        <div className="flex items-start gap-2.5">
                                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-xs font-black text-amber-500">
                                                <i className="fa-solid fa-layer-group text-xs" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 dark:text-white">{subject.name}</span>
                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                                                        {subject.code}
                                                    </span>
                                                </div>
                                                {subject.created_at && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Dibuat {subject.created_at}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3"><StatusPill value={subject.is_active ? "aktif" : "nonaktif"} /></td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">{subject.packages_count}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">{subject.questions_count}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onEdit(subject)}
                                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-700 hover:border-amber-500 hover:text-amber-600 dark:border-white/10 dark:text-slate-300"
                                            >
                                                <i className="fa-solid fa-pen text-[11px]" /> Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void destroy(subject)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-600 dark:border-white/10"
                                                aria-label={`Hapus jenis mapel ${subject.name}`}
                                                title={subject.packages_count > 0 ? "Jenis mapel masih memiliki paket" : "Hapus jenis mapel"}
                                            >
                                                <i className="fa-solid fa-trash text-[11px]" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
});

export default PublicExamCategoryTable;