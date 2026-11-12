import { useState, useMemo, useEffect, type FormEvent, type ReactNode } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import Select from "react-select";
import { makeSelectStyles } from "@/Components/UI/selectStyles";
import { useTheme } from "@/context/ThemeContext";
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
    description: string | null;
    instructions: string | null;
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
    examTimezone: string;
    detailMode?: boolean;
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

export default function PublicSessions({ sessions, packages, stats, examTimezone, detailMode = false }: Props) {
    const { theme } = useTheme();
    const selectStyles = makeSelectStyles(false, theme === "dark");
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;

    // Filters & toolbar
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("newest");

    // Create session modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formInstructions, setFormInstructions] = useState("");
    const [formOpensAt, setFormOpensAt] = useState("");
    const [formClosesAt, setFormClosesAt] = useState("");
    const [formOrderType, setFormOrderType] = useState<"free" | "sequential">("free");
    const [formPackageIds, setFormPackageIds] = useState<number[]>([0, 0, 0, 0]);
    const [editingDraftSession, setEditingDraftSession] = useState<Session | null>(null);

    // Participant Manager modal state
    const [selectedSessionForParticipants, setSelectedSessionForParticipants] = useState<Session | null>(null);
    const [participantsList, setParticipantsList] = useState<Participant[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [rosterPage, setRosterPage] = useState(1);
    const [rosterLastPage, setRosterLastPage] = useState(1);
    const [rosterTotal, setRosterTotal] = useState(0);
    const [rosterError, setRosterError] = useState(false);
    const [regName, setRegName] = useState("");
    const [regSchool, setRegSchool] = useState("");
    const [regAddress, setRegAddress] = useState("");
    const [issuedCode, setIssuedCode] = useState<string | null>(null);

    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (detailMode && sessions[0]) void openParticipantManager(sessions[0]);
    }, [detailMode, sessions[0]?.id]);

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
        setEditingDraftSession(null);
        setFormTitle("");
        setFormDescription("");
        setFormInstructions("");
        setFormOpensAt("");
        setFormClosesAt("");
        setFormOrderType("free");
        setFormPackageIds(packagesBySubject.slice(0, 4).map((g) => g.packages[0]?.id ?? 0));
        setIsCreateModalOpen(true);
    };

    const openEditPackages = async (session: Session) => {
        setBusy(true);
        try {
            const response = await axios.get(route("admin.exams.public-v2.sessions.show", { session: session.id }));
            const selected = response.data.packages as { id: number; subject_name: string }[];
            const selectedIds = Array.from({ length: 4 }, (_, index) => selected[index]?.id ?? 0);
            setEditingDraftSession(session);
            setFormTitle(session.title);
            setFormDescription(session.description ?? "");
            setFormInstructions(session.instructions ?? "");
            const localInput = (value: string) => {
                const date = new Date(value);
                return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            };
            setFormOpensAt(localInput(session.opens_at));
            setFormClosesAt(localInput(session.closes_at));
            setFormOrderType(session.order_type as "free" | "sequential");
            setFormPackageIds(selectedIds);
            setIsCreateModalOpen(true);
        } catch (error) {
            showErrorToast(axios.isAxiosError(error) ? error.response?.data?.message ?? "Gagal memuat paket sesi." : "Gagal memuat paket sesi.");
        } finally {
            setBusy(false);
        }
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleCreateSession = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        try {
            const data = {
                title: formTitle, description: formDescription, instructions: formInstructions,
                opens_at: new Date(formOpensAt).toISOString(), closes_at: new Date(formClosesAt).toISOString(),
                order_type: formOrderType, package_ids: formPackageIds,
            };
            if (editingDraftSession) {
                await axios.put(route("admin.exams.public-v2.sessions.update", { session: editingDraftSession.id }), data);
                showSuccessToast("Konfigurasi sesi draft diperbarui. Buat token baru setelah sesi diterbitkan.");
            } else {
                await axios.post(route("admin.exams.public-v2.sessions.store"), data);
                showSuccessToast("Sesi ujian publik berhasil dibuat dalam status draft.");
            }
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
            const response = await axios.post<{ token: string }>(
                route("admin.exams.public-v2.sessions.tokens.store", { session: sess.id })
            );
            showSuccessToast(`Token ruang berhasil dibuat: ${response.data.token}`);
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

    const handleEditSessionPackages = (sess: Session) => {
        void openEditPackages(sess);
    };

    const loadRoster = async (sess: Session, page = 1) => {
        setLoadingParticipants(true);
        setRosterError(false);
        setParticipantsList([]);
        try {
            const response = await axios.get<{ data: Participant[]; current_page: number; last_page: number; total: number }>(
                route("admin.exams.public-sessions.participants.index", { session: sess.id }), { params: { page } }
            );
            setParticipantsList(response.data.data);
            setRosterPage(response.data.current_page);
            setRosterLastPage(response.data.last_page);
            setRosterTotal(response.data.total);
        } catch {
            setRosterError(true);
            showErrorToast("Gagal memuat daftar peserta.");
        } finally {
            setLoadingParticipants(false);
        }
    };

    const openParticipantManager = async (sess: Session) => {
        setSelectedSessionForParticipants(sess);
        setIssuedCode(null);
        await loadRoster(sess);
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
            const response = await axios.post<{ participant_code: string }>(
                route("admin.exams.public-sessions.participants.store", { session: selectedSessionForParticipants.id }),
                {
                    name: regName,
                    school_origin: regSchool,
                    address: regAddress,
                }
            );
            const code = response.data.participant_code;
            setIssuedCode(code);
            showSuccessToast(`Peserta berhasil didaftarkan! Kode: ${code}`);
            setRegName("");
            setRegSchool("");
            setRegAddress("");

            // Reload roster
            await loadRoster(selectedSessionForParticipants, rosterPage);
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
                timeZone: examTimezone,
                timeZoneName: "short",
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

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            showSuccessToast(`${label} berhasil disalin ke clipboard!`);
        } catch {
            showErrorToast("Tidak dapat menyalin. Pilih teks dan salin secara manual.");
        }
    };

    return (
        <>
            <Head title={detailMode ? sessions[0].title : "Sesi Ujian Publik"} />

            <ExamWorkspace active="sessions">
                <PageHeader
                    title={detailMode ? sessions[0].title : "Pengaturan Sesi Ujian Publik"}
                    badge="LANGKAH 3: JADWAL & AKSES PESERTA"
                    description="Jadwalkan sesi ujian publik 4 mata pelajaran, aktifkan token ruang ujian, dan daftarkan peserta ujian."
                    icon="fa-solid fa-calendar-check"
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            {detailMode ? <Link href={route("admin.public-exams.sessions.index")} className={secondaryButtonClass}>Kembali ke Sesi Ujian</Link> : packagesBySubject.length < 4 ? (
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
                    {!detailMode && <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 space-y-4">
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
                                disabled={packagesBySubject.length < 4}
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

                                <Select aria-label="Urutkan sesi" styles={selectStyles}
                                    options={[{ value: "newest", label: "Terbaru" }, { value: "oldest", label: "Terlama" }, { value: "title_asc", label: "Judul (A-Z)" }, { value: "closes_soon", label: "Segera Berakhir" }]}
                                    value={{ value: sortBy, label: { newest: "Terbaru", oldest: "Terlama", title_asc: "Judul (A-Z)", closes_soon: "Segera Berakhir" }[sortBy] }}
                                    onChange={option => setSortBy((option?.value ?? "newest") as SortOption)} />
                            </div>
                        </div>
                    </div>}

                    {/* Session Cards Grid */}
                    <div className="p-4 sm:p-5">
                        {filteredSessions.length === 0 ? (
                            <EmptyState
                                icon="fa-solid fa-calendar-xmark"
                                title="Tidak ada sesi ujian publik yang cocok"
                                description="Buat sesi baru dengan memilih 4 paket mapel berbeda."
                            />
                        ) : (
                            <div className="grid gap-4">
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
                                                            {detailMode ? sess.title : <Link href={route("admin.public-exams.sessions.show", { session: sess.id })} className="hover:text-amber-600 hover:underline">{sess.title} · Kelola Sesi</Link>}
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
                                                        {sess.packages.length} Paket Terhubung
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {sess.packages.map((p) => (
                                                            <Link
                                                                key={p.id}
                                                                href={route("admin.public-exams.packages.show", { package: p.id })}
                                                                className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-xs"
                                                            >
                                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                                <strong className="text-amber-600 dark:text-amber-400">{p.subject_name}:</strong> {p.title}
                                                            </Link>
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
                                                        <button type="button" onClick={() => handleEditSessionPackages(sess)} disabled={busy} className={secondaryButtonClass}>
                                                            <i className="fa-solid fa-pen-to-square mr-1" aria-hidden="true" /> Konfigurasi Sesi
                                                        </button>
                                                    )}
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
                                    {editingDraftSession ? `Konfigurasi Sesi: ${editingDraftSession.title}` : "Buat Sesi Ujian Publik 4 Mata Pelajaran"}
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

                                <p className="text-xs text-slate-600 dark:text-slate-300">Input waktu mengikuti zona perangkat ({Intl.DateTimeFormat().resolvedOptions().timeZone}). Jadwal sesi ditampilkan dalam {examTimezone}.</p>
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
                                    <Select aria-label="Urutan pengerjaan" styles={selectStyles}
                                        options={[{ value: "free", label: "Bebas Memilih" }, { value: "sequential", label: "Wajib Berurutan" }]}
                                        value={{ value: formOrderType, label: formOrderType === "free" ? "Bebas Memilih" : "Wajib Berurutan" }}
                                        onChange={option => setFormOrderType(option?.value === "sequential" ? "sequential" : "free")} />
                                </div>
                                <div>
                                    <label htmlFor="session-description" className={labelClass}>Deskripsi Sesi</label>
                                    <textarea id="session-description" value={formDescription} onChange={event => setFormDescription(event.target.value)} maxLength={1500} className={inputClass} />
                                </div>
                                <div>
                                    <label htmlFor="session-instructions" className={labelClass}>Petunjuk untuk Peserta</label>
                                    <textarea id="session-instructions" value={formInstructions} onChange={event => setFormInstructions(event.target.value)} maxLength={5000} className={inputClass} />
                                </div>

                                {/* 4 Package Selectors for 4 distinct subjects */}
                                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
                                    <span className="block text-xs font-bold uppercase tracking-wider text-amber-500">
                                        Pilih Tepat 4 Paket dari 4 Jenis Mapel Berbeda
                                    </span>

                                    {Array.from({ length: 4 }, (_, idx) => {
                                        const selected = packages.find(pkg => pkg.id === formPackageIds[idx]);
                                        const otherSubjects = formPackageIds.filter((_, index) => index !== idx).map(id => packages.find(pkg => pkg.id === id)?.subject_id);
                                        return <div key={idx}>
                                            <label className={labelClass}>Paket {idx + 1}</label>
                                            <Select aria-label={`Paket ${idx + 1}`} styles={selectStyles}
                                                options={packages.filter(pkg => !otherSubjects.includes(pkg.subject_id)).map(pkg => ({ value: pkg.id, label: `${pkg.subject_name} · ${pkg.title}` }))}
                                                value={selected ? { value: selected.id, label: `${selected.subject_name} · ${selected.title}` } : null}
                                                placeholder="Pilih paket dari mapel berbeda"
                                                onChange={option => setFormPackageIds(current => current.map((id, index) => index === idx ? option?.value ?? 0 : id))}
                                                required />
                                        </div>;
                                    })}
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                                    <button type="button" onClick={closeCreateModal} className={secondaryButtonClass}>
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={busy || formPackageIds.length !== 4 || formPackageIds.some((id) => !id)}
                                        className={primaryButtonClass}
                                    >
                                        {busy ? "Menyimpan..." : editingDraftSession ? "Simpan Konfigurasi" : "Buat Sesi Draft"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Participant Manager for a Session */}
                {selectedSessionForParticipants && (
                    <div
                        className={detailMode ? "min-w-0" : "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto"}
                        onClick={(e) => { if (!detailMode && e.target === e.currentTarget) closeParticipantManager(); }}
                        role={detailMode ? undefined : "dialog"}
                        aria-modal={detailMode ? undefined : true}
                    >
                        <div className={`w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 space-y-4 ${detailMode ? "" : "max-w-3xl my-8"}`}>
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                                        SESI: {selectedSessionForParticipants.title}
                                    </span>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                        Kelola & Daftarkan Peserta Ujian Publik
                                    </h3>
                                </div>
                                {!detailMode && <button type="button" onClick={closeParticipantManager} className="text-slate-400 hover:text-slate-600">
                                    <i className="fa-solid fa-xmark text-sm" />
                                </button>}
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
                                        Daftar Peserta Terdaftar ({rosterTotal})
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
                                ) : rosterError ? (
                                    <button type="button" className={secondaryButtonClass} onClick={() => void loadRoster(selectedSessionForParticipants, rosterPage)}>Gagal memuat peserta · Coba lagi</button>
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
                                {!rosterError && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <span>Halaman {rosterPage} dari {rosterLastPage} · {participantsList.length} dari {rosterTotal} peserta</span>
                                    <div className="flex gap-2">
                                        <button disabled={loadingParticipants || rosterPage <= 1} className={secondaryButtonClass} onClick={() => void loadRoster(selectedSessionForParticipants, rosterPage - 1)}>Sebelumnya</button>
                                        <button disabled={loadingParticipants || rosterPage >= rosterLastPage} className={secondaryButtonClass} onClick={() => void loadRoster(selectedSessionForParticipants, rosterPage + 1)}>Berikutnya</button>
                                    </div>
                                </div>}
                            </div>
                        </div>
                    </div>
                )}
            </ExamWorkspace>
        </>
    );
}

PublicSessions.layout = (page: ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
