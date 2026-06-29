import { FormEvent, useEffect, useState } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { EmptyState, FlashMessage, PageHeader, StatusPill, inputClass, labelClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import type { PageProps } from "@/types";

type Subject = {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    is_active: boolean;
    packages_count: number;
    questions_count: number;
    created_at: string | null;
};

type SubjectForm = {
    name: string;
    code: string;
    description: string;
    is_active: boolean;
};

type Props = {
    subjects: Subject[];
};

const emptyForm: SubjectForm = {
    name: "",
    code: "",
    description: "",
    is_active: true,
};

export default function ExamSubjects({ subjects }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const [editing, setEditing] = useState<Subject | null>(null);
    const form = useForm<SubjectForm>(emptyForm);

    useEffect(() => {
        if (!editing) {
            form.setData(emptyForm);
            return;
        }

        form.setData({
            name: editing.name,
            code: editing.code ?? "",
            description: editing.description ?? "",
            is_active: editing.is_active,
        });
    }, [editing?.id]);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setEditing(null);
                form.reset();
            },
        };

        if (editing) {
            form.put(`/dashboard/admin/exams/subjects/${editing.id}`, options);
            return;
        }

        form.post("/dashboard/admin/exams/subjects", options);
    };

    const destroy = (subject: Subject) => {
        if (!window.confirm(`Hapus kategori "${subject.name}"?`)) return;

        router.delete(`/dashboard/admin/exams/subjects/${subject.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout>
            <Head title="Kategori Ujian" />

            <div className="space-y-5 pb-8">
                <PageHeader
                    title="Kategori Ujian"
                    description="Kelola subject atau kategori soal yang akan dipakai paket ujian."
                    icon="fa-solid fa-layer-group"
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.subject} />

                <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
                    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{editing ? "Edit Kategori" : "Kategori Baru"}</h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kode bersifat opsional, tetapi membantu validasi import.</p>
                            </div>
                            {editing ? (
                                <button
                                    type="button"
                                    onClick={() => setEditing(null)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:text-rose-500 dark:border-white/10 dark:text-slate-300"
                                >
                                    Batal
                                </button>
                            ) : null}
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className={labelClass} htmlFor="subject-name">Nama kategori</label>
                                <input
                                    id="subject-name"
                                    value={form.data.name}
                                    onChange={(event) => form.setData("name", event.target.value)}
                                    className={inputClass}
                                    placeholder="Contoh: Tes Akademik"
                                    maxLength={120}
                                />
                                {form.errors.name ? <p className="mt-1 text-xs text-red-500">{form.errors.name}</p> : null}
                            </div>

                            <div>
                                <label className={labelClass} htmlFor="subject-code">Kode</label>
                                <input
                                    id="subject-code"
                                    value={form.data.code}
                                    onChange={(event) => form.setData("code", event.target.value)}
                                    className={inputClass}
                                    placeholder="Contoh: AKADEMIK"
                                    maxLength={50}
                                />
                                {form.errors.code ? <p className="mt-1 text-xs text-red-500">{form.errors.code}</p> : null}
                            </div>

                            <div>
                                <label className={labelClass} htmlFor="subject-description">Catatan</label>
                                <textarea
                                    id="subject-description"
                                    value={form.data.description}
                                    onChange={(event) => form.setData("description", event.target.value)}
                                    className={`${inputClass} min-h-24 resize-y`}
                                    placeholder="Deskripsi internal untuk admin."
                                    maxLength={1000}
                                />
                                {form.errors.description ? <p className="mt-1 text-xs text-red-500">{form.errors.description}</p> : null}
                            </div>

                            <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(event) => form.setData("is_active", event.target.checked)}
                                    className="rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                                />
                                Aktif untuk paket baru
                            </label>

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 text-sm font-bold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {form.processing ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-floppy-disk text-xs" />}
                                {editing ? "Simpan Perubahan" : "Buat Kategori"}
                            </button>
                        </form>
                    </section>

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
                                                            onClick={() => setEditing(subject)}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-300"
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
                </div>
            </div>
        </DashboardLayout>
    );
}
