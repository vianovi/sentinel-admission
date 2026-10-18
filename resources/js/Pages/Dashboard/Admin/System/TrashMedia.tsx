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

export type TrashItem = {
    id: number;
    type: string;
    name: string;
    identifier: string;
    file_size: number | null;
    human_file_size: string | null;
    days_remaining: number;
    deleted_by_name: string | null;
    created_at: string;
    purge_at: string;
    metadata: {
        affected_questions_count?: number;
        affected_question_ids?: number[];
    } | null;
};

type Props = {
    items: {
        data: TrashItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
    };
    filters: { search: string };
    stats: { total_files: number; total_size: string; expiring_soon: number };
};

export default function TrashMedia({ items, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route("admin.system.trash.media"), { search }, { preserveState: true, replace: true });
    };

    const handleRestore = async (item: TrashItem) => {
        const confirmed = await confirmAction("Pulihkan Gambar?", `"${item.name}" akan dikembalikan ke Bank Media.`);
        if (confirmed) {
            router.post(route("admin.system.trash.restore", item.id), {}, {
                preserveScroll: true,
                onSuccess: () => showSuccessToast("Gambar dipulihkan."),
            });
        }
    };

    const handlePurge = async (item: TrashItem) => {
        const confirmed = await confirmAction("Hapus Permanen?", `Gambar "${item.name}" akan dimusnahkan selamanya.`, "Hapus");
        if (confirmed) {
            router.delete(route("admin.system.trash.purge", item.id), {
                preserveScroll: true,
                onSuccess: () => showSuccessToast("Gambar dihapus permanen."),
            });
        }
    };

    const handleEmptyAll = async () => {
        const confirmed = await confirmAction("Kosongkan Sampah?", "Seluruh gambar sampah akan dimusnahkan permanen.", "Kosongkan");
        if (confirmed) {
            router.delete(route("admin.system.trash.empty", { type: "exam_media" }), {
                preserveScroll: true,
                onSuccess: () => showSuccessToast("Tempat sampah media dikosongkan."),
            });
        }
    };

    return (
        <DashboardLayout>
            <Head title="Sampah Bank Media" />
            <div className="space-y-6">
                <PageHeader
                    title="Tempat Sampah Bank Media"
                    badge="RETENSI OTOMATIS 30 HARI"
                    description="File di tempat sampah otomatis dimusnahkan permanen setelah 30 hari."
                    icon="fa-solid fa-trash-can"
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
                <SystemWorkspaceTabs active="trash-media" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Total Gambar di Sampah" value={stats.total_files} icon="fa-solid fa-photo-film" tone="text-amber-400" />
                    <StatCard label="Kapasitas Digunakan" value={stats.total_size} icon="fa-solid fa-hard-drive" tone="text-blue-400" />
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
                                placeholder="Cari nama file di tempat sampah..."
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
                            <EmptyState icon="fa-solid fa-trash-can-arrow-up" title="Tempat Sampah Bersih" description="Tidak ada gambar ujian yang sedang berada di tempat sampah." />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
                                        <th className="py-3 px-4 font-bold uppercase">Gambar</th>
                                        <th className="py-3 px-4 font-bold uppercase">Nama File</th>
                                        <th className="py-3 px-4 font-bold uppercase">Ukuran</th>
                                        <th className="py-3 px-4 font-bold uppercase">Dihapus Oleh</th>
                                        <th className="py-3 px-4 font-bold uppercase">Sisa Retensi</th>
                                        <th className="py-3 px-4 font-bold uppercase text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {items.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                            <td className="py-3 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImage(route("admin.system.trash.preview", item.id))}
                                                    className="h-10 w-10 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-100 dark:bg-black/20 flex items-center justify-center hover:opacity-80"
                                                >
                                                    <img
                                                        src={route("admin.system.trash.preview", item.id)}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                                                    />
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{item.name}</td>
                                            <td className="py-3 px-4 font-mono text-slate-500">{item.human_file_size || "-"}</td>
                                            <td className="py-3 px-4 font-medium">{item.deleted_by_name || "Admin"}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex rounded px-2 py-0.5 font-bold ${item.days_remaining <= 3 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                                                    {item.days_remaining} hari
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-1">
                                                <button type="button" onClick={() => handleRestore(item)} className="rounded bg-emerald-500/10 text-emerald-500 px-2 py-1 font-bold">Pulihkan</button>
                                                <button type="button" onClick={() => handlePurge(item)} className="rounded bg-red-500/10 text-red-500 px-2 py-1 font-bold">Hapus</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {items.links && items.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 px-4 py-3 text-xs">
                            <span className="text-slate-400">Total {items.total} file</span>
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
                {previewImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewImage(null)}>
                        <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <button type="button" onClick={() => setPreviewImage(null)} className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90">
                                <i className="fa-solid fa-xmark text-sm" />
                            </button>
                            <img src={previewImage} alt="Preview" className="max-h-[75vh] w-auto mx-auto object-contain rounded-xl" />
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
