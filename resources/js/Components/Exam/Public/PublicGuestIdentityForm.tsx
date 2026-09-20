import { FormEvent, memo } from "react";
import { useForm } from "@inertiajs/react";

export type SessionPayload = {
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
    token: string;
    session: SessionPayload;
    themeMode?: "dark" | "light";
};

export const PublicGuestIdentityForm = memo(function PublicGuestIdentityForm({ token, session, themeMode = "dark" }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        guest_name: "",
        guest_school: "",
        guest_email: "",
        guest_phone: "",
    });

    const isDark = themeMode === "dark";

    const handleStartExam = (e: FormEvent) => {
        e.preventDefault();
        post(route("exam.public.start", { token }));
    };

    return (
        <div className="mt-10 grid gap-6 md:grid-cols-12 items-start">
            {/* Session Information Card */}
            <div className="md:col-span-7 space-y-6">
                <div className={`rounded-2xl border p-6 shadow-xl backdrop-blur-xl transition-all duration-300 ${
                    isDark 
                        ? "border-white/10 bg-slate-900/80 text-white" 
                        : "border-slate-200 bg-white text-slate-800"
                }`}>
                    <div className={`flex items-center justify-between border-b pb-4 ${
                        isDark ? "border-white/10" : "border-slate-200"
                    }`}>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                                {session.subject_name ?? "Ujian Online"}
                            </span>
                            <h2 className={`text-xl font-black mt-0.5 ${isDark ? "text-white" : "text-slate-950"}`}>{session.title}</h2>
                        </div>
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors ${
                            session.is_open 
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border-red-500/30 bg-red-500/10 text-red-500"
                        }`}>
                            {session.is_open ? "Sesi Buka" : "Sesi Ditutup"}
                        </span>
                    </div>

                    {session.description && (
                        <p className={`mt-4 text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{session.description}</p>
                    )}

                    <div className={`mt-6 grid grid-cols-2 gap-4 rounded-xl p-4 border transition-colors ${
                        isDark ? "bg-slate-950/60 border-white/5" : "bg-slate-50 border-slate-200"
                    }`}>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Durasi Pengerjaan</span>
                            <p className={`text-sm font-bold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{session.duration_minutes} Menit</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status Token</span>
                            <p className="text-sm font-bold text-amber-500 mt-0.5">Token Aktif</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Waktu Buka</span>
                            <p className={`text-xs font-semibold mt-0.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{session.opens_at ?? "-"}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Waktu Tutup</span>
                            <p className={`text-xs font-semibold mt-0.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{session.closes_at ?? "-"}</p>
                        </div>
                    </div>

                    {session.instructions && (
                        <div className="mt-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Petunjuk Ujian</h3>
                            <div className={`rounded-xl p-4 text-xs leading-relaxed border transition-colors ${
                                isDark ? "bg-slate-950/40 text-slate-300 border-white/5" : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}>
                                {session.instructions}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Identity Input & Start Card */}
            <div className="md:col-span-5">
                <div className={`rounded-2xl border p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
                    isDark 
                        ? "border-amber-500/20 bg-slate-900/80 text-white shadow-amber-500/5" 
                        : "border-slate-200 bg-white text-slate-800 shadow-slate-200/50"
                }`}>
                    <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? "text-white" : "text-slate-950"}`}>
                        <i className="fa-solid fa-user-pen text-amber-500" /> Identitas Peserta
                    </h3>
                    <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Isi data berikut untuk kebutuhan pencatatan hasil ujian publik Anda.
                    </p>

                    <form onSubmit={handleStartExam} className="mt-5 space-y-4">
                        <div>
                            <label htmlFor="guest_name" className={`block text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="guest_name"
                                type="text"
                                value={data.guest_name}
                                onChange={(e) => setData("guest_name", e.target.value)}
                                placeholder="Masukkan nama lengkap Anda"
                                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all ${
                                    isDark 
                                        ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-800" 
                                        : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-300"
                                }`}
                                required
                            />
                            {errors.guest_name && <p className="mt-1 text-[11px] text-red-500">{errors.guest_name}</p>}
                        </div>

                        <div>
                            <label htmlFor="guest_school" className={`block text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                Asal Sekolah <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="guest_school"
                                type="text"
                                value={data.guest_school}
                                onChange={(e) => setData("guest_school", e.target.value)}
                                placeholder="Contoh: SMP Negeri 1 / SMA 2"
                                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all ${
                                    isDark 
                                        ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-800" 
                                        : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-300"
                                }`}
                                required
                            />
                            {errors.guest_school && <p className="mt-1 text-[11px] text-red-500">{errors.guest_school}</p>}
                        </div>

                        <div>
                            <label htmlFor="guest_email" className={`block text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                Email <span className="text-slate-500">(Opsional)</span>
                            </label>
                            <input
                                id="guest_email"
                                type="email"
                                value={data.guest_email}
                                onChange={(e) => setData("guest_email", e.target.value)}
                                placeholder="contoh@email.com"
                                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all ${
                                    isDark 
                                        ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-800" 
                                        : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-300"
                                }`}
                            />
                            {errors.guest_email && <p className="mt-1 text-[11px] text-red-500">{errors.guest_email}</p>}
                        </div>

                        <div>
                            <label htmlFor="guest_phone" className={`block text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                No. WhatsApp / HP <span className="text-slate-500">(Opsional)</span>
                            </label>
                            <input
                                id="guest_phone"
                                type="tel"
                                value={data.guest_phone}
                                onChange={(e) => setData("guest_phone", e.target.value)}
                                placeholder="081234567890"
                                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all ${
                                    isDark 
                                        ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-800" 
                                        : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-300"
                                }`}
                            />
                            {errors.guest_phone && <p className="mt-1 text-[11px] text-red-500">{errors.guest_phone}</p>}
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing || !session.is_open}
                                className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 text-sm font-bold text-white hover:from-emerald-400 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <i className="fa-solid fa-play text-xs" /> {processing ? "Menyiapkan Ujian..." : "Mulai Kerjakan Ujian"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
});

export default PublicGuestIdentityForm;
