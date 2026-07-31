import { useState } from "react";
import { Head, useForm } from "@inertiajs/react";

type SessionPayload = {
    title: string;
    description: string | null;
    instructions: string | null;
    subject_name: string | null;
    duration_minutes: number;
    opens_at: string | null;
    closes_at: string | null;
    token_label: string | null;
    is_open: boolean;
};

type Props = {
    token: string | null;
    token_valid: boolean;
    session: SessionPayload | null;
    server_time: string;
};

export default function PublicExamLanding({ token: initialToken, token_valid, session }: Props) {
    const [tokenInput, setTokenInput] = useState(initialToken ?? "");

    const { data, setData, post, processing, errors } = useForm({
        guest_name: "",
        guest_email: "",
        guest_phone: "",
    });

    const handleVerifyToken = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tokenInput.trim()) return;
        window.location.href = route("exam.public.landing", { token: tokenInput.trim().toUpperCase() });
    };

    const handleStartExam = (e: React.FormEvent) => {
        e.preventDefault();
        if (!initialToken) return;
        post(route("exam.public.start", { token: initialToken }));
    };

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
                    /* Step 1: Token Input Form */
                    <div className="mt-10 mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                        <form onSubmit={handleVerifyToken} className="space-y-5">
                            <div>
                                <label htmlFor="token_input" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                                    Token Ujian
                                </label>
                                <div className="mt-2 relative">
                                    <input
                                        id="token_input"
                                        type="text"
                                        value={tokenInput}
                                        onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                                        placeholder="CONTOH: X7K9P2"
                                        maxLength={10}
                                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 text-center text-xl font-mono font-black uppercase text-amber-400 tracking-widest placeholder:text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                        required
                                    />
                                </div>
                                <p className="mt-2 text-[11px] text-slate-500 text-center">
                                    Kode token terdiri dari 6 karakter huruf & angka.
                                </p>
                            </div>

                            {initialToken && !token_valid && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-center text-xs text-red-300">
                                    <i className="fa-solid fa-circle-exclamation mr-1.5" />
                                    Token <span className="font-mono font-bold text-red-200">{initialToken}</span> tidak ditemukan atau sudah kedaluwarsa.
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 text-sm font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-lg shadow-amber-500/25 transition-all"
                            >
                                <i className="fa-solid fa-key text-xs" /> Verifikasi Token Ujian
                            </button>
                        </form>
                    </div>
                ) : session ? (
                    /* Step 2: Session Details & Identity Form */
                    <div className="mt-10 grid gap-6 md:grid-cols-12">
                        {/* Session Information Card */}
                        <div className="md:col-span-7 space-y-6">
                            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                            {session.subject_name ?? "Ujian Online"}
                                        </span>
                                        <h2 className="text-xl font-black text-white mt-0.5">{session.title}</h2>
                                    </div>
                                    <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                                        session.is_open 
                                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                            : "border-red-500/30 bg-red-500/10 text-red-400"
                                    }`}>
                                        {session.is_open ? "Sesi Buka" : "Sesi Ditutup"}
                                    </span>
                                </div>

                                {session.description && (
                                    <p className="mt-4 text-xs text-slate-300 leading-relaxed">{session.description}</p>
                                )}

                                <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-950/60 p-4 border border-white/5">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Durasi Pengerjaan</span>
                                        <p className="text-sm font-bold text-white mt-0.5">{session.duration_minutes} Menit</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status Token</span>
                                        <p className="text-sm font-bold text-amber-400 mt-0.5">Token Aktif</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Waktu Buka</span>
                                        <p className="text-xs font-semibold text-slate-300 mt-0.5">{session.opens_at ?? "-"}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Waktu Tutup</span>
                                        <p className="text-xs font-semibold text-slate-300 mt-0.5">{session.closes_at ?? "-"}</p>
                                    </div>
                                </div>

                                {session.instructions && (
                                    <div className="mt-6">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Petunjuk Ujian</h3>
                                        <div className="rounded-xl bg-slate-950/40 p-4 text-xs text-slate-300 leading-relaxed border border-white/5 space-y-1">
                                            {session.instructions}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Identity Input & Start Card */}
                        <div className="md:col-span-5">
                            <div className="rounded-2xl border border-amber-500/20 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
                                <h3 className="text-base font-black text-white flex items-center gap-2">
                                    <i className="fa-solid fa-user-pen text-amber-400" /> Identitas Peserta
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Isi data berikut untuk keperluan pencatatan hasil ujian publik Anda.
                                </p>

                                <form onSubmit={handleStartExam} className="mt-5 space-y-4">
                                    <div>
                                        <label htmlFor="guest_name" className="block text-xs font-bold text-slate-300">
                                            Nama Lengkap <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            id="guest_name"
                                            type="text"
                                            value={data.guest_name}
                                            onChange={(e) => setData("guest_name", e.target.value)}
                                            placeholder="Masukkan nama lengkap Anda"
                                            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            required
                                        />
                                        {errors.guest_name && <p className="mt-1 text-[11px] text-red-400">{errors.guest_name}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="guest_email" className="block text-xs font-bold text-slate-300">
                                            Email <span className="text-slate-500">(Opsional)</span>
                                        </label>
                                        <input
                                            id="guest_email"
                                            type="email"
                                            value={data.guest_email}
                                            onChange={(e) => setData("guest_email", e.target.value)}
                                            placeholder="contoh@email.com"
                                            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        />
                                        {errors.guest_email && <p className="mt-1 text-[11px] text-red-400">{errors.guest_email}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="guest_phone" className="block text-xs font-bold text-slate-300">
                                            No. WhatsApp / HP <span className="text-slate-500">(Opsional)</span>
                                        </label>
                                        <input
                                            id="guest_phone"
                                            type="tel"
                                            value={data.guest_phone}
                                            onChange={(e) => setData("guest_phone", e.target.value)}
                                            placeholder="081234567890"
                                            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        />
                                        {errors.guest_phone && <p className="mt-1 text-[11px] text-red-400">{errors.guest_phone}</p>}
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={processing || !session.is_open}
                                            className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 text-sm font-bold text-white hover:from-emerald-400 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <i className="fa-solid fa-play text-xs" /> {processing ? "Menyiapkan Ujian..." : "Mulai Kerjakan Ujian"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}
