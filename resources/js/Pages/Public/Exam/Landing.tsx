import { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import PublicTokenLoginForm from "@/Components/Exam/Public/PublicTokenLoginForm";
import PublicGuestIdentityForm, { SessionPayload } from "@/Components/Exam/Public/PublicGuestIdentityForm";

type Props = {
    token: string | null;
    token_valid: boolean;
    session: SessionPayload | null;
    server_time: string;
};

type ActiveExamSession = {
    attemptId: number;
    guestName: string;
    guestSchool: string;
    sessionTitle: string;
    subjectName?: string;
    startedAt: string;
    expiresAt: string;
};

export default function PublicExamLanding({ token: initialToken, token_valid, session }: Props) {
    const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
    const [clientTime, setClientTime] = useState("");
    const [activeTab, setActiveTab] = useState<"flow" | "backup" | "security">("security");
    const [activeSession, setActiveSession] = useState<ActiveExamSession | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("SENTINEL_PUBLIC_EXAM_ACTIVE_SESSION");
            if (raw) {
                const parsed = JSON.parse(raw) as ActiveExamSession;
                if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() > Date.now()) {
                    setActiveSession(parsed);
                } else {
                    localStorage.removeItem("SENTINEL_PUBLIC_EXAM_ACTIVE_SESSION");
                }
            }
        } catch {
            localStorage.removeItem("SENTINEL_PUBLIC_EXAM_ACTIVE_SESSION");
        }
    }, []);

    const handleResumeSession = () => {
        if (!activeSession) return;
        router.post(
            route("exam.public.attempts.resume", { attempt: activeSession.attemptId }),
            {
                guest_name: activeSession.guestName,
                guest_school: activeSession.guestSchool,
            },
            {
                onError: () => {
                    localStorage.removeItem("SENTINEL_PUBLIC_EXAM_ACTIVE_SESSION");
                    setActiveSession(null);
                },
            }
        );
    };

    const handleDismissActiveSession = () => {
        localStorage.removeItem("SENTINEL_PUBLIC_EXAM_ACTIVE_SESSION");
        setActiveSession(null);
    };

    useEffect(() => {
        const saved = localStorage.getItem("sentinel-theme") as "dark" | "light" | null;
        const initial = saved || (document.documentElement.classList.contains("dark") ? "dark" : "light");
        setThemeMode(initial);
        if (initial === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });
            const dateStr = now.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
            });
            setClientTime(`${dateStr} · ${timeStr} WIB`);
        };

        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleTheme = () => {
        setThemeMode((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            localStorage.setItem("sentinel-theme", next);
            if (next === "dark") {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
            return next;
        });
    };

    const isDark = themeMode === "dark";

    return (
        <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
            isDark 
                ? "bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-white" 
                : "bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-slate-950"
        }`}>
            {/* Cyber Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30"
                 style={{
                     backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? '#f59e0b' : '#d97706'} 1px, transparent 0)`,
                     backgroundSize: "32px 32px"
                 }}
            />

            {/* Futuristic Glowing Orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] animate-pulse duration-[6000ms]" />
                <div className="absolute right-0 top-1/4 h-[600px] w-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[140px]" />
                <div className="absolute left-1/3 bottom-10 h-[400px] w-[400px] rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-[100px]" />
            </div>

            {/* Top Bar with Glassmorphic design */}
            <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-all duration-300 ${
                isDark 
                    ? "border-white/10 bg-slate-900/60 shadow-2xl shadow-slate-950/20" 
                    : "border-slate-200/80 bg-white/70 shadow-sm"
            }`}>
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20 ring-1 ring-white/20">
                            S
                        </div>
                        <div>
                            <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                                SENTINEL
                            </span>
                            <span className={`ml-2 rounded px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                                isDark 
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                                    : "bg-amber-500/5 text-amber-700 border-amber-500/30"
                            }`}>
                                EXAM ENGINE
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <span className={`text-xs font-bold tracking-wide block ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                Public Access Portal
                            </span>
                            <span className={`text-[10px] font-mono font-medium block mt-0.5 ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                                <i className="fa-regular fa-clock mr-1 animate-pulse" /> {clientTime || "Memuat..."}
                            </span>
                        </div>

                        {/* Theme Toggle Button */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all border flex items-center gap-1.5 shadow-sm active:scale-95 ${
                                isDark
                                    ? "bg-slate-900 text-amber-300 border-white/10 hover:bg-slate-800 hover:border-amber-500/40"
                                    : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:border-amber-600/40"
                            }`}
                            title="Beralih Tema (Terang / Gelap)"
                        >
                            <i className={`fa-solid ${isDark ? "fa-sun text-amber-400" : "fa-moon text-indigo-600"}`} />
                            <span className="hidden sm:inline">{isDark ? "Mode Terang" : "Mode Gelap"}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content container */}
            <main className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-12">
                
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold border transition-colors ${
                        isDark 
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                            : "bg-amber-500/5 text-amber-700 border-amber-500/30"
                    }`}>
                        <i className="fa-solid fa-shield-halved text-xs animate-pulse text-amber-500" /> Portal Ujian Mandiri Resmi
                    </span>
                    <h1 className={`text-3xl font-black sm:text-5xl tracking-tight leading-none ${
                        isDark ? "text-white" : "text-slate-950"
                    }`}>
                        Akses Portal <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">Ujian Publik</span>
                    </h1>
                    <p className={`mx-auto max-w-2xl text-xs sm:text-sm leading-relaxed ${
                        isDark ? "text-slate-400" : "text-slate-600"
                    }`}>
                        Selamat datang di portal pengerjaan ujian mandiri Sentinel. Silakan masukkan token unik ujian Anda yang valid untuk mendaftarkan identitas dan memulai sesi pengerjaan.
                    </p>
                </div>

                {/* Form & Security Information Split Layout */}
                <div className="grid gap-8 lg:grid-cols-12 items-start max-w-4xl mx-auto">
                    
                    {/* Left: Input Form (Spans 7 cols on large screens, or full width if session is verified) */}
                    <div className={(session && initialToken && token_valid) || activeSession ? "lg:col-span-12 w-full" : "lg:col-span-7 w-full"}>
                        {activeSession ? (
                            <div className={`rounded-2xl border p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
                                isDark ? "border-amber-500/30 bg-slate-900/80 text-slate-200" : "border-amber-400 bg-white text-slate-800"
                            }`}>
                                <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                                            Sesi Ujian Aktif Terdeteksi Pada Browser Ini
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleDismissActiveSession}
                                        className="text-xs text-slate-400 hover:text-rose-500 underline transition-colors"
                                    >
                                        Bukan Saya / Hapus Sesi
                                    </button>
                                </div>

                                <div className="mt-5 space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                        <div>
                                            <div className="text-xs font-semibold uppercase text-amber-500">Peserta Ujian</div>
                                            <h3 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>
                                                {activeSession.guestName}
                                            </h3>
                                            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                                Asal Sekolah: <span className="font-semibold">{activeSession.guestSchool}</span>
                                            </p>
                                        </div>
                                        <div className={`text-left sm:text-right p-3 rounded-xl border ${
                                            isDark ? "border-white/10 bg-slate-800/60" : "border-slate-200 bg-slate-50"
                                        }`}>
                                            <div className="text-[10px] font-bold uppercase text-slate-400">Judul Ujian</div>
                                            <div className="text-xs font-extrabold text-amber-500">{activeSession.sessionTitle}</div>
                                            {activeSession.subjectName && (
                                                <div className="text-[11px] text-slate-400">{activeSession.subjectName}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`rounded-xl border p-4 text-xs flex items-start gap-3 ${
                                        isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-900"
                                    }`}>
                                        <i className="fa-solid fa-triangle-exclamation text-amber-500 text-base shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold">Perangkat ini mendeteksi sesi pengerjaan ujian yang belum selesai.</p>
                                            <p className="mt-1 opacity-90">Sistem Sentinel menyimpan status pengerjaan secara lokal dan real-time di browser Anda. Klik tombol di bawah untuk langsung kembali ke lembar soal tanpa memasukkan token kembali.</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleResumeSession}
                                        className="w-full py-4 px-6 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xl shadow-amber-500/25 active:scale-[0.99] transition-all duration-200 text-center flex items-center justify-center gap-3 text-sm tracking-wide"
                                    >
                                        <i className="fa-solid fa-play text-xs" />
                                        Lanjutkan Sesi Ujian Saya Sekarang
                                    </button>
                                </div>
                            </div>
                        ) : !initialToken || !token_valid ? (
                            <PublicTokenLoginForm initialToken={initialToken} tokenValid={token_valid} themeMode={themeMode} clientTime={clientTime} />
                        ) : session && initialToken ? (
                            <PublicGuestIdentityForm token={initialToken} session={session} themeMode={themeMode} />
                        ) : null}
                    </div>

                    {/* Right: Interactive Security & Integrity Feature Dashboard (Hidden if active session or guest identity form is active to save space) */}
                    {!activeSession && (!session || !initialToken || !token_valid) && (
                        <div className="lg:col-span-5 w-full space-y-4">
                            <div className={`rounded-2xl border p-5 shadow-xl backdrop-blur-xl transition-all duration-300 ${
                                isDark ? "border-white/10 bg-slate-900/40 text-slate-300" : "border-slate-200 bg-white text-slate-800"
                            }`}>
                                <h3 className={`text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 border-b pb-3 mb-4 ${
                                    isDark ? "border-white/10 text-white" : "border-slate-200 text-slate-950"
                                }`}>
                                    <i className="fa-solid fa-circle-info text-amber-500" /> Panduan & Sistem Ujian
                                </h3>

                                {/* Tab Selector */}
                                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950/60 mb-4 border border-slate-200 dark:border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("flow")}
                                        className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                                            activeTab === "flow"
                                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <i className="fa-solid fa-route text-xs" />
                                        <span>Alur</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("backup")}
                                        className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                                            activeTab === "backup"
                                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <i className="fa-solid fa-rotate text-xs" />
                                        <span>Backup</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("security")}
                                        className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                                            activeTab === "security"
                                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <i className="fa-solid fa-shield-halved text-xs" />
                                        <span>Keamanan</span>
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="space-y-4 min-h-[190px] flex flex-col justify-start">
                                    {activeTab === "flow" && (
                                        <div className="space-y-3 animate-fadeIn">
                                            <p className="text-[10px] leading-relaxed text-slate-500">
                                                Alur pengerjaan ujian mandiri dirancang secara linier dan terstruktur:
                                            </p>
                                            <div className="relative pl-5 border-l border-amber-500/20 space-y-3.5 mt-2">
                                                <div className="relative">
                                                    <div className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">1</div>
                                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Masuk dengan Token</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Dapatkan token ujian dari admin/proktor dan verifikasi di halaman ini.</p>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">2</div>
                                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Isi Identitas</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Isi nama lengkap, sekolah/instansi, dan info opsional lainnya secara benar.</p>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">3</div>
                                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Konfirmasi & Mulai</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Kunci layar penuh (fullscreen) diaktifkan, dan timer ujian mulai berjalan.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "backup" && (
                                        <div className="space-y-3.5 animate-fadeIn">
                                            <div className="flex gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    <i className="fa-solid fa-rotate text-xs" />
                                                </div>
                                                <div>
                                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Sinkronisasi Cepat (400ms)</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Setiap kali Anda memilih atau mengubah opsi jawaban, sistem mengirimkannya ke cloud dalam waktu kurang dari 400 milidetik.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    <i className="fa-solid fa-hard-drive text-xs" />
                                                </div>
                                                <div>
                                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Proteksi Offline (Local Storage)</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Jika koneksi internet putus, jawaban Anda tetap tersimpan di browser dan akan disinkronkan kembali secara otomatis saat online.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    <i className="fa-solid fa-power-off text-xs" />
                                                </div>
                                                <div>
                                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Auto-Resume Ujian</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Apabila perangkat mati mendadak atau browser tertutup, Anda dapat masuk kembali ke portal untuk melanjutkan ujian dari sisa waktu terakhir.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "security" && (
                                        <div className="space-y-3.5 animate-fadeIn">
                                            <div className="flex gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                                                    <i className="fa-solid fa-expand text-xs" />
                                                </div>
                                                <div>
                                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Layar Penuh Wajib</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Ujian berjalan otomatis dalam mode fullscreen. Keluar dari fullscreen dicatat sebagai pelanggaran.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                                                    <i className="fa-solid fa-eye text-xs" />
                                                </div>
                                                <div>
                                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Deteksi Blur & Ganti Tab</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Membuka tab baru, beralih aplikasi, atau memindahkan fokus kursor di luar ujian akan memicu sanksi pelanggaran.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                                                    <i className="fa-solid fa-desktop text-xs" />
                                                </div>
                                                <div>
                                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Deteksi Screen Sharing</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Sistem mendeteksi dan mencegah penggunaan screen sharing atau monitor tambahan saat ujian berlangsung.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Technical Requirements Info */}
                            <div className={`rounded-xl border p-4 text-[10px] leading-relaxed transition-colors ${
                                isDark ? "bg-slate-900/20 border-white/5 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-600"
                            }`}>
                                <p className="font-bold mb-1">Syarat Teknis Ujian:</p>
                                <ul className="list-disc pl-4 space-y-0.5">
                                    <li>Gunakan browser modern (Chrome, Edge, Firefox, Safari terupdate).</li>
                                    <li>Pastikan koneksi internet stabil sepanjang pengerjaan.</li>
                                    <li>Matikan ekstensi penerjemah bahasa atau perekam layar.</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
