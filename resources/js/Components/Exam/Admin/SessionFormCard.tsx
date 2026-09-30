import { FormEvent, memo, useCallback, useEffect, useMemo } from "react";
import { useForm } from "@inertiajs/react";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import QuickDateTimePicker from "@/Components/Exam/Admin/QuickDateTimePicker";

export type PackageOption = {
    id: number;
    title: string;
    code?: string | null;
    duration_minutes: number;
    passing_score: number;
    max_attempts: number;
    show_result_to_candidate: boolean;
};

export type WaveOption = {
    id: number;
    title: string;
};

export type SessionRow = {
    id: number;
    exam_package_id: number;
    package_title: string | null;
    package_ids?: number[];
    packages_count?: number;
    admission_wave_id: number | null;
    admission_wave: string | null;
    title: string;
    description?: string | null;
    instructions?: string | null;
    status: string;
    opens_at: string | null;
    closes_at: string | null;
    opens_at_input?: string | null;
    closes_at_input?: string | null;
    duration_minutes: number;
    passing_score: number;
    max_attempts: number;
    show_result_to_candidate: boolean;
    is_public: boolean;
    public_access_type: string;
    candidates_count: number;
    attempts_count: number;
};

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
    packages: PackageOption[];
    waves: WaveOption[];
    editingSession: SessionRow | null;
    mode?: "create" | "edit";
};

const MAX_PACKAGES = 5;

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

export const SessionFormCard = memo(function SessionFormCard({ packages, waves, editingSession, mode }: Props) {
    const firstPackage = packages[0];
    const form = useForm<SessionForm>(defaultForm(firstPackage));
    const isEditing = mode === "edit" && editingSession !== null;

    useEffect(() => {
        if (!editingSession) {
            form.setData(defaultForm(firstPackage));
            return;
        }

        const editPackageIds = editingSession.package_ids?.length
            ? editingSession.package_ids
            : [editingSession.exam_package_id];

        form.setData({
            package_ids: editPackageIds,
            exam_package_id: editPackageIds[0],
            admission_wave_id: editingSession.admission_wave_id ? String(editingSession.admission_wave_id) : "",
            title: editingSession.title,
            description: editingSession.description ?? "",
            instructions: editingSession.instructions ?? "",
            opens_at: editingSession.opens_at_input ?? "",
            closes_at: editingSession.closes_at_input ?? "",
            duration_minutes: editingSession.duration_minutes,
            passing_score: editingSession.passing_score,
            max_attempts: editingSession.max_attempts,
            show_result_to_candidate: editingSession.show_result_to_candidate,
            is_public: editingSession.is_public ?? true,
            public_access_type: editingSession.public_access_type ?? "token_required",
            package_order_type: editingSession.package_order_type ?? "flexible",
            status: editingSession.status,
        });
    }, [editingSession?.id, firstPackage?.id]);

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
                    // Don't remove the last package
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

                // Don't exceed max
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
            form.put(`/dashboard/admin/exams/sessions/${editingSession.id}`, { preserveScroll: true });
            return;
        }

        form.post("/dashboard/admin/exams/sessions", { preserveScroll: true });
    };

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{isEditing ? "Edit Sesi" : "Sesi Baru"}</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Paket Ujian = apa yang diuji. Sesi Ujian = jadwal dan kandidat yang mendapat akses.</p>
            </div>

            {packages.length === 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <i className="fa-solid fa-box-open text-xl" />
                    </div>
                    <div>
                        <h3 className="text-sm font-extrabold text-white">Langkah 2: Buat Paket Soal Ujian</h3>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                            Belum ada Paket Soal Ujian yang dibuat. Sesi Ujian memerlukan Paket Soal sebagai sumber materi ujian. Silakan buat Paket Soal terlebih dahulu.
                        </p>
                    </div>
                    <a
                        href="/dashboard/admin/exams/packages"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                    >
                        <i className="fa-solid fa-plus text-xs" /> Buat Paket Soal Sekarang
                    </a>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4">
                    {/* Multi-Package Selector */}
                    <div>
                        <label className={labelClass}>
                            Paket Ujian
                            <span className="ml-1.5 text-[10px] font-medium text-slate-400">
                                ({form.data.package_ids.length}/{MAX_PACKAGES})
                            </span>
                        </label>

                        {/* Selected Packages (chips) */}
                        {selectedPackages.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {selectedPackages.map((pkg, index) => (
                                    <div
                                        key={pkg.id}
                                        className="group flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs transition-all"
                                    >
                                        <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-500/20 text-[9px] font-black text-amber-400">
                                            {index + 1}
                                        </span>
                                        <span className="font-semibold text-amber-300 max-w-[160px] truncate">{pkg.title}</span>
                                        <span className="text-[10px] text-slate-400">{pkg.duration_minutes}m</span>
                                        {selectedPackages.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => togglePackage(pkg.id)}
                                                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                            >
                                                <i className="fa-solid fa-xmark text-[9px]" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Package Dropdown */}
                        {availablePackages.length > 0 && form.data.package_ids.length < MAX_PACKAGES && (
                            <select
                                value=""
                                onChange={(event) => {
                                    const val = Number(event.target.value);
                                    if (val) addPackage(val);
                                }}
                                className={inputClass}
                            >
                                <option value="">
                                    {form.data.package_ids.length === 0
                                        ? "Pilih Paket Ujian..."
                                        : `+ Tambah Paket (sisa ${MAX_PACKAGES - form.data.package_ids.length})`}
                                </option>
                                {availablePackages.map((pkg) => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.title} ({pkg.duration_minutes}m, {pkg.passing_score}%)
                                    </option>
                                ))}
                            </select>
                        )}

                        {form.errors.exam_package_id ? <p className="mt-1 text-xs text-red-500">{form.errors.exam_package_id}</p> : null}
                        {(form.errors as Record<string, string>).package_ids ? (
                            <p className="mt-1 text-xs text-red-500">{(form.errors as Record<string, string>).package_ids}</p>
                        ) : null}

                        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {form.data.package_ids.length > 1
                                ? `${form.data.package_ids.length} paket terpilih. Durasi & skor ambang lulus mengikuti masing-masing paket.`
                                : "Memilih paket akan menyalin durasi, ambang lulus, percobaan, dan aturan hasil dari paket sebagai nilai awal sesi."}
                        </p>
                    </div>

                    {/* Package Info Badges */}
                    {selectedPackages.length > 0 && (
                        <div className="rounded-lg border border-white/5 bg-slate-950/50 p-2.5 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                <i className="fa-solid fa-circle-info mr-1 text-amber-400/60" />
                                Konfigurasi per Paket
                            </span>
                            {selectedPackages.map((pkg, index) => (
                                <div key={pkg.id} className="flex items-center justify-between rounded-md bg-white/5 px-2.5 py-1.5 text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-amber-500/20 text-[9px] font-black text-amber-400">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-slate-300 truncate">{pkg.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0 ml-2">
                                        <span>{pkg.duration_minutes}m</span>
                                        <span className="text-emerald-400">{pkg.passing_score}%</span>
                                        <span className="text-amber-300">{pkg.max_attempts}x</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* URUTAN PENGERJAAN - Only show if multiple packages are selected */}
                    {form.data.package_ids.length > 1 && (
                        <div>
                            <label className={labelClass} htmlFor="session-order-type">Urutan Pengerjaan Paket</label>
                            <select
                                id="session-order-type"
                                value={form.data.package_order_type}
                                onChange={(event) => form.setData("package_order_type", event.target.value)}
                                className={inputClass}
                            >
                                <option value="flexible">Fleksibel (Kandidat bebas memilih urutan)</option>
                                <option value="sequential">Berurutan (Kandidat harus mengerjakan sesuai urutan)</option>
                            </select>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {form.data.package_order_type === 'flexible'
                                    ? 'Peserta akan melihat semua paket yang tersedia dan bebas memilih mana yang dikerjakan lebih dulu.'
                                    : 'Peserta harus mengerjakan Paket 1 hingga selesai sebelum bisa membuka Paket 2, dan seterusnya.'}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className={labelClass} htmlFor="session-wave">Gelombang</label>
                        <select
                            id="session-wave"
                            value={form.data.admission_wave_id}
                            onChange={(event) => form.setData("admission_wave_id", event.target.value)}
                            className={inputClass}
                        >
                            <option value="">Semua Gelombang</option>
                            {waves.map((wave) => (
                                <option key={wave.id} value={wave.id}>{wave.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="session-title">Judul Sesi</label>
                        <input
                            id="session-title"
                            value={form.data.title}
                            onChange={(event) => form.setData("title", event.target.value)}
                            className={inputClass}
                            placeholder="Sesi 1 - Tes Masuk Gelombang 1"
                            maxLength={160}
                        />
                        {form.errors.title ? <p className="mt-1 text-xs text-red-500">{form.errors.title}</p> : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="relative">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className={labelClass} htmlFor="session-opens">Waktu Buka (WIB)</label>
                                <QuickDateTimePicker
                                    type="opens"
                                    currentValue={form.data.opens_at}
                                    onSelect={(val) => form.setData("opens_at", val)}
                                />
                            </div>
                            <input
                                id="session-opens"
                                type="datetime-local"
                                value={form.data.opens_at}
                                onChange={(event) => form.setData("opens_at", event.target.value)}
                                className={inputClass}
                            />
                            {form.errors.opens_at ? <p className="mt-1 text-xs text-red-500">{form.errors.opens_at}</p> : null}
                        </div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className={labelClass} htmlFor="session-closes">Waktu Tutup (WIB)</label>
                                <QuickDateTimePicker
                                    type="closes"
                                    currentValue={form.data.closes_at}
                                    baseOpensAt={form.data.opens_at}
                                    onSelect={(val) => form.setData("closes_at", val)}
                                />
                            </div>
                            <input
                                id="session-closes"
                                type="datetime-local"
                                value={form.data.closes_at}
                                onChange={(event) => form.setData("closes_at", event.target.value)}
                                className={inputClass}
                            />
                            {form.errors.closes_at ? <p className="mt-1 text-xs text-red-500">{form.errors.closes_at}</p> : null}
                        </div>
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="session-description">Deskripsi Sesi</label>
                        <textarea
                            id="session-description"
                            value={form.data.description}
                            onChange={(event) => form.setData("description", event.target.value)}
                            className={`${inputClass} min-h-20 resize-y`}
                            maxLength={500}
                        />
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="session-instructions">Petunjuk Pengerjaan</label>
                        <textarea
                            id="session-instructions"
                            value={form.data.instructions}
                            onChange={(event) => form.setData("instructions", event.target.value)}
                            className={`${inputClass} min-h-20 resize-y`}
                            maxLength={1000}
                        />
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="session-status">Status Sesi</label>
                        <select
                            id="session-status"
                            value={form.data.status}
                            onChange={(event) => form.setData("status", event.target.value)}
                            className={inputClass}
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <button type="submit" disabled={form.processing} className={`${primaryButtonClass} flex-1 min-h-11`}>
                            {form.processing ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-floppy-disk text-xs" />}
                            {isEditing ? "Simpan Perubahan" : "Simpan Sesi"}
                        </button>

                        {isEditing ? (
                            <a href="/dashboard/admin/exams/sessions" className={`${secondaryButtonClass} min-h-11`}>
                                Batal
                            </a>
                        ) : null}
                    </div>
                </form>
            )}
        </section>
    );
});

export default SessionFormCard;
