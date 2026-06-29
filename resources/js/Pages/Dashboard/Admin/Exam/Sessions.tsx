import { FormEvent, useEffect } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { EmptyState, ExamSectionNav, FlashMessage, PageHeader, StatusPill, inputClass, labelClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import type { PageProps } from "@/types";

type PackageOption = {
    id: number;
    title: string;
    duration_minutes: number;
    passing_score: number;
    max_attempts: number;
    show_result_to_candidate: boolean;
};

type WaveOption = {
    id: number;
    title: string;
};

type SessionRow = {
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
    status: string;
};

type Props = {
    sessions: SessionRow[];
    packages: PackageOption[];
    waves: WaveOption[];
    editing_session: SessionRow | null;
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
    status: "draft",
});

export default function ExamSessions({ sessions, packages, waves, editing_session, mode }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const firstPackage = packages[0];
    const form = useForm<SessionForm>(defaultForm(firstPackage));
    const isEditing = mode === "edit" && editing_session !== null;

    useEffect(() => {
        if (!editing_session) {
            form.setData(defaultForm(firstPackage));
            return;
        }

        form.setData({
            exam_package_id: editing_session.exam_package_id,
            admission_wave_id: editing_session.admission_wave_id ? String(editing_session.admission_wave_id) : "",
            title: editing_session.title,
            description: editing_session.description ?? "",
            instructions: editing_session.instructions ?? "",
            opens_at: editing_session.opens_at_input ?? "",
            closes_at: editing_session.closes_at_input ?? "",
            duration_minutes: editing_session.duration_minutes,
            passing_score: editing_session.passing_score,
            max_attempts: editing_session.max_attempts,
            show_result_to_candidate: editing_session.show_result_to_candidate,
            status: editing_session.status,
        });
    }, [editing_session?.id, firstPackage?.id]);

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

        if (isEditing && editing_session) {
            form.put(`/dashboard/admin/exams/sessions/${editing_session.id}`, { preserveScroll: true });
            return;
        }

        form.post("/dashboard/admin/exams/sessions", { preserveScroll: true });
    };

    const destroy = (session: SessionRow) => {
        if (!window.confirm(`Hapus sesi "${session.title}"?`)) return;
        router.delete(`/dashboard/admin/exams/sessions/${session.id}`, { preserveScroll: true });
    };

    return (
        <DashboardLayout>
            <Head title="Sesi Ujian" />

            <div className="space-y-5 pb-8">
                <PageHeader
                    title="Sesi Ujian"
                    description="Sesi menentukan kapan paket tersedia dan untuk siapa kandidat ditugaskan."
                    icon="fa-solid fa-calendar-check"
                    actions={
                        <Link href="/dashboard/admin/exams/sessions/create" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-500 px-3 text-sm font-bold text-white hover:bg-rose-400">
                            <i className="fa-solid fa-plus text-xs" /> Sesi Baru
                        </Link>
                    }
                />

                <ExamSectionNav active="sessions" />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.session} />

                <div className="grid gap-4 xl:grid-cols-[440px_1fr]">
                    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="mb-4">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{isEditing ? "Edit Sesi" : "Sesi Baru"}</h2>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Paket Ujian = apa yang diuji. Sesi Ujian = jadwal dan kandidat yang mendapat akses.</p>
                        </div>

                        {packages.length === 0 ? (
                            <EmptyState icon="fa-solid fa-box-open" title="Paket belum tersedia" description="Buat paket ujian terlebih dahulu sebelum menjadwalkan sesi." />
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
                                        <option value="">Tanpa batas gelombang</option>
                                        {waves.map((wave) => (
                                            <option key={wave.id} value={wave.id}>{wave.title}</option>
                                        ))}
                                    </select>
                                    {form.errors.admission_wave_id ? <p className="mt-1 text-xs text-red-500">{form.errors.admission_wave_id}</p> : null}
                                </div>

                                <div>
                                    <label className={labelClass} htmlFor="session-title">Judul sesi</label>
                                    <input
                                        id="session-title"
                                        value={form.data.title}
                                        onChange={(event) => form.setData("title", event.target.value)}
                                        className={inputClass}
                                        placeholder="Sesi Seleksi Online Gelombang 1"
                                        maxLength={180}
                                    />
                                    {form.errors.title ? <p className="mt-1 text-xs text-red-500">{form.errors.title}</p> : null}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass} htmlFor="session-opens">Dibuka</label>
                                        <input
                                            id="session-opens"
                                            type="datetime-local"
                                            value={form.data.opens_at}
                                            onChange={(event) => form.setData("opens_at", event.target.value)}
                                            className={inputClass}
                                        />
                                        {form.errors.opens_at ? <p className="mt-1 text-xs text-red-500">{form.errors.opens_at}</p> : null}
                                    </div>
                                    <div>
                                        <label className={labelClass} htmlFor="session-closes">Ditutup</label>
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

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className={labelClass} htmlFor="session-duration">Durasi</label>
                                        <input
                                            id="session-duration"
                                            type="number"
                                            value={form.data.duration_minutes}
                                            onChange={(event) => form.setData("duration_minutes", Number(event.target.value))}
                                            className={inputClass}
                                            min={5}
                                            max={300}
                                        />
                                        {form.errors.duration_minutes ? <p className="mt-1 text-xs text-red-500">{form.errors.duration_minutes}</p> : null}
                                    </div>
                                    <div>
                                        <label className={labelClass} htmlFor="session-passing">Lulus %</label>
                                        <input
                                            id="session-passing"
                                            type="number"
                                            value={form.data.passing_score}
                                            onChange={(event) => form.setData("passing_score", Number(event.target.value))}
                                            className={inputClass}
                                            min={0}
                                            max={100}
                                            step="0.01"
                                        />
                                        {form.errors.passing_score ? <p className="mt-1 text-xs text-red-500">{form.errors.passing_score}</p> : null}
                                    </div>
                                    <div>
                                        <label className={labelClass} htmlFor="session-attempts">Attempt</label>
                                        <input
                                            id="session-attempts"
                                            type="number"
                                            value={form.data.max_attempts}
                                            onChange={(event) => form.setData("max_attempts", Number(event.target.value))}
                                            className={inputClass}
                                            min={1}
                                            max={5}
                                        />
                                        {form.errors.max_attempts ? <p className="mt-1 text-xs text-red-500">{form.errors.max_attempts}</p> : null}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass} htmlFor="session-status">Status</label>
                                    <select id="session-status" value={form.data.status} onChange={(event) => form.setData("status", event.target.value)} className={inputClass}>
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="closed">Closed</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                    {form.errors.status ? <p className="mt-1 text-xs text-red-500">{form.errors.status}</p> : null}
                                </div>

                                <div>
                                    <label className={labelClass} htmlFor="session-description">Deskripsi</label>
                                    <textarea
                                        id="session-description"
                                        value={form.data.description}
                                        onChange={(event) => form.setData("description", event.target.value)}
                                        className={`${inputClass} min-h-20 resize-y`}
                                        placeholder="Catatan internal sesi."
                                        maxLength={1500}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass} htmlFor="session-instructions">Instruksi Kandidat</label>
                                    <textarea
                                        id="session-instructions"
                                        value={form.data.instructions}
                                        onChange={(event) => form.setData("instructions", event.target.value)}
                                        className={`${inputClass} min-h-28 resize-y`}
                                        placeholder="Instruksi singkat sebelum kandidat memulai ujian."
                                        maxLength={5000}
                                    />
                                </div>

                                <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={form.data.show_result_to_candidate}
                                        onChange={(event) => form.setData("show_result_to_candidate", event.target.checked)}
                                        className="rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                                    />
                                    Tampilkan hasil ke kandidat setelah selesai
                                </label>

                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 text-sm font-bold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {form.processing ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-floppy-disk text-xs" />}
                                    {isEditing ? "Simpan Sesi" : "Buat Sesi"}
                                </button>
                            </form>
                        )}
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daftar Sesi</h2>
                            <span className="text-xs font-semibold text-slate-500">{sessions.length.toLocaleString("id-ID")} sesi</span>
                        </div>

                        {sessions.length === 0 ? (
                            <EmptyState icon="fa-solid fa-calendar-xmark" title="Belum ada sesi" description="Sesi menentukan kapan kandidat dapat memulai ujian." />
                        ) : (
                            <div className="grid gap-3">
                                {sessions.map((session) => (
                                    <article key={session.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Link href={`/dashboard/admin/exams/sessions/${session.id}`} className="text-base font-bold text-slate-900 hover:text-rose-500 dark:text-white">
                                                        {session.title}
                                                    </Link>
                                                    <StatusPill value={session.status} />
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500">{session.package_title ?? "Tanpa paket"} · {session.admission_wave ?? "Semua gelombang"}</p>
                                                <p className="mt-1 text-xs text-slate-500">{session.opens_at ?? "-"} - {session.closes_at ?? "-"}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Link href={`/dashboard/admin/exams/sessions/${session.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-200">
                                                    <i className="fa-solid fa-eye" /> Detail
                                                </Link>
                                                <Link href={`/dashboard/admin/exams/sessions/${session.id}/edit`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-200">
                                                    <i className="fa-solid fa-pen" /> Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(session)}
                                                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-red-300 hover:text-red-500 dark:border-white/10 dark:text-slate-200"
                                                >
                                                    <i className="fa-solid fa-trash" /> Hapus
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                                            <Metric label="Durasi" value={`${session.duration_minutes} menit`} />
                                            <Metric label="Lulus" value={`${session.passing_score}%`} />
                                            <Metric label="Attempt" value={session.max_attempts} />
                                            <Metric label="Kandidat" value={session.candidates_count} />
                                            <Metric label="Pengerjaan" value={session.attempts_count} />
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg bg-slate-50 px-3 py-3 dark:bg-white/[0.03]">
            <p className="text-sm font-black text-slate-900 dark:text-white">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    );
}
