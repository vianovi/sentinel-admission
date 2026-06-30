import { FormEvent } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
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

                <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <section id="import-soal" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="max-w-3xl">
                                <h2 className="text-base font-black text-slate-900 dark:text-white">Workflow Import Soal</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    Gunakan template resmi paket ini agar konfigurasi paket dari panel admin tetap terkunci, sementara guru hanya mengisi konfigurasi ujian dan data soal.
                                </p>
                            </div>
                            <a
                                href={templateUrl}
                                download
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-gold px-3 text-sm font-bold text-navy transition hover:bg-goldhover hover:text-white focus:outline-none focus:ring-2 focus:ring-gold/20"
                            >
                                <i className="fa-solid fa-file-arrow-down text-xs" /> Unduh Template Soal
                            </a>
                        </div>

                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                            {[
                                ["1", "Buka Paket Ujian", "Admin memastikan paket, kategori, kode, dan status sudah sesuai di panel ini."],
                                ["2", "Unduh Template Paket", "File XLSX dibuat khusus untuk paket ini dan memakai sheet Data Soal sebagai sumber import."],
                                ["3", "Sistem Isi Konfigurasi Paket", "Kategori, judul, kode, deskripsi, dan status paket terisi otomatis dari panel admin."],
                                ["4", "Bagikan ke Guru Mapel", "Kirim template ke guru atau pembuat soal tanpa mengubah nama sheet dan header tabel."],
                                ["5", "Guru Mengisi Template", "Guru mengisi durasi, ambang lulus, visibilitas hasil, izin ujian ulang, dan data soal."],
                                ["6", "Upload XLSX Terisi", `Admin mengunggah file kembali; sistem membaca maksimal ${max_rows.toLocaleString("id-ID")} baris soal.`],
                                ["7", "Review & Simpan", "Sistem menampilkan ringkasan import, alasan gagal per baris, lalu menyimpan soal yang valid."],
                            ].map(([step, title, description]) => (
                                <div key={step} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-black text-white dark:bg-white dark:text-slate-950">{step}</span>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={submitImport} className="mt-4 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-end">
                                <div>
                                    <label className={labelClass} htmlFor="question-import-file">Upload Template Terisi</label>
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
                                    ) : (
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Hanya file `.xlsx` dari template paket ini. Sheet `Panduan` tidak dibaca sebagai data soal.</p>
                                    )}
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

                        <details className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-white/[0.03]">
                            <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Format Template</summary>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {required_columns.map((column) => (
                                    <code key={column} className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-white/10">
                                        {column}
                                    </code>
                                ))}
                            </div>
                            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                Jangan ubah nama sheet `Data Soal`, section konfigurasi, atau header tabel. `opsi_e`, `tingkat_kesulitan`, dan `pembahasan` boleh kosong; jika jawaban benar E maka `opsi_e` wajib diisi. Kolom `aktif` wajib berisi ya/tidak atau nilai boolean sejenis.
                            </p>
                        </details>
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
                                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Riwayat akan muncul setelah file XLSX pertama diunggah.</p>
                            </div>
                        ) : (
                            <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
                                {imports.map((item) => (
                                    <Link key={item.id} href={`/dashboard/admin/exams/imports/${item.id}`} className="rounded-lg border border-slate-200 bg-white p-2.5 hover:border-gold/60 dark:border-white/10 dark:bg-slate-900">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{item.original_filename}</p>
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
                    <section id="bank-soal" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
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
                            <Link href="/dashboard/admin/exams/sessions/create" className={textLinkClass}>Buat sesi</Link>
                        </div>

                        {sessions.length === 0 ? (
                            <EmptyState icon="fa-solid fa-calendar-plus" title="Belum ada sesi" description="Buat sesi agar kandidat bisa ditugaskan dan mulai ujian sesuai jadwal." />
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((session) => (
                                    <Link key={session.id} href={`/dashboard/admin/exams/sessions/${session.id}`} className="block rounded-lg border border-slate-200 p-3 hover:border-gold/60 dark:border-white/10">
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
            </ExamWorkspace>
        </DashboardLayout>
    );
}
