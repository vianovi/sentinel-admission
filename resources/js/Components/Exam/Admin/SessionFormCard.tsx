import { FormEvent, memo, useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import { EmptyState, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";

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

const formatToLocalDateTime = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export const SessionFormCard = memo(function SessionFormCard({ packages, waves, editingSession, mode }: Props) {
    const [showOpensQuick, setShowOpensQuick] = useState(false);
    const [showClosesQuick, setShowClosesQuick] = useState(false);
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
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowOpensQuick(!showOpensQuick);
                                            setShowClosesQuick(false);
                                        }}
                                        className="flex items-center gap-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-500 transition-all hover:scale-105 active:scale-95 border border-amber-500/20"
                                        title="Pilihan Cepat"
                                    >
                                        <i className="fa-solid fa-bolt animate-pulse text-amber-500" /> Cepat
                                    </button>
                                    {showOpensQuick && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowOpensQuick(false)} />
                                            <div className="absolute right-0 top-6 z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800 dark:text-slate-100">
                                                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                    1. Pilih Hari
                                                </div>
                                                <div className="grid grid-cols-2 gap-1.5 mb-3">
                                                    {[
                                                        { label: "Hari Ini", offset: 0 },
                                                        { label: "Besok", offset: 1 },
                                                        { label: "Lusa", offset: 2 },
                                                        { label: "+1 Minggu", offset: 7 }
                                                    ].map((item) => (
                                                        <button
                                                            key={item.label}
                                                            type="button"
                                                            onClick={() => {
                                                                const currentVal = form.data.opens_at ? new Date(form.data.opens_at) : new Date();
                                                                const newDate = new Date();
                                                                newDate.setDate(newDate.getDate() + item.offset);
                                                                newDate.setHours(currentVal.getHours(), currentVal.getMinutes(), 0, 0);
                                                                form.setData("opens_at", formatToLocalDateTime(newDate));
                                                            }}
                                                            className="rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 px-2 py-1 text-xs font-medium text-left border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 transition-all"
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                    2. Pilih Jam
                                                </div>
                                                <div className="grid grid-cols-3 gap-1 mb-1">
                                                    {[
                                                        { label: "Sekarang", time: null },
                                                        { label: "07:30", time: "07:30" },
                                                        { label: "08:00", time: "08:00" },
                                                        { label: "09:00", time: "09:00" },
                                                        { label: "10:00", time: "10:00" },
                                                        { label: "13:00", time: "13:00" },
                                                        { label: "14:00", time: "14:00" },
                                                        { label: "16:00", time: "16:00" },
                                                        { label: "19:00", time: "19:00" }
                                                    ].map((item) => (
                                                        <button
                                                            key={item.label}
                                                            type="button"
                                                            onClick={() => {
                                                                const newDate = form.data.opens_at ? new Date(form.data.opens_at) : new Date();
                                                                if (item.time) {
                                                                    const [h, m] = item.time.split(":").map(Number);
                                                                    newDate.setHours(h, m, 0, 0);
                                                                } else {
                                                                    const now = new Date();
                                                                    newDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
                                                                }
                                                                form.setData("opens_at", formatToLocalDateTime(newDate));
                                                            }}
                                                            className="rounded-md bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 px-1 py-1 text-[11px] font-medium text-center border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 transition-all"
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
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
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowClosesQuick(!showClosesQuick);
                                            setShowOpensQuick(false);
                                        }}
                                        className="flex items-center gap-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-500 transition-all hover:scale-105 active:scale-95 border border-amber-500/20"
                                        title="Pilihan Cepat"
                                    >
                                        <i className="fa-solid fa-bolt animate-pulse text-amber-500" /> Cepat
                                    </button>
                                    {showClosesQuick && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowClosesQuick(false)} />
                                            <div className="absolute right-0 top-6 z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800 dark:text-slate-100">
                                                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                    Tambah Jam (Waktu Buka)
                                                </div>
                                                <div className="grid grid-cols-3 gap-1.5 mb-3">
                                                    {[
                                                        { label: "+1 Jam", hours: 1 },
                                                        { label: "+2 Jam", hours: 2 },
                                                        { label: "+3 Jam", hours: 3 },
                                                        { label: "+4 Jam", hours: 4 },
                                                        { label: "+6 Jam", hours: 6 },
                                                        { label: "+8 Jam", hours: 8 },
                                                        { label: "+12 Jam", hours: 12 },
                                                        { label: "+18 Jam", hours: 18 },
                                                        { label: "+24 Jam", hours: 24 }
                                                    ].map((item) => (
                                                        <button
                                                            key={item.label}
                                                            type="button"
                                                            onClick={() => {
                                                                const baseStr = form.data.opens_at || formatToLocalDateTime(new Date());
                                                                const baseDate = new Date(baseStr);
                                                                baseDate.setHours(baseDate.getHours() + item.hours);
                                                                form.setData("closes_at", formatToLocalDateTime(baseDate));
                                                                setShowClosesQuick(false);
                                                            }}
                                                            className="rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 px-1 py-1 text-xs font-medium text-center border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 transition-all"
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                    Tambah Hari
                                                </div>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {[
                                                        { label: "+1 Hari", days: 1 },
                                                        { label: "+2 Hari", days: 2 },
                                                        { label: "+3 Hari", days: 3 },
                                                        { label: "+7 Hari", days: 7 }
                                                    ].map((item) => (
                                                        <button
                                                            key={item.label}
                                                            type="button"
                                                            onClick={() => {
                                                                const baseStr = form.data.opens_at || formatToLocalDateTime(new Date());
                                                                const baseDate = new Date(baseStr);
                                                                baseDate.setDate(baseDate.getDate() + item.days);
                                                                form.setData("closes_at", formatToLocalDateTime(baseDate));
                                                                setShowClosesQuick(false);
                                                            }}
                                                            className="rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 px-2 py-1 text-xs font-medium text-left border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 transition-all"
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
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
