import { memo, useMemo, useState } from "react";
import { Link, router } from "@inertiajs/react";
import RichExamText from "@/Components/Exam/Shared/RichExamText";
import { EmptyState, StatusPill, inputClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { confirmAction } from "@/utils/swal";
import type { ExamQuestionPreview } from "@/types/exam";

type Props = {
    questions: ExamQuestionPreview[];
    packageId?: number;
};

/**
 * Paginated, searchable question bank table with RichExamText rendering.
 * Extracted from PackageShow to keep the page lean and memoized for performance.
 */
function QuestionBankTableInner({ questions, packageId }: Props) {
    const [searchQuery, setSearchQuery] = useState("");
    const [perPage, setPerPage] = useState<number>(50);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

    const handleClearQuestionBank = async () => {
        if (!packageId) return;
        const confirmed = await confirmAction(
            "Kosongkan Bank Soal?",
            `Apakah Anda yakin ingin menghapus seluruh ${questions.length} butir soal dari bank soal paket ini? Seluruh riwayat upload dan catatan import tetap tersimpan secara aman.`,
            "Ya, Kosongkan Bank Soal"
        );
        if (!confirmed) return;

        router.delete(`/dashboard/admin/exams/packages/${packageId}/questions`, {
            preserveScroll: true,
        });
    };

    const handleDeleteQuestion = async (questionId: number, index: number) => {
        const confirmed = await confirmAction(
            "Hapus Soal Ini?",
            `Apakah Anda yakin ingin menghapus soal nomor ${index} dari bank soal?`,
            "Ya, Hapus Soal"
        );
        if (!confirmed) return;

        router.delete(`/dashboard/admin/exams/questions/${questionId}`, {
            preserveScroll: true,
        });
    };

    const filteredQuestions = useMemo(() => {
        if (!searchQuery.trim()) return questions;
        const q = searchQuery.toLowerCase();
        return questions.filter((question) => {
            if (question.question_text.toLowerCase().includes(q)) return true;
            return Object.values(question.options).some((val) => val && val.toLowerCase().includes(q));
        });
    }, [questions, searchQuery]);

    const totalPages = Math.ceil(filteredQuestions.length / perPage) || 1;
    const paginatedQuestions = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredQuestions.slice(start, start + perPage);
    }, [filteredQuestions, currentPage, perPage]);

    return (
        <section id="bank-soal" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <i className="fa-solid fa-table-list text-amber-500" /> Tabel Bank Soal ({filteredQuestions.length} Soal)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Format ekspresi matematika (misal: 7², 5², 90°) dan gambar tag <code className="text-amber-500 font-mono">[GAMBAR: ...]</code> dirender presisi dengan komponen RichExamText.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {packageId && questions.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearQuestionBank}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition-all dark:text-rose-400"
                        >
                            <i className="fa-solid fa-trash-can text-xs" /> Kosongkan Bank Soal
                        </button>
                    )}

                    <Link
                        href="/dashboard/admin/exams/media"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-500/20 transition-all dark:text-amber-400"
                    >
                        <i className="fa-solid fa-photo-film text-xs" /> Kelola Gambar
                    </Link>

                    <div className="relative min-w-[200px]">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Cari teks soal / opsi..."
                            className={`${inputClass} pl-8 text-xs py-1.5`}
                        />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-medium">Tampil:</span>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className={`${inputClass} py-1 text-xs w-20`}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
            </div>

            {filteredQuestions.length === 0 ? (
                <div className="py-8">
                    <EmptyState icon="fa-solid fa-circle-question" title="Tidak ada soal ditemukan" description={searchQuery ? "Ganti kata kunci pencarian Anda." : "Soal yang diimport akan tampil di sini."} />
                </div>
            ) : (
                <>
                    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-3 py-3 w-12 text-center">No</th>
                                    <th className="px-4 py-3 min-w-[320px]">Pertanyaan Ujian & Pilihan Jawaban</th>
                                    <th className="px-3 py-3 w-28 text-center">Kunci Jawaban</th>
                                    <th className="px-3 py-3 w-24 text-center">Poin</th>
                                    <th className="px-3 py-3 w-28 text-center">Tingkat</th>
                                    <th className="px-3 py-3 w-24 text-center">Status</th>
                                    <th className="px-3 py-3 w-16 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                                {paginatedQuestions.map((question, idx) => {
                                    const globalIndex = (currentPage - 1) * perPage + idx + 1;
                                    const isExpanded = expandedQuestionId === question.id;

                                    return (
                                        <tr key={question.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                                            <td className="px-3 py-3 font-bold text-center text-slate-500 align-top">{globalIndex}</td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-semibold text-slate-900 dark:text-white leading-relaxed">
                                                    <RichExamText text={question.question_text} />
                                                </div>

                                                <div className="mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedQuestionId(isExpanded ? null : question.id)}
                                                        className="text-[11px] font-bold text-amber-600 hover:text-amber-500 dark:text-amber-400 flex items-center gap-1"
                                                    >
                                                        <i className={`fa-solid ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"} text-[9px]`} />
                                                        {isExpanded ? "Sembunyikan Pilihan" : "Lihat Pilihan Jawaban"}
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="mt-2.5 grid gap-1.5 pl-2 border-l-2 border-amber-500/30">
                                                            {Object.entries(question.options).map(([key, value]) => value ? (
                                                                <div
                                                                    key={key}
                                                                    className={`px-2.5 py-1.5 rounded text-xs flex items-start gap-2 ${
                                                                        question.correct_answer === key
                                                                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20"
                                                                            : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300"
                                                                    }`}
                                                                >
                                                                    <span className="font-black shrink-0">{key}.</span>
                                                                    <RichExamText text={value} />
                                                                </div>
                                                            ) : null)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 font-bold text-center align-top">
                                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-black">
                                                    {question.correct_answer}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center align-top font-semibold text-slate-600 dark:text-slate-300">
                                                {question.point} Poin
                                            </td>
                                            <td className="px-3 py-3 text-center align-top">
                                                <span className="capitalize rounded bg-slate-200 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                    {question.difficulty}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center align-top">
                                                <StatusPill value={question.is_active ? "aktif" : "nonaktif"} />
                                            </td>
                                            <td className="px-3 py-3 text-center align-top">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteQuestion(question.id, globalIndex)}
                                                    title="Hapus butir soal ini"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 transition"
                                                >
                                                    <i className="fa-solid fa-trash-can text-xs" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 dark:text-slate-400">
                        <p>
                            Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{(currentPage - 1) * perPage + 1}</span> - <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * perPage, filteredQuestions.length)}</span> dari <span className="font-bold text-slate-800 dark:text-slate-200">{filteredQuestions.length}</span> soal
                        </p>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                            >
                                <i className="fa-solid fa-chevron-left text-[10px] mr-1" /> Sebelum
                            </button>
                            <span className="px-2 font-bold text-slate-800 dark:text-slate-200">
                                Halaman {currentPage} dari {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                            >
                                Berikut <i className="fa-solid fa-chevron-right text-[10px] ml-1" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

const QuestionBankTable = memo(QuestionBankTableInner);
export default QuestionBankTable;
