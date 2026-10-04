import { FormEvent, memo } from "react";
import { useForm } from "@inertiajs/react";

export type PackagePayload = {
    id: number;
    title: string;
    subject_name: string | null;
    duration_minutes: number;
};

export type SessionPayload = {
    title: string;
    description: string | null;
    instructions: string | null;
    duration_minutes: number;
    opens_at: string | null;
    closes_at: string | null;
    token_label: string | null;
    is_open: boolean;
    package_order_type: string | null;
    packages: PackagePayload[];
};

type Props = {
    token: string;
    session: SessionPayload;
    themeMode?: "dark" | "light";
};

type GuestFormData = {
    guest_name: string;
    guest_school: string;
    guest_email: string;
    guest_phone: string;
    package_id: number | string;
    token?: string;
};

export const PublicGuestIdentityForm = memo(function PublicGuestIdentityForm({ token, session, themeMode = "dark" }: Props) {
    const { data, setData, post, processing, errors } = useForm<GuestFormData>({
        guest_name: "",
        guest_school: "",
        guest_email: "",
        guest_phone: "",
        package_id: session.packages?.[0]?.id ?? "",
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
                                Ujian Publik
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

                    <div className={`mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 rounded-xl p-4 border transition-colors ${
                        isDark ? "bg-slate-950/60 border-white/5" : "bg-slate-50 border-slate-200"
                    }`}>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status Token</span>
                            <p className="text-sm font-bold text-amber-500 mt-0.5">Token Aktif</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Waktu Buka</span>
                            <p className={`text-sm font-bold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{session.opens_at ?? "-"}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Waktu Tutup</span>
                            <p className={`text-sm font-bold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{session.closes_at ?? "-"}</p>
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
                    <h3 className={`text-lg font-black flex items-center gap-2 ${isDark ? "text-white" : "text-slate-950"}`}>
                        <i className="fa-solid fa-user-pen text-amber-500" /> Identitas Santri
                    </h3>
                    <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Isi data diri di bawah ini dengan benar sebelum memulai pengerjaan soal.
                    </p>

                    {errors.token && (
                        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs sm:text-sm text-red-500 font-semibold flex items-start gap-2">
                            <i className="fa-solid fa-circle-exclamation text-base shrink-0 mt-0.5" />
                            <span>{errors.token}</span>
                        </div>
                    )}

                    <form onSubmit={handleStartExam} className="mt-5 space-y-4">
                        <div>
                            <label htmlFor="guest_name" className={`block text-xs sm:text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                Nama Lengkap Santri <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="guest_name"
                                type="text"
                                value={data.guest_name}
                                onChange={(e) => setData("guest_name", e.target.value)}
                                placeholder="Contoh: Muhammad Farhan"
                                className={`mt-1.5 w-full rounded-2xl border px-4 py-3 text-sm sm:text-base font-medium focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all ${
                                    isDark 
                                        ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-700" 
                                        : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                                }`}
                                required
                            />
                            {errors.guest_name && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.guest_name}</p>}
                        </div>

                        <div>
                            <label htmlFor="guest_school" className={`block text-xs sm:text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                Asal Sekolah / Madrasah <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="guest_school"
                                type="text"
                                value={data.guest_school}
                                onChange={(e) => setData("guest_school", e.target.value)}
                                placeholder="Contoh: SD Muhammadiyah 1 / MTs Al-Falah"
                                className={`mt-1.5 w-full rounded-2xl border px-4 py-3 text-sm sm:text-base font-medium focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all ${
                                    isDark 
                                        ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-700" 
                                        : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                                }`}
                                required
                            />
                            {errors.guest_school && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.guest_school}</p>}
                        </div>
                        
                        {session.packages && session.packages.length > 0 && (
                            <div>
                                <label className={`block text-xs sm:text-sm font-bold mb-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                    Pilih Paket Soal <span className="text-red-500">*</span>
                                </label>
                                <div className="space-y-2.5">
                                    {session.packages.map((pkg) => (
                                        <button
                                            key={pkg.id}
                                            type="button"
                                            onClick={() => setData("package_id", pkg.id)}
                                            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                                                data.package_id === pkg.id
                                                    ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/40 shadow-sm"
                                                    : isDark
                                                    ? "border-white/10 bg-slate-950/50 hover:bg-slate-900 text-slate-300"
                                                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                                            }`}
                                        >
                                            <div>
                                                <div className={`text-sm sm:text-base font-bold ${data.package_id === pkg.id ? "text-amber-400" : ""}`}>
                                                    {pkg.title}
                                                </div>
                                                <div className="text-xs mt-1 flex items-center gap-3 opacity-80">
                                                    <span><i className="fa-solid fa-book mr-1 text-amber-500" />{pkg.subject_name}</span>
                                                    <span><i className="fa-solid fa-clock mr-1 text-amber-500" />{pkg.duration_minutes} Menit</span>
                                                </div>
                                            </div>
                                            {data.package_id === pkg.id && (
                                                <i className="fa-solid fa-circle-check text-amber-500 text-xl" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {errors.package_id && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.package_id}</p>}
                            </div>
                        )}

                        <div>
                            <label htmlFor="guest_email" className={`block text-xs sm:text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                Email Santri / Orang Tua <span className="text-slate-400 text-xs">(Opsional)</span>
                            </label>
                            <input
                                id="guest_email"
                                type="email"
                                value={data.guest_email}
                                onChange={(e) => setData("guest_email", e.target.value)}
                                placeholder="contoh@gmail.com"
                                className={`mt-1.5 w-full rounded-2xl border px-4 py-3 text-sm sm:text-base font-medium focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all ${
                                    isDark 
                                        ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-700" 
                                        : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                                }`}
                            />
                            {errors.guest_email && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.guest_email}</p>}
                        </div>

                        <div>
                            <label htmlFor="guest_phone" className={`block text-xs sm:text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                No. WhatsApp Santri / Wali <span className="text-slate-400 text-xs">(Opsional)</span>
                            </label>
                            <input
                                id="guest_phone"
                                type="tel"
                                value={data.guest_phone}
                                onChange={(e) => setData("guest_phone", e.target.value)}
                                placeholder="081234567890"
                                className={`mt-1.5 w-full rounded-2xl border px-4 py-3 text-sm sm:text-base font-medium focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all ${
                                    isDark 
                                        ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-700" 
                                        : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                                }`}
                            />
                            {errors.guest_phone && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.guest_phone}</p>}
                        </div>

                        <div className="pt-3">
                            <button
                                type="submit"
                                disabled={processing || !session.is_open || !data.package_id}
                                className="w-full inline-flex min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 px-6 text-sm sm:text-base font-black text-slate-950 hover:from-emerald-400 hover:to-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <i className="fa-solid fa-play text-sm" /> {processing ? "Menyiapkan Lembar Soal..." : "Mulai Kerjakan Ujian Sekarang"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
});

export default PublicGuestIdentityForm;
