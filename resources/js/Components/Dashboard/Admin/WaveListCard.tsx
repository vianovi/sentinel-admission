import { memo, useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import Swal from "sweetalert2";
import { useSessionState } from "@/hooks/useSessionState";
import type { Wave } from "./WaveFormModal";

type Props = {
    waves: Wave[];
    onEdit: (wave: Wave) => void;
    onCreateNew: () => void;
};

type SortOption = "newest" | "oldest" | "title_asc" | "quota_desc";
type StatusFilter = "all" | "active" | "inactive";

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

const rupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);

export const WaveListCard = memo(function WaveListCard({
    waves,
    onEdit,
    onCreateNew,
}: Props) {
    const [search, setSearch] = useSessionState("admin:waves:search", "");
    const [statusFilter, setStatusFilter] = useSessionState<StatusFilter>("admin:waves:status", "all");
    const [sortBy, setSortBy] = useSessionState<SortOption>("admin:waves:sort", "newest");
    const [processingId, setProcessingId] = useState<number | null>(null);

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

    const filteredWaves = useMemo(() => {
        let result = [...waves];
        if (search.trim()) {
            const q = search.toLowerCase().trim();
            result = result.filter((w) => w.title.toLowerCase().includes(q) || w.academic_year.toLowerCase().includes(q) || (w.description && w.description.toLowerCase().includes(q)));
        }
        if (statusFilter === "active") result = result.filter((w) => w.is_active);
        if (statusFilter === "inactive") result = result.filter((w) => !w.is_active);
        result.sort((a, b) => {
            if (sortBy === "oldest") return a.id - b.id;
            if (sortBy === "title_asc") return a.title.localeCompare(b.title, "id");
            if (sortBy === "quota_desc") return b.quota_target - a.quota_target;
            return b.id - a.id;
        });
        return result;
    }, [waves, search, statusFilter, sortBy]);

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-2.5">
                        <div className="relative min-w-[220px] flex-1 max-w-sm">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama gelombang, tahun ajaran..."
                                className="w-full h-9 pl-8 pr-7 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-gold"
                            />
                            {search && (
                                <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            )}
                        </div>

                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-gold">
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif Saja</option>
                            <option value="inactive">Nonaktif</option>
                        </select>

                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-gold">
                            <option value="newest">Terbaru</option>
                            <option value="oldest">Terlama</option>
                            <option value="title_asc">Nama (A-Z)</option>
                            <option value="quota_desc">Kuota Terbanyak</option>
                        </select>
                    </div>

                    {(search || statusFilter !== "all" || sortBy !== "newest") && (
                        <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); setSortBy("newest"); }} className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 font-semibold self-start lg:self-auto">
                            Reset Filter
                        </button>
                    )}
                </div>
            </div>

            {filteredWaves.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-12 text-center bg-white/50 dark:bg-slate-900/50">
                    <i className="fa-solid fa-layer-group text-3xl text-slate-300 dark:text-slate-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Tidak ada gelombang ditemukan</p>
                    <p className="mt-1 text-xs text-slate-400">{search || statusFilter !== "all" ? "Coba sesuaikan kata kunci pencarian atau filter Anda." : "Belum ada gelombang pendaftaran yang dibuat."}</p>
                    {(!search && statusFilter === "all") && (
                        <button type="button" onClick={onCreateNew} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-navy hover:bg-amber-400 transition">
                            <i className="fa-solid fa-plus text-xs" /> Buat Gelombang Sekarang
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {filteredWaves.map((wave) => (
                        <div key={wave.id} className={`rounded-2xl border p-5 shadow-soft transition hover:shadow-md flex flex-col justify-between ${wave.is_active ? "border-emerald-500/30 bg-emerald-500/[0.02] dark:border-emerald-500/20" : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"}`}>
                            <div>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{wave.title}</h3>
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${wave.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"}`}>
                                                {wave.is_active ? "Aktif" : "Nonaktif"}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">TA {wave.academic_year} &bull; {wave.start_date ?? "-"} s/d {wave.end_date ?? "-"}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button type="button" onClick={() => toggleWave(wave)} disabled={processingId === wave.id} title={wave.is_active ? "Tutup gelombang" : "Aktifkan gelombang"} className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs transition border ${wave.is_active ? "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-500/20 dark:text-amber-400" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/20 dark:text-emerald-400"}`}>
                                            <i className="fa-solid fa-power-off" />
                                        </button>
                                        <button type="button" onClick={() => onEdit(wave)} title="Edit Gelombang" className="h-8 w-8 rounded-xl flex items-center justify-center text-xs border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-gold hover:text-amber-700 dark:hover:text-gold transition">
                                            <i className="fa-solid fa-pen" />
                                        </button>
                                        <button type="button" onClick={() => deleteWave(wave)} disabled={processingId === wave.id || wave.candidates_count > 0} title={wave.candidates_count > 0 ? "Tidak bisa dihapus (sudah ada kandidat)" : "Hapus gelombang"} className="h-8 w-8 rounded-xl flex items-center justify-center text-xs border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                            <i className="fa-solid fa-trash" />
                                        </button>
                                    </div>
                                </div>
                                {wave.description && <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{wave.description}</p>}
                                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3 text-center border border-slate-100 dark:border-white/5">
                                    <div><p className="text-[10px] uppercase font-bold text-slate-400">Kandidat</p><p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-white">{wave.candidates_count}</p></div>
                                    <div><p className="text-[10px] uppercase font-bold text-slate-400">Target Kuota</p><p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-white">{wave.quota_target}</p></div>
                                    <div><p className="text-[10px] uppercase font-bold text-slate-400">Biaya</p><p className="mt-0.5 text-sm font-bold text-gold">{rupiah(wave.registration_fee)}</p></div>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
                                {wave.majors_enabled && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-purple-600 dark:text-purple-400 font-medium">
                                        <i className="fa-solid fa-graduation-cap text-[10px]" /> Pilihan Jurusan
                                    </span>
                                )}
                                {wave.reregistration_date && (
                                    <span className="inline-flex items-center gap-1">
                                        <i className="fa-solid fa-calendar-check text-[10px]" /> Daftar Ulang: {wave.reregistration_date}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});
export default WaveListCard;
