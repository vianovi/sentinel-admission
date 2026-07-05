import { useEffect, useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import Swal from "sweetalert2";
import DashboardLayout from "@/Layouts/DashboardLayout";
import type { PageProps } from "@/types";

type Wave = {
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

type Props = {
    waves: Wave[];
};

type WaveForm = {
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

const swalDark = Swal.mixin({
    background: "#0f172a",
    color: "#e2e8f0",
    confirmButtonColor: "#d4a017",
    cancelButtonColor: "#334155",
    customClass: {
        popup: "!rounded-2xl !border !border-white/10",
        confirmButton: "!rounded-xl !px-6",
        cancelButton: "!rounded-xl !px-6",
    },
});

const listToText = (items: string[]) => items.join("\n");

const textToList = (value: string) =>
    value
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);

const rupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);

const fromWave = (wave: Wave): WaveForm => ({
    title: wave.title,
    academic_year: wave.academic_year,
    description: wave.description ?? "",
    start_date: wave.start_date_raw ?? "",
    end_date: wave.end_date_raw ?? "",
    exam_info: wave.exam_info ?? "",
    announcement_info: wave.announcement_info ?? "",
    reregistration_date: wave.reregistration_date_raw ?? "",
    registration_fee: String(Math.round(wave.registration_fee ?? 0)),
    quota_target: String(wave.quota_target ?? 0),
    available_majors: listToText(wave.available_majors ?? []),
    majors_enabled: wave.majors_enabled,
    is_active: wave.is_active,
});

export default function AdminWaves({ waves }: Props) {
    const { flash, errors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const [form, setForm] = useState<WaveForm>(blankForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const activeWave = useMemo(() => waves.find((wave) => wave.is_active) ?? null, [waves]);

    useEffect(() => {
        animate(".admin-wave-entry", {
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 480,
            delay: stagger(55),
            ease: "outExpo",
        });
    }, [waves]);

    useEffect(() => {
        if (!flash.success && !flash.error) return;
        const message = flash.success ?? flash.error ?? "";

        swalDark.fire({
            toast: true,
            position: "top-end",
            icon: flash.success ? "success" : "error",
            title: message,
            showConfirmButton: false,
            timer: 2400,
            timerProgressBar: true,
        });
    }, [flash.success, flash.error]);

    const setField = <K extends keyof WaveForm>(key: K, value: WaveForm[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const resetForm = () => {
        setEditingId(null);
        setForm(blankForm);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        setProcessing(true);

        const payload = {
            ...form,
            registration_fee: Number(form.registration_fee || 0),
            quota_target: Number(form.quota_target || 0),
            available_majors: textToList(form.available_majors),
        };

        const options = {
            preserveScroll: true,
            onSuccess: resetForm,
            onFinish: () => setProcessing(false),
        };

        if (editingId) {
            router.put(`/dashboard/admin/waves/${editingId}`, payload, options);
            return;
        }

        router.post("/dashboard/admin/waves", payload, options);
    };

    const editWave = (wave: Wave) => {
        setEditingId(wave.id);
        setForm(fromWave(wave));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleWave = async (wave: Wave) => {
        const confirmed = await swalDark.fire({
            title: wave.is_active ? "Tutup gelombang ini?" : "Aktifkan gelombang ini?",
            text: wave.is_active ? "Pendaftaran pada gelombang ini akan ditandai tidak aktif." : "Gelombang aktif lain akan otomatis ditutup.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, lanjutkan",
            cancelButtonText: "Batal",
        });

        if (!confirmed.isConfirmed) return;

        setProcessingId(wave.id);
        router.post(`/dashboard/admin/waves/${wave.id}/toggle`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    const deleteWave = async (wave: Wave) => {
        const confirmed = await swalDark.fire({
            title: "Hapus gelombang?",
            text: `${wave.title} hanya bisa dihapus jika belum memiliki kandidat.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Hapus",
            cancelButtonText: "Batal",
        });

        if (!confirmed.isConfirmed) return;

        setProcessingId(wave.id);
        router.delete(`/dashboard/admin/waves/${wave.id}`, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    return (
        <DashboardLayout>
            <Head title="Gelombang - Admin" />

            <div className="flex flex-col gap-6 pb-8">
                <header className="admin-wave-entry opacity-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold text-navy shadow-lg shadow-gold/20">
                            <i className="fa-solid fa-layer-group text-sm" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold leading-tight text-slate-800 dark:text-white">
                                Gelombang Pendaftaran
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {waves.length} gelombang terdata{activeWave ? ` - aktif: ${activeWave.title}` : ""}
                            </p>
                        </div>
                    </div>
                </header>

                <form
                    onSubmit={submit}
                    className="admin-wave-entry opacity-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900"
                >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">
                                {editingId ? "Edit Gelombang" : "Buat Gelombang Baru"}
                            </h2>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Atur periode, kuota, biaya, jadwal seleksi, dan jurusan yang tersedia untuk pendaftaran.
                            </p>
                        </div>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:border-gold hover:text-amber-700 dark:border-white/10 dark:text-slate-300 dark:hover:text-gold"
                            >
                                <i className="fa-solid fa-xmark" />
                                Batal Edit
                            </button>
                        )}
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <Input label="Nama Gelombang" value={form.title} onChange={(value) => setField("title", value)} error={errors.title} placeholder="Gelombang 1" required />
                        <Input label="Tahun Ajaran" value={form.academic_year} onChange={(value) => setField("academic_year", value)} error={errors.academic_year} placeholder="2026/2027" required />
                        <Input type="date" label="Tanggal Buka" value={form.start_date} onChange={(value) => setField("start_date", value)} error={errors.start_date} required />
                        <Input type="date" label="Tanggal Tutup" value={form.end_date} onChange={(value) => setField("end_date", value)} error={errors.end_date} required />
                        <Input type="date" label="Tanggal Daftar Ulang" value={form.reregistration_date} onChange={(value) => setField("reregistration_date", value)} error={errors.reregistration_date} />
                        <Input type="number" label="Biaya Pendaftaran" value={form.registration_fee} onChange={(value) => setField("registration_fee", value)} error={errors.registration_fee} placeholder="150000" required />
                        <Input type="number" label="Kuota Target" value={form.quota_target} onChange={(value) => setField("quota_target", value)} error={errors.quota_target} placeholder="200" required />

                        <div className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
                            <Toggle
                                label="Aktifkan Gelombang"
                                description="Jika aktif, gelombang aktif lain otomatis ditutup."
                                checked={form.is_active}
                                onChange={(value) => setField("is_active", value)}
                            />
                            <Toggle
                                label="Aktifkan Pilihan Jurusan"
                                description="Dipakai jika pendaftaran perlu pilihan jurusan/kelas khusus."
                                checked={form.majors_enabled}
                                onChange={(value) => setField("majors_enabled", value)}
                            />
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <Textarea label="Deskripsi Gelombang" value={form.description} onChange={(value) => setField("description", value)} error={errors.description} placeholder="Ringkasan informasi pendaftaran untuk gelombang ini." />
                        <Textarea label="Info Jadwal Ujian" value={form.exam_info} onChange={(value) => setField("exam_info", value)} error={errors.exam_info} placeholder="Contoh: Ujian seleksi dilaksanakan 07 Maret 2026 pukul 08.00 WIB." />
                        <Textarea label="Info Pengumuman" value={form.announcement_info} onChange={(value) => setField("announcement_info", value)} error={errors.announcement_info} placeholder="Contoh: Hasil seleksi diumumkan melalui dashboard kandidat." />
                        <Textarea label="Daftar Jurusan" value={form.available_majors} onChange={(value) => setField("available_majors", value)} error={errors.available_majors} placeholder="Satu baris per jurusan, contoh: IPA&#10;IPS" />
                    </div>

                    <div className="mt-5 flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-navy shadow-sm shadow-gold/20 transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-floppy-disk" />}
                            {editingId ? "Simpan Perubahan" : "Buat Gelombang"}
                        </button>
                    </div>
                </form>

                {waves.length === 0 ? (
                    <div className="admin-wave-entry opacity-0 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-soft dark:border-white/10 dark:bg-slate-900">
                        <i className="fa-solid fa-calendar-xmark text-3xl text-slate-300 dark:text-slate-600" />
                        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Belum ada gelombang pendaftaran
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Buat gelombang pertama dari form di atas.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {waves.map((wave) => {
                            const quotaPct = wave.quota_target > 0
                                ? Math.min(100, Math.round((wave.quota_filled / wave.quota_target) * 100))
                                : 0;

                            return (
                                <section
                                    key={wave.id}
                                    className="admin-wave-entry opacity-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/5 dark:bg-slate-900"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-base font-display font-bold text-slate-800 dark:text-white">
                                                    {wave.title}
                                                </h2>
                                                <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${wave.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"}`}>
                                                    {wave.is_active ? "Aktif" : "Nonaktif"}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                TA {wave.academic_year} - {wave.start_date ?? "Mulai belum diset"} sampai {wave.end_date ?? "Akhir belum diset"}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleWave(wave)}
                                                disabled={processingId === wave.id}
                                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 px-3 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                            >
                                                <i className="fa-solid fa-power-off text-xs" />
                                                {wave.is_active ? "Tutup" : "Aktifkan"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => editWave(wave)}
                                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-gold hover:text-amber-700 dark:border-white/10 dark:text-slate-300 dark:hover:text-gold"
                                            >
                                                <i className="fa-solid fa-pen" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteWave(wave)}
                                                disabled={processingId === wave.id || wave.candidates_count > 0}
                                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
                                            >
                                                <i className="fa-solid fa-trash" />
                                                Hapus
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        <Metric label="Kandidat" value={wave.candidates_count} />
                                        <Metric label="Diterima" value={wave.quota_filled} />
                                        <Metric label="Kuota" value={wave.quota_target} />
                                        <Metric label="Biaya" value={rupiah(wave.registration_fee)} />
                                    </div>

                                    <div className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-white/10">
                                        <div className="mb-2 flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Kuota diterima</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{quotaPct}%</span>
                                        </div>
                                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                            <div className="h-full rounded-full bg-gold" style={{ width: `${quotaPct}%` }} />
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 text-xs text-slate-500 dark:text-slate-400">
                                        <InfoLine icon="fa-solid fa-clipboard-question" label="Jadwal ujian" value={wave.exam_info ?? "Belum diisi"} />
                                        <InfoLine icon="fa-solid fa-bullhorn" label="Pengumuman" value={wave.announcement_info ?? "Belum diisi"} />
                                        <InfoLine icon="fa-solid fa-user-check" label="Daftar ulang" value={wave.reregistration_date ?? "Belum diset"} />
                                        <InfoLine
                                            icon={wave.majors_enabled ? "fa-solid fa-circle-check" : "fa-solid fa-circle-minus"}
                                            label="Jurusan"
                                            value={wave.majors_enabled && wave.available_majors.length ? wave.available_majors.join(", ") : "Tidak aktif"}
                                        />
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function Input({
    label,
    value,
    onChange,
    error,
    placeholder,
    required = false,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    placeholder?: string;
    required?: boolean;
    type?: "text" | "date" | "number";
}) {
    return (
        <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {label}{required ? " *" : ""}
            </span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className={`mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-gold dark:bg-slate-950 dark:text-slate-100 ${
                    error ? "border-red-400" : "border-slate-200 dark:border-white/10"
                }`}
            />
            {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
        </label>
    );
}

function Textarea({
    label,
    value,
    onChange,
    error,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    placeholder?: string;
}) {
    return (
        <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={4}
                className={`mt-2 w-full resize-none rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gold dark:bg-slate-950 dark:text-slate-100 ${
                    error ? "border-red-400" : "border-slate-200 dark:border-white/10"
                }`}
            />
            {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
        </label>
    );
}

function Toggle({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex items-center justify-between gap-4 text-left"
        >
            <span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span>
            </span>
            <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? "bg-gold" : "bg-slate-300 dark:bg-slate-700"}`}>
                <span className={`h-4 w-4 rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
            </span>
        </button>
    );
}

function Metric({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center dark:bg-white/[0.03]">
            <p className="text-sm font-display font-bold text-slate-800 dark:text-white sm:text-base">
                {typeof value === "number" ? value.toLocaleString("id-ID") : value}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">{label}</p>
        </div>
    );
}

function InfoLine({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/[0.03]">
            <i className={`${icon} mt-0.5 w-4 shrink-0 text-gold`} />
            <p className="min-w-0">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{label}: </span>
                <span>{value}</span>
            </p>
        </div>
    );
}
