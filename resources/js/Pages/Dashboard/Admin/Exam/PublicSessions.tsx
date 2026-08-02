import { FormEvent, useEffect, useState } from "react";
import { Head, Link, useForm, router, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
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
        package_title: string | null;
        status: string;
        is_open: boolean;
        show_result_to_candidate: boolean;
        opens_at: string | null;
        closes_at: string | null;
        duration_minutes: number;
    } | null;
    packages: Array<{ id: number; title: string; code: string; duration_minutes: number }>;
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
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            showSuccessToast(flash.success);
        }
        if (flash?.error) {
            showErrorToast(flash.error);
        }
    }, [flash]);

    const createForm = useForm({
        exam_package_id: packages[0]?.id || "",
        admission_wave_id: waves[0]?.id || "",
        title: "",
        description: "",
        instructions: "",
        opens_at: "",
        closes_at: "",
        duration_minutes: packages[0]?.duration_minutes || 60,
        passing_score: 70,
        max_attempts: 1,
        show_result_to_candidate: false,
        status: "published",
    });

    const tokenForm = useForm({
        label: "",
        type: "multi_use",
        max_uses: 100,
        expiry_minutes: 120,
    });

    const handleCreateSession = (e: FormEvent) => {
        e.preventDefault();
        createForm.post(route("admin.exams.public-sessions.store"), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
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

    const activeProctorToken = tokens.find((t) => t.is_valid);

    return (
        <DashboardLayout>
            <Head title="Pengaturan Ujian Publik & Proktor" />

            <div className="space-y-6">
                {/* Header & Sub-Navigation */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 border border-indigo-500/20 shadow-xl">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                            <i className="fa-solid fa-tower-broadcast" /> Mode Ujian Publik & Proktor Token
                        </div>
                        <h1 className="text-xl font-black text-white mt-1">Pengaturan Ujian Publik (Guest Portal)</h1>
                        <p className="text-xs text-slate-300 mt-1">
                            Kelola token proktor dinamis, atur akses hasil peserta publik, dan pantau peserta secara real-time.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route("admin.exams.sessions.index")}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-white/10"
                        >
                            <i className="fa-solid fa-list-check" /> Sesi Internal (Kandidat)
                        </Link>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
                        >
                            <i className="fa-solid fa-plus" /> Sesi Publik Baru
                        </button>
                    </div>
                </div>

                {/* Stats Mini Dashboard */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Peserta Publik</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-white">{stats.total_participants}</span>
                            <span className="text-xs text-slate-400">orang</span>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-amber-500/20 bg-slate-900/80 p-4 shadow-lg">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Sedang Mengerjakan</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-amber-400">{stats.in_progress}</span>
                            <span className="text-xs text-slate-400 font-semibold animate-pulse">Live</span>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/80 p-4 shadow-lg">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Sudah Selesai</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-emerald-400">{stats.submitted}</span>
                            <span className="text-xs text-slate-400">peserta</span>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/80 p-4 shadow-lg">
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Rata-Rata Skor</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-indigo-300">{stats.avg_score}</span>
                            <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                    </div>
                </div>

                {/* Main Workspace Layout */}
                <div className="grid gap-6 md:grid-cols-12">
                    {/* Left Panel: Public Session Selector List */}
                    <div className="md:col-span-4 space-y-3">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Daftar Sesi Ujian Publik</h2>
                        {public_sessions.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-8 text-center">
                                <i className="fa-solid fa-folder-open text-3xl text-slate-600 mb-2" />
                                <p className="text-xs font-bold text-slate-400">Belum Ada Sesi Publik</p>
                                <p className="text-[11px] text-slate-500 mt-1">Klik tombol diatas untuk membuat sesi publik baru.</p>
                            </div>
                        ) : (
                            public_sessions.map((sess) => {
                                const isActive = sess.id === active_session_id;
                                return (
                                    <div
                                        key={sess.id}
                                        onClick={() => router.get(route("admin.exams.public-sessions.index"), { session_id: sess.id }, { preserveState: true })}
                                        className={`group cursor-pointer rounded-2xl border p-4 transition-all ${
                                            isActive
                                                ? "border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 shadow-xl"
                                                : "border-white/10 bg-slate-900/60 hover:border-white/20 hover:bg-slate-900"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                                {sess.package_title ?? "Paket Ujian"}
                                            </span>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                sess.is_open ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                                            }`}>
                                                {sess.is_open ? "Buka" : "Tutup"}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-extrabold text-white mt-1 group-hover:text-amber-400 transition-colors">
                                            {sess.title}
                                        </h3>
                                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2">
                                            <span><i className="fa-solid fa-clock text-slate-500 mr-1" /> {sess.duration_minutes} Menit</span>
                                            <span><i className="fa-solid fa-users text-slate-500 mr-1" /> {sess.attempts_count} Peserta</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Right Panel: Active Session Proctor Control & Participant Table */}
                    <div className="md:col-span-8 space-y-6">
                        {active_session ? (
                            <>
                                {/* Proctor Room & Dynamic Token Control Box */}
                                <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl space-y-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
                                        <div>
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                                                Sesi Publik Aktif: #{active_session.id}
                                            </span>
                                            <h2 className="text-lg font-black text-white">{active_session.title}</h2>
                                            <p className="text-xs text-slate-400 mt-0.5">Paket: {active_session.package_title ?? "-"}</p>
                                        </div>

                                        {/* Toggle Result Visibility Button */}
                                        <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-white/10">
                                            <div className="text-left">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Pengumuman Hasil</span>
                                                <span className={`text-xs font-bold ${active_session.show_result_to_candidate ? "text-emerald-400" : "text-amber-400"}`}>
                                                    {active_session.show_result_to_candidate ? "Tampil di Peserta" : "Disembunyikan"}
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleToggleResults}
                                                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all border ${
                                                    active_session.show_result_to_candidate
                                                        ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                                                        : "border-amber-500/30 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                                                }`}
                                            >
                                                <i className={`fa-solid ${active_session.show_result_to_candidate ? "fa-eye" : "fa-eye-slash"} mr-1`} />
                                                {active_session.show_result_to_candidate ? "Sembunyikan" : "Tampilkan"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dynamic Proctor Token Display Box */}
                                    <div className="rounded-xl bg-gradient-to-r from-amber-950/50 via-slate-950 to-slate-950 p-5 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                                                TOKEN PROKTOR AKTIF (ANBK / CBT STYLE)
                                            </span>
                                            <div className="mt-1 flex items-center gap-3">
                                                <span className="text-3xl font-black tracking-widest text-amber-300 font-mono bg-slate-900 px-4 py-1.5 rounded-lg border border-amber-500/40 select-all shadow-inner">
                                                    {activeProctorToken ? activeProctorToken.token : "BELUM ADA TOKEN"}
                                                </span>
                                                {activeProctorToken && (
                                                    <span className="text-xs text-slate-400">
                                                        Digunakan {activeProctorToken.used_count}x
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-2">
                                                Berikan token 6 karakter di atas kepada peserta publik untuk memulai ujian.
                                            </p>
                                        </div>

                                        {activeProctorToken && (
                                            <button
                                                onClick={() => handleRotateToken(activeProctorToken.id)}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                                            >
                                                <i className="fa-solid fa-rotate text-xs" /> Rotasi Token Baru
                                            </button>
                                        )}
                                    </div>

                                    {/* Generate Custom Token Form */}
                                    <form onSubmit={handleGenerateToken} className="rounded-xl bg-slate-950/50 p-4 border border-white/5 space-y-3">
                                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                            <i className="fa-solid fa-key text-amber-400" /> Buat Token Akses Tambahan
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <input
                                                type="text"
                                                placeholder="Label Token (cth: Ruang A)"
                                                value={tokenForm.data.label}
                                                onChange={(e) => tokenForm.setData("label", e.target.value)}
                                                className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                                            />
                                            <select
                                                value={tokenForm.data.type}
                                                onChange={(e) => tokenForm.setData("type", e.target.value)}
                                                className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                                            >
                                                <option value="multi_use">Multi-Use (Ruang/Masal)</option>
                                                <option value="single_use">Single-Use (Sekali Pakai)</option>
                                            </select>
                                            <button
                                                type="submit"
                                                disabled={tokenForm.processing}
                                                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-slate-700 transition-all border border-amber-500/30"
                                            >
                                                {tokenForm.processing ? "Memproses..." : "Generate Token"}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Live Participants Monitoring Table */}
                                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div>
                                            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                                                <i className="fa-solid fa-users text-amber-400" /> Live Monitoring Peserta Ujian Publik
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Daftar real-time peserta guest/publik yang sedang atau telah mengerjakan ujian.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => router.reload()}
                                            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-white/10"
                                        >
                                            <i className="fa-solid fa-rotate-right mr-1 text-amber-400" /> Refresh Data
                                        </button>
                                    </div>

                                    {attempts.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-slate-500">
                                            Belum ada peserta yang mendaftar atau mengerjakan sesi ujian publik ini.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                        <th className="py-3 px-3">Nama Lengkap</th>
                                                        <th className="py-3 px-3">Asal Sekolah</th>
                                                        <th className="py-3 px-3">Token</th>
                                                        <th className="py-3 px-3">Waktu Masuk</th>
                                                        <th className="py-3 px-3">Status</th>
                                                        <th className="py-3 px-3">Skor</th>
                                                        <th className="py-3 px-3 text-center">Keluar Fullscreen</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {attempts.map((att) => (
                                                        <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                                                            <td className="py-3 px-3 font-bold text-white">
                                                                {att.guest_name}
                                                                {att.guest_email && <span className="block text-[10px] font-normal text-slate-500">{att.guest_email}</span>}
                                                            </td>
                                                            <td className="py-3 px-3 font-semibold text-slate-300">{att.guest_school}</td>
                                                            <td className="py-3 px-3 font-mono font-bold text-amber-400">{att.token}</td>
                                                            <td className="py-3 px-3 text-slate-400">{att.started_at ?? "-"}</td>
                                                            <td className="py-3 px-3">
                                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                                    att.status === "in_progress"
                                                                        ? "bg-amber-500/20 text-amber-300 animate-pulse"
                                                                        : "bg-emerald-500/20 text-emerald-300"
                                                                }`}>
                                                                    {att.status === "in_progress" ? "Mengerjakan" : "Selesai"}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 font-bold text-white">
                                                                {att.score !== null ? `${att.score}%` : "-"}
                                                            </td>
                                                            <td className="py-3 px-3 text-center">
                                                                <span className={`rounded-md px-2 py-0.5 text-xs font-mono font-bold ${
                                                                    att.violations_count > 0 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-slate-800 text-slate-400"
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
                </div>
            </div>

            {/* Create Public Session Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-base font-black text-white">Buat Sesi Ujian Publik Baru</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSession} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-300">Judul Sesi Ujian Publik</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Tryout Nasional Matematika 2026"
                                    value={createForm.data.title}
                                    onChange={(e) => createForm.setData("title", e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300">Paket Soal</label>
                                    <select
                                        value={createForm.data.exam_package_id}
                                        onChange={(e) => createForm.setData("exam_package_id", Number(e.target.value))}
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                                    >
                                        {packages.map((pkg) => (
                                            <option key={pkg.id} value={pkg.id}>
                                                {pkg.title} ({pkg.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300">Gelombang SPMB</label>
                                    <select
                                        value={createForm.data.admission_wave_id}
                                        onChange={(e) => createForm.setData("admission_wave_id", Number(e.target.value))}
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                                    >
                                        {waves.map((wave) => (
                                            <option key={wave.id} value={wave.id}>
                                                {wave.title} ({wave.academic_year})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300">Waktu Buka (WIB)</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={createForm.data.opens_at}
                                        onChange={(e) => createForm.setData("opens_at", e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300">Waktu Tutup (WIB)</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={createForm.data.closes_at}
                                        onChange={(e) => createForm.setData("closes_at", e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300">Durasi Pengerjaan (Menit)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="300"
                                        value={createForm.data.duration_minutes}
                                        onChange={(e) => createForm.setData("duration_minutes", Number(e.target.value))}
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300">Nilai Kelulusan (Passing Score)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={createForm.data.passing_score}
                                        onChange={(e) => createForm.setData("passing_score", Number(e.target.value))}
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                                >
                                    {createForm.processing ? "Menyimpan..." : "Buat Sesi Publik"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
