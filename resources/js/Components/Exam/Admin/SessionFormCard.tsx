import { FormEvent, memo, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import QuickDateTimePicker from "@/Components/Exam/Admin/QuickDateTimePicker";

export type PackageOption = {
    id: number;
    title: string;
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
    status: string;
};

type Props = {
    packages: PackageOption[];
    waves: WaveOption[];
    editingSession: SessionRow | null;
    mode?: "create" | "edit";
};

const defaultForm = (pkg?: PackageOption): SessionForm => ({
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

        form.setData({
            exam_package_id: editingSession.exam_package_id,
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
            status: editingSession.status,
        });
    }, [editingSession?.id, firstPackage?.id]);

    const selectPackage = (packageId: number) => {
        const selected = packages.find((item) => item.id === packageId);

        form.setData((current) => ({
            ...current,
            exam_package_id: packageId,
            duration_minutes: selected?.duration_minutes ?? current.duration_minutes,
            passing_score: selected?.passing_score ?? current.passing_score,
            max_attempts: selected?.max_attempts ?? current.max_attempts,
            show_result_to_candidate: selected?.show_result_to_candidate ?? current.show_result_to_candidate,
        }));
    };

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
                    <div>
                        <label className={labelClass} htmlFor="session-package">Paket</label>
                        <select
                            id="session-package"
                            value={form.data.exam_package_id}
                            onChange={(event) => selectPackage(Number(event.target.value))}
                            className={inputClass}
                        >
                            {packages.map((pkg) => (
                                <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                            ))}
                        </select>
                        {form.errors.exam_package_id ? <p className="mt-1 text-xs text-red-500">{form.errors.exam_package_id}</p> : null}
                        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            Memilih paket akan menyalin durasi, ambang lulus, percobaan, dan aturan hasil dari paket sebagai nilai awal sesi.
                        </p>
                    </div>

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
