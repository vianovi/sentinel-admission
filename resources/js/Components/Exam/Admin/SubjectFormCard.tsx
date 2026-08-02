import { FormEvent, memo, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { inputClass, labelClass, primaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";

export type Subject = {
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
    editing: Subject | null;
    onCancelEdit: () => void;
    onSuccess: () => void;
};

const emptyForm: SubjectForm = {
    name: "",
    code: "",
    description: "",
    is_active: true,
};

export const SubjectFormCard = memo(function SubjectFormCard({ editing, onCancelEdit, onSuccess }: Props) {
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
                onSuccess();
                form.reset();
            },
        };

        if (editing) {
            form.put(`/dashboard/admin/exams/subjects/${editing.id}`, options);
            return;
        }

        form.post("/dashboard/admin/exams/subjects", options);
    };

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">{editing ? "Edit Kategori" : "Kategori Baru"}</h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kode bersifat opsional, tetapi membantu validasi import.</p>
                </div>
                {editing ? (
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:text-gold dark:border-white/10 dark:text-slate-300"
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
                        className="rounded border-slate-300 text-gold focus:ring-gold"
                    />
                    Aktif untuk paket baru
                </label>

                <button
                    type="submit"
                    disabled={form.processing}
                    className={`${primaryButtonClass} w-full min-h-11`}
                >
                    {form.processing ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-floppy-disk text-xs" />}
                    {editing ? "Simpan Perubahan" : "Buat Kategori"}
                </button>
            </form>
        </section>
    );
});

export default SubjectFormCard;
