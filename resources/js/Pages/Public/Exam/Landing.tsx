import { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import PublicTokenLoginForm from "@/Components/Exam/Public/PublicTokenLoginForm";
import PublicGuestIdentityForm, { SessionPayload } from "@/Components/Exam/Public/PublicGuestIdentityForm";
import PublicActiveSessionCard from "@/Components/Exam/Public/PublicActiveSessionCard";
import PublicExamSecurityInfo from "@/Components/Exam/Public/PublicExamSecurityInfo";

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
            <Head title="Portal Ujian - Pondok Modern Sabilurrosyad Muhammadiyah Banjarnegara" />

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
                    ? "border-white/10 bg-slate-900/80 shadow-2xl shadow-slate-950/20" 
                    : "border-slate-200/80 bg-white/85 shadow-sm"
            }`}>
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <img
                            src="/assets/icons/brand/exam-logo.png"
                            alt="Logo Pondok Modern Sabilurrosyad"
                            className="h-12 w-12 object-contain rounded-xl p-0.5 bg-white/10 dark:bg-white/5 border border-amber-500/30 shadow-md shadow-amber-500/10"
                        />
                        <div className="min-w-0">
                            <span className="font-extrabold text-sm sm:text-base tracking-wide bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent block leading-tight truncate max-w-xs sm:max-w-md md:max-w-xl">
                                Pondok Modern Sabilurrosyad Muhammadiyah Banjarnegara
                            </span>
                            <span className={`inline-block mt-0.5 rounded-md px-2 py-0.5 text-[11px] font-bold border transition-colors ${
                                isDark 
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                                    : "bg-amber-500/5 text-amber-700 border-amber-500/30"
                            }`}>
                                Portal Ujian Masuk Santri Baru (SPMB)
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <span className={`text-xs font-bold tracking-wide block ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                Waktu Server SPMB
                            </span>
                            <span className={`text-[11px] font-mono font-medium block mt-0.5 ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                                <i className="fa-regular fa-clock mr-1 animate-pulse" /> {clientTime || "Memuat..."}
                            </span>
                        </div>

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
            <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-10">
                <div className="text-center space-y-3.5">
                    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold border transition-colors ${
                        isDark 
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                            : "bg-amber-500/5 text-amber-700 border-amber-500/30"
                    }`}>
                        <i className="fa-solid fa-graduation-cap text-sm text-amber-500" /> Ujian Seleksi Masuk Santri Baru
                    </span>
                    <h1 className={`text-3xl font-black sm:text-5xl tracking-tight leading-tight ${
                        isDark ? "text-white" : "text-slate-950"
                    }`}>
                        Ruang Ujian <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">Online Santri</span>
                    </h1>
                    <p className={`mx-auto max-w-2xl text-sm sm:text-base leading-relaxed ${
                        isDark ? "text-slate-300" : "text-slate-600"
                    }`}>
                        Selamat datang di ruang ujian seleksi Pondok Modern Sabilurrosyad Muhammadiyah Banjarnegara. Masukkan kode token dari pengawas ujian untuk memulai. Kerjakan dengan tenang, teliti, dan penuh kejujuran ya!
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-12 items-start max-w-4xl mx-auto">
                    <div className={(session && initialToken && token_valid) || activeSession ? "lg:col-span-12 w-full" : "lg:col-span-7 w-full"}>
                        {activeSession ? (
                            <PublicActiveSessionCard
                                activeSession={activeSession}
                                isDark={isDark}
                                handleResumeSession={handleResumeSession}
                                handleDismissActiveSession={handleDismissActiveSession}
                            />
                        ) : !initialToken || !token_valid ? (
                            <PublicTokenLoginForm initialToken={initialToken} tokenValid={token_valid} themeMode={themeMode} clientTime={clientTime} />
                        ) : session && initialToken ? (
                            <PublicGuestIdentityForm token={initialToken} session={session} themeMode={themeMode} />
                        ) : null}
                    </div>

                    {!activeSession && (!session || !initialToken || !token_valid) && (
                        <PublicExamSecurityInfo isDark={isDark} />
                    )}
                </div>
            </main>
        </div>
    );
}
