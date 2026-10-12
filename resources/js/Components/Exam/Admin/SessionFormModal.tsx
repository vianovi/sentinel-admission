import { FormEvent, memo, useCallback, useEffect, useMemo } from "react";
import { useForm } from "@inertiajs/react";
import { inputClass, labelClass, primaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import QuickDateTimePicker from "@/Components/Exam/Admin/QuickDateTimePicker";
import { showSuccessToast } from "@/utils/swal";
import type { PackageOption, SessionRow, WaveOption } from "./SessionFormCard";

const MAX_PACKAGES = 5;

type SessionForm = {
    package_ids: number[];
    exam_package_id: number;
    admission_wave_id: string;
    title: string;
    description: string;
    instructions: string;
    opens_at: string;
    closes_at: string;
    duration_minutes: number;
    passing_score: number;
    max_attempts: number;
    show_result_to_candidate: boolean;
    is_public: boolean;
    public_access_type: string;
    package_order_type: string;
    status: string;
};

type Props = {
    show: boolean;
    onClose: () => void;
    packages: PackageOption[];
    waves: WaveOption[];
    editingSession: SessionRow | null;
};

const defaultForm = (pkg?: PackageOption): SessionForm => ({
    package_ids: pkg ? [pkg.id] : [],
    exam_package_id: pkg?.id ?? 0,
    admission_wave_id: "",
    title: "",
    description: "",
    instructions: "",
    opens_at: "",
    closes_at: "",
    duration_minutes: pkg?.duration_minutes ?? 90,
    passing_score: pkg?.passing_score ?? 70,
    max_attempts: pkg?.max_attempts ?? 1,
    show_result_to_candidate: pkg?.show_result_to_candidate ?? false,
    is_public: true,
    public_access_type: "token_required",
    package_order_type: "flexible",
    status: "draft",
});

export const SessionFormModal = memo(function SessionFormModal({
    show,
    onClose,
    packages,
    waves,
    editingSession,
}: Props) {
    const firstPackage = packages[0];
    const form = useForm<SessionForm>(defaultForm(firstPackage));
    const isEditing = editingSession !== null;

    useEffect(() => {
        if (!show) return;

        if (!editingSession) {
            form.setData(defaultForm(firstPackage));
            form.clearErrors();
            return;
        }

        const editPackageIds = editingSession.package_ids?.length
            ? editingSession.package_ids
            : editingSession.exam_package_id
            ? [editingSession.exam_package_id]
            : [];

        form.setData({
            package_ids: editPackageIds,
            exam_package_id: editPackageIds[0] ?? 0,
            admission_wave_id: editingSession.admission_wave_id ? String(editingSession.admission_wave_id) : "",
            title: editingSession.title,
            description: editingSession.description ?? "",
            instructions: editingSession.instructions ?? "",
            opens_at: editingSession.opens_at_input ?? editingSession.opens_at ?? "",
            closes_at: editingSession.closes_at_input ?? editingSession.closes_at ?? "",
            duration_minutes: editingSession.duration_minutes,
            passing_score: editingSession.passing_score,
            max_attempts: editingSession.max_attempts,
            show_result_to_candidate: editingSession.show_result_to_candidate,
            is_public: editingSession.is_public ?? true,
            public_access_type: editingSession.public_access_type ?? "token_required",
            package_order_type: editingSession.package_order_type ?? "flexible",
            status: editingSession.status,
        });
        form.clearErrors();
    }, [show, editingSession?.id, firstPackage?.id]);

    useEffect(() => {
        if (!show) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [show, onClose]);

    const selectedPackages = useMemo(
        () => packages.filter((pkg) => form.data.package_ids.includes(pkg.id)),
        [packages, form.data.package_ids]
    );

    const availablePackages = useMemo(
        () => packages.filter((pkg) => !form.data.package_ids.includes(pkg.id)),
        [packages, form.data.package_ids]
    );

    const togglePackage = useCallback(
        (packageId: number) => {
            form.setData((current) => {
                const isSelected = current.package_ids.includes(packageId);

                if (isSelected) {
                    if (current.package_ids.length <= 1) return current;
                    const newIds = current.package_ids.filter((id) => id !== packageId);
                    const primaryPkg = packages.find((p) => p.id === newIds[0]);
                    return {
                        ...current,
                        package_ids: newIds,
                        exam_package_id: newIds[0],
                        duration_minutes: primaryPkg?.duration_minutes ?? current.duration_minutes,
                        passing_score: primaryPkg?.passing_score ?? current.passing_score,
                        max_attempts: primaryPkg?.max_attempts ?? current.max_attempts,
                        show_result_to_candidate: primaryPkg?.show_result_to_candidate ?? current.show_result_to_candidate,
                    };
                }

                if (current.package_ids.length >= MAX_PACKAGES) return current;
                const newIds = [...current.package_ids, packageId];
                return { ...current, package_ids: newIds };
            });
        },
        [packages]
    );

    const addPackage = useCallback(
        (packageId: number) => {
            if (form.data.package_ids.length >= MAX_PACKAGES) return;
            const newIds = [...form.data.package_ids, packageId];
            const primaryPkg = packages.find((p) => p.id === newIds[0]);

            form.setData((current) => ({
                ...current,
                package_ids: newIds,
                exam_package_id: newIds[0],
                duration_minutes: primaryPkg?.duration_minutes ?? current.duration_minutes,
                passing_score: primaryPkg?.passing_score ?? current.passing_score,
                max_attempts: primaryPkg?.max_attempts ?? current.max_attempts,
                show_result_to_candidate: primaryPkg?.show_result_to_candidate ?? current.show_result_to_candidate,
            }));
        },
        [packages, form.data.package_ids]
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (isEditing && editingSession) {
            form.put(`/dashboard/admin/exams/sessions/${editingSession.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccessToast("Sesi ujian berhasil diperbarui");
                    onClose();
                },
            });
            return;
        }
        form.post("/dashboard/admin/exams/sessions", {
            preserveScroll: true,
            onSuccess: () => {
                showSuccessToast("Sesi ujian baru berhasil dibuat");
                form.reset();
                onClose();
            },
        });
    };

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-amber-500/30 bg-white dark:bg-slate-900 shadow-2xl my-8 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <i className={`fa-solid ${isEditing ? "fa-pen-to-square" : "fa-calendar-plus"} text-base`} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            {isEditing ? "Edit Sesi Ujian" : "Buat Sesi Ujian Baru"}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Atur jadwal pelaksanaan, paket soal, dan akses peserta ujian.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                    <i className="fa-solid fa-xmark text-sm" />
                </button>
            </div>

            <form onSubmit={submit}>
                <div className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-5">
                    {/* Multi-Package Selector */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className={labelClass}>
                                Paket Soal Terhubung
                                <span className="ml-1.5 text-[10px] font-medium text-slate-400">
                                    ({form.data.package_ids.length}/{MAX_PACKAGES})
                                </span>
                            </label>
                            {availablePackages.length > 0 && form.data.package_ids.length < MAX_PACKAGES && (
                                <span className="text-[11px] text-amber-500/80 font-medium">
                                    Maksimal {MAX_PACKAGES} paket per sesi
                                </span>
                            )}
                        </div>

                        {selectedPackages.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2.5">
                                {selectedPackages.map((pkg, index) => (
                                    <div
                                        key={pkg.id}
                                        className="group flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs transition-all"
                                    >
                                        <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-500/20 text-[9px] font-black text-amber-400">
                                            {index + 1}
                                        </span>
                                        <span className="font-semibold text-amber-300 max-w-[200px] truncate">{pkg.title}</span>
                                        <span className="text-[10px] text-slate-400">{pkg.duration_minutes}m</span>
                                        {selectedPackages.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => togglePackage(pkg.id)}
                                                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                                title="Hapus paket"
                                            >
                                                <i className="fa-solid fa-xmark text-[9px]" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {availablePackages.length > 0 && form.data.package_ids.length < MAX_PACKAGES && (
                            <select
                                value=""
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val) addPackage(val);
                                }}
                                className={inputClass}
                            >
                                <option value="">
                                    {form.data.package_ids.length === 0
                                        ? "Pilih Paket Soal Utama..."
                                        : `+ Tambah Paket Lain (sisa ${MAX_PACKAGES - form.data.package_ids.length})`}
                                </option>
                                {availablePackages.map((pkg) => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.title} ({pkg.duration_minutes}m, {pkg.passing_score}%)
                                    </option>
                                ))}
                            </select>
                        )}
                        {form.errors.exam_package_id && <p className="mt-1 text-xs text-red-500">{form.errors.exam_package_id}</p>}
                    </div>

                    {form.data.package_ids.length > 1 && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
                            <label className={labelClass} htmlFor="modal-session-order-type">
                                <i className="fa-solid fa-list-ol mr-1.5 text-amber-400" /> Urutan Pengerjaan Paket
                            </label>
                            <select
                                id="modal-session-order-type"
                                value={form.data.package_order_type}
                                onChange={(e) => form.setData("package_order_type", e.target.value)}
                                className={inputClass}
                            >
                                <option value="flexible">Fleksibel (Kandidat bebas memilih urutan)</option>
                                <option value="sequential">Berurutan (Kandidat wajib selesai bertahap 1, 2, ...)</option>
                            </select>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className={labelClass} htmlFor="modal-session-title">Judul Sesi</label>
                            <input
                                id="modal-session-title"
                                value={form.data.title}
                                onChange={(e) => form.setData("title", e.target.value)}
                                className={inputClass}
                                placeholder="Contoh: Sesi 1 - Tes Masuk Gelombang 1"
                                maxLength={180}
                                required
                            />
                            {form.errors.title && <p className="mt-1 text-xs text-red-500">{form.errors.title}</p>}
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="modal-session-wave">Gelombang Penerimaan</label>
                            <select
                                id="modal-session-wave"
                                value={form.data.admission_wave_id}
                                onChange={(e) => form.setData("admission_wave_id", e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Semua Gelombang</option>
                                {waves.map((wave) => (
                                    <option key={wave.id} value={wave.id}>{wave.title}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="modal-session-status">Status Sesi</label>
                            <select
                                id="modal-session-status"
                                value={form.data.status}
                                onChange={(e) => form.setData("status", e.target.value)}
                                className={inputClass}
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="closed">Closed</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="relative">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className={labelClass} htmlFor="modal-session-opens">Waktu Buka (WIB)</label>
                                <QuickDateTimePicker
                                    type="opens"
                                    currentValue={form.data.opens_at}
                                    onSelect={(val) => form.setData("opens_at", val)}
                                />
                            </div>
                            <input
                                id="modal-session-opens"
                                type="datetime-local"
                                value={form.data.opens_at}
                                onChange={(e) => form.setData("opens_at", e.target.value)}
                                className={inputClass}
                                required
                            />
                            {form.errors.opens_at && <p className="mt-1 text-xs text-red-500">{form.errors.opens_at}</p>}
                        </div>

                        <div className="relative">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className={labelClass} htmlFor="modal-session-closes">Waktu Tutup (WIB)</label>
                                <QuickDateTimePicker
                                    type="closes"
                                    currentValue={form.data.closes_at}
                                    baseOpensAt={form.data.opens_at}
                                    onSelect={(val) => form.setData("closes_at", val)}
                                />
                            </div>
                            <input
                                id="modal-session-closes"
                                type="datetime-local"
                                value={form.data.closes_at}
                                onChange={(e) => form.setData("closes_at", e.target.value)}
                                className={inputClass}
                                required
                            />
                            {form.errors.closes_at && <p className="mt-1 text-xs text-red-500">{form.errors.closes_at}</p>}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <label className={labelClass} htmlFor="modal-session-duration">Durasi (Menit)</label>
                            <input
                                id="modal-session-duration"
                                type="number"
                                min={5}
                                max={300}
                                value={form.data.duration_minutes}
                                onChange={(e) => form.setData("duration_minutes", Number(e.target.value))}
                                className={inputClass}
                                required
                            />
                            {form.errors.duration_minutes && <p className="mt-1 text-xs text-red-500">{form.errors.duration_minutes}</p>}
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="modal-session-passing">Ambang Lulus (%)</label>
                            <input
                                id="modal-session-passing"
                                type="number"
                                min={0}
                                max={100}
                                step="0.5"
                                value={form.data.passing_score}
                                onChange={(e) => form.setData("passing_score", Number(e.target.value))}
                                className={inputClass}
                                required
                            />
                            {form.errors.passing_score && <p className="mt-1 text-xs text-red-500">{form.errors.passing_score}</p>}
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="modal-session-attempts">Maks. Percobaan</label>
                            <input
                                id="modal-session-attempts"
                                type="number"
                                min={1}
                                max={5}
                                value={form.data.max_attempts}
                                onChange={(e) => form.setData("max_attempts", Number(e.target.value))}
                                className={inputClass}
                                required
                            />
                            {form.errors.max_attempts && <p className="mt-1 text-xs text-red-500">{form.errors.max_attempts}</p>}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass} htmlFor="modal-session-description">Deskripsi Sesi</label>
                            <textarea
                                id="modal-session-description"
                                value={form.data.description}
                                onChange={(e) => form.setData("description", e.target.value)}
                                className={`${inputClass} min-h-20 resize-y`}
                                placeholder="Keterangan singkat tentang sesi ini..."
                                maxLength={500}
                            />
                            {form.errors.description && <p className="mt-1 text-xs text-red-500">{form.errors.description}</p>}
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="modal-session-instructions">Petunjuk Pengerjaan</label>
                            <textarea
                                id="modal-session-instructions"
                                value={form.data.instructions}
                                onChange={(e) => form.setData("instructions", e.target.value)}
                                className={`${inputClass} min-h-20 resize-y`}
                                placeholder="Petunjuk khusus bagi peserta sebelum mengerjakan..."
                                maxLength={1000}
                            />
                            {form.errors.instructions && <p className="mt-1 text-xs text-red-500">{form.errors.instructions}</p>}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-slate-950/30">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.data.show_result_to_candidate}
                                onChange={(e) => form.setData("show_result_to_candidate", e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 dark:border-white/20 dark:bg-slate-900"
                            />
                            <div>
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    Tampilkan skor hasil langsung ke kandidat setelah selesai
                                </span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Jika dinonaktifkan, skor dan ringkasan hasil hanya dapat dilihat oleh admin/panitia.
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 px-6 py-4 dark:border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={form.processing}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                        Batal
                    </button>

                    <button
                        type="submit"
                        disabled={form.processing}
                        className={`${primaryButtonClass} min-w-[140px]`}
                    >
                        {form.processing ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin text-xs" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-floppy-disk text-xs" />
                                {isEditing ? "Simpan Perubahan" : "Simpan Sesi"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    </div>
    );
});

export default SessionFormModal;