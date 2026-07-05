import { useEffect, useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import Swal from "sweetalert2";
import DashboardLayout from "@/Layouts/DashboardLayout";
import type { PageProps } from "@/types";

type TabKey = "programs" | "extracurriculars" | "payments";

type WaveOption = {
    id: number;
    title: string;
    academic_year: string;
    is_active: boolean;
};

type ProgramRow = {
    id: number;
    admission_wave_id: number;
    wave_title: string | null;
    wave_academic_year: string | null;
    name: string;
    priority: number;
    quota_ideal: number;
    quota_max: number;
    is_open_quota: boolean;
    description: string | null;
    is_active: boolean;
    filled_count: number;
    quota_zone: string;
};

type ExtracurricularRow = {
    id: number;
    name: string;
    is_active: boolean;
    updated_at: string | null;
};

type PaymentConfigRow = {
    id: number;
    admission_wave_id: number | null;
    scope_label: string;
    gateway_fee_type: "percentage" | "flat";
    gateway_fee_value: number;
    gateway_fee_label: string;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    bank_logo_key: string | null;
    whatsapp_contact: string | null;
    whatsapp_contact_label: string | null;
    is_active: boolean;
};

type Props = {
    initial_tab: TabKey;
    waves: WaveOption[];
    programs: ProgramRow[];
    extracurriculars: ExtracurricularRow[];
    payment_configs: PaymentConfigRow[];
    bank_logos: Record<string, string>;
};

type ProgramForm = {
    admission_wave_id: string;
    name: string;
    priority: string;
    quota_ideal: string;
    quota_max: string;
    is_open_quota: boolean;
    description: string;
    is_active: boolean;
};

type ExtraForm = {
    name: string;
    is_active: boolean;
};

type PaymentForm = {
    admission_wave_id: string;
    gateway_fee_type: "percentage" | "flat";
    gateway_fee_value: string;
    gateway_fee_label: string;
    bank_name: string;
    bank_account_number: string;
    bank_account_name: string;
    bank_logo_key: string;
    whatsapp_contact: string;
    whatsapp_contact_label: string;
    is_active: boolean;
};

const blankProgram: ProgramForm = {
    admission_wave_id: "",
    name: "",
    priority: "99",
    quota_ideal: "0",
    quota_max: "0",
    is_open_quota: false,
    description: "",
    is_active: true,
};

const blankExtra: ExtraForm = {
    name: "",
    is_active: true,
};

const blankPayment: PaymentForm = {
    admission_wave_id: "",
    gateway_fee_type: "percentage",
    gateway_fee_value: "0",
    gateway_fee_label: "Biaya layanan",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    bank_logo_key: "",
    whatsapp_contact: "",
    whatsapp_contact_label: "",
    is_active: true,
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

const zoneLabel: Record<string, string> = {
    green: "Normal",
    yellow: "Melewati Ideal",
    red: "Penuh",
    open: "Open Quota",
};

export default function SystemSettings({
    initial_tab,
    waves,
    programs,
    extracurriculars,
    payment_configs,
    bank_logos,
}: Props) {
    const { flash, errors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const [activeTab, setActiveTab] = useState<TabKey>(initial_tab);
    const [processing, setProcessing] = useState(false);
    const [programForm, setProgramForm] = useState<ProgramForm>(blankProgram);
    const [extraForm, setExtraForm] = useState<ExtraForm>(blankExtra);
    const [paymentForm, setPaymentForm] = useState<PaymentForm>(blankPayment);
    const [editingProgramId, setEditingProgramId] = useState<number | null>(null);
    const [editingExtraId, setEditingExtraId] = useState<number | null>(null);
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);

    const activeWave = useMemo(() => waves.find((wave) => wave.is_active) ?? waves[0] ?? null, [waves]);

    useEffect(() => {
        animate(".system-settings-entry", {
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 480,
            delay: stagger(45),
            ease: "outExpo",
        });
    }, [activeTab, programs.length, extracurriculars.length, payment_configs.length]);

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

    useEffect(() => {
        if (programForm.admission_wave_id || !activeWave) return;
        setProgramForm((current) => ({ ...current, admission_wave_id: String(activeWave.id) }));
    }, [activeWave, programForm.admission_wave_id]);

    const resetProgram = () => {
        setEditingProgramId(null);
        setProgramForm({ ...blankProgram, admission_wave_id: activeWave ? String(activeWave.id) : "" });
    };

    const resetExtra = () => {
        setEditingExtraId(null);
        setExtraForm(blankExtra);
    };

    const resetPayment = () => {
        setEditingPaymentId(null);
        setPaymentForm(blankPayment);
    };

    const submitProgram = (event: React.FormEvent) => {
        event.preventDefault();
        setProcessing(true);

        const payload = {
            ...programForm,
            admission_wave_id: Number(programForm.admission_wave_id),
            priority: Number(programForm.priority || 99),
            quota_ideal: Number(programForm.quota_ideal || 0),
            quota_max: Number(programForm.quota_max || 0),
        };

        const options = {
            preserveScroll: true,
            onSuccess: resetProgram,
            onFinish: () => setProcessing(false),
        };

        if (editingProgramId) {
            router.put(`/dashboard/admin/settings/programs/${editingProgramId}`, payload, options);
            return;
        }

        router.post("/dashboard/admin/settings/programs", payload, options);
    };

    const submitExtra = (event: React.FormEvent) => {
        event.preventDefault();
        setProcessing(true);

        const options = {
            preserveScroll: true,
            onSuccess: resetExtra,
            onFinish: () => setProcessing(false),
        };

        if (editingExtraId) {
            router.put(`/dashboard/admin/settings/extracurriculars/${editingExtraId}`, extraForm, options);
            return;
        }

        router.post("/dashboard/admin/settings/extracurriculars", extraForm, options);
    };

    const submitPayment = (event: React.FormEvent) => {
        event.preventDefault();
        setProcessing(true);

        const payload = {
            ...paymentForm,
            admission_wave_id: paymentForm.admission_wave_id ? Number(paymentForm.admission_wave_id) : null,
            gateway_fee_value: Number(paymentForm.gateway_fee_value || 0),
            bank_logo_key: paymentForm.bank_logo_key || null,
            bank_name: paymentForm.bank_name || null,
            bank_account_number: paymentForm.bank_account_number || null,
            bank_account_name: paymentForm.bank_account_name || null,
            whatsapp_contact: paymentForm.whatsapp_contact || null,
            whatsapp_contact_label: paymentForm.whatsapp_contact_label || null,
        };

        const options = {
            preserveScroll: true,
            onSuccess: resetPayment,
            onFinish: () => setProcessing(false),
        };

        if (editingPaymentId) {
            router.put(`/dashboard/admin/settings/payment-configs/${editingPaymentId}`, payload, options);
            return;
        }

        router.post("/dashboard/admin/settings/payment-configs", payload, options);
    };

    const confirmDelete = async (label: string, url: string) => {
        const result = await swalDark.fire({
            icon: "warning",
            title: `Hapus ${label}?`,
            text: "Aksi ini tidak bisa dibatalkan dari halaman ini.",
            showCancelButton: true,
            confirmButtonText: "Hapus",
            cancelButtonText: "Batal",
        });

        if (!result.isConfirmed) return;

        router.delete(url, { preserveScroll: true });
    };

    return (
        <DashboardLayout>
            <Head title="Pengaturan Sistem - Admin" />

            <div className="flex flex-col gap-6 pb-8">
                <header className="system-settings-entry opacity-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold text-navy shadow-lg shadow-gold/20">
                            <i className="fa-solid fa-sliders text-sm" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold leading-tight text-slate-800 dark:text-white">
                                Pengaturan Sistem
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Kelola data referensi yang dipakai pendaftaran, pembayaran, dan pilihan kandidat.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="system-settings-entry opacity-0 flex overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-slate-900">
                    <TabButton active={activeTab === "programs"} icon="fa-solid fa-diagram-project" label="Program / Jalur" onClick={() => setActiveTab("programs")} />
                    <TabButton active={activeTab === "extracurriculars"} icon="fa-solid fa-people-group" label="Ekstrakurikuler" onClick={() => setActiveTab("extracurriculars")} />
                    <TabButton active={activeTab === "payments"} icon="fa-solid fa-credit-card" label="Pembayaran" onClick={() => setActiveTab("payments")} />
                </div>

                {activeTab === "programs" && (
                    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
                        <form onSubmit={submitProgram} className="system-settings-entry opacity-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900">
                            <FormHeader title={editingProgramId ? "Edit Program/Jalur" : "Tambah Program/Jalur"} onReset={editingProgramId ? resetProgram : undefined} />
                            <div className="mt-4 grid gap-4">
                                <SelectInput label="Gelombang" value={programForm.admission_wave_id} onChange={(value) => setProgramForm({ ...programForm, admission_wave_id: value })} error={errors.admission_wave_id} required>
                                    <option value="">Pilih gelombang</option>
                                    {waves.map((wave) => (
                                        <option key={wave.id} value={wave.id}>{wave.title} - {wave.academic_year}</option>
                                    ))}
                                </SelectInput>
                                <TextInput label="Nama Program/Jalur" value={programForm.name} onChange={(value) => setProgramForm({ ...programForm, name: value })} error={errors.name} placeholder="Reguler, Tahfidz, Unggulan" required />
                                <div className="grid grid-cols-3 gap-3">
                                    <TextInput type="number" label="Urutan" value={programForm.priority} onChange={(value) => setProgramForm({ ...programForm, priority: value })} error={errors.priority} required />
                                    <TextInput type="number" label="Ideal" value={programForm.quota_ideal} onChange={(value) => setProgramForm({ ...programForm, quota_ideal: value })} error={errors.quota_ideal} required />
                                    <TextInput type="number" label="Maks" value={programForm.quota_max} onChange={(value) => setProgramForm({ ...programForm, quota_max: value })} error={errors.quota_max} required />
                                </div>
                                <TextareaInput label="Deskripsi" value={programForm.description} onChange={(value) => setProgramForm({ ...programForm, description: value })} error={errors.description} />
                                <ToggleInput label="Open Quota" description="Hanya dibatasi total kuota gelombang." checked={programForm.is_open_quota} onChange={(value) => setProgramForm({ ...programForm, is_open_quota: value })} />
                                <ToggleInput label="Aktif" description="Program tampil untuk kandidat saat memilih jalur." checked={programForm.is_active} onChange={(value) => setProgramForm({ ...programForm, is_active: value })} />
                                <SubmitButton processing={processing} label={editingProgramId ? "Simpan Program" : "Tambah Program"} />
                            </div>
                        </form>

                        <section className="system-settings-entry opacity-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900">
                            <SectionTitle title="Daftar Program/Jalur" subtitle={`${programs.length} program terdata`} />
                            <div className="mt-4 grid gap-3">
                                {programs.map((program) => (
                                    <article key={program.id} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{program.name}</h3>
                                                    <Pill active={program.is_active}>{program.is_active ? "Aktif" : "Nonaktif"}</Pill>
                                                    <Pill active={program.quota_zone !== "red"}>{zoneLabel[program.quota_zone] ?? program.quota_zone}</Pill>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {program.wave_title ?? "Tanpa gelombang"} - {program.wave_academic_year ?? "-"} | Terisi {program.filled_count} | Ideal {program.quota_ideal} | Maks {program.quota_max}
                                                </p>
                                                {program.description && <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{program.description}</p>}
                                            </div>
                                            <ActionGroup
                                                onEdit={() => {
                                                    setEditingProgramId(program.id);
                                                    setProgramForm({
                                                        admission_wave_id: String(program.admission_wave_id),
                                                        name: program.name,
                                                        priority: String(program.priority),
                                                        quota_ideal: String(program.quota_ideal),
                                                        quota_max: String(program.quota_max),
                                                        is_open_quota: program.is_open_quota,
                                                        description: program.description ?? "",
                                                        is_active: program.is_active,
                                                    });
                                                }}
                                                onToggle={() => router.post(`/dashboard/admin/settings/programs/${program.id}/toggle`, {}, { preserveScroll: true })}
                                                onDelete={() => confirmDelete("program/jalur", `/dashboard/admin/settings/programs/${program.id}`)}
                                            />
                                        </div>
                                    </article>
                                ))}
                                {programs.length === 0 && <EmptyText text="Belum ada program/jalur. Tambahkan dari form di kiri." />}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === "extracurriculars" && (
                    <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
                        <form onSubmit={submitExtra} className="system-settings-entry opacity-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900">
                            <FormHeader title={editingExtraId ? "Edit Ekstrakurikuler" : "Tambah Ekstrakurikuler"} onReset={editingExtraId ? resetExtra : undefined} />
                            <div className="mt-4 grid gap-4">
                                <TextInput label="Nama Ekstrakurikuler" value={extraForm.name} onChange={(value) => setExtraForm({ ...extraForm, name: value })} error={errors.name} placeholder="Robotik, Pramuka, Futsal" required />
                                <ToggleInput label="Aktif" description="Hanya ekstrakurikuler aktif yang muncul di form kandidat." checked={extraForm.is_active} onChange={(value) => setExtraForm({ ...extraForm, is_active: value })} />
                                <SubmitButton processing={processing} label={editingExtraId ? "Simpan Ekstrakurikuler" : "Tambah Ekstrakurikuler"} />
                            </div>
                        </form>

                        <section className="system-settings-entry opacity-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900">
                            <SectionTitle title="Daftar Ekstrakurikuler" subtitle={`${extracurriculars.length} pilihan terdata`} />
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {extracurriculars.map((extra) => (
                                    <article key={extra.id} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{extra.name}</h3>
                                                    <Pill active={extra.is_active}>{extra.is_active ? "Aktif" : "Nonaktif"}</Pill>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Update terakhir: {extra.updated_at ?? "-"}</p>
                                            </div>
                                            <ActionGroup
                                                compact
                                                onEdit={() => {
                                                    setEditingExtraId(extra.id);
                                                    setExtraForm({ name: extra.name, is_active: extra.is_active });
                                                }}
                                                onToggle={() => router.post(`/dashboard/admin/settings/extracurriculars/${extra.id}/toggle`, {}, { preserveScroll: true })}
                                                onDelete={() => confirmDelete("ekstrakurikuler", `/dashboard/admin/settings/extracurriculars/${extra.id}`)}
                                            />
                                        </div>
                                    </article>
                                ))}
                                {extracurriculars.length === 0 && <EmptyText text="Belum ada ekstrakurikuler. Tambahkan dari form di kiri." />}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === "payments" && (
                    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
                        <form onSubmit={submitPayment} className="system-settings-entry opacity-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900">
                            <FormHeader title={editingPaymentId ? "Edit Payment Config" : "Tambah Payment Config"} onReset={editingPaymentId ? resetPayment : undefined} />
                            <div className="mt-4 grid gap-4">
                                <SelectInput label="Scope Gelombang" value={paymentForm.admission_wave_id} onChange={(value) => setPaymentForm({ ...paymentForm, admission_wave_id: value })} error={errors.admission_wave_id}>
                                    <option value="">Global Default</option>
                                    {waves.map((wave) => (
                                        <option key={wave.id} value={wave.id}>{wave.title} - {wave.academic_year}</option>
                                    ))}
                                </SelectInput>
                                <div className="grid grid-cols-2 gap-3">
                                    <SelectInput label="Tipe Fee" value={paymentForm.gateway_fee_type} onChange={(value) => setPaymentForm({ ...paymentForm, gateway_fee_type: value as "percentage" | "flat" })} error={errors.gateway_fee_type} required>
                                        <option value="percentage">Persentase</option>
                                        <option value="flat">Nominal Tetap</option>
                                    </SelectInput>
                                    <TextInput type="number" label="Nilai Fee" value={paymentForm.gateway_fee_value} onChange={(value) => setPaymentForm({ ...paymentForm, gateway_fee_value: value })} error={errors.gateway_fee_value} required />
                                </div>
                                <TextInput label="Label Fee" value={paymentForm.gateway_fee_label} onChange={(value) => setPaymentForm({ ...paymentForm, gateway_fee_label: value })} error={errors.gateway_fee_label} required />
                                <div className="grid grid-cols-2 gap-3">
                                    <TextInput label="Bank" value={paymentForm.bank_name} onChange={(value) => setPaymentForm({ ...paymentForm, bank_name: value })} error={errors.bank_name} />
                                    <SelectInput label="Logo Bank" value={paymentForm.bank_logo_key} onChange={(value) => setPaymentForm({ ...paymentForm, bank_logo_key: value })} error={errors.bank_logo_key}>
                                        <option value="">Pilih logo</option>
                                        {Object.entries(bank_logos).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </SelectInput>
                                </div>
                                <TextInput label="No. Rekening" value={paymentForm.bank_account_number} onChange={(value) => setPaymentForm({ ...paymentForm, bank_account_number: value })} error={errors.bank_account_number} />
                                <TextInput label="Nama Rekening" value={paymentForm.bank_account_name} onChange={(value) => setPaymentForm({ ...paymentForm, bank_account_name: value })} error={errors.bank_account_name} />
                                <TextInput label="WhatsApp Tim PSB" value={paymentForm.whatsapp_contact} onChange={(value) => setPaymentForm({ ...paymentForm, whatsapp_contact: value.replace(/\D/g, "") })} error={errors.whatsapp_contact} placeholder="6281234567890" />
                                <TextInput label="Label WhatsApp" value={paymentForm.whatsapp_contact_label} onChange={(value) => setPaymentForm({ ...paymentForm, whatsapp_contact_label: value })} error={errors.whatsapp_contact_label} placeholder="Admin PSB" />
                                <ToggleInput label="Aktif" description="Hanya satu config aktif per scope." checked={paymentForm.is_active} onChange={(value) => setPaymentForm({ ...paymentForm, is_active: value })} />
                                <SubmitButton processing={processing} label={editingPaymentId ? "Simpan Config" : "Tambah Config"} />
                            </div>
                        </form>

                        <section className="system-settings-entry opacity-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900">
                            <SectionTitle title="Konfigurasi Pembayaran" subtitle={`${payment_configs.length} konfigurasi terdata`} />
                            <div className="mt-4 grid gap-3">
                                {payment_configs.map((config) => (
                                    <article key={config.id} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{config.scope_label}</h3>
                                                    <Pill active={config.is_active}>{config.is_active ? "Aktif" : "Nonaktif"}</Pill>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {config.gateway_fee_label}: {config.gateway_fee_type === "percentage" ? `${config.gateway_fee_value}%` : currency(config.gateway_fee_value)}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    Rekening: {config.bank_name ?? "-"} {config.bank_account_number ?? ""} {config.bank_account_name ? `a.n. ${config.bank_account_name}` : ""}
                                                </p>
                                            </div>
                                            <ActionGroup
                                                onEdit={() => {
                                                    setEditingPaymentId(config.id);
                                                    setPaymentForm({
                                                        admission_wave_id: config.admission_wave_id ? String(config.admission_wave_id) : "",
                                                        gateway_fee_type: config.gateway_fee_type,
                                                        gateway_fee_value: String(config.gateway_fee_value),
                                                        gateway_fee_label: config.gateway_fee_label,
                                                        bank_name: config.bank_name ?? "",
                                                        bank_account_number: config.bank_account_number ?? "",
                                                        bank_account_name: config.bank_account_name ?? "",
                                                        bank_logo_key: config.bank_logo_key ?? "",
                                                        whatsapp_contact: config.whatsapp_contact ?? "",
                                                        whatsapp_contact_label: config.whatsapp_contact_label ?? "",
                                                        is_active: config.is_active,
                                                    });
                                                }}
                                                onToggle={undefined}
                                                onDelete={() => confirmDelete("payment config", `/dashboard/admin/settings/payment-configs/${config.id}`)}
                                            />
                                        </div>
                                    </article>
                                ))}
                                {payment_configs.length === 0 && <EmptyText text="Belum ada konfigurasi pembayaran. Tambahkan config global terlebih dahulu." />}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function currency(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
                active
                    ? "bg-gold text-navy shadow-sm shadow-gold/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-white"
            }`}
        >
            <i className={`${icon} text-xs`} />
            <span className="whitespace-nowrap">{label}</span>
        </button>
    );
}

function FormHeader({ title, onReset }: { title: string; onReset?: () => void }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">{title}</h2>
            {onReset && (
                <button type="button" onClick={onReset} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-500 transition hover:border-gold hover:text-amber-700 dark:border-white/10 dark:text-slate-300 dark:hover:text-gold">
                    <i className="fa-solid fa-xmark" />
                    Batal
                </button>
            )}
        </div>
    );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div>
            <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
    );
}

function TextInput({
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
    type?: "text" | "number";
}) {
    return (
        <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}{required ? " *" : ""}</span>
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

function SelectInput({
    label,
    value,
    onChange,
    children,
    error,
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: React.ReactNode;
    error?: string;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}{required ? " *" : ""}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={`mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-gold dark:bg-slate-950 dark:text-slate-100 ${
                    error ? "border-red-400" : "border-slate-200 dark:border-white/10"
                }`}
            >
                {children}
            </select>
            {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
        </label>
    );
}

function TextareaInput({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    return (
        <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={3}
                className={`mt-2 w-full resize-none rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gold dark:bg-slate-950 dark:text-slate-100 ${
                    error ? "border-red-400" : "border-slate-200 dark:border-white/10"
                }`}
            />
            {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
        </label>
    );
}

function ToggleInput({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
    return (
        <button type="button" onClick={() => onChange(!checked)} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 text-left dark:border-white/10">
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

function SubmitButton({ processing, label }: { processing: boolean; label: string }) {
    return (
        <button type="submit" disabled={processing} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-navy shadow-sm shadow-gold/20 transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60">
            {processing ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-floppy-disk" />}
            {label}
        </button>
    );
}

function Pill({ active, children }: { active: boolean; children: React.ReactNode }) {
    return (
        <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${active ? "bg-gold/15 text-amber-700 dark:text-gold" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"}`}>
            {children}
        </span>
    );
}

function ActionGroup({ onEdit, onToggle, onDelete, compact = false }: { onEdit: () => void; onToggle?: () => void; onDelete: () => void; compact?: boolean }) {
    return (
        <div className={`flex shrink-0 flex-wrap gap-2 ${compact ? "justify-end" : ""}`}>
            <IconButton icon="fa-solid fa-pen" label="Edit" onClick={onEdit} />
            {onToggle && <IconButton icon="fa-solid fa-power-off" label="Toggle" onClick={onToggle} />}
            <IconButton icon="fa-solid fa-trash" label="Hapus" danger onClick={onDelete} />
        </div>
    );
}

function IconButton({ icon, label, danger = false, onClick }: { icon: string; label: string; danger?: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold transition ${
                danger
                    ? "border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
                    : "border-slate-200 text-slate-600 hover:border-gold hover:text-amber-700 dark:border-white/10 dark:text-slate-300 dark:hover:text-gold"
            }`}
        >
            <i className={icon} />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

function EmptyText({ text }: { text: string }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400 dark:border-white/10">
            {text}
        </div>
    );
}
