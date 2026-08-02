import { Head } from "@inertiajs/react";
import PublicTokenLoginForm from "@/Components/Exam/Public/PublicTokenLoginForm";
import PublicGuestIdentityForm, { SessionPayload } from "@/Components/Exam/Public/PublicGuestIdentityForm";

type Props = {
    token: string | null;
    token_valid: boolean;
    session: SessionPayload | null;
    server_time: string;
};

export default function PublicExamLanding({ token: initialToken, token_valid, session }: Props) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-white">
            <Head title="Ujian Online Umum - Sentinel Admission" />

            {/* Background Decorative Glows */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
                <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 border-b border-white/10 bg-slate-900/60 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20">
                            S
                        </div>
                        <div>
                            <span className="font-black text-white text-base tracking-wide">SENTINEL</span>
                            <span className="ml-2 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                                EXAM ENGINE
                            </span>
                        </div>
                    </div>

                    <div className="text-right text-xs text-slate-400 hidden sm:block">
                        <span className="font-semibold text-slate-200">Public Access Portal</span>
                        <p className="text-[11px] text-slate-500">Secure Token Verification</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:px-6">
                <div className="text-center space-y-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                        <i className="fa-solid fa-shield-halved text-xs" /> Ujian Online Mandiri
                    </span>
                    <h1 className="text-3xl font-black text-white sm:text-4xl tracking-tight">
                        Portal Akses Ujian Publik
                    </h1>
                    <p className="mx-auto max-w-xl text-sm text-slate-400">
                        Masukkan token akses ujian yang diberikan oleh pengawas atau panitia untuk memulai sesi ujian online Anda.
                    </p>
                </div>

                {!initialToken || !token_valid ? (
                    <PublicTokenLoginForm initialToken={initialToken} tokenValid={token_valid} />
                ) : session && initialToken ? (
                    <PublicGuestIdentityForm token={initialToken} session={session} />
                ) : null}
            </main>
        </div>
    );
}
