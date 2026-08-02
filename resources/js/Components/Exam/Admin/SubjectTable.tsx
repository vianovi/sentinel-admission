import { memo } from "react";
import { router } from "@inertiajs/react";
import { EmptyState, StatusPill } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { confirmAction } from "@/utils/swal";
import type { Subject } from "./SubjectFormCard";

type Props = {
    subjects: Subject[];
    onEdit: (subject: Subject) => void;
};

export const SubjectTable = memo(function SubjectTable({ subjects, onEdit }: Props) {
    const destroy = async (subject: Subject) => {
        const confirmed = await confirmAction("Hapus Kategori Ujian?", `Apakah Anda yakin ingin menghapus kategori "${subject.name}"?`, "Ya, Hapus");
        if (!confirmed) return;

        router.delete(`/dashboard/admin/exams/subjects/${subject.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daftar Kategori</h2>
                <span className="text-xs font-semibold text-slate-500">{subjects.length.toLocaleString("id-ID")} kategori</span>
            </div>

            {subjects.length === 0 ? (
                <EmptyState icon="fa-solid fa-folder-open" title="Belum ada kategori" description="Buat kategori sebelum membuat paket ujian dan import soal." />
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
                            {subjects.map((subject) => (
                                <tr key={subject.id} className="align-top">
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-slate-900 dark:text-white">{subject.name}</p>
                                        <p className="mt-1 text-xs text-slate-500">{subject.code ?? "Tanpa kode"} · {subject.created_at ?? "-"}</p>
                                        {subject.description ? <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{subject.description}</p> : null}
                                    </td>
                                    <td className="px-4 py-3"><StatusPill value={subject.is_active ? "aktif" : "nonaktif"} /></td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">{subject.packages_count}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">{subject.questions_count}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onEdit(subject)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-gold/60 hover:text-gold dark:border-white/10 dark:text-slate-300"
                                                aria-label={`Edit ${subject.name}`}
                                            >
                                                <i className="fa-solid fa-pen text-xs" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => destroy(subject)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-500 dark:border-white/10 dark:text-slate-300"
                                                aria-label={`Hapus ${subject.name}`}
                                            >
                                                <i className="fa-solid fa-trash text-xs" />
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
