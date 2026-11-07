import { useState, useMemo, type FormEvent, type ReactNode } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    ExamWorkspace,
    FlashMessage,
    PageHeader,
    WorkflowRail,
    EmptyState,
    StatusPill,
    inputClass,
    labelClass,
    primaryButtonClass,
    secondaryButtonClass,
    dangerButtonClass,
} from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { confirmAction, showSuccessToast, showErrorToast } from "@/utils/swal";
import type { PageProps } from "@/types";

type PackageInfo = {
    id: number;
    title: string;
    code: string;
    subject_name: string;
};

type Session = {
    id: number;
    title: string;
    status: string;
    order_type: string;
    opens_at: string;
    closes_at: string;
    packages: PackageInfo[];
    active_token: string | null;
    participants_count: number;
};

type AvailablePackage = {
    id: number;
    title: string;
    subject_name: string;
    subject_id: number;
};

type Participant = {
    id: number;
    participant_code: string;
    name: string;
    school_origin: string;
    address: string | null;
    status: string;
    average_score: number | null;
};

type Props = {
    sessions: Session[];
    packages: AvailablePackage[];
    stats: {
        total: number;
        published: number;
        available_packages: number;
        total_participants: number;
    };
};

type StatusFilter = "all" | "draft" | "published" | "closed";
type SortOption = "newest" | "oldest" | "title_asc" | "closes_soon";

export default function PublicSessions({ sessions, packages, stats }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;

    // Filters & toolbar
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("newest");

    // Create session modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formTitle, setFormTitle] = useState("");
    const [formOpensAt, setFormOpensAt] = useState("");
    const [formClosesAt, setFormClosesAt] = useState("");
    const [formOrderType, setFormOrderType] = useState<"free" | "sequential">("free");
    const [formPackageIds, setFormPackageIds] = useState<number[]>([0, 0, 0, 0]);

    // Participant Manager modal state
    const [selectedSessionForParticipants, setSelectedSessionForParticipants] = useState<Session | null>(null);
    const [participantsList, setParticipantsList] = useState<Participant[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [regName, setRegName] = useState("");
    const [regSchool, setRegSchool] = useState("");
    const [regAddress, setRegAddress] = useState("");
    const [issuedCode, setIssuedCode] = useState<string | null>(null);

    const [busy, setBusy] = useState(false);

    // Group available packages by distinct subjects
    const packagesBySubject = useMemo(() => {
        const map = new Map<number, { subject_name: string; packages: AvailablePackage[] }>();
        for (const pkg of packages) {
            if (!map.has(pkg.subject_id)) {
                map.set(pkg.subject_id, { subject_name: pkg.subject_name, packages: [] });
            }
            map.get(pkg.subject_id)!.packages.push(pkg);
        }
        return Array.from(map.values());
    }, [packages]);

    const filteredSessions = useMemo(() => {
        return sessions
            .filter((sess) => {
                const q = search.trim().toLowerCase();
                const matchesSearch =
                    !q ||
                    sess.title.toLowerCase().includes(q) ||
                    sess.packages.some((p) => p.title.toLowerCase().includes(q) || p.subject_name.toLowerCase().includes(q));

                const matchesStatus =
                    statusFilter === "all" ||
                    sess.status.toLowerCase() === statusFilter;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === "oldest") return a.id - b.id;
                if (sortBy === "title_asc") return a.title.localeCompare(b.title);
                if (sortBy === "closes_soon") {
                    const timeA = new Date(a.closes_at).getTime();
                    const timeB = new Date(b.closes_at).getTime();
                    return timeA - timeB;
                }
                return b.id - a.id;
            });
    }, [sessions, search, statusFilter, sortBy]);

    const openCreateModal = () => {
        setFormTitle("");
        setFormOpensAt("");
        setFormClosesAt("");
        setFormOrderType("free");
        setFormPackageIds(packagesBySubject.slice(0, 4).map((g) => g.packages[0]?.id ?? 0));
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleCreateSession = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        try {
            await axios.post(route("admin.exams.public-v2.sessions.store"), {
                title: formTitle,
                opens_at: new Date(formOpensAt).toISOString(),
                closes_at: new Date(formClosesAt).toISOString(),
                order_type: formOrderType,
                package_ids: formPackageIds,
            });
            showSuccessToast("Sesi ujian publik berhasil dibuat dalam status draft.");
            closeCreateModal();
            router.reload();
        } catch (err) {
            showErrorToast(axios.isAxiosError(err) ? err.response?.data?.message ?? "Gagal membuat sesi." : "Terjadi kesalahan.");
        } finally {
            setBusy(false);
        }
    };

    const handlePublishSession = async (sess: Session) => {
        const confirmed = await confirmAction(
            "Terbitkan Sesi Ujian?",
            `Sesi "${sess.title}" akan diterbitkan dan siap menerima peserta.`,
            "Ya, Terbitkan"
        );
        if (!confirmed) return;

        setBusy(true);
        try {
            await axios.post(route("admin.exams.public-v2.sessions.publish", { session: sess.id }));
            showSuccessToast("Sesi berhasil diterbitkan.");
            router.reload();
        } catch (err) {
            showErrorToast(axios.isAxiosError(err) ? err.response?.data?.message ?? "Gagal menerbitkan sesi." : "Terjadi kesalahan.");
        } finally {
            setBusy(false);
        }
    };

    const handleGenerateToken = async (sess: Session) => {
        setBusy(true);
        try {
            const response = await axios.post<{ token: { token: string } }>(
                route("admin.exams.public-v2.sessions.tokens.store", { session: sess.id })
            );
            showSuccessToast(`Token ruang berhasil dibuat: ${response.data.token.token}`);
            router.reload();
        } catch (err) {
            showErrorToast(axios.isAxiosError(err) ? err.response?.data?.message ?? "Gagal membuat token." : "Terjadi kesalahan.");
        } finally {
            setBusy(false);
        }
    };

    const handleCloseSession = async (sess: Session) => {
        const confirmed = await confirmAction(
            "Tutup Sesi Ujian?",
            `Sesi "${sess.title}" akan ditutup dan peserta tidak dapat mengerjakan ujian lagi.`,
            "Ya, Tutup Sesi"
        );
        if (!confirmed) return;

        setBusy(true);
        try {
            await axios.post(route("admin.exams.public-v2.sessions.close", { session: sess.id }));
            showSuccessToast("Sesi berhasil ditutup.");
            router.reload();
        } catch (err) {
            showErrorToast(axios.isAxiosError(err) ? err.response?.data?.message ?? "Gagal menutup sesi." : "Terjadi kesalahan.");
        } finally {
            setBusy(false);
        }
    };

    const openParticipantManager = async (sess: Session) => {
        setSelectedSessionForParticipants(sess);
        setIssuedCode(null);
        setLoadingParticipants(true);
        try {
            const response = await axios.get<{ data: Participant[] }>(
                route("admin.exams.public-sessions.participants.index", { session: sess.id })
            );
            setParticipantsList(response.data.data);
        } catch {
            showErrorToast("Gagal memuat daftar peserta.");
        } finally {
            setLoadingParticipants(false);
        }
    };

    const closeParticipantManager = () => {
        setSelectedSessionForParticipants(null);
        setParticipantsList([]);
        setRegName("");
        setRegSchool("");
        setRegAddress("");
        setIssuedCode(null);
    };

    const handleRegisterParticipant = async (event: FormEvent) => {
        event.preventDefault();
        if (!selectedSessionForParticipants) return;
        setBusy(true);
        try {
            const response = await axios.post<{ participant: { participant_code: string } }>(
                route("admin.exams.public-sessions.participants.store", { session: selectedSessionForParticipants.id }),
                {
                    name: regName,
                    school_origin: regSchool,
                    address: regAddress,
                }
            );
            const code = response.data.participant.participant_code;
            setIssuedCode(code);
            showSuccessToast(`Peserta berhasil didaftarkan! Kode: ${code}`);
            setRegName("");
            setRegSchool("");
            setRegAddress("");

            // Reload roster
            const roster = await axios.get<{ data: Participant[] }>(
                route("admin.exams.public-sessions.participants.index", { session: selectedSessionForParticipants.id })
            );
            setParticipantsList(roster.data.data);
            router.reload();
        } catch (err) {
            showErrorToast(axios.isAxiosError(err) ? err.response?.data?.message ?? "Gagal mendaftarkan peserta." : "Terjadi kesalahan.");
        } finally {
            setBusy(false);
        }
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return "-";
        try {
            const date = new Date(isoString);
            return date.toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return isoString;
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showSuccessToast(`${label} berhasil disalin ke clipboard!`);
    };

    return (
        <>
            <Head title="Sesi Ujian Publik" />

            <ExamWorkspace active="sessions">
                <PageHeader
                    title="Pengaturan Sesi Ujian Publik"
                    badge="LANGKAH 3: JADWAL & AKSES PESERTA"
                    description="Jadwalkan sesi ujian publik 4 mata pelajaran, aktifkan token ruang ujian, dan daftarkan peserta ujian."
                    icon="fa-solid fa-calendar-check"
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            {packages.length < 4 ? (
                                <Link
                                    href="/dashboard/admin/public-exams/packages"
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-2.5 text-xs font-extrabold hover:bg-amber-500/30 transition-all shadow-lg shadow-amber-500/10"
                                >
                                    <i className="fa-solid fa-box-open" /> Terbitkan 4 Paket Dahulu
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={openCreateModal}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
                                >
                                    <i className="fa-solid fa-plus text-xs" /> Buat Sesi Baru
                                </button>
                            )}
                            <Link
                                href="/dashboard/admin/public-exams/results"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                Lihat Rekap Hasil <i className="fa-solid fa-arrow-right text-xs" />
                            </Link>
                        </div>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.session} />

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Sesi Publik</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Sesi Diterbitkan</span>
                        <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.published}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paket Siap Dipilih</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.available_packages}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Peserta Terdaftar</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.total_participants}</p>
                    </div>
                </div>

                <WorkflowRail
                    items={[
                        {
                            label: "Langkah 1",
                            title: "Buat Sesi",
                            description: "Pilih 4 paket soal dari mapel berbeda (IPAS, PAIBP, MTK, B.INDO).",
                            icon: "fa-solid fa-calendar-plus",
                            state: stats.total > 0 ? "done" : "active",
                        },
                        {
                            label: "Langkah 2",
                            title: "Atur Jadwal",
                            description: "Tentukan jendela waktu pengerjaan dan mode urutan paket.",
                            icon: "fa-solid fa-clock",
                            state: stats.total > 0 ? "done" : "idle",
                        },
                        {
                            label: "Langkah 3",
                            title: "Terbitkan Sesi",
                            description: `${stats.published} sesi aktif siap menyelenggarakan ujian.`,
                            icon: "fa-solid fa-circle-check",
                            state: stats.published > 0 ? "done" : stats.total > 0 ? "active" : "idle",
                        },
                        {
                            label: "Langkah 4",
                            title: "Buat Token",
                            description: "Token ruang dibagikan kepada peserta untuk akses sesi.",
                            icon: "fa-solid fa-key",
                            state: stats.published > 0 ? "done" : "idle",
                        },
                        {
                            label: "Langkah 5",
                            title: "Daftarkan Siswa",
                            description: `${stats.total_participants} peserta didaftarkan dengan kode unik.`,
                            icon: "fa-solid fa-user-check",
                            state: stats.total_participants > 0 ? "done" : stats.published > 0 ? "active" : "idle",
                        },
                        {
                            label: "Langkah 6",
                            title: "Rekap Nilai",
                            description: "Hitung rata-rata 4 mapel dan kelulusan (passing grade 65).",
                            icon: "fa-solid fa-chart-column",
                            state: stats.total_participants > 0 ? "active" : "idle",
                        },
                    ]}
                />

                {/* Session List Section */}
                <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <i className="fa-solid fa-calendar-check text-amber-500" />
                                    <span>Daftar Sesi Ujian Publik</span>
                                    <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {sessions.length}
                                    </span>
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Atur jadwal sesi 4 mapel, kelola token ruang, daftarkan peserta, dan pantau kelulusan.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={openCreateModal}
                                disabled={packages.length < 4}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-black text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20 whitespace-nowrap self-start sm:self-auto disabled:opacity-50"
                            >
                                <i className="fa-solid fa-plus text-xs" /> Buat Sesi Baru
                            </button>
                        </div>

                        {/* Search & Filter Toolbar */}
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari judul sesi atau paket soal..."
                                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold">
                                    {(["all", "draft", "published", "closed"] as StatusFilter[]).map((tab) => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setStatusFilter(tab)}
                                            className={`rounded-lg px-2.5 py-1 transition-all capitalize ${
                                                statusFilter === tab
                                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                                            }`}
                                        >
                                            {tab === "all" ? "Semua" : tab}
                                        </button>
                                    ))}
                                </div>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    <option value="newest">Terbaru</option>
                                    <option value="oldest">Terlama</option>
                                    <option value="title_asc">Judul (A-Z)</option>
                                    <option value="closes_soon">Segera Berakhir</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Session Cards Grid */}
                    <div className="p-4 sm:p-5">
                        {filteredSessions.length === 0 ? (
                            <EmptyState
                                icon="fa-solid fa-calendar-xmark"
                                title="Tidak ada sesi ujian publik yang cocok"
                                description="Buat sesi baru dengan memilih 4 paket mapel berbeda."
                            />
                        ) : (
                            <div className="grid gap-4 lg:grid-cols-2">
                                {filteredSessions.map((sess) => {
                                    return (
                                        <div
                                            key={sess.id}
                                            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30 p-5 shadow-sm hover:border-amber-500/50 transition-all flex flex-col justify-between gap-4"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                                sess.order_type === "sequential"
                                                                    ? "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                                                    : "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                                            }`}>
                                                                {sess.order_type === "sequential" ? "Wajib Berurutan" : "Bebas Memilih Mapel"}
                                                            </span>
                                                        </div>
                                                        <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                                                            {sess.title}
                                                        </h3>
                                                    </div>
                                                    <StatusPill value={sess.status} />
                                                </div>

                                                {/* Schedule Info */}
                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                    <i className="fa-solid fa-clock text-amber-500 text-xs" />
                                                    <span>{formatDate(sess.opens_at)} — {formatDate(sess.closes_at)}</span>
                                                </div>

                                                {/* 4 Packages Badges */}
                                                <div>
                                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                                        4 Paket Terhubung
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {sess.packages.map((p) => (
                                                            <span
                                                                key={p.id}
                                                                className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-xs"
                                                            >
                                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                                <strong className="text-amber-600 dark:text-amber-400">{p.subject_name}:</strong> {p.title}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Active Room Token & Participant Stat Boxes */}
                                                <div className="grid grid-cols-2 gap-2.5 pt-1">
                                                    {/* Token Ruang Box */}
                                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3 flex flex-col justify-between gap-1 shadow-xs">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Token Ruang Ujian</span>
                                                        {sess.active_token ? (
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-mono text-base font-black text-amber-600 dark:text-amber-400 tracking-wider">
                                                                    {sess.active_token}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(sess.active_token!, "Token ruang")}
                                                                    className="rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-600 hover:bg-amber-500/20"
                                                                >
                                                                    Salin
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-slate-400">Belum ada token</span>
                                                                {sess.status === "published" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => void handleGenerateToken(sess)}
                                                                        disabled={busy}
                                                                        className="rounded-md bg-amber-500 px-2 py-1 text-[10px] font-bold text-slate-950 hover:bg-amber-400"
                                                                    >
                                                                        Buat Token
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Participant Counter Box */}
                                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3 flex flex-col justify-between gap-1 shadow-xs">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Peserta Terdaftar</span>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-base font-black text-slate-900 dark:text-white">
                                                                {sess.participants_count} Siswa
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => void openParticipantManager(sess)}
                                                                className="rounded-md bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-600 hover:bg-sky-500/20"
                                                            >
                                                                Daftarkan
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Footer Actions */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 dark:border-white/5 pt-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void openParticipantManager(sess)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-200/80 dark:bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
                                                    >
                                                        <i className="fa-solid fa-users text-xs" />
                                                        Peserta ({sess.participants_count})
                                                    </button>

                                                    <Link
                                                        href={`/dashboard/admin/public-exams/results?session=${sess.id}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                                    >
                                                        <i className="fa-solid fa-chart-simple text-xs" />
                                                        Hasil Ujian
                                                    </Link>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    {sess.status === "draft" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void handlePublishSession(sess)}
                                                            disabled={busy}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all"
                                                        >
                                                            <i className="fa-solid fa-check text-xs" /> Terbitkan
                                                        </button>
                                                    )}
                                                    {sess.status === "published" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleGenerateToken(sess)}
                                                                disabled={busy}
                                                                className="rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                                                title="Buat Token Baru"
                                                            >
                                                                <i className="fa-solid fa-rotate text-xs" /> Token
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleCloseSession(sess)}
                                                                disabled={busy}
                                                                className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all"
                                                                title="Tutup Sesi Ujian"
                                                            >
                                                                Tutup Sesi
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Modal Create Session */}
                {isCreateModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto"
                        onClick={(e) => { if (e.target === e.currentTarget) closeCreateModal(); }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-amber-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <i className="fa-solid fa-calendar-plus text-amber-500" />
                                    Buat Sesi Ujian Publik 4 Mata Pelajaran
                                </h3>
                                <button type="button" onClick={closeCreateModal} className="text-slate-400 hover:text-slate-600">
                                    <i className="fa-solid fa-xmark text-sm" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSession} className="space-y-3.5">
                                <div>
                                    <label className={labelClass}>Judul Sesi Ujian</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={255}
                                        value={formTitle}
                                        onChange={(e) => setFormTitle(e.target.value)}
                                        placeholder="Contoh: Sesi Ujian Publik Gelombang 1"
                                        className={inputClass}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Waktu Mulai</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={formOpensAt}
                                            onChange={(e) => setFormOpensAt(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Waktu Selesai</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={formClosesAt}
                                            onChange={(e) => setFormClosesAt(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Urutan Pengerjaan Paket</label>
                                    <select
                                        value={formOrderType}
                                        onChange={(e) => setFormOrderType(e.target.value as "free" | "sequential")}
                                        className={inputClass}
                                    >
                                        <option value="free">Bebas Memilih (Peserta bebas memilih urutan mapel)</option>
                                        <option value="sequential">Wajib Berurutan (Harus menyelesaikan mapel 1 lalu mapel 2, dst.)</option>
                                    </select>
                                </div>

                                {/* 4 Package Selectors for 4 distinct subjects */}
                                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
                                    <span className="block text-xs font-bold uppercase tracking-wider text-amber-500">
                                        Pilih Tepat 4 Paket dari 4 Kategori Berbeda
                                    </span>

                                    {packagesBySubject.slice(0, 4).map((group, idx) => (
                                        <div key={idx}>
                                            <label className={labelClass}>Mapel {idx + 1}: {group.subject_name}</label>
                                            <select
                                                value={formPackageIds[idx] ?? 0}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setFormPackageIds((current) =>
                                                        current.map((item, pIdx) => (pIdx === idx ? val : item))
                                                    );
                                                }}
                                                className={inputClass}
                                                required
                                            >
                                                <option value={0}>Pilih Paket {group.subject_name}</option>
                                                {group.packages.map((pkg) => (
                                                    <option key={pkg.id} value={pkg.id}>
                                                        {pkg.title} ({pkg.subject_name})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                                    <button type="button" onClick={closeCreateModal} className={secondaryButtonClass}>
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={busy || formPackageIds.some((id) => !id)}
                                        className={primaryButtonClass}
                                    >
                                        {busy ? "Menyimpan..." : "Buat Sesi Draft"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Participant Manager for a Session */}
                {selectedSessionForParticipants && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto"
                        onClick={(e) => { if (e.target === e.currentTarget) closeParticipantManager(); }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-amber-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                                        SESI: {selectedSessionForParticipants.title}
                                    </span>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                        Kelola & Daftarkan Peserta Ujian Publik
                                    </h3>
                                </div>
                                <button type="button" onClick={closeParticipantManager} className="text-slate-400 hover:text-slate-600">
                                    <i className="fa-solid fa-xmark text-sm" />
                                </button>
                            </div>

                            {/* Alert when newly registered participant code is issued */}
                            {issuedCode && (
                                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <i className="fa-solid fa-circle-check text-xl text-emerald-500" />
                                        <div>
                                            <span className="text-xs font-semibold uppercase tracking-wider block">Kode Peserta Baru Diterbitkan</span>
                                            <span className="font-mono text-xl font-black">{issuedCode}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(issuedCode, "Kode peserta")}
                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                                    >
                                        Salin Kode
                                    </button>
                                </div>
                            )}

                            {/* Register Participant Form */}
                            <form onSubmit={handleRegisterParticipant} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <i className="fa-solid fa-user-plus text-amber-500" />
                                    Daftarkan Siswa Baru ke Sesi Ini
                                </h4>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>Nama Lengkap Siswa</label>
                                        <input
                                            type="text"
                                            required
                                            value={regName}
                                            onChange={(e) => setRegName(e.target.value)}
                                            placeholder="Contoh: Muhammad Farhan"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Asal Sekolah</label>
                                        <input
                                            type="text"
                                            required
                                            value={regSchool}
                                            onChange={(e) => setRegSchool(e.target.value)}
                                            placeholder="Contoh: SMP Negeri 1"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Alamat (Opsional, pengganti email)</label>
                                    <input
                                        type="text"
                                        value={regAddress}
                                        onChange={(e) => setRegAddress(e.target.value)}
                                        placeholder="Contoh: Jl. Merdeka No. 45"
                                        className={inputClass}
                                    />
                                </div>

                                <div className="flex justify-end pt-1">
                                    <button type="submit" disabled={busy} className={primaryButtonClass}>
                                        <i className="fa-solid fa-user-check text-xs" /> Daftarkan Siswa & Dapatkan Kode
                                    </button>
                                </div>
                            </form>

                            {/* Participant Roster Table */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Daftar Peserta Terdaftar ({participantsList.length})
                                    </span>
                                    {participantsList.length > 0 && (
                                        <a
                                            href={route("admin.exams.public-sessions.results.export", { session: selectedSessionForParticipants.id })}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <i className="fa-solid fa-file-csv text-xs text-emerald-500" /> Unduh CSV Roster
                                        </a>
                                    )}
                                </div>

                                {loadingParticipants ? (
                                    <div className="py-8 text-center text-xs text-slate-400">
                                        <i className="fa-solid fa-circle-notch fa-spin text-base text-amber-500 mb-2" />
                                        <p>Memuat daftar peserta...</p>
                                    </div>
                                ) : participantsList.length === 0 ? (
                                    <EmptyState
                                        icon="fa-solid fa-users"
                                        title="Belum ada peserta terdaftar"
                                        description="Gunakan formulir di atas untuk mendaftarkan siswa."
                                    />
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 max-h-60 overflow-y-auto">
                                        <table className="min-w-full text-left text-xs dark:text-white">
                                            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 sticky top-0">
                                                <tr>
                                                    <th className="p-2.5">Kode Peserta</th>
                                                    <th className="p-2.5">Nama Siswa</th>
                                                    <th className="p-2.5">Asal Sekolah</th>
                                                    <th className="p-2.5">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                {participantsList.map((p) => (
                                                    <tr key={p.id}>
                                                        <td className="p-2.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                                                            {p.participant_code}
                                                        </td>
                                                        <td className="p-2.5 font-medium">{p.name}</td>
                                                        <td className="p-2.5 text-slate-500">{p.school_origin}</td>
                                                        <td className="p-2.5">
                                                            <StatusPill value={p.status} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </ExamWorkspace>
        </>
    );
}

PublicSessions.layout = (page: ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
