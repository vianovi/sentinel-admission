import { FormEvent, useMemo, useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import RichExamText from "@/Components/Dashboard/Exam/RichExamText";
import { BackLink, EmptyState, ExamWorkspace, FlashMessage, PageHeader, StatCard, StatusPill, inputClass, labelClass, primaryButtonClass, secondaryButtonClass, textLinkClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import type { PageProps } from "@/types";

type PackageDetail = {
    id: number;
    subject_name: string | null;
    title: string;
    code: string | null;
    description?: string | null;
    duration_minutes: number;
    passing_score: number;
    max_attempts: number;
    status: string;
    questions_count: number;
    sessions_count: number;
    randomize_questions?: boolean;
    randomize_options?: boolean;
    show_result_to_candidate?: boolean;
};

type QuestionPreview = {
    id: number;
    question_text: string;
    options: Record<string, string | null>;
    correct_answer: string;
    point: number;
    difficulty: string;
    is_active: boolean;
};

type SessionPreview = {
    id: number;
    title: string;
    status: string;
    opens_at: string | null;
    closes_at: string | null;
    duration_minutes: number;
};

type ImportPreview = {
    id: number;
    original_filename: string;
    status: string;
    total_rows: number;
    imported_rows: number;
    failed_rows: number;
    created_at: string | null;
};

type ImportForm = {
    file: File | null;
};

type Props = {
    package: PackageDetail;
    questions: QuestionPreview[];
    sessions: SessionPreview[];
    imports: ImportPreview[];
    required_columns: string[];
    max_rows: number;
};

export default function ExamPackageShow({ package: examPackage, questions, sessions, imports, required_columns, max_rows }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const form = useForm<ImportForm>({ file: null });
    const templateUrl = `/dashboard/admin/exams/packages/${examPackage.id}/template`;

    const [searchQuery, setSearchQuery] = useState("");
    const [perPage, setPerPage] = useState<number>(50);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

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

    const submitImport = (event: FormEvent) => {
        event.preventDefault();

        form.post(`/dashboard/admin/exams/packages/${examPackage.id}/imports`, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const publish = () => {
        router.post(`/dashboard/admin/exams/packages/${examPackage.id}/publish`, {}, { preserveScroll: true });
    };

    const close = () => {
        if (!window.confirm(`Tutup paket "${examPackage.title}"?`)) return;
        router.post(`/dashboard/admin/exams/packages/${examPackage.id}/close`, {}, { preserveScroll: true });
    };

    return (
        <DashboardLayout>
            <Head title={`${examPackage.title} - Paket Ujian`} />

            <ExamWorkspace active="packages">
                <PageHeader
                    title={examPackage.title}
                    description={`${examPackage.subject_name ?? "Tanpa kategori"} · ${examPackage.code ?? "Tanpa kode"}`}
                    icon="fa-solid fa-box-archive"
                    actions={
                        <>
                            <BackLink href="/dashboard/admin/exams/packages" label="Kembali ke Pengaturan Paket" />
                            <Link href={`/dashboard/admin/exams/packages/${examPackage.id}/edit`} className={secondaryButtonClass}>
                                <i className="fa-solid fa-pen text-xs" /> Edit
                            </Link>
                        </>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.package ?? pageErrors.file} />

                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <StatusPill value={examPackage.status} />
                                <StatusPill value={examPackage.randomize_questions ? "soal diacak" : "urutan tetap"} />
                                <StatusPill value={examPackage.show_result_to_candidate ? "hasil kandidat aktif" : "hasil kandidat tersembunyi"} />
                            </div>
                            <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {examPackage.description || "Belum ada deskripsi paket."}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={publish}
                                disabled={examPackage.status === "published"}
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-500 px-3 text-sm font-bold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <i className="fa-solid fa-circle-check text-xs" /> Publish
                            </button>
                            <button
                                type="button"
                                onClick={close}
                                disabled={examPackage.status === "closed"}
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-amber-300 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
                            >
                                <i className="fa-solid fa-lock text-xs" /> Tutup
                            </button>
                        </div>
                    </div>
                </section>

                <div className="grid gap-3 md:grid-cols-4">
                    <StatCard label="Durasi" value={`${examPackage.duration_minutes} menit`} icon="fa-solid fa-clock" tone="text-blue-500" />
                    <StatCard label="Passing Score" value={`${examPackage.passing_score}%`} icon="fa-solid fa-bullseye" tone="text-emerald-500" />
                    <StatCard label="Soal Terdata" value={examPackage.questions_count} icon="fa-solid fa-list-ol" tone="text-violet-500" />
                    <StatCard label="Sesi" value={examPackage.sessions_count} icon="fa-solid fa-calendar-check" tone="text-amber-500" />
                </div>

                {/* Import Workflow & History Section */}
                <div className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
                    <section id="import-soal" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="max-w-3xl">
                                <h2 className="text-base font-black text-slate-900 dark:text-white">Workflow Import Soal</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    Gunakan template resmi paket ini agar konfigurasi paket dari panel admin tetap terkunci, sementara guru hanya mengisi data soal.
                                </p>
                            </div>
                            <a
                                href={templateUrl}
                                download
                                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-gold px-3 text-sm font-bold text-navy transition hover:bg-goldhover hover:text-white focus:outline-none focus:ring-2 focus:ring-gold/20"
                            >
                                <i className="fa-solid fa-file-arrow-down text-xs" /> Unduh Template Soal
                            </a>
                        </div>

                        <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                            <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200 flex items-center justify-between">
                                <span><i className="fa-solid fa-circle-info mr-2" /> Panduan & Langkah Import Soal</span>
                                <span className="text-[11px] text-slate-500">Klik untuk lihat</span>
                            </summary>
                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                {[
                                    ["1", "Buka Paket Ujian", "Admin memastikan paket, kategori, kode, dan status sudah sesuai di panel ini."],
                                    ["2", "Unduh Template Paket", "File XLSX dibuat khusus untuk paket ini dan memakai sheet Data Soal sebagai sumber import."],
                                    ["3", "Sistem Isi Konfigurasi Paket", "Kategori, judul, kode, deskripsi, dan status paket terisi otomatis."],
                                    ["4", "Bagikan ke Guru Mapel", "Kirim template ke guru tanpa mengubah nama sheet dan header tabel."],
                                    ["5", "Guru Mengisi Template", "Guru mengisi durasi, ambang lulus, dan data soal."],
                                    ["6", "Upload XLSX Terisi", `Admin mengunggah file kembali; sistem membaca maksimal ${max_rows.toLocaleString("id-ID")} baris.`],
                                    ["7", "Review & Simpan", "Sistem menampilkan ringkasan import dan menyimpan soal yang valid."],
                                ].map(([step, title, description]) => (
                                    <div key={step} className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-white/10 dark:bg-slate-900">
                                        <div className="flex items-start gap-2.5">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-900 text-xs font-black text-white dark:bg-white dark:text-slate-950">{step}</span>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{title}</p>
                                                <p className="mt-0.5 text-[11px] leading-4 text-slate-600 dark:text-slate-300">{description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </details>

                        <form onSubmit={submitImport} className="mt-4 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-end">
                                <div>
                                    <label className={labelClass} htmlFor="question-import-file">Upload Template Terisi (.xlsx)</label>
                                    <input
                                        id="question-import-file"
                                        type="file"
                                        accept=".xlsx"
                                        onChange={(event) => form.setData("file", event.target.files?.[0] ?? null)}
                                        className={inputClass}
                                    />
                                    {form.errors.file ? <p className="mt-1 text-xs text-red-500">{form.errors.file}</p> : null}
                                    {form.data.file ? (
                                        <p className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                                            File dipilih: {form.data.file.name}
                                        </p>
                                    ) : null}
                                </div>
                                <button
                                    type="submit"
                                    disabled={form.processing || !form.data.file}
                                    className={`${primaryButtonClass} min-h-11 w-full`}
                                >
                                    {form.processing ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-file-import text-xs" />}
                                    {form.processing ? "Memproses..." : "Validasi & Import"}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Riwayat Import</h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Ringkas, 10 terakhir.</p>
                            </div>
                            <Link href={`/dashboard/admin/exams/packages/${examPackage.id}/imports`} className={textLinkClass}>Semua</Link>
                        </div>

                        {imports.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center dark:border-white/10 dark:bg-slate-900">
                                <i className="fa-solid fa-clock-rotate-left text-2xl text-slate-300 dark:text-slate-600" />
                                <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">Belum ada import</p>
                            </div>
                        ) : (
                            <div className="grid max-h-[300px] gap-2 overflow-y-auto pr-1">
                                {imports.map((item) => (
                                    <Link key={item.id} href={`/dashboard/admin/exams/imports/${item.id}`} className="rounded-lg border border-slate-200 bg-white p-2.5 hover:border-gold/60 dark:border-white/10 dark:bg-slate-900">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{item.original_filename}</p>
                                                <p className="mt-1 text-[11px] text-slate-500">{item.imported_rows} berhasil · {item.failed_rows} gagal</p>
                                            </div>
                                            <StatusPill value={item.status} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Bank Soal Table Section */}
                <section id="bank-soal" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                        <div>
                            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <i className="fa-solid fa-table-list text-amber-500" /> Tabel Bank Soal ({filteredQuestions.length} Soal)
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Format ekspresi matematika (misal: 7², 5², 90°) dirender presisi dengan komponen RichExamText.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative min-w-[220px]">
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

                                                        {/* Toggleable Options View */}
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
            </ExamWorkspace>
        </DashboardLayout>
    );
}
