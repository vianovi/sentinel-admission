import { FormEvent, useEffect, useState, useMemo } from "react";
import { Head, Link, useForm, router, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import ResizableSplitGrid from "@/Components/Dashboard/Shared/ResizableSplitGrid";
import { confirmAction, showSuccessToast, showErrorToast } from "@/utils/swal";
import type { PageProps } from "@/types";
import PublicSessionFormModal from "@/Components/Exam/Admin/PublicSessionFormModal";
import PublicProctorTokenManager from "@/Components/Exam/Admin/PublicProctorTokenManager";
import PublicParticipantMonitorTable from "@/Components/Exam/Admin/PublicParticipantMonitorTable";
import PublicProctorFullscreenScreen from "@/Components/Exam/Admin/PublicProctorFullscreenScreen";

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

export type SessionFormData = {
    package_ids: number[];
    exam_package_id: number;
    admission_wave_id: number | null;
    title: string;
    description: string;
    instructions: string;
    opens_at: string;
    closes_at: string;
    duration_minutes: number;
    passing_score: number;
    max_attempts: number;
    show_result_to_candidate: boolean;
    public_access_type: string;
    package_order_type: string;
    status: string;
};

export type TokenFormData = {
    label: string;
    type: string;
    max_uses: number;
    expiry_minutes: number;
};

export type SessionFormReturn = ReturnType<typeof useForm<SessionFormData>>;
export type TokenFormReturn = ReturnType<typeof useForm<TokenFormData>>;

type Props = {
    public_sessions: PublicSessionItem[];
    active_session_id: number | null;
    active_session: {
        id: number;
        title: string;
        description: string | null;
        instructions: string | null;
        package_ids: number[];
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
        package_order_type: string;
        opens_at_input: string | null;
        closes_at_input: string | null;
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
    const pad = (num: number) => String(num).padStart(2, "0");
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

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
    const [showProctorScreen, setShowProctorScreen] = useState(false);
    const [searchSession, setSearchSession] = useState("");

    useEffect(() => {
        if (flash?.success) showSuccessToast(flash.success);
        if (flash?.error) showErrorToast(flash.error);
    }, [flash]);

    const sessionForm = useForm({
        package_ids: packages[0] ? [packages[0].id] : [],
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
        package_order_type: "flexible",
        status: "published",
    });

    const tokenForm = useForm({
        label: "",
        type: "multi_use",
        max_uses: 100,
        expiry_minutes: 120,
    });

    const selectedPackage = useMemo(
        () => packages.find((p) => p.id === Number(sessionForm.data.exam_package_id)) || packages[0],
        [packages, sessionForm.data.exam_package_id]
    );

    const activeProctorToken = useMemo(() => tokens.find((t) => t.is_valid), [tokens]);

    const filteredSessions = useMemo(
        () =>
            public_sessions.filter(
                (sess) =>
                    sess.title.toLowerCase().includes(searchSession.toLowerCase()) ||
                    (sess.package_title && sess.package_title.toLowerCase().includes(searchSession.toLowerCase()))
            ),
        [public_sessions, searchSession]
    );

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
            package_ids: active_session.package_ids || [active_session.exam_package_id],
            exam_package_id: active_session.exam_package_id,
            admission_wave_id: active_session.admission_wave_id,
            title: active_session.title || "",
            description: active_session.description || "",
            instructions: active_session.instructions || "",
            opens_at: active_session.opens_at_input || "",
            closes_at: active_session.closes_at_input || "",
            duration_minutes: active_session.duration_minutes || 60,
            passing_score: active_session.passing_score || 70,
            max_attempts: active_session.max_attempts || 1,
            show_result_to_candidate: active_session.show_result_to_candidate || false,
            public_access_type: active_session.public_access_type || "token_required",
            package_order_type: active_session.package_order_type || "flexible",
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

    const handleDeleteToken = async (tokenId: number) => {
        const confirmed = await confirmAction(
            "Hapus Token Proktor?",
            "Token ini akan dihapus permanen dari sistem dan tidak dapat dipakai lagi.",
            "Hapus Token"
        );
        if (confirmed) {
            router.delete(route("admin.exams.public-sessions.destroy-token", tokenId));
        }
    };

    const handleForceSubmitAttempt = async (attemptId: number, participantName: string) => {
        const confirmed = await confirmAction(
            "Paksa Selesai Ujian?",
            `Tindakan ini akan menghentikan pengerjaan untuk peserta "${participantName}" dan langsung mengumpulkan seluruh jawaban yang tersimpan saat ini.`,
            "Ya, Paksa Selesai"
        );
        if (confirmed) {
            router.post(route("admin.exams.public-sessions.attempts.force-submit", attemptId));
        }
    };

    const handleResetAttemptViolations = async (attemptId: number, participantName: string) => {
        const confirmed = await confirmAction(
            "Reset Pelanggaran Peserta?",
            `Tindakan ini akan menghapus seluruh catatan keluar fullscreen (${participantName}) kembali menjadi 0.`,
            "Ya, Reset Pelanggaran"
        );
        if (confirmed) {
            router.post(route("admin.exams.public-sessions.attempts.reset-violations", attemptId));
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showSuccessToast(`${label} berhasil disalin ke clipboard!`);
    };

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

                {/* Main Workspace Layout with Resizable Split Grid */}
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

                                        {/* Proctor Token Manager Sub-Component */}
                                        <PublicProctorTokenManager
                                            tokens={tokens}
                                            activeProctorToken={activeProctorToken}
                                            tokenForm={tokenForm}
                                            handleGenerateToken={handleGenerateToken}
                                            handleDeleteToken={handleDeleteToken}
                                            copyToClipboard={copyToClipboard}
                                            onOpenProctorScreen={() => setShowProctorScreen(true)}
                                        />

                                        {/* Participant Monitoring Table Sub-Component */}
                                        <PublicParticipantMonitorTable
                                            attempts={attempts}
                                            handleResetAttempt={handleResetAttemptViolations}
                                            handleForceSubmit={handleForceSubmitAttempt}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60 p-12 text-center">
                                    <i className="fa-solid fa-hand-pointer text-4xl text-amber-500/50 mb-3" />
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pilih Sesi Ujian Publik</h3>
                                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                        Pilih salah satu sesi ujian di panel sebelah kiri untuk melihat informasi token proktor, melakukan rotasi, dan memantau peserta live.
                                    </p>
                                </div>
                            )}
                        </div>
                    }
                />

                {/* Modals & Fullscreen Overlays */}
                <PublicSessionFormModal
                    show={showFormModal}
                    onClose={() => setShowFormModal(false)}
                    editingSessionId={editingSessionId}
                    sessionForm={sessionForm}
                    packages={packages}
                    waves={waves}
                    handlePackageChange={handlePackageChange}
                    handleSaveSession={handleSaveSession}
                    formatToLocalDateTime={formatToLocalDateTime}
                />

                <PublicProctorFullscreenScreen
                    show={showProctorScreen}
                    onClose={() => setShowProctorScreen(false)}
                    activeToken={activeProctorToken?.token}
                    sessionTitle={active_session?.title || "Ujian Publik"}
                    copyToClipboard={copyToClipboard}
                />
            </div>
        </DashboardLayout>
    );
}
