import { FormEvent } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { BackLink, EmptyState, FlashMessage, PageHeader, StatCard, StatusPill, inputClass, labelClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
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

            <div className="space-y-5 pb-8">
                <PageHeader
                    title={examPackage.title}
                    description={`${examPackage.subject_name ?? "Tanpa kategori"} · ${examPackage.code ?? "Tanpa kode"}`}
                    icon="fa-solid fa-box-archive"
                    actions={
                        <>
                            <BackLink href="/dashboard/admin/exams/packages" />
                            <Link href={`/dashboard/admin/exams/packages/${examPackage.id}/edit`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-200">
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

                <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
                    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Import Soal XLSX</h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Maksimal {max_rows.toLocaleString("id-ID")} baris. Kolom subject/package harus cocok dengan paket tujuan.</p>

                        <form onSubmit={submitImport} className="mt-4 space-y-4">
                            <div>
                                <label className={labelClass} htmlFor="question-import-file">File Excel</label>
                                <input
                                    id="question-import-file"
                                    type="file"
                                    accept=".xlsx"
                                    onChange={(event) => form.setData("file", event.target.files?.[0] ?? null)}
                                    className={inputClass}
                                />
                                {form.errors.file ? <p className="mt-1 text-xs text-red-500">{form.errors.file}</p> : null}
                            </div>

                            <button
                                type="submit"
                                disabled={form.processing || !form.data.file}
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 text-sm font-bold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {form.processing ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-file-import text-xs" />}
                                Import Soal
                            </button>
                        </form>

                        <div className="mt-5 rounded-lg bg-slate-50 p-3 dark:bg-white/[0.03]">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Kolom wajib</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {required_columns.map((column) => (
                                    <code key={column} className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-white/10">
                                        {column}
                                    </code>
                                ))}
                            </div>
                            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                `option_e`, `explanation`, dan `is_active` boleh kosong, tetapi `correct_answer` E wajib memiliki isi pada `option_e`.
                            </p>
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Riwayat Import</h2>
                            <Link href={`/dashboard/admin/exams/packages/${examPackage.id}/imports`} className="text-xs font-bold text-rose-500">Semua</Link>
                        </div>

                        {imports.length === 0 ? (
                            <EmptyState icon="fa-solid fa-file-circle-plus" title="Belum ada import" description="Upload file XLSX untuk menambahkan bank soal ke paket ini." />
                        ) : (
                            <div className="grid gap-3">
                                {imports.map((item) => (
                                    <Link key={item.id} href={`/dashboard/admin/exams/imports/${item.id}`} className="rounded-lg border border-slate-200 p-3 hover:border-rose-300 dark:border-white/10">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{item.original_filename}</p>
                                                <p className="mt-1 text-xs text-slate-500">{item.created_at ?? "-"}</p>
                                                <p className="mt-1 text-xs text-slate-500">{item.imported_rows} berhasil · {item.failed_rows} gagal · {item.total_rows} baris</p>
                                            </div>
                                            <StatusPill value={item.status} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Preview Soal Terbaru</h2>
                            <span className="text-xs font-semibold text-slate-500">20 terakhir</span>
                        </div>

                        {questions.length === 0 ? (
                            <EmptyState icon="fa-solid fa-circle-question" title="Belum ada soal" description="Soal yang berhasil diimport akan tampil sebagai preview admin." />
                        ) : (
                            <div className="space-y-3">
                                {questions.map((question, index) => (
                                    <article key={question.id} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-bold leading-6 text-slate-900 dark:text-white">{index + 1}. {question.question_text}</p>
                                            <StatusPill value={question.is_active ? "aktif" : "nonaktif"} />
                                        </div>
                                        <div className="mt-3 grid gap-2">
                                            {Object.entries(question.options).map(([key, value]) => value ? (
                                                <div key={key} className={`rounded-lg px-3 py-2 text-sm ${question.correct_answer === key ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-slate-50 text-slate-600 dark:bg-white/[0.03] dark:text-slate-300"}`}>
                                                    <span className="font-black">{key}.</span> {value}
                                                </div>
                                            ) : null)}
                                        </div>
                                        <p className="mt-3 text-xs font-semibold text-slate-500">Jawaban benar: {question.correct_answer} · {question.point} poin · {question.difficulty}</p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Sesi Menggunakan Paket Ini</h2>
                            <Link href="/dashboard/admin/exams/sessions/create" className="text-xs font-bold text-rose-500">Buat sesi</Link>
                        </div>

                        {sessions.length === 0 ? (
                            <EmptyState icon="fa-solid fa-calendar-plus" title="Belum ada sesi" description="Buat sesi agar kandidat bisa ditugaskan dan mulai ujian sesuai jadwal." />
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((session) => (
                                    <Link key={session.id} href={`/dashboard/admin/exams/sessions/${session.id}`} className="block rounded-lg border border-slate-200 p-3 hover:border-rose-300 dark:border-white/10">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{session.title}</p>
                                                <p className="mt-1 text-xs text-slate-500">{session.opens_at ?? "-"} - {session.closes_at ?? "-"}</p>
                                                <p className="mt-1 text-xs text-slate-500">{session.duration_minutes} menit</p>
                                            </div>
                                            <StatusPill value={session.status} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}
