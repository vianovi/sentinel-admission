import { FormEvent, useEffect } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { EmptyState, ExamSectionNav, FlashMessage, PageHeader, StatusPill, inputClass, labelClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import type { PageProps } from "@/types";

type SubjectOption = {
    id: number;
    name: string;
    code: string | null;
};

type PackageRow = {
    id: number;
    exam_subject_id: number;
    subject_name: string | null;
    title: string;
    code: string | null;
    description?: string | null;
    duration_minutes: number;
    passing_score: number;
    max_attempts: number;
    randomize_questions?: boolean;
    randomize_options?: boolean;
    show_result_to_candidate?: boolean;
    status: string;
    questions_count: number;
    sessions_count: number;
    created_at: string | null;
};

type PackageForm = {
    exam_subject_id: number;
    title: string;
    code: string;
    description: string;
    duration_minutes: number;
    passing_score: number;
    max_attempts: number;
    randomize_questions: boolean;
    randomize_options: boolean;
    show_result_to_candidate: boolean;
    status: string;
};

type Props = {
    packages: PackageRow[];
    subjects: SubjectOption[];
    editing_package: PackageRow | null;
    mode?: "create" | "edit";
};

const defaultForm = (subjectId = 0): PackageForm => ({
    exam_subject_id: subjectId,
    title: "",
    code: "",
    description: "",
    duration_minutes: 90,
    passing_score: 70,
    max_attempts: 1,
    randomize_questions: true,
    randomize_options: false,
    show_result_to_candidate: false,
    status: "draft",
});

export default function ExamPackages({ packages, subjects, editing_package, mode }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const firstSubjectId = subjects[0]?.id ?? 0;
    const form = useForm<PackageForm>(defaultForm(firstSubjectId));
    const isEditing = mode === "edit" && editing_package !== null;

    useEffect(() => {
        if (!editing_package) {
            form.setData(defaultForm(firstSubjectId));
            return;
        }

        form.setData({
            exam_subject_id: editing_package.exam_subject_id,
            title: editing_package.title,
            code: editing_package.code ?? "",
            description: editing_package.description ?? "",
            duration_minutes: editing_package.duration_minutes,
            passing_score: editing_package.passing_score,
            max_attempts: editing_package.max_attempts,
            randomize_questions: editing_package.randomize_questions ?? true,
            randomize_options: editing_package.randomize_options ?? false,
            show_result_to_candidate: editing_package.show_result_to_candidate ?? false,
            status: editing_package.status,
        });
    }, [editing_package?.id, firstSubjectId]);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (isEditing && editing_package) {
            form.put(`/dashboard/admin/exams/packages/${editing_package.id}`, {
                preserveScroll: true,
            });
            return;
        }

        form.post("/dashboard/admin/exams/packages", {
            preserveScroll: true,
        });
    };

    const publish = (item: PackageRow) => {
        router.post(`/dashboard/admin/exams/packages/${item.id}/publish`, {}, { preserveScroll: true });
    };

    const close = (item: PackageRow) => {
        if (!window.confirm(`Tutup paket "${item.title}"?`)) return;
        router.post(`/dashboard/admin/exams/packages/${item.id}/close`, {}, { preserveScroll: true });
    };

    const destroy = (item: PackageRow) => {
        if (!window.confirm(`Hapus paket "${item.title}"?`)) return;
        router.delete(`/dashboard/admin/exams/packages/${item.id}`, { preserveScroll: true });
    };

    return (
        <DashboardLayout>
            <Head title="Paket Ujian" />

            <div className="space-y-5 pb-8">
                <PageHeader
                    title="Paket Ujian"
                    description="Paket ujian adalah satu mapel/unit seleksi. Setelah paket dibuat, sistem dapat membuat template soal untuk guru."
                    icon="fa-solid fa-box-archive"
                    actions={
                        <>
                            <Link href="/dashboard/admin/exams/subjects" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-200">
                                <i className="fa-solid fa-layer-group text-xs" /> Kategori
                            </Link>
                            <Link href="/dashboard/admin/exams/packages/create" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-500 px-3 text-sm font-bold text-white hover:bg-rose-400">
                                <i className="fa-solid fa-plus text-xs" /> Paket Baru
                            </Link>
                        </>
                    }
                />

                <ExamSectionNav active="packages" />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.package} />

                <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
                    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="mb-4">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{isEditing ? "Edit Paket" : "Paket Baru"}</h2>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Admin mengisi metadata paket. Konfigurasi pengerjaan dapat diperbarui dari file template saat import.</p>
                        </div>

                        {subjects.length === 0 ? (
                            <EmptyState icon="fa-solid fa-layer-group" title="Kategori belum tersedia" description="Buat kategori ujian sebelum membuat paket." />
                        ) : (
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className={labelClass} htmlFor="package-subject">Kategori</label>
                                    <select
                                        id="package-subject"
                                        value={form.data.exam_subject_id}
                                        onChange={(event) => form.setData("exam_subject_id", Number(event.target.value))}
                                        className={inputClass}
                                    >
                                        {subjects.map((subject) => (
                                            <option key={subject.id} value={subject.id}>{subject.name}{subject.code ? ` (${subject.code})` : ""}</option>
                                        ))}
                                    </select>
                                    {form.errors.exam_subject_id ? <p className="mt-1 text-xs text-red-500">{form.errors.exam_subject_id}</p> : null}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass} htmlFor="package-title">Judul Paket</label>
                                        <input
                                            id="package-title"
                                            value={form.data.title}
                                            onChange={(event) => form.setData("title", event.target.value)}
                                            className={inputClass}
                                            placeholder="Tes Seleksi Gelombang 1"
                                            maxLength={160}
                                        />
                                        {form.errors.title ? <p className="mt-1 text-xs text-red-500">{form.errors.title}</p> : null}
                                    </div>
                                    <div>
                                        <label className={labelClass} htmlFor="package-code">Kode Paket</label>
                                        <input
                                            id="package-code"
                                            value={form.data.code}
                                            onChange={(event) => form.setData("code", event.target.value)}
                                            className={inputClass}
                                            placeholder="TS-GL1"
                                            maxLength={80}
                                        />
                                        {form.errors.code ? <p className="mt-1 text-xs text-red-500">{form.errors.code}</p> : null}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass} htmlFor="package-description">Deskripsi</label>
                                    <textarea
                                        id="package-description"
                                        value={form.data.description}
                                        onChange={(event) => form.setData("description", event.target.value)}
                                        className={`${inputClass} min-h-24 resize-y`}
                                        placeholder="Catatan internal paket ujian."
                                        maxLength={1500}
                                    />
                                    {form.errors.description ? <p className="mt-1 text-xs text-red-500">{form.errors.description}</p> : null}
                                </div>

                                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-800 dark:text-amber-200">
                                    Durasi, ambang lulus, izin ujian ulang, dan visibilitas hasil adalah nilai awal. Saat admin mengimport XLSX yang diisi guru, nilai ini akan mengikuti konfigurasi pada file tersebut.
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className={labelClass} htmlFor="package-duration">Durasi Awal</label>
                                        <input
                                            id="package-duration"
                                            type="number"
                                            value={form.data.duration_minutes}
                                            onChange={(event) => form.setData("duration_minutes", Number(event.target.value))}
                                            className={inputClass}
                                            min={5}
                                            max={300}
                                        />
                                        {form.errors.duration_minutes ? <p className="mt-1 text-xs text-red-500">{form.errors.duration_minutes}</p> : null}
                                    </div>
                                    <div>
                                        <label className={labelClass} htmlFor="package-passing">Ambang Lulus %</label>
                                        <input
                                            id="package-passing"
                                            type="number"
                                            value={form.data.passing_score}
                                            onChange={(event) => form.setData("passing_score", Number(event.target.value))}
                                            className={inputClass}
                                            min={0}
                                            max={100}
                                            step="0.01"
                                        />
                                        {form.errors.passing_score ? <p className="mt-1 text-xs text-red-500">{form.errors.passing_score}</p> : null}
                                    </div>
                                    <div>
                                        <label className={labelClass} htmlFor="package-max-attempts">Maks. Percobaan</label>
                                        <input
                                            id="package-max-attempts"
                                            type="number"
                                            value={form.data.max_attempts}
                                            onChange={(event) => form.setData("max_attempts", Number(event.target.value))}
                                            className={inputClass}
                                            min={1}
                                            max={5}
                                        />
                                        {form.errors.max_attempts ? <p className="mt-1 text-xs text-red-500">{form.errors.max_attempts}</p> : null}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass} htmlFor="package-status">Status Paket</label>
                                    <select
                                        id="package-status"
                                        value={form.data.status}
                                        onChange={(event) => form.setData("status", event.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="closed">Closed</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                    {form.errors.status ? <p className="mt-1 text-xs text-red-500">{form.errors.status}</p> : null}
                                </div>

                                <div className="grid gap-2">
                                    {[
                                        ["randomize_questions", "Acak urutan soal"],
                                        ["randomize_options", "Acak pilihan jawaban"],
                                        ["show_result_to_candidate", "Tampilkan hasil ke kandidat setelah selesai"],
                                    ].map(([field, label]) => (
                                        <label key={field} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(form.data[field as keyof PackageForm])}
                                                onChange={(event) => form.setData(field as keyof PackageForm, event.target.checked)}
                                                className="rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 text-sm font-bold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {form.processing ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-floppy-disk text-xs" />}
                                    {isEditing ? "Simpan Paket" : "Buat Paket"}
                                </button>
                            </form>
                        )}
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daftar Paket</h2>
                            <span className="text-xs font-semibold text-slate-500">{packages.length.toLocaleString("id-ID")} paket</span>
                        </div>

                        {packages.length === 0 ? (
                            <EmptyState icon="fa-solid fa-box-open" title="Belum ada paket" description="Paket akan menjadi rumah soal, jadwal sesi, dan aturan kelulusan." />
                        ) : (
                            <div className="grid gap-3">
                                {packages.map((item) => (
                                    <article key={item.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Link href={`/dashboard/admin/exams/packages/${item.id}`} className="text-base font-bold text-slate-900 hover:text-rose-500 dark:text-white">
                                                        {item.title}
                                                    </Link>
                                                    <StatusPill value={item.status} />
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {item.subject_name ?? "Tanpa kategori"} · {item.code ?? "Tanpa kode"} · {item.created_at ?? "-"}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Link href={`/dashboard/admin/exams/packages/${item.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-200">
                                                    <i className="fa-solid fa-eye" /> Detail
                                                </Link>
                                                <Link href={`/dashboard/admin/exams/packages/${item.id}/edit`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-200">
                                                    <i className="fa-solid fa-pen" /> Edit
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                                            <Metric label="Durasi" value={`${item.duration_minutes} menit`} />
                                            <Metric label="Lulus" value={`${item.passing_score}%`} />
                                            <Metric label="Attempt" value={item.max_attempts} />
                                            <Metric label="Soal" value={item.questions_count} />
                                            <Metric label="Sesi" value={item.sessions_count} />
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => publish(item)}
                                                disabled={item.status === "published"}
                                                className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <i className="fa-solid fa-circle-check" /> Publish
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => close(item)}
                                                disabled={item.status === "closed"}
                                                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-amber-300 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
                                            >
                                                <i className="fa-solid fa-lock" /> Tutup
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => destroy(item)}
                                                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-red-300 hover:text-red-500 dark:border-white/10 dark:text-slate-200"
                                            >
                                                <i className="fa-solid fa-trash" /> Hapus
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg bg-slate-50 px-3 py-3 dark:bg-white/[0.03]">
            <p className="text-sm font-black text-slate-900 dark:text-white">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    );
}
