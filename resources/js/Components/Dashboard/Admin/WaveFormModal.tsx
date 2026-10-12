import { FormEvent, memo, useEffect, useState } from "react";
import { router, useForm } from "@inertiajs/react";
import { showSuccessToast } from "@/utils/swal";

export type Wave = {
    id: number;
    title: string;
    academic_year: string;
    description: string | null;
    start_date_raw: string | null;
    end_date_raw: string | null;
    start_date: string | null;
    end_date: string | null;
    exam_info: string | null;
    announcement_info: string | null;
    reregistration_date_raw: string | null;
    reregistration_date: string | null;
    registration_fee: number;
    quota_target: number;
    available_majors: string[];
    is_active: boolean;
    majors_enabled: boolean;
    candidates_count: number;
    quota_filled: number;
};

export type WaveForm = {
    title: string;
    academic_year: string;
    description: string;
    start_date: string;
    end_date: string;
    exam_info: string;
    announcement_info: string;
    reregistration_date: string;
    registration_fee: string;
    quota_target: string;
    available_majors: string;
    majors_enabled: boolean;
    is_active: boolean;
};

type Props = {
    show: boolean;
    onClose: () => void;
    editingWave: Wave | null;
};

const blankForm: WaveForm = {
    title: "",
    academic_year: "",
    description: "",
    start_date: "",
    end_date: "",
    exam_info: "",
    announcement_info: "",
    reregistration_date: "",
    registration_fee: "",
    quota_target: "",
    available_majors: "",
    majors_enabled: false,
    is_active: false,
};

const listToText = (items: string[]) => items.join("\n");
const textToList = (value: string) =>
    value
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);

export const WaveFormModal = memo(function WaveFormModal({
    show,
    onClose,
    editingWave,
}: Props) {
    const isEditing = editingWave !== null;
    const form = useForm<WaveForm>(blankForm);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!show) return;
        if (!editingWave) {
            form.setData(blankForm);
            form.clearErrors();
            return;
        }

        form.setData({
            title: editingWave.title,
            academic_year: editingWave.academic_year,
            description: editingWave.description ?? "",
            start_date: editingWave.start_date_raw ?? "",
            end_date: editingWave.end_date_raw ?? "",
            exam_info: editingWave.exam_info ?? "",
            announcement_info: editingWave.announcement_info ?? "",
            reregistration_date: editingWave.reregistration_date_raw ?? "",
            registration_fee: String(Math.round(editingWave.registration_fee ?? 0)),
            quota_target: String(editingWave.quota_target ?? 0),
            available_majors: listToText(editingWave.available_majors ?? []),
            majors_enabled: editingWave.majors_enabled,
            is_active: editingWave.is_active,
        });
        form.clearErrors();
    }, [show, editingWave]);

    useEffect(() => {
        if (!show) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !submitting) onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [show, submitting, onClose]);

    if (!show) return null;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const payload = {
            ...form.data,
            registration_fee: Number(form.data.registration_fee || 0),
            quota_target: Number(form.data.quota_target || 0),
            available_majors: textToList(form.data.available_majors),
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                showSuccessToast(isEditing ? "Gelombang berhasil diperbarui!" : "Gelombang baru berhasil dibuat!");
                onClose();
            },
            onFinish: () => setSubmitting(false),
            onError: (errors: Record<string, string>) => {
                form.setError(errors);
            },
        };

        if (isEditing && editingWave) {
            router.put(`/dashboard/admin/waves/${editingWave.id}`, payload, options);
        } else {
            router.post("/dashboard/admin/waves", payload, options);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !submitting && onClose()} />
            <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6 z-10 my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                    <div>
                        <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white">
                            {isEditing ? "Edit Gelombang Pendaftaran" : "Buat Gelombang Baru"}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Atur periode pendaftaran, kuota, biaya, jadwal ujian, dan jurusan.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition">
                        <i className="fa-solid fa-xmark text-base" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Nama Gelombang *</label>
                            <input type="text" value={form.data.title} onChange={(e) => form.setData("title", e.target.value)} placeholder="Contoh: Gelombang 1" required className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-gold" />
                            {form.errors.title && <p className="mt-1 text-xs text-red-500">{form.errors.title}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Tahun Ajaran *</label>
                            <input type="text" value={form.data.academic_year} onChange={(e) => form.setData("academic_year", e.target.value)} placeholder="2026/2027" required className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-gold" />
                            {form.errors.academic_year && <p className="mt-1 text-xs text-red-500">{form.errors.academic_year}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Tanggal Buka *</label>
                            <input type="date" value={form.data.start_date} onChange={(e) => form.setData("start_date", e.target.value)} required className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-gold" />
                            {form.errors.start_date && <p className="mt-1 text-xs text-red-500">{form.errors.start_date}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Tanggal Tutup *</label>
                            <input type="date" value={form.data.end_date} onChange={(e) => form.setData("end_date", e.target.value)} required className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-gold" />
                            {form.errors.end_date && <p className="mt-1 text-xs text-red-500">{form.errors.end_date}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Tanggal Daftar Ulang</label>
                            <input type="date" value={form.data.reregistration_date} onChange={(e) => form.setData("reregistration_date", e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-gold" />
                            {form.errors.reregistration_date && <p className="mt-1 text-xs text-red-500">{form.errors.reregistration_date}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Biaya Pendaftaran (Rp) *</label>
                            <input type="number" value={form.data.registration_fee} onChange={(e) => form.setData("registration_fee", e.target.value)} placeholder="150000" required className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-gold" />
                            {form.errors.registration_fee && <p className="mt-1 text-xs text-red-500">{form.errors.registration_fee}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Kuota Target (Kandidat) *</label>
                            <input type="number" value={form.data.quota_target} onChange={(e) => form.setData("quota_target", e.target.value)} placeholder="200" required className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-gold" />
                            {form.errors.quota_target && <p className="mt-1 text-xs text-red-500">{form.errors.quota_target}</p>}
                        </div>
                        <div className="space-y-3 rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-slate-50/50 dark:bg-slate-800/30">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Aktifkan Gelombang</span>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Gelombang lain otomatis ditutup jika ini aktif.</p>
                                </div>
                                <input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData("is_active", e.target.checked)} className="h-4 w-4 rounded text-gold focus:ring-gold" />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Pilihan Jurusan</span>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Izinkan kandidat memilih jurusan/program.</p>
                                </div>
                                <input type="checkbox" checked={form.data.majors_enabled} onChange={(e) => form.setData("majors_enabled", e.target.checked)} className="h-4 w-4 rounded text-gold focus:ring-gold" />
                            </label>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 pt-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Deskripsi Gelombang</label>
                            <textarea rows={3} value={form.data.description} onChange={(e) => form.setData("description", e.target.value)} placeholder="Ringkasan informasi gelombang..." className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-gold resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Info Jadwal Ujian Seleksi</label>
                            <textarea rows={3} value={form.data.exam_info} onChange={(e) => form.setData("exam_info", e.target.value)} placeholder="Contoh: Ujian seleksi dilaksanakan 07 Maret 2026..." className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-gold resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Info Pengumuman</label>
                            <textarea rows={3} value={form.data.announcement_info} onChange={(e) => form.setData("announcement_info", e.target.value)} placeholder="Contoh: Hasil seleksi diumumkan melalui dashboard..." className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-gold resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Daftar Jurusan (Satu per baris)</label>
                            <textarea rows={3} value={form.data.available_majors} onChange={(e) => form.setData("available_majors", e.target.value)} placeholder="IPA&#10;IPS" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-gold resize-none" />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                        <button type="button" onClick={onClose} disabled={submitting} className="h-10 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                            Batal
                        </button>
                        <button type="submit" disabled={submitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-xs font-bold text-navy transition hover:bg-amber-400 disabled:opacity-50 shadow-md shadow-gold/20">
                            {submitting && <i className="fa-solid fa-spinner fa-spin" />}
                            <span>{isEditing ? "Simpan Perubahan" : "Simpan Gelombang"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});
export default WaveFormModal;
