import { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";

type ExportGroup = {
    key: string;
    label: string;
    scope_label: string;
    description: string;
    sensitivity: string;
    status: "placeholder";
    columns_preview: string[];
};

type ExportState = {
    download_enabled: boolean;
    generator_status: "placeholder";
    download_url: string | null;
    default_group: string;
};

type Props = {
    export_groups: ExportGroup[];
    export_state: ExportState;
    generated_at: string;
};

const groupTone: Record<string, string> = {
    payment_only: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    quick_rekap: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    full_data: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

const groupIcon: Record<string, string> = {
    payment_only: "fa-solid fa-receipt",
    quick_rekap: "fa-solid fa-chart-simple",
    full_data: "fa-solid fa-database",
};

function statusText(enabled: boolean) {
    return enabled ? "Siap diunduh" : "Placeholder - generator belum aktif";
}

function SettingsField({ label, value, note }: { label: string; value: string; note: string }) {
    return (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">{value}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{note}</p>
        </div>
    );
}

export default function ReportsExportSettings({ export_groups, export_state, generated_at }: Props) {
    const [selectedKey, setSelectedKey] = useState(export_state.default_group);
    const selectedGroup = useMemo(
        () => export_groups.find((group) => group.key === selectedKey) ?? export_groups[0] ?? null,
        [export_groups, selectedKey],
    );

    return (
        <DashboardLayout>
            <Head title="Pengaturan Export Laporan - Staff" />

            <div className="flex flex-col gap-6 pb-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                            <i className="fa-solid fa-sliders text-sm" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-display text-xl font-bold leading-tight text-slate-800 dark:text-white">
                                Pengaturan Export
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Placeholder format laporan staff · {generated_at}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/staff/reports"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:text-blue-300"
                    >
                        <i className="fa-solid fa-arrow-left text-xs" />
                        Kembali ke Rekap
                    </Link>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="space-y-5">
                        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <div className="border-b border-slate-100 px-5 py-4 dark:border-white/10">
                                <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                                    Kelompok File
                                </h2>
                                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    Pilihan di halaman ini hanya preview struktur. Belum ada save preference dan belum ada file yang dibuat.
                                </p>
                            </div>
                            <div className="grid gap-3 p-5 lg:grid-cols-3">
                                {export_groups.map((group) => {
                                    const selected = group.key === selectedGroup?.key;

                                    return (
                                        <button
                                            key={group.key}
                                            type="button"
                                            onClick={() => setSelectedKey(group.key)}
                                            className={[
                                                "min-h-[170px] rounded-lg border p-4 text-left transition",
                                                selected
                                                    ? "border-slate-900 bg-slate-50 shadow-sm dark:border-white dark:bg-white/[0.06]"
                                                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 dark:border-white/10 dark:bg-slate-900 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${groupTone[group.key] ?? groupTone.quick_rekap}`}>
                                                    <i className={`${groupIcon[group.key] ?? "fa-solid fa-file-lines"} text-sm`} />
                                                </div>
                                                <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase text-amber-700 dark:text-amber-300">
                                                    Placeholder
                                                </span>
                                            </div>
                                            <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">{group.label}</h3>
                                            <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{group.scope_label}</p>
                                            <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                {group.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {selectedGroup ? (
                            <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                                <div className="border-b border-slate-100 px-5 py-4 dark:border-white/10">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                                                Preview Format: {selectedGroup.label}
                                            </h2>
                                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                Kolom masih rancangan awal dan belum menjadi kontrak export final.
                                            </p>
                                        </div>
                                        <span className={`inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-black ${groupTone[selectedGroup.key] ?? groupTone.quick_rekap}`}>
                                            {selectedGroup.sensitivity}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {selectedGroup.columns_preview.map((column) => (
                                            <div
                                                key={column}
                                                className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300"
                                            >
                                                <i className="fa-solid fa-check text-[10px] text-emerald-500" />
                                                <span className="min-w-0 truncate">{column}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">Status Generator</p>
                                        <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                                            {statusText(export_state.download_enabled)}
                                        </p>
                                        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                            Halaman ini hanya menyiapkan tempat konfigurasi. Download akan dibuat setelah format base disetujui.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        ) : null}

                        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <div className="border-b border-slate-100 px-5 py-4 dark:border-white/10">
                                <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                                    Pengaturan yang Disiapkan
                                </h2>
                                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    Kontrol ini sengaja belum interaktif karena format export belum final.
                                </p>
                            </div>
                            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
                                <SettingsField label="Periode" value="Semua data" note="Nanti dapat dibatasi periode pendaftaran atau payment." />
                                <SettingsField label="Gelombang" value="Semua gelombang" note="Nanti mengikuti filter laporan yang disepakati." />
                                <SettingsField label="Program" value="Semua program" note="Nanti dapat dipersempit per program/jalur." />
                                <SettingsField label="Format file" value="Belum dikunci" note="Generator belum dibuat pada milestone ini." />
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
                        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <div className="mb-4 flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">
                                    <i className="fa-solid fa-download text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-900 dark:text-white">Unduh Data</h2>
                                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                        Tombol utama disiapkan dengan ruang landscape, tetapi belum menjalankan download.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled
                                aria-disabled="true"
                                className="flex min-h-14 w-full cursor-not-allowed items-center justify-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-100 px-5 text-sm font-black text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                            >
                                <i className="fa-solid fa-download text-xs" />
                                Unduh data
                            </button>
                            <div className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-semibold leading-5 text-amber-700 dark:text-amber-200">
                                Belum ada endpoint download, job export, atau generator file.
                            </div>
                        </section>

                        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white">Batasan Milestone Ini</h2>
                            <div className="mt-4 space-y-3 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                                <p className="rounded-md border border-slate-200 p-3 dark:border-white/10">
                                    Tidak membuat Excel export atau CSV export.
                                </p>
                                <p className="rounded-md border border-slate-200 p-3 dark:border-white/10">
                                    Tidak membuat route download aktif.
                                </p>
                                <p className="rounded-md border border-slate-200 p-3 dark:border-white/10">
                                    Full Data disiapkan sebagai format lengkap, termasuk sensitive data nanti.
                                </p>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </DashboardLayout>
    );
}
