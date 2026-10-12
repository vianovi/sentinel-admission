import { memo, useMemo } from "react";
import { router } from "@inertiajs/react";
import { EmptyState, StatusPill, inputClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { confirmAction } from "@/utils/swal";
import { useSessionState } from "@/hooks/useSessionState";
import type { Subject } from "./SubjectFormCard";

type Props = {
    subjects: Subject[];
    onEdit: (subject: Subject) => void;
    onCreateNew: () => void;
};

type SortOption = "newest" | "name_asc" | "packages_desc" | "questions_desc";
type StatusFilter = "all" | "active" | "inactive";

export const SubjectTable = memo(function SubjectTable({ subjects, onEdit, onCreateNew }: Props) {
    const [search, setSearch] = useSessionState("admin:exams:subjects:search", "");
    const [statusFilter, setStatusFilter] = useSessionState<StatusFilter>("admin:exams:subjects:status", "all");
    const [sortBy, setSortBy] = useSessionState<SortOption>("admin:exams:subjects:sort", "newest");

    const filteredAndSorted = useMemo(() => {
        let result = [...subjects];
        if (search.trim()) {
            const q = search.toLowerCase().trim();
            result = result.filter(
                (s) => s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q))
            );
        }
        if (statusFilter === "active") result = result.filter((s) => s.is_active);
        if (statusFilter === "inactive") result = result.filter((s) => !s.is_active);

        result.sort((a, b) => {
            if (sortBy === "name_asc") return a.name.localeCompare(b.name);
            if (sortBy === "packages_desc") return b.packages_count - a.packages_count;
            if (sortBy === "questions_desc") return b.questions_count - a.questions_count;
            return b.id - a.id;
        });
        return result;
    }, [subjects, search, statusFilter, sortBy]);

    const destroy = async (subject: Subject) => {
        const confirmed = await confirmAction("Hapus Kategori Ujian?", `Apakah Anda yakin ingin menghapus "${subject.name}"?`, "Ya, Hapus");
        if (!confirmed) return;
        router.delete(`/dashboard/admin/exams/subjects/${subject.id}`, { preserveScroll: true });
    };

    return (
        <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-2.5">
                    <div className="relative min-w-[200px] flex-1 max-w-sm">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari kategori atau kode..."
                            className={`${inputClass} pl-8 pr-7 text-xs h-9`}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <i className="fa-solid fa-xmark text-xs" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setStatusFilter("all")}
                            className={`rounded-lg px-2.5 py-1 font-bold ${statusFilter === "all" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"}`}
                        >
                            Semua ({subjects.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("active")}
                            className={`rounded-lg px-2.5 py-1 font-bold ${statusFilter === "active" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs" : "text-slate-500"}`}
                        >
                            Aktif ({subjects.filter((s) => s.is_active).length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("inactive")}
                            className={`rounded-lg px-2.5 py-1 font-bold ${statusFilter === "inactive" ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs" : "text-slate-500"}`}
                        >
                            Nonaktif ({subjects.filter((s) => !s.is_active).length})
                        </button>
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                        <option value="newest">Terbaru</option>
                        <option value="name_asc">Nama (A-Z)</option>
                        <option value="packages_desc">Paket Terbanyak</option>
                        <option value="questions_desc">Soal Terbanyak</option>
                    </select>
                </div>

                <button
                    type="button"
                    onClick={onCreateNew}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-black text-slate-950 hover:from-amber-400 transition-all shadow-md shadow-amber-500/20 whitespace-nowrap"
                >
                    <i className="fa-solid fa-plus text-xs" /> Tambah Kategori
                </button>
            </div>

            {filteredAndSorted.length === 0 ? (
                <EmptyState
                    icon="fa-solid fa-layer-group"
                    title={subjects.length === 0 ? "Belum ada kategori" : "Tidak ada hasil"}
                    description={subjects.length === 0 ? "Buat kategori pertama Anda sekarang." : "Sesuaikan kata kunci pencarian Anda."}
                />
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3 text-left">Kategori</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-right">Paket</th>
                                <th className="px-4 py-3 text-right">Soal</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                            {filteredAndSorted.map((subject) => (
                                <tr key={subject.id} className="align-middle hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                                    <td className="px-4 py-3">
                                        <div className="flex items-start gap-2.5">
                                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-black">
                                                <i className="fa-solid fa-layer-group text-xs" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 dark:text-white">{subject.name}</span>
                                                    {subject.code && (
                                                        <span className="rounded bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                            {subject.code}
                                                        </span>
                                                    )}
                                                </div>
                                                {subject.description ? (
                                                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{subject.description}</p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap"><StatusPill value={subject.is_active ? "aktif" : "nonaktif"} /></td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">{subject.packages_count}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">{subject.questions_count}</td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onEdit(subject)}
                                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-amber-500 hover:text-amber-600"
                                            >
                                                <i className="fa-solid fa-pen text-[11px]" /> Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => destroy(subject)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:border-red-400 hover:text-red-600"
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

export default SubjectTable;
