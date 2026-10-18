import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    PageHeader,
    StatCard,
    EmptyState,
    cardClass,
    inputClass,
} from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import SystemWorkspaceTabs from "@/Components/Dashboard/Admin/System/SystemWorkspaceTabs";
import { confirmAction, showSuccessToast, showErrorToast } from "@/utils/swal";

export type TrashedCandidate = {
    id: number;
    type: string;
    name: string;
    identifier: string;
    days_remaining: number;
    deleted_by_name: string | null;
    created_at: string;
    purge_at: string;
    metadata: {
        id?: number;
        registration_code?: string;
        nisn?: string;
        nik?: string;
        full_name?: string;
        email?: string;
        whatsapp_number?: string;
        current_step?: number;
    } | null;
};

type Props = {
    items: {
        data: TrashedCandidate[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
    };
    filters: { search: string };
    stats: { total_drafts: number; expiring_soon: number };
};

export default function TrashCandidates({ items, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [selectedDraft, setSelectedDraft] = useState<TrashedCandidate | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route("admin.system.trash.candidates"), { search }, { preserveState: true, replace: true });
    };

    const handleRestore = async (item: TrashedCandidate) => {
        const confirmed = await confirmAction("Pulihkan Draft?", `Draft "${item.name}" akan dikembalikan.`);
        if (confirmed) {
            router.post(route("admin.system.trash.restore", item.id), {}, {
                preserveScroll: true,
                onSuccess: () => showSuccessToast("Draft berhasil dipulihkan."),
            });
        }
    };

    const handlePurge = async (item: TrashedCandidate) => {
        const confirmed = await confirmAction("Hapus Permanen?", `Draft "${item.name}" akan dihapus permanen.`, "Hapus");
        if (confirmed) {
            router.delete(route("admin.system.trash.purge", item.id), {
                preserveScroll: true,
                onSuccess: () => showSuccessToast("Draft dihapus permanen."),
            });
        }
    };

    const handleEmptyAll = async () => {
        const confirmed = await confirmAction("Kosongkan Sampah Draft?", "Seluruh draft di sampah akan dimusnahkan permanen.", "Kosongkan");
        if (confirmed) {
            router.delete(route("admin.system.trash.empty", { type: "candidate_draft" }), {
                preserveScroll: true,
                onSuccess: () => showSuccessToast("Tempat sampah draft dikosongkan."),
            });
        }
    };

    return (
        <DashboardLayout>
            <Head title="Sampah Draft Pendaftaran" />
            <div className="space-y-6">
                <PageHeader
                    title="Tempat Sampah Draft Pendaftaran"
                    badge="RETENSI OTOMATIS 30 HARI"
                    description="Kelola formulir draft pendaftaran yang dibatalkan atau dihapus. Otomatis dimusnahkan permanen setelah 30 hari."
                    icon="fa-solid fa-user-xmark"
                    actions={
                        items.data.length > 0 ? (
                            <button
                                type="button"
                                onClick={handleEmptyAll}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 px-4 py-2 text-xs font-extrabold hover:bg-red-500/30 transition shadow-lg shadow-red-500/10"
                            >
                                <i className="fa-solid fa-broom" /> Kosongkan Sampah
                            </button>
                        ) : null
                    }
                />
                <SystemWorkspaceTabs active="trash-candidates" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard label="Total Draft di Sampah" value={stats.total_drafts} icon="fa-solid fa-user-xmark" tone="text-indigo-400" />
                    <StatCard label="Kadaluarsa < 7 Hari" value={stats.expiring_soon} icon="fa-solid fa-triangle-exclamation" tone="text-red-400" />
                </div>
                <div className={`${cardClass} p-4`}>
                    <form onSubmit={handleSearch} className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama calon siswa, NISN, atau NIK di sampah..."
                                className={`${inputClass} pl-9`}
                            />
                        </div>
                        <button type="submit" className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition">
                            Cari
                        </button>
                    </form>
                </div>
                <div className={`${cardClass} overflow-hidden p-0`}>
                    {items.data.length === 0 ? (
                        <div className="p-8">
                            <EmptyState icon="fa-solid fa-user-check" title="Tempat Sampah Draft Bersih" description="Tidak ada draft pendaftaran yang sedang berada di tempat sampah." />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
                                        <th className="py-3 px-4 font-bold uppercase">Nama Calon</th>
                                        <th className="py-3 px-4 font-bold uppercase">NISN / NIK</th>
                                        <th className="py-3 px-4 font-bold uppercase">Kontak</th>
                                        <th className="py-3 px-4 font-bold uppercase">Step</th>
                                        <th className="py-3 px-4 font-bold uppercase">Sisa Retensi</th>
                                        <th className="py-3 px-4 font-bold uppercase text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {items.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                            <td className="py-3 px-4">
                                                <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                                                <span className="text-[10px] text-slate-400 font-mono">Kode: {item.metadata?.registration_code || "-"}</span>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                                                <p>NISN: {item.metadata?.nisn || "-"}</p>
                                                <p className="text-[10px] text-slate-400">NIK: {item.metadata?.nik || "-"}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p>{item.metadata?.whatsapp_number || "-"}</p>
                                                <p className="text-[10px] text-slate-400">{item.metadata?.email || "-"}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="rounded bg-slate-100 dark:bg-white/5 px-2 py-0.5 font-bold">
                                                    Step {item.metadata?.current_step || 1}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex rounded px-2 py-0.5 font-bold ${item.days_remaining <= 3 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                                                    {item.days_remaining} hari
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-1">
                                                <button type="button" onClick={() => setSelectedDraft(item)} className="rounded border border-slate-200 dark:border-white/10 px-2 py-1 font-bold">
                                                    Detail
                                                </button>
                                                <button type="button" onClick={() => handleRestore(item)} className="rounded bg-emerald-500/10 text-emerald-500 px-2 py-1 font-bold">
                                                    Pulihkan
                                                </button>
                                                <button type="button" onClick={() => handlePurge(item)} className="rounded bg-red-500/10 text-red-500 px-2 py-1 font-bold">
                                                    Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {items.links && items.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 px-4 py-3 text-xs">
                            <span className="text-slate-400">Total {items.total} draft</span>
                            <div className="flex items-center gap-1">
                                {items.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || "#"}
                                        className={`rounded px-2.5 py-1 font-bold ${link.active ? "bg-amber-500 text-slate-950" : link.url ? "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5" : "text-slate-400 opacity-50 cursor-not-allowed"}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {selectedDraft && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedDraft(null)}>
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#171f33] border border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Detail Snapshot Draft</h3>
                                <button type="button" onClick={() => setSelectedDraft(null)} className="text-slate-400 hover:text-white">
                                    <i className="fa-solid fa-xmark text-sm" />
                                </button>
                            </div>
                            <pre className="mt-4 max-h-60 overflow-y-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-amber-400 border border-amber-500/20">
                                {JSON.stringify(selectedDraft.metadata, null, 2)}
                            </pre>
                            <div className="mt-4 text-right">
                                <button type="button" onClick={() => setSelectedDraft(null)} className="rounded-lg bg-slate-100 dark:bg-white/10 px-4 py-2 text-xs font-bold">Tutup</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
