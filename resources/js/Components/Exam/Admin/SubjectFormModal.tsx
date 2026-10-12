import { FormEvent, memo, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { inputClass, labelClass, primaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { showSuccessToast } from "@/utils/swal";
import type { Subject } from "./SubjectFormCard";

type SubjectForm = {
    name: string;
    code: string;
    description: string;
    is_active: boolean;
};

type Props = {
    show: boolean;
    onClose: () => void;
    editing: Subject | null;
};

const emptyForm: SubjectForm = {
    name: "",
    code: "",
    description: "",
    is_active: true,
};

export const SubjectFormModal = memo(function SubjectFormModal({ show, onClose, editing }: Props) {
    const form = useForm<SubjectForm>(emptyForm);

    useEffect(() => {
        if (!show) return;
        if (editing) {
            form.setData({
                name: editing.name,
                code: editing.code ?? "",
                description: editing.description ?? "",
                is_active: editing.is_active,
            });
        } else {
            form.setData(emptyForm);
        }
        form.clearErrors();
    }, [show, editing?.id]);

    useEffect(() => {
        if (!show) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
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
                showSuccessToast(editing ? "Kategori ujian berhasil diperbarui." : "Kategori ujian berhasil dibuat.");
                form.reset();
                onClose();
            },
        };
        if (editing) {
            form.put(`/dashboard/admin/exams/subjects/${editing.id}`, options);
            return;
        }
        form.post("/dashboard/admin/exams/subjects", options);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-amber-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <i className="fa-solid fa-layer-group text-base" />
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                {editing ? "MODIFIKASI KATEGORI" : "KATEGORI BARU"}
                            </span>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {editing ? "Edit Kategori Ujian" : "Tambah Kategori Baru"}
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Tutup modal"
                    >
                        <i className="fa-solid fa-xmark text-lg" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className={labelClass} htmlFor="modal-sub-name">Nama Kategori *</label>
                        <input
                            id="modal-sub-name"
                            required
                            value={form.data.name}
                            onChange={(e) => form.setData("name", e.target.value)}
                            className={inputClass}
                            placeholder="Contoh: Tes Potensi Akademik"
                            maxLength={120}
                            autoFocus
                        />
                        {form.errors.name ? <p className="mt-1 text-xs text-red-500">{form.errors.name}</p> : null}
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="modal-sub-code">Kode Kategori</label>
                        <input
                            id="modal-sub-code"
                            value={form.data.code}
                            onChange={(e) => form.setData("code", e.target.value.toUpperCase())}
                            className={`${inputClass} font-mono uppercase tracking-wider`}
                            placeholder="Contoh: TPA-01"
                            maxLength={50}
                        />
                        {form.errors.code ? <p className="mt-1 text-xs text-red-500">{form.errors.code}</p> : null}
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="modal-sub-desc">Deskripsi</label>
                        <textarea
                            id="modal-sub-desc"
                            value={form.data.description}
                            onChange={(e) => form.setData("description", e.target.value)}
                            className={`${inputClass} min-h-20 resize-y`}
                            placeholder="Catatan materi atau petunjuk..."
                            maxLength={1000}
                        />
                        {form.errors.description ? <p className="mt-1 text-xs text-red-500">{form.errors.description}</p> : null}
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData("is_active", e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span>Aktif untuk pembuatan paket soal baru</span>
                    </label>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className={`${primaryButtonClass} px-5 min-h-10 text-xs shadow-lg shadow-amber-500/20`}
                        >
                            {form.processing ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-floppy-disk text-xs" />}
                            {editing ? "Simpan Perubahan" : "Simpan Kategori"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

export default SubjectFormModal;
