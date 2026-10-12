import { FormEvent, memo, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { inputClass, labelClass, primaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { showSuccessToast } from "@/utils/swal";
import type { PackageRow, SubjectOption } from "./PackageFormCard";

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
    show: boolean;
    onClose: () => void;
    subjects: SubjectOption[];
    editingPackage: PackageRow | null;
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

export const PackageFormModal = memo(function PackageFormModal({ show, onClose, subjects, editingPackage }: Props) {
    const firstSubjectId = subjects[0]?.id ?? 0;
    const form = useForm<PackageForm>(defaultForm(firstSubjectId));
    const isEditing = editingPackage !== null;

    useEffect(() => {
        if (!show) return;
        if (editingPackage) {
            form.setData({
                exam_subject_id: editingPackage.exam_subject_id,
                title: editingPackage.title,
                code: editingPackage.code ?? "",
                description: editingPackage.description ?? "",
                duration_minutes: editingPackage.duration_minutes,
                passing_score: editingPackage.passing_score,
                max_attempts: editingPackage.max_attempts,
                randomize_questions: editingPackage.randomize_questions ?? true,
                randomize_options: editingPackage.randomize_options ?? false,
                show_result_to_candidate: editingPackage.show_result_to_candidate ?? false,
                status: editingPackage.status,
            });
        } else {
            form.setData(defaultForm(firstSubjectId));
        }
        form.clearErrors();
    }, [show, editingPackage?.id, firstSubjectId]);

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
                showSuccessToast(isEditing ? "Paket soal berhasil diperbarui." : "Paket soal baru berhasil dibuat.");
                form.reset();
                onClose();
            },
        };

        if (isEditing && editingPackage) {
            form.put(`/dashboard/admin/exams/packages/${editingPackage.id}`, options);
            return;
        }
        form.post("/dashboard/admin/exams/packages", options);
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
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-amber-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <i className="fa-solid fa-box-archive text-base" />
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                {isEditing ? "MODIFIKASI PAKET" : "PAKET BARU"}
                            </span>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {isEditing ? "Edit Paket Soal" : "Buat Paket Soal Baru"}
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

                {subjects.length === 0 ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center space-y-3">
                        <p className="text-xs text-slate-300">Belum ada kategori ujian. Buat kategori terlebih dahulu.</p>
                        <a href="/dashboard/admin/exams/subjects" className="inline-flex rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950">
                            Buat Kategori
                        </a>
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className={labelClass} htmlFor="modal-pkg-subject">Kategori Ujian *</label>
                            <select
                                id="modal-pkg-subject"
                                value={form.data.exam_subject_id}
                                onChange={(e) => form.setData("exam_subject_id", Number(e.target.value))}
                                className={inputClass}
                            >
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ""}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className={labelClass} htmlFor="modal-pkg-title">Judul Paket *</label>
                                <input
                                    id="modal-pkg-title"
                                    required
                                    value={form.data.title}
                                    onChange={(e) => form.setData("title", e.target.value)}
                                    className={inputClass}
                                    placeholder="Contoh: Tes Akademik Gelombang 1"
                                    maxLength={160}
                                    autoFocus
                                />
                                {form.errors.title && <p className="mt-1 text-xs text-red-500">{form.errors.title}</p>}
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="modal-pkg-code">Kode Paket</label>
                                <input
                                    id="modal-pkg-code"
                                    value={form.data.code}
                                    onChange={(e) => form.setData("code", e.target.value.toUpperCase())}
                                    className={`${inputClass} font-mono uppercase`}
                                    placeholder="Contoh: TPA-GL1"
                                    maxLength={80}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="modal-pkg-desc">Deskripsi</label>
                            <textarea
                                id="modal-pkg-desc"
                                value={form.data.description}
                                onChange={(e) => form.setData("description", e.target.value)}
                                className={`${inputClass} min-h-16 resize-y`}
                                placeholder="Petunjuk ringkas..."
                                maxLength={500}
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                                <label className={labelClass} htmlFor="modal-pkg-dur">Durasi (Menit)</label>
                                <input
                                    id="modal-pkg-dur"
                                    type="number"
                                    min={1}
                                    max={600}
                                    value={form.data.duration_minutes}
                                    onChange={(e) => form.setData("duration_minutes", Number(e.target.value))}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="modal-pkg-pass">Ambang Lulus (%)</label>
                                <input
                                    id="modal-pkg-pass"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={form.data.passing_score}
                                    onChange={(e) => form.setData("passing_score", Number(e.target.value))}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="modal-pkg-att">Max Attempt</label>
                                <input
                                    id="modal-pkg-att"
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={form.data.max_attempts}
                                    onChange={(e) => form.setData("max_attempts", Number(e.target.value))}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 text-xs border border-slate-200 dark:border-white/10">
                            <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.data.randomize_questions}
                                    onChange={(e) => form.setData("randomize_questions", e.target.checked)}
                                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                />
                                <span>Acak urutan soal</span>
                            </label>
                            <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.data.randomize_options}
                                    onChange={(e) => form.setData("randomize_options", e.target.checked)}
                                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                />
                                <span>Acak urutan pilihan jawaban</span>
                            </label>
                            <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.data.show_result_to_candidate}
                                    onChange={(e) => form.setData("show_result_to_candidate", e.target.checked)}
                                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                />
                                <span>Tampilkan skor akhir langsung ke peserta</span>
                            </label>
                        </div>
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
                                {isEditing ? "Simpan Perubahan" : "Simpan Paket"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
});

export default PackageFormModal;
