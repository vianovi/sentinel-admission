import { FormEvent, memo, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { EmptyState, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";

export type SubjectOption = {
    id: number;
    name: string;
    code: string | null;
};

export type PackageRow = {
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
    subjects: SubjectOption[];
    editingPackage: PackageRow | null;
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

export const PackageFormCard = memo(function PackageFormCard({ subjects, editingPackage, mode }: Props) {
    const firstSubjectId = subjects[0]?.id ?? 0;
    const form = useForm<PackageForm>(defaultForm(firstSubjectId));
    const isEditing = mode === "edit" && editingPackage !== null;

    useEffect(() => {
        if (!editingPackage) {
            form.setData(defaultForm(firstSubjectId));
            return;
        }

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
    }, [editingPackage?.id, firstSubjectId]);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (isEditing && editingPackage) {
            form.put(`/dashboard/admin/exams/packages/${editingPackage.id}`, {
                preserveScroll: true,
            });
            return;
        }

        form.post("/dashboard/admin/exams/packages", {
            preserveScroll: true,
        });
    };

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{isEditing ? "Edit Paket" : "Paket Baru"}</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Admin mengisi metadata paket. Konfigurasi pengerjaan dapat diperbarui dari file template saat import.</p>
            </div>

            {subjects.length === 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <i className="fa-solid fa-layer-group text-xl" />
                    </div>
                    <div>
                        <h3 className="text-sm font-extrabold text-white">Langkah 1: Buat Kategori Ujian</h3>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                            Belum ada Kategori / Mata Pelajaran Ujian yang tersedia. Silakan buat kategori ujian terlebih dahulu (contoh: Matematika, Bahasa Indonesia, TPA) sebelum membuat Paket Soal.
                        </p>
                    </div>
                    <a
                        href="/dashboard/admin/exams/subjects"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                    >
                        <i className="fa-solid fa-plus text-xs" /> Buat Kategori Ujian Sekarang
                    </a>
                </div>
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
                            className={`${inputClass} min-h-20 resize-y`}
                            maxLength={500}
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                            <label className={labelClass} htmlFor="package-duration">Durasi (Menit)</label>
                            <input
                                id="package-duration"
                                type="number"
                                min={1}
                                max={600}
                                value={form.data.duration_minutes}
                                onChange={(event) => form.setData("duration_minutes", Number(event.target.value))}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="package-passing">Ambang Lulus (%)</label>
                            <input
                                id="package-passing"
                                type="number"
                                min={0}
                                max={100}
                                value={form.data.passing_score}
                                onChange={(event) => form.setData("passing_score", Number(event.target.value))}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="package-attempts">Max Attempt</label>
                            <input
                                id="package-attempts"
                                type="number"
                                min={1}
                                max={10}
                                value={form.data.max_attempts}
                                onChange={(event) => form.setData("max_attempts", Number(event.target.value))}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-xs dark:bg-white/[0.03]">
                        <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                            <input
                                type="checkbox"
                                checked={form.data.randomize_questions}
                                onChange={(event) => form.setData("randomize_questions", event.target.checked)}
                                className="rounded border-slate-300 text-gold focus:ring-gold"
                            />
                            Acak nomor soal saat ujian berlangsung
                        </label>
                        <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                            <input
                                type="checkbox"
                                checked={form.data.randomize_options}
                                onChange={(event) => form.setData("randomize_options", event.target.checked)}
                                className="rounded border-slate-300 text-gold focus:ring-gold"
                            />
                            Acak pilihan jawaban (A, B, C, D, E)
                        </label>
                        <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                            <input
                                type="checkbox"
                                checked={form.data.show_result_to_candidate}
                                onChange={(event) => form.setData("show_result_to_candidate", event.target.checked)}
                                className="rounded border-slate-300 text-gold focus:ring-gold"
                            />
                            Tampilkan nilai langsung kepada kandidat setelah submit
                        </label>
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="package-status">Status Metadata</label>
                        <select
                            id="package-status"
                            value={form.data.status}
                            onChange={(event) => form.setData("status", event.target.value)}
                            className={inputClass}
                        >
                            <option value="draft">Draft (Persiapan Metadata)</option>
                            <option value="published">Published (Siap Pakai)</option>
                            <option value="closed">Closed (Ditutup)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <button type="submit" disabled={form.processing} className={`${primaryButtonClass} flex-1 min-h-11`}>
                            {form.processing ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-floppy-disk text-xs" />}
                            {isEditing ? "Simpan Perubahan" : "Simpan Paket"}
                        </button>

                        {isEditing ? (
                            <a href="/dashboard/admin/exams/packages" className={`${secondaryButtonClass} min-h-11`}>
                                Batal
                            </a>
                        ) : null}
                    </div>
                </form>
            )}
        </section>
    );
});

export default PackageFormCard;
