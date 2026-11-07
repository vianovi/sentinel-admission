import { memo, useEffect, type FormEvent } from "react";
import { useForm } from "@inertiajs/react";
import { inputClass, labelClass, primaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { showSuccessToast } from "@/utils/swal";
import type { PublicExamSubject } from "@/Pages/Dashboard/Admin/PublicExam/Categories";

type SubjectForm = {
    name: string;
    code: string;
    is_active: boolean;
};

type Props = {
    show: boolean;
    onClose: () => void;
    editing: PublicExamSubject | null;
};

const emptyForm: SubjectForm = {
    name: "",
    code: "",
    is_active: true,
};

const routeRoot = "/dashboard/admin/public-exams/categories";

export const PublicExamCategoryModal = memo(function PublicExamCategoryModal({ show, onClose, editing }: Props) {
    const form = useForm<SubjectForm>(emptyForm);

    useEffect(() => {
        if (!show) return;
        if (editing) {
            form.setData({
                name: editing.name,
                code: editing.code,
                is_active: editing.is_active,
            });
        } else {
            form.setData(emptyForm);
        }
        form.clearErrors();
    }, [show, editing?.id]);

    useEffect(() => {
        if (!show) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [show, onClose]);

    if (!show) return null;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                showSuccessToast(editing ? "Kategori ujian publik berhasil diperbarui." : "Kategori ujian publik berhasil dibuat.");
                form.reset();
                onClose();
            },
        };

        if (editing) {
            form.put(`${routeRoot}/${editing.id}`, options);
            return;
        }

        form.post(routeRoot, options);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-category-modal-title"
        >
            <div className="my-8 w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-amber-500/30 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <i className="fa-solid fa-layer-group text-base" />
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                {editing ? "EDIT KATEGORI PUBLIK" : "KATEGORI PUBLIK BARU"}
                            </span>
                            <h2 id="public-category-modal-title" className="text-lg font-black text-slate-900 dark:text-white">
                                {editing ? "Ubah kategori ujian publik" : "Buat kategori ujian publik"}
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
                        aria-label="Tutup dialog"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className={labelClass} htmlFor="public-category-name">Nama Kategori</label>
                        <input
                            id="public-category-name"
                            required
                            value={form.data.name}
                            onChange={(event) => form.setData("name", event.target.value)}
                            className={inputClass}
                            placeholder="Contoh: Matematika Publik"
                            maxLength={255}
                            autoFocus
                        />
                        {form.errors.name && <p className="mt-1 text-xs text-red-500">{form.errors.name}</p>}
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="public-category-code">Kode Kategori</label>
                        <input
                            id="public-category-code"
                            required
                            value={form.data.code}
                            onChange={(event) => form.setData("code", event.target.value.toUpperCase())}
                            className={`${inputClass} font-mono uppercase tracking-wider`}
                            placeholder="Contoh: MTK-PUB"
                            maxLength={50}
                        />
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Gunakan huruf, angka, tanda hubung, atau garis bawah. Kode harus unik di bank ujian publik.</p>
                        {form.errors.code && <p className="mt-1 text-xs text-red-500">{form.errors.code}</p>}
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) => form.setData("is_active", event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span>Aktif untuk pemilihan paket ujian publik</span>
                    </label>
                    {form.errors.is_active && <p className="-mt-3 text-xs text-red-500">{form.errors.is_active}</p>}

                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Batal
                        </button>
                        <button type="submit" disabled={form.processing} className={`${primaryButtonClass} min-h-10 px-5 text-xs shadow-lg shadow-amber-500/20`}>
                            {form.processing ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-floppy-disk text-xs" />}
                            {editing ? "Simpan Perubahan" : "Simpan Kategori"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

export default PublicExamCategoryModal;