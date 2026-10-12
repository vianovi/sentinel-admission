import { memo, useMemo } from "react";
import { Link, router } from "@inertiajs/react";
import { EmptyState, StatusPill, dangerButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { confirmAction } from "@/utils/swal";
import { useSessionState } from "@/hooks/useSessionState";
import type { SessionRow, WaveOption } from "./SessionFormCard";

type Props = {
    sessions: SessionRow[];
    waves?: WaveOption[];
    onEdit?: (session: SessionRow) => void;
    onCreateNew?: () => void;
};

type SortOption = "newest" | "oldest" | "title_asc" | "candidates_desc" | "attempts_desc" | "closes_soon";

export const SessionListCard = memo(function SessionListCard({ sessions, waves = [], onEdit, onCreateNew }: Props) {
    const [searchQuery, setSearchQuery] = useSessionState("admin:exams:sessions:search", "");
    const [statusFilter, setStatusFilter] = useSessionState<string>("admin:exams:sessions:status", "all");
    const [waveFilter, setWaveFilter] = useSessionState<string>("admin:exams:sessions:wave", "all");
    const [sortBy, setSortBy] = useSessionState<SortOption>("admin:exams:sessions:sort", "newest");

    const destroy = async (session: SessionRow) => {
        const confirmed = await confirmAction(
            "Hapus Sesi Ujian?",
            `Apakah Anda yakin ingin menghapus sesi "${session.title}"?`,
            "Ya, Hapus Sesi"
        );
        if (!confirmed) return;
        router.delete(`/dashboard/admin/exams/sessions/${session.id}`, { preserveScroll: true });
    };

    const filteredSessions = useMemo(() => {
        let result = [...sessions];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(
                (session) =>
                    session.title.toLowerCase().includes(query) ||
                    (session.package_title && session.package_title.toLowerCase().includes(query)) ||
                    (session.admission_wave && session.admission_wave.toLowerCase().includes(query)) ||
                    (session.description && session.description.toLowerCase().includes(query))
            );
        }

        if (statusFilter !== "all") {
            result = result.filter((session) => session.status === statusFilter);
        }

        if (waveFilter !== "all") {
            const waveId = Number(waveFilter);
            result = result.filter((session) => session.admission_wave_id === waveId);
        }

        result.sort((a, b) => {
            switch (sortBy) {
                case "oldest":
                    return a.id - b.id;
                case "title_asc":
                    return a.title.localeCompare(b.title, "id");
                case "candidates_desc":
                    return b.candidates_count - a.candidates_count;
                case "attempts_desc":
                    return b.attempts_count - a.attempts_count;
                case "closes_soon": {
                    const timeA = a.closes_at ? new Date(a.closes_at).getTime() : Infinity;
                    const timeB = b.closes_at ? new Date(b.closes_at).getTime() : Infinity;
                    return timeA - timeB;
                }
                case "newest":
                default:
                    return b.id - a.id;
            }
        });

        return result;
    }, [sessions, searchQuery, statusFilter, waveFilter, sortBy]);

    const activeFilterCount = (searchQuery.trim() ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (waveFilter !== "all" ? 1 : 0);

    const resetFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setWaveFilter("all");
        setSortBy("newest");
    };

    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/90 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <i className="fa-solid fa-calendar-check text-amber-500" />
                        Daftar Sesi Ujian Internal
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Atur penugasan peserta, pantau pengerjaan real-time, dan buka halaman hasil evaluasi.
                    </p>
                </div>
                {onCreateNew && (
                    <button
                        type="button"
                        onClick={onCreateNew}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/10 shrink-0"
                    >
                        <i className="fa-solid fa-plus text-xs" /> Buat Sesi Baru
                    </button>
                )}
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative sm:col-span-2 lg:col-span-1">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari sesi, paket, gelombang..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:focus:bg-slate-900"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <i className="fa-solid fa-xmark text-xs" />
                        </button>
                    )}
                </div>

                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-medium text-slate-700 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300 dark:focus:bg-slate-900"
                    >
                        <option value="all">Semua Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="closed">Closed</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>

                <div>
                    <select
                        value={waveFilter}
                        onChange={(e) => setWaveFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-medium text-slate-700 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300 dark:focus:bg-slate-900"
                    >
                        <option value="all">Semua Gelombang</option>
                        {waves.map((wave) => (
                            <option key={wave.id} value={wave.id}>{wave.title}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-medium text-slate-700 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300 dark:focus:bg-slate-900"
                    >
                        <option value="newest">Terbaru Ditambahkan</option>
                        <option value="oldest">Terlama</option>
                        <option value="title_asc">Judul Sesi (A-Z)</option>
                        <option value="candidates_desc">Peserta Terbanyak</option>
                        <option value="attempts_desc">Pengerjaan Terbanyak</option>
                        <option value="closes_soon">Tutup Lebih Awal</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-0.5">
                <span>
                    Menampilkan <strong>{filteredSessions.length}</strong> dari <strong>{sessions.length}</strong> sesi
                </span>
                {activeFilterCount > 0 && (
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="text-amber-500 hover:text-amber-600 font-semibold inline-flex items-center gap-1.5"
                    >
                        <i className="fa-solid fa-rotate-left text-[10px]" /> Reset Filter ({activeFilterCount})
                    </button>
                )}
            </div>

            {filteredSessions.length === 0 ? (
                <EmptyState
                    icon="fa-solid fa-calendar-xmark"
                    title={activeFilterCount > 0 ? "Tidak ada sesi yang cocok" : "Belum ada sesi ujian"}
                    description={
                        activeFilterCount > 0
                            ? "Coba sesuaikan kata kunci pencarian atau filter status dan gelombang Anda."
                            : "Buat sesi baru untuk mulai menjadwalkan ujian bagi peserta seleksi."
                    }
                />
            ) : (
                <div className="grid gap-3">
                    {filteredSessions.map((session) => (
                        <div
                            key={session.id}
                            className="group rounded-xl border border-slate-200/90 bg-white p-4 transition-all hover:border-amber-500/50 hover:shadow-md dark:border-white/10 dark:bg-slate-950/60"
                        >
                            <div className="flex flex-col gap-3.5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-2 min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                                            {session.title}
                                        </h3>
                                        <StatusPill value={session.status} />
                                        <StatusPill value={session.is_public ? "akses umum aktif" : "akses khusus kandidat"} />
                                        {session.admission_wave && (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                                <i className="fa-solid fa-graduation-cap text-[10px]" />
                                                {session.admission_wave}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                            <i className="fa-solid fa-box-archive text-amber-500/80" />
                                            {session.package_title ?? "Tanpa paket"}
                                            {Boolean(session.packages_count && session.packages_count > 1) && (
                                                <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[10px] font-bold text-amber-500">
                                                    +{(session.packages_count ?? 1) - 1} paket
                                                </span>
                                            )}
                                        </span>
                                        <span>·</span>
                                        <span><i className="fa-solid fa-clock mr-1 text-slate-400" />{session.duration_minutes} min</span>
                                        <span>·</span>
                                        <span><i className="fa-solid fa-bullseye mr-1 text-slate-400" />Passing: {session.passing_score}%</span>
                                    </div>

                                    {session.description && (
                                        <p className="text-xs leading-relaxed text-slate-600 line-clamp-2 dark:text-slate-300">
                                            {session.description}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="inline-flex items-center gap-1.5">
                                            <i className="fa-solid fa-calendar-day text-emerald-500" />
                                            <strong className="font-semibold text-slate-700 dark:text-slate-300">Buka:</strong>
                                            {session.opens_at ?? "-"}
                                        </span>
                                        <span>·</span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <i className="fa-solid fa-calendar-xmark text-rose-500" />
                                            <strong className="font-semibold text-slate-700 dark:text-slate-300">Tutup:</strong>
                                            {session.closes_at ?? "-"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-white/5">
                                    <Link
                                        href={`/dashboard/admin/exams/sessions/${session.id}`}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-amber-500/50 hover:text-amber-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all shadow-sm"
                                    >
                                        <i className="fa-solid fa-users text-xs text-amber-500" />
                                        Kandidat ({session.candidates_count})
                                    </Link>

                                    <Link
                                        href={`/dashboard/admin/exams/results?session=${session.id}`}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-amber-500/50 hover:text-amber-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all shadow-sm"
                                    >
                                        <i className="fa-solid fa-chart-simple text-xs text-emerald-500" />
                                        Hasil ({session.attempts_count})
                                    </Link>

                                    {onEdit ? (
                                        <button
                                            type="button"
                                            onClick={() => onEdit(session)}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-amber-500/50 hover:text-amber-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all shadow-sm"
                                        >
                                            <i className="fa-solid fa-pen text-xs text-sky-500" /> Edit
                                        </button>
                                    ) : (
                                        <Link
                                            href={`/dashboard/admin/exams/sessions/${session.id}/edit`}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-amber-500/50 hover:text-amber-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all shadow-sm"
                                        >
                                            <i className="fa-solid fa-pen text-xs text-sky-500" /> Edit
                                        </Link>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => destroy(session)}
                                        className={dangerButtonClass}
                                        title="Hapus sesi"
                                    >
                                        <i className="fa-solid fa-trash text-xs" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
});

export default SessionListCard;
