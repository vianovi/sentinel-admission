import { FormEvent, useEffect, useState } from "react";
import { Head, Link, useForm, router, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import ResizableSplitGrid from "@/Components/Dashboard/Shared/ResizableSplitGrid";
import SentinelSelect from "@/Components/Dashboard/Shared/SentinelSelect";
import { confirmAction, showSuccessToast, showErrorToast } from "@/utils/swal";
import type { PageProps } from "@/types";

export type PublicSessionItem = {
    id: number;
    title: string;
    package_title: string | null;
    status: string;
    is_open: boolean;
    opens_at: string | null;
    closes_at: string | null;
    duration_minutes: number;
    show_result_to_candidate: boolean;
    attempts_count: number;
};

export type PublicAttemptItem = {
    id: number;
    guest_name: string;
    guest_school: string;
    guest_email: string | null;
    guest_phone: string | null;
    token: string;
    status: string;
    started_at: string | null;
    submitted_at: string | null;
    score: number | null;
    passed: boolean | null;
    violations_count: number;
};

export type PublicTokenItem = {
    id: number;
    token: string;
    label: string | null;
    type: string;
    used_count: number;
    max_uses: number;
    is_expired: boolean;
    is_valid: boolean;
    created_at: string | null;
    expires_at: string | null;
};

type Props = {
    public_sessions: PublicSessionItem[];
    active_session_id: number | null;
    active_session: {
        id: number;
        title: string;
        description: string | null;
        instructions: string | null;
        exam_package_id: number;
        admission_wave_id: number | null;
        package_title: string | null;
        status: string;
        is_open: boolean;
        show_result_to_candidate: boolean;
        opens_at: string | null;
        closes_at: string | null;
        duration_minutes: number;
        passing_score: number;
        max_attempts: number;
        public_access_type: string;
    } | null;
    packages: Array<{ id: number; title: string; code: string; duration_minutes: number; passing_score?: number }>;
    waves: Array<{ id: number; title: string; academic_year: string }>;
    attempts: PublicAttemptItem[];
    tokens: PublicTokenItem[];
    stats: {
        total_participants: number;
        in_progress: number;
        submitted: number;
        avg_score: number;
    };
};

const formatToLocalDateTime = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export default function PublicSessions({
    public_sessions,
    active_session_id,
    active_session,
    packages,
    waves,
    attempts,
    tokens,
    stats,
}: Props) {
    const { flash } = usePage<PageProps>().props;

    // Modals state
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
    const [showProctorScreen, setShowProctorScreen] = useState(false);

    // Filters state
    const [searchSession, setSearchSession] = useState("");
    const [searchParticipant, setSearchParticipant] = useState("");
    const [participantStatusFilter, setParticipantStatusFilter] = useState("all");
    const [showOpensQuick, setShowOpensQuick] = useState(false);
    const [showClosesQuick, setShowClosesQuick] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            showSuccessToast(flash.success);
        }
        if (flash?.error) {
            showErrorToast(flash.error);
        }
    }, [flash]);

    // Unified Form for Create & Edit
    const sessionForm = useForm({
        exam_package_id: packages[0]?.id || 0,
        admission_wave_id: waves[0]?.id || (null as number | null),
        title: "",
        description: "",
        instructions: "",
        opens_at: "",
        closes_at: "",
        duration_minutes: packages[0]?.duration_minutes || 60,
        passing_score: packages[0]?.passing_score || 70,
        max_attempts: 1,
        show_result_to_candidate: false,
        public_access_type: "token_required",
        status: "published",
    });

    const tokenForm = useForm({
        label: "",
        type: "multi_use",
        max_uses: 100,
        expiry_minutes: 120,
    });

    const selectedPackage = packages.find((p) => p.id === Number(sessionForm.data.exam_package_id)) || packages[0];

    const openCreateModal = () => {
        setEditingSessionId(null);
        const initialPkg = packages[0];
        sessionForm.setData({
            exam_package_id: initialPkg?.id || 0,
            admission_wave_id: waves[0]?.id || null,
            title: "",
            description: "",
            instructions: "",
            opens_at: formatToLocalDateTime(new Date()),
            closes_at: formatToLocalDateTime(new Date(Date.now() + 3 * 3600 * 1000)),
            duration_minutes: initialPkg?.duration_minutes || 60,
            passing_score: initialPkg?.passing_score || 70,
            max_attempts: 1,
            show_result_to_candidate: false,
            public_access_type: "token_required",
            status: "published",
        });
        setShowFormModal(true);
    };

    const openEditModal = () => {
        if (!active_session) return;
        setEditingSessionId(active_session.id);
        sessionForm.setData({
            exam_package_id: active_session.exam_package_id,
            admission_wave_id: active_session.admission_wave_id,
            title: active_session.title || "",
            description: active_session.description || "",
            instructions: active_session.instructions || "",
            opens_at: active_session.opens_at || "",
            closes_at: active_session.closes_at || "",
            duration_minutes: active_session.duration_minutes || 60,
            passing_score: active_session.passing_score || 70,
            max_attempts: active_session.max_attempts || 1,
            show_result_to_candidate: active_session.show_result_to_candidate || false,
            public_access_type: active_session.public_access_type || "token_required",
            status: active_session.status || "published",
        });
        setShowFormModal(true);
    };

    const handlePackageChange = (packageId: number) => {
        const pkg = packages.find((p) => p.id === packageId);
        sessionForm.setData((prev) => ({
            ...prev,
            exam_package_id: packageId,
            duration_minutes: pkg?.duration_minutes ?? prev.duration_minutes,
            passing_score: pkg?.passing_score ?? prev.passing_score,
        }));
    };

    const handleSaveSession = (e: FormEvent) => {
        e.preventDefault();
        // Ensure duration & passing score automatically inherit from package
        const finalDuration = selectedPackage?.duration_minutes || sessionForm.data.duration_minutes;
        const finalPassingScore = selectedPackage?.passing_score || sessionForm.data.passing_score;

        sessionForm.setData((prev) => ({
            ...prev,
            duration_minutes: finalDuration,
            passing_score: finalPassingScore,
            max_attempts: 1,
        }));

        if (editingSessionId) {
            sessionForm.put(route("admin.exams.public-sessions.update", editingSessionId), {
                onSuccess: () => setShowFormModal(false),
            });
        } else {
            sessionForm.post(route("admin.exams.public-sessions.store"), {
                onSuccess: () => setShowFormModal(false),
            });
        }
    };

    const handleDeleteSession = async () => {
        if (!active_session) return;
        const confirmed = await confirmAction(
            "Hapus Sesi Ujian Publik?",
            `Tindakan ini akan menghapus sesi "${active_session.title}" beserta token proktor terkait. Data hasil peserta yang sudah disubmit akan tetap tersimpan di riwayat log audit.`,
            "Ya, Hapus Sesi"
        );
        if (confirmed) {
            router.delete(route("admin.exams.public-sessions.destroy", active_session.id));
        }
    };

    const handleToggleResults = () => {
        if (!active_session) return;
        router.post(route("admin.exams.public-sessions.toggle-results", active_session.id));
    };

    const handleGenerateToken = (e: FormEvent) => {
        e.preventDefault();
        if (!active_session) return;
        tokenForm.post(route("admin.exams.public-sessions.tokens.store", active_session.id), {
            onSuccess: () => tokenForm.reset(),
        });
    };

    const handleRotateToken = async (tokenId: number) => {
        const confirmed = await confirmAction(
            "Rotasi Token Proktor?",
            "Apakah Anda yakin ingin merotasi token ini? Token lama akan langsung non-aktif dan token baru akan otomatis dibuat.",
            "Ya, Rotasi Token"
        );
        if (confirmed) {
            router.post(route("admin.exams.public-sessions.tokens.rotate", tokenId));
        }
    };

    const handleDeleteToken = async (tokenId: number) => {
        const confirmed = await confirmAction(
            "Hapus Token Proktor?",
            "Token ini akan dihapus permanen dari sistem dan tidak dapat dipakai lagi.",
            "Hapus Token"
        );
        if (confirmed) {
            router.delete(route("admin.exams.public-sessions.tokens.destroy", tokenId));
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showSuccessToast(`${label} berhasil disalin ke clipboard!`);
    };

    const activeProctorToken = tokens.find((t) => t.is_valid);

    const filteredSessions = public_sessions.filter((sess) =>
        sess.title.toLowerCase().includes(searchSession.toLowerCase()) ||
        (sess.package_title && sess.package_title.toLowerCase().includes(searchSession.toLowerCase()))
    );

    const filteredAttempts = attempts.filter((att) => {
        const matchesSearch =
            att.guest_name.toLowerCase().includes(searchParticipant.toLowerCase()) ||
            att.guest_school.toLowerCase().includes(searchParticipant.toLowerCase()) ||
            att.token.toLowerCase().includes(searchParticipant.toLowerCase());
        const matchesStatus =
            participantStatusFilter === "all" ||
            (participantStatusFilter === "in_progress" && att.status === "in_progress") ||
            (participantStatusFilter === "submitted" && (att.status === "submitted" || att.status === "auto_submitted"));
        return matchesSearch && matchesStatus;
    });

    // Options for SentinelSelect dropdowns
    const packageOptions = packages.map((pkg) => ({
        value: pkg.id,
        label: `${pkg.title} (${pkg.code})`,
        description: `Durasi: ${pkg.duration_minutes}m | Passing Score: ${pkg.passing_score ?? 70}%`,
        badge: `${pkg.duration_minutes}m`,
    }));

    const waveOptions = [
        { value: 0, label: "Tanpa Gelombang (Publik Umum)", description: "Terbuka bagi pendaftar umum" },
        ...waves.map((w) => ({
            value: w.id,
            label: `${w.title} (${w.academic_year})`,
            description: `Tahun Akademik: ${w.academic_year}`,
        })),
    ];

    const accessTypeOptions = [
        { value: "token_required", label: "Token Proktor Wajib", description: "Peserta wajib memasukkan token 6 karakter untuk masuk" },
        { value: "open", label: "Akses Terbuka Tanpa Token", description: "Peserta publik langsung mengerjakan tanpa input token" },
    ];

    const statusOptions = [
        { value: "published", label: "Diterbitkan (Published)", badge: "Live" },
        { value: "draft", label: "Draft (Disimpan saja)", badge: "Draft" },
        { value: "closed", label: "Ditutup (Closed)", badge: "Closed" },
    ];

    const tokenTypeOptions = [
        { value: "multi_use", label: "Multi-Use (Banyak Peserta)" },
        { value: "single_use", label: "Single-Use (Sekali Pakai)" },
    ];

    const participantFilterOptions = [
        { value: "all", label: `Semua Status (${attempts.length})` },
        { value: "in_progress", label: `Sedang Mengerjakan (${stats.in_progress})` },
        { value: "submitted", label: `Sudah Selesai (${stats.submitted})` },
    ];

    return (
        <DashboardLayout>
            <Head title="Pengaturan Ujian Publik & Proktor" />

            <div className="space-y-6">
                {/* Header & Portal Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white dark:bg-slate-900/90 p-6 border border-slate-200 dark:border-amber-500/20 shadow-lg dark:shadow-2xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                            <i className="fa-solid fa-tower-broadcast animate-pulse" /> MODUL CBT PUBLIK & PROKTOR LIVE
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Pengaturan Ujian Publik & Token Proktor</h1>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                            Kelola sesi ujian terbuka untuk peserta umum/guest, generate token proktor dinamis ANBK-style, dan pantau aktivitas pengerjaan peserta secara real-time.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 relative z-10">
                        <Link
                            href={route("admin.exams.sessions.index")}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-300 dark:border-white/10 shadow-sm"
                        >
                            <i className="fa-solid fa-list-check text-amber-600 dark:text-amber-400" /> Sesi Internal (SPMB)
                        </Link>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                        >
                            <i className="fa-solid fa-plus text-xs" /> Sesi Publik Baru
                        </button>
                    </div>
                </div>

                {/* Stats Mini Dashboard */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/80 p-4 shadow-sm dark:shadow-xl backdrop-blur-md">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Peserta Publik</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.total_participants}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">orang</span>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-amber-500/30 bg-white dark:border-amber-500/20 dark:bg-slate-900/80 p-4 shadow-sm dark:shadow-xl backdrop-blur-md">
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Sedang Mengerjakan</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.in_progress}</span>
                            <span className="text-xs text-amber-600 dark:text-amber-400/80 font-bold animate-pulse">● Live</span>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-white dark:border-emerald-500/20 dark:bg-slate-900/80 p-4 shadow-sm dark:shadow-xl backdrop-blur-md">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Sudah Selesai</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.submitted}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">peserta</span>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-amber-500/30 bg-white dark:border-amber-500/20 dark:bg-slate-900/80 p-4 shadow-sm dark:shadow-xl backdrop-blur-md">
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Rata-Rata Skor</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-amber-600 dark:text-amber-300">{stats.avg_score}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">/ 100</span>
                        </div>
                    </div>
                </div>

                {/* Main Workspace Layout with Resizable Panel Splitter */}
                <ResizableSplitGrid
                    storageKey="public-sessions-v2"
                    initialLeftWidth={360}
                    minLeftWidth={280}
                    maxLeftWidth={650}
                    left={
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Daftar Sesi Ujian Publik</h2>
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                    {public_sessions.length} Sesi
                                </span>
                            </div>

                            {/* Session Search Filter */}
                            <div className="relative">
                                <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Cari sesi atau paket..."
                                    value={searchSession}
                                    onChange={(e) => setSearchSession(e.target.value)}
                                    className="sentinel-field pl-8"
                                />
                            </div>

                            {filteredSessions.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 dark:border-white/10 dark:bg-slate-900/40 p-8 text-center">
                                    <i className="fa-solid fa-folder-open text-3xl text-slate-400 dark:text-slate-600 mb-2" />
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Belum Ada Sesi Publik</p>
                                    <p className="text-[11px] text-slate-500 mt-1">Klik tombol diatas untuk membuat sesi publik baru.</p>
                                </div>
                            ) : (
                                filteredSessions.map((sess) => {
                                    const isActive = sess.id === active_session_id;
                                    return (
                                        <div
                                            key={sess.id}
                                            onClick={() => router.get(route("admin.exams.public-sessions.index"), { session_id: sess.id }, { preserveState: true })}
                                            className={`group cursor-pointer rounded-2xl border p-4 transition-all relative ${
                                                isActive
                                                    ? "border-amber-500/50 bg-amber-500/10 dark:bg-gradient-to-r dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900 shadow-lg dark:shadow-xl"
                                                    : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60 hover:border-amber-500/30 hover:bg-slate-50 dark:hover:bg-slate-900"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider truncate">
                                                    {sess.package_title ?? "Paket Ujian"}
                                                </span>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                                                    sess.is_open ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-white/5"
                                                }`}>
                                                    {sess.is_open ? "● Live / Buka" : "Tutup"}
                                                </span>
                                            </div>

                                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                                                {sess.title}
                                            </h3>

                                            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-2">
                                                <span><i className="fa-solid fa-clock text-slate-400 dark:text-slate-500 mr-1" /> {sess.duration_minutes}m</span>
                                                <span><i className="fa-solid fa-users text-slate-400 dark:text-slate-500 mr-1" /> {sess.attempts_count} Peserta</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    }
                    right={
                        <div className="space-y-6">
                        {active_session ? (
                            <>
                                {/* Active Session Details & Action Bar */}
                                <div className="rounded-2xl border border-slate-200 bg-white dark:border-amber-500/30 dark:bg-slate-900/90 p-6 shadow-lg dark:shadow-xl backdrop-blur-xl space-y-6 relative overflow-hidden text-slate-900 dark:text-white">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-white/10 pb-5">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                    ID SESI: #{active_session.id}
                                                </span>
                                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                    active_session.is_open ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 animate-pulse" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                }`}>
                                                    {active_session.is_open ? "Ujian Berlangsung" : "Sesi Ditutup"}
                                                </span>
                                            </div>

                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1.5">{active_session.title}</h2>
                                            
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <span><i className="fa-solid fa-box text-slate-400 dark:text-slate-500 mr-1" /> Paket: <strong className="text-slate-900 dark:text-white">{active_session.package_title ?? "-"}</strong></span>
                                                <span><i className="fa-solid fa-clock text-slate-400 dark:text-slate-500 mr-1" /> Durasi: <strong className="text-slate-900 dark:text-white">{active_session.duration_minutes} Menit</strong></span>
                                            </div>
                                        </div>

                                        {/* Actions: Edit, Delete, Toggle Results */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                onClick={handleToggleResults}
                                                className={`rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
                                                    active_session.show_result_to_candidate
                                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-500/20"
                                                        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 hover:bg-amber-500/20"
                                                }`}
                                                title="Atur pengumuman hasil ke peserta publik"
                                            >
                                                <i className={`fa-solid ${active_session.show_result_to_candidate ? "fa-eye" : "fa-eye-slash"} mr-1.5`} />
                                                {active_session.show_result_to_candidate ? "Hasil Tampil" : "Hasil Sembunyi"}
                                            </button>

                                            <button
                                                onClick={openEditModal}
                                                className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-300 dark:border-white/10"
                                            >
                                                <i className="fa-solid fa-pen-to-square mr-1.5 text-amber-600 dark:text-amber-400" /> Edit Sesi
                                            </button>

                                            <button
                                                onClick={handleDeleteSession}
                                                className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all border border-red-500/30"
                                                title="Hapus Sesi Ujian Publik"
                                            >
                                                <i className="fa-solid fa-trash-can" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Proctor Token Display & Control Box */}
                                    <div className="rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 dark:from-amber-950/60 dark:via-slate-950 dark:to-slate-950 p-5 border border-amber-500/30 dark:border-amber-500/40 shadow-sm dark:shadow-inner space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                                <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-widest block">
                                                    TOKEN PROKTOR UTAMA (ANBK / CBT STYLE)
                                                </span>
                                                <div className="mt-1 flex items-center gap-3 flex-wrap">
                                                    <span className="text-3xl font-black tracking-widest text-amber-700 dark:text-amber-300 font-mono bg-white dark:bg-slate-900 px-4 py-1.5 rounded-xl border border-amber-500/40 shadow-md select-all">
                                                        {activeProctorToken ? activeProctorToken.token : "BELUM ADA TOKEN"}
                                                    </span>

                                                    {activeProctorToken && (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <button
                                                                onClick={() => copyToClipboard(`${window.location.origin}/exam/p`, "Link Portal Ujian (Tanpa Token)")}
                                                                className="rounded-lg bg-white dark:bg-slate-800/90 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-300 dark:border-white/10 shadow-sm"
                                                                title="Salin URL Portal Ujian tempat peserta memasukkan token sendiri"
                                                            >
                                                                <i className="fa-solid fa-globe mr-1 text-amber-600 dark:text-amber-400" /> Salin Link Portal (Tanpa Token)
                                                            </button>

                                                            <button
                                                                onClick={() => copyToClipboard(`${window.location.origin}/exam/p/${activeProctorToken.token}`, "Link Direct Ujian (Dengan Token)")}
                                                                className="rounded-lg bg-amber-500/10 dark:bg-amber-500/15 px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all border border-amber-500/30"
                                                                title="Salin URL Ujian langsung beserta Token"
                                                            >
                                                                <i className="fa-solid fa-link mr-1 text-amber-600 dark:text-amber-400" /> Salin Link Direct (Dengan Token)
                                                            </button>

                                                            <button
                                                                onClick={() => copyToClipboard(activeProctorToken.token, "Kode Token Proktor")}
                                                                className="rounded-lg bg-white dark:bg-slate-800/90 px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-amber-500/30 shadow-sm"
                                                                title="Salin 6 Karakter Kode Token"
                                                            >
                                                                <i className="fa-solid fa-key mr-1" /> Salin Token Saja
                                                            </button>

                                                            <button
                                                                onClick={() => setShowProctorScreen(true)}
                                                                className="rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all border border-emerald-500/30"
                                                                title="Tampilkan layar proktor fullscreen"
                                                            >
                                                                <i className="fa-solid fa-expand mr-1" /> Mode Proktor
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {activeProctorToken && (
                                                <button
                                                    onClick={() => handleRotateToken(activeProctorToken.id)}
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
                                                >
                                                    <i className="fa-solid fa-rotate text-xs" /> Rotasi Token Baru
                                                </button>
                                            )}
                                        </div>

                                        {/* Token History & Generator */}
                                        <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                    <i className="fa-solid fa-key text-amber-600 dark:text-amber-400" /> Token Aktif & Riwayat Token ({tokens.length})
                                                </span>
                                            </div>

                                            {/* Create Token Form with SentinelSelect */}
                                            <form onSubmit={handleGenerateToken} className="grid grid-cols-1 gap-2.5 sm:grid-cols-4 bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-white/5 items-center shadow-sm">
                                                <input
                                                    type="text"
                                                    placeholder="Label Token (cth: Ruang A)"
                                                    value={tokenForm.data.label}
                                                    onChange={(e) => tokenForm.setData("label", e.target.value)}
                                                    className="sentinel-field"
                                                />
                                                <SentinelSelect
                                                    options={tokenTypeOptions}
                                                    value={tokenForm.data.type}
                                                    onChange={(val) => tokenForm.setData("type", val)}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Batas Penggunaan (0 = Unlim)"
                                                    value={tokenForm.data.max_uses}
                                                    onChange={(e) => tokenForm.setData("max_uses", Number(e.target.value))}
                                                    className="sentinel-field"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={tokenForm.processing}
                                                    className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-amber-500/30"
                                                >
                                                    {tokenForm.processing ? "Memproses..." : "+ Token Tambahan"}
                                                </button>
                                            </form>

                                            {/* Tokens Table */}
                                            {tokens.length > 0 && (
                                                <div className="overflow-x-auto max-h-44 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                                                    <table className="w-full text-left text-[11px]">
                                                        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                                                            <tr>
                                                                <th className="py-2 px-3">Token</th>
                                                                <th className="py-2 px-3">Label</th>
                                                                <th className="py-2 px-3">Tipe</th>
                                                                <th className="py-2 px-3">Penggunaan</th>
                                                                <th className="py-2 px-3">Status</th>
                                                                <th className="py-2 px-3 text-right">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-slate-900/50">
                                                            {tokens.map((t) => (
                                                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                                    <td className="py-2 px-3 font-mono font-bold text-amber-700 dark:text-amber-300">{t.token}</td>
                                                                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{t.label ?? "-"}</td>
                                                                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 capitalize">{t.type === "multi_use" ? "Multi-Use" : "Single-Use"}</td>
                                                                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">{t.used_count} / {t.max_uses === 0 ? "∞" : t.max_uses}</td>
                                                                    <td className="py-2 px-3">
                                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                                            t.is_valid ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                                                        }`}>
                                                                            {t.is_valid ? "Aktif" : "Expired / Habis"}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right">
                                                                        <button
                                                                            onClick={() => handleDeleteToken(t.id)}
                                                                            className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                                                                            title="Hapus token"
                                                                        >
                                                                            <i className="fa-solid fa-trash-can" />
                                                                        </button>
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

                                {/* Live Participants Monitoring Table */}
                                <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/80 p-6 shadow-xl space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
                                        <div>
                                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                                <i className="fa-solid fa-users text-amber-500" /> Live Monitoring Peserta Ujian Publik
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Daftar real-time peserta guest/publik yang sedang atau telah mengerjakan ujian.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 min-w-[200px]">
                                            <SentinelSelect
                                                options={participantFilterOptions}
                                                value={participantStatusFilter}
                                                onChange={(val) => setParticipantStatusFilter(val)}
                                                className="w-full"
                                            />

                                            <button
                                                onClick={() => router.reload()}
                                                className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-300 dark:border-white/10 shrink-0"
                                                title="Refresh Data Peserta"
                                            >
                                                <i className="fa-solid fa-rotate-right text-amber-500" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Participant Search */}
                                    <div className="relative">
                                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="Filter berdasarkan Nama, Asal Sekolah, atau Token..."
                                            value={searchParticipant}
                                            onChange={(e) => setSearchParticipant(e.target.value)}
                                            className="sentinel-field pl-8"
                                        />
                                    </div>

                                    {filteredAttempts.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-white/5 rounded-xl">
                                            Belum ada peserta yang sesuai dengan pencarian atau filter status.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/5">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                                        <th className="py-3 px-3">Nama Peserta</th>
                                                        <th className="py-3 px-3">Asal Sekolah</th>
                                                        <th className="py-3 px-3">Token</th>
                                                        <th className="py-3 px-3">Waktu Masuk</th>
                                                        <th className="py-3 px-3">Status</th>
                                                        <th className="py-3 px-3">Skor Akhir</th>
                                                        <th className="py-3 px-3 text-center">Keluar Fullscreen</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                    {filteredAttempts.map((att) => (
                                                        <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                                                                {att.guest_name}
                                                                {att.guest_email && <span className="block text-[10px] font-normal text-slate-500">{att.guest_email}</span>}
                                                            </td>
                                                            <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{att.guest_school}</td>
                                                            <td className="py-3 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{att.token}</td>
                                                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{att.started_at ?? "-"}</td>
                                                            <td className="py-3 px-3">
                                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                                    att.status === "in_progress"
                                                                        ? "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30 animate-pulse"
                                                                        : "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30"
                                                                }`}>
                                                                    {att.status === "in_progress" ? "Mengerjakan" : "Selesai"}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                                                                {att.score !== null ? (
                                                                    <span className={att.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                                                                        {att.score}%
                                                                    </span>
                                                                ) : "-"}
                                                            </td>
                                                            <td className="py-3 px-3 text-center">
                                                                <span className={`rounded-md px-2 py-0.5 text-xs font-mono font-bold ${
                                                                    att.violations_count > 0 ? "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-500/30" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-white/5"
                                                                }`}>
                                                                    {att.violations_count}x
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-12 text-center">
                                <i className="fa-solid fa-tower-cell text-4xl text-slate-600 mb-3" />
                                <p className="text-sm font-bold text-slate-300">Pilih atau Buat Sesi Ujian Publik</p>
                                <p className="text-xs text-slate-500 mt-1">Pilih salah satu sesi di sebelah kiri untuk melihat pengaturan proktor dan monitoring.</p>
                            </div>
                        )}
                    </div>
                    }
                />
            </div>

            {/* Create / Edit Public Session Modal */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                    {editingSessionId ? "MODIFIKASI SESI" : "SESI PUBLIK BARU"}
                                </span>
                                <h3 className="text-lg font-black text-white">
                                    {editingSessionId ? "Edit Konfigurasi Sesi Ujian Publik" : "Buat Sesi Ujian Publik Baru"}
                                </h3>
                            </div>
                            <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-white">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        {packages.length === 0 ? (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center space-y-3">
                                <i className="fa-solid fa-box-open text-3xl text-amber-400" />
                                <h4 className="text-sm font-bold text-white">Belum Ada Paket Soal Ujian</h4>
                                <p className="text-xs text-slate-300">
                                    Anda perlu membuat minimal satu Paket Soal Ujian sebelum dapat membuat Sesi Ujian Publik.
                                </p>
                                <Link
                                    href="/dashboard/admin/exams/packages"
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-400 transition-all"
                                >
                                    <i className="fa-solid fa-plus text-xs" /> Buat Paket Soal Sekarang
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveSession} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Judul Sesi Ujian Publik</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Tryout Nasional Matematika 2026"
                                        value={sessionForm.data.title}
                                        onChange={(e) => sessionForm.setData("title", e.target.value)}
                                        className="sentinel-field"
                                    />
                                    {sessionForm.errors.title && <p className="text-[11px] text-red-400 mt-1">{sessionForm.errors.title}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <SentinelSelect
                                        label="Paket Soal Ujian"
                                        icon="fa-solid fa-box"
                                        options={packageOptions}
                                        value={sessionForm.data.exam_package_id}
                                        onChange={(val) => handlePackageChange(Number(val))}
                                    />

                                    <SentinelSelect
                                        label="Gelombang SPMB (Opsional)"
                                        icon="fa-solid fa-layer-group"
                                        options={waveOptions}
                                        value={sessionForm.data.admission_wave_id || 0}
                                        onChange={(val) => sessionForm.setData("admission_wave_id", val === 0 ? null : Number(val))}
                                    />
                                </div>

                                {/* Package Inheritance Read-Only Badge Box */}
                                <div className="rounded-xl border border-amber-500/20 bg-slate-950/80 p-3.5 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                                            <i className="fa-solid fa-circle-info text-xs" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Aturan Paket & Sesi</span>
                                            <span className="text-xs text-slate-300">Konfigurasi diwarisi otomatis dari Paket Soal Ujian</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-400 block">Durasi</span>
                                            <strong className="text-white font-bold">{selectedPackage?.duration_minutes ?? 60} Menit</strong>
                                        </div>
                                        <div className="text-right border-l border-white/10 pl-4">
                                            <span className="text-[10px] text-slate-400 block">Passing Grade</span>
                                            <strong className="text-emerald-400 font-bold">{selectedPackage?.passing_score ?? 70}%</strong>
                                        </div>
                                        <div className="text-right border-l border-white/10 pl-4">
                                            <span className="text-[10px] text-slate-400 block">Percobaan</span>
                                            <strong className="text-amber-300 font-bold">1x Utama</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-xs font-bold text-slate-300">Waktu Buka (WIB)</label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowOpensQuick(!showOpensQuick);
                                                        setShowClosesQuick(false);
                                                    }}
                                                    className="flex items-center gap-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400 transition-all border border-amber-500/20"
                                                >
                                                    <i className="fa-solid fa-bolt text-amber-400" /> Cepat
                                                </button>
                                                {showOpensQuick && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setShowOpensQuick(false)} />
                                                        <div className="absolute right-0 top-6 z-50 w-64 rounded-xl border border-white/10 bg-slate-900 p-3 shadow-xl text-slate-100">
                                                            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Pilih Jam Hari Ini</div>
                                                            <div className="grid grid-cols-3 gap-1 mb-2">
                                                                {["Sekarang", "07:30", "08:00", "09:00", "10:00", "13:00", "14:00", "16:00", "19:00"].map((t) => (
                                                                    <button
                                                                        key={t}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newDate = sessionForm.data.opens_at ? new Date(sessionForm.data.opens_at) : new Date();
                                                                            if (t !== "Sekarang") {
                                                                                const [h, m] = t.split(":").map(Number);
                                                                                newDate.setHours(h, m, 0, 0);
                                                                            } else {
                                                                                const now = new Date();
                                                                                newDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
                                                                            }
                                                                            sessionForm.setData("opens_at", formatToLocalDateTime(newDate));
                                                                            setShowOpensQuick(false);
                                                                        }}
                                                                        className="rounded-md bg-white/5 hover:bg-white/10 px-1 py-1 text-[11px] font-medium text-center border border-white/5 text-slate-200"
                                                                    >
                                                                        {t}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={sessionForm.data.opens_at}
                                            onChange={(e) => sessionForm.setData("opens_at", e.target.value)}
                                            className="sentinel-field"
                                        />
                                    </div>

                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-xs font-bold text-slate-300">Waktu Tutup (WIB)</label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowClosesQuick(!showClosesQuick);
                                                        setShowOpensQuick(false);
                                                    }}
                                                    className="flex items-center gap-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400 transition-all border border-amber-500/20"
                                                >
                                                    <i className="fa-solid fa-bolt text-amber-400" /> Cepat
                                                </button>
                                                {showClosesQuick && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setShowClosesQuick(false)} />
                                                        <div className="absolute right-0 top-6 z-50 w-64 rounded-xl border border-white/10 bg-slate-900 p-3 shadow-xl text-slate-100">
                                                            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Tambah Waktu (dari Buka)</div>
                                                            <div className="grid grid-cols-3 gap-1.5">
                                                                {[1, 2, 3, 4, 6, 12, 24].map((h) => (
                                                                    <button
                                                                        key={h}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const baseStr = sessionForm.data.opens_at || formatToLocalDateTime(new Date());
                                                                            const baseDate = new Date(baseStr);
                                                                            baseDate.setHours(baseDate.getHours() + h);
                                                                            sessionForm.setData("closes_at", formatToLocalDateTime(baseDate));
                                                                            setShowClosesQuick(false);
                                                                        }}
                                                                        className="rounded-lg bg-white/5 hover:bg-white/10 px-2 py-1 text-xs font-medium text-center border border-white/5 text-slate-200"
                                                                    >
                                                                        +{h} Jam
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={sessionForm.data.closes_at}
                                            onChange={(e) => sessionForm.setData("closes_at", e.target.value)}
                                            className="sentinel-field"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Petunjuk Khusus Ujian (Opsional)</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Petunjuk pengerjaan yang tampil pada layar peserta sebelum mulai..."
                                        value={sessionForm.data.instructions}
                                        onChange={(e) => sessionForm.setData("instructions", e.target.value)}
                                        className="sentinel-field"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <SentinelSelect
                                        label="Tipe Akses Publik"
                                        icon="fa-solid fa-lock"
                                        options={accessTypeOptions}
                                        value={sessionForm.data.public_access_type}
                                        onChange={(val) => sessionForm.setData("public_access_type", val)}
                                    />

                                    <SentinelSelect
                                        label="Status Sesi Ujian"
                                        icon="fa-solid fa-toggle-on"
                                        options={statusOptions}
                                        value={sessionForm.data.status}
                                        onChange={(val) => sessionForm.setData("status", val)}
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={sessionForm.data.show_result_to_candidate}
                                            onChange={(e) => sessionForm.setData("show_result_to_candidate", e.target.checked)}
                                            className="rounded border-white/10 bg-slate-950 text-amber-500 focus:ring-amber-500"
                                        />
                                        <span className="text-xs text-slate-300 font-semibold">Tampilkan nilai/hasil langsung ke peserta setelah submit</span>
                                    </label>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowFormModal(false)}
                                            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={sessionForm.processing}
                                            className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                                        >
                                            {sessionForm.processing ? "Menyimpan..." : (editingSessionId ? "Simpan Perubahan" : "Buat Sesi Publik")}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Proctor Fullscreen Projection Mode Modal */}
            {showProctorScreen && active_session && activeProctorToken && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-8 backdrop-blur-xl animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-10 shadow-2xl text-center space-y-8 relative">
                        <button
                            onClick={() => setShowProctorScreen(false)}
                            className="absolute right-6 top-6 rounded-full bg-slate-800 p-3 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                        >
                            <i className="fa-solid fa-xmark text-xl" />
                        </button>

                        <div>
                            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                                PROKTOR LIVE CBT SCREEN — LAYAR PROYEKSI RUANG UJIAN
                            </span>
                            <h2 className="text-3xl font-black text-white mt-3">{active_session.title}</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Peserta dipersilakan mengakses portal ujian publik dan memasukkan Token Proktor berikut:
                            </p>
                        </div>

                        <div className="py-8 bg-slate-900/90 rounded-2xl border border-amber-500/40 shadow-inner space-y-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">TOKEN MASUK UJIAN</span>
                            <div className="text-7xl font-black tracking-widest font-mono text-amber-300 select-all font-sans">
                                {activeProctorToken.token}
                            </div>
                            <p className="text-xs text-slate-400">
                                Token ini dapat digunakan oleh peserta di ruang ujian.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono text-slate-300">
                            <div className="bg-slate-900 px-4 py-2 rounded-xl border border-white/10">
                                Direct URL: <span className="text-amber-400 font-bold">{window.location.origin}/exam/p/{activeProctorToken.token}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex justify-center gap-4">
                            <button
                                onClick={() => copyToClipboard(`${window.location.origin}/exam/p/${activeProctorToken.token}`, "Link Ujian Publik")}
                                className="rounded-xl bg-amber-500 px-6 py-3 text-xs font-black text-slate-950 hover:bg-amber-400 shadow-xl shadow-amber-500/20"
                            >
                                <i className="fa-solid fa-copy mr-2" /> Salin Link Direct Ujian
                            </button>
                            <button
                                onClick={() => setShowProctorScreen(false)}
                                className="rounded-xl bg-slate-800 px-6 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700"
                            >
                                Tutup Layar Proktor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
