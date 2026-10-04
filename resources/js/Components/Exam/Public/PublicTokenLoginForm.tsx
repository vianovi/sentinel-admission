import { FormEvent, memo, useState } from "react";
import { showSuccessToast, showErrorToast } from "@/utils/swal";

type Props = {
    initialToken: string | null;
    tokenValid: boolean;
    themeMode?: "dark" | "light";
    clientTime: string;
};

export const PublicTokenLoginForm = memo(function PublicTokenLoginForm({ initialToken, tokenValid, themeMode = "dark", clientTime }: Props) {
    const [tokenInput, setTokenInput] = useState(initialToken ?? "");

    const handleVerifyToken = (e: FormEvent) => {
        e.preventDefault();
        if (!tokenInput.trim()) return;
        window.location.href = route("exam.public.landing", { token: tokenInput.trim().toUpperCase() });
    };

    const handlePasteToken = async () => {
        try {
            const clipText = await navigator.clipboard.readText();
            if (!clipText || !clipText.trim()) {
                showErrorToast("Papan klip (clipboard) masih kosong. Salin dulu token dari pengawas ya!");
                return;
            }
            let clean = clipText.trim();
            // Handle if a full link was copied (e.g. from WhatsApp or chat)
            if (clean.includes("/exam/p/")) {
                clean = clean.split("/exam/p/").pop()?.split(/[?#]/)[0] ?? clean;
            }
            clean = clean.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
            if (clean.length > 10) clean = clean.substring(0, 10);

            if (!clean) {
                showErrorToast("Teks di papan klip tidak berisi kode token yang valid.");
                return;
            }

            setTokenInput(clean);
            showSuccessToast(`Token "${clean}" berhasil ditempel dari papan klip!`);
        } catch {
            showErrorToast("Izin akses papan klip belum diaktifkan di browser. Silakan ketik langsung token ujian.");
        }
    };

    const isDark = themeMode === "dark";

    return (
        <div className={`mx-auto max-w-lg rounded-3xl border p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 transition-all duration-300 ${
            isDark 
                ? "border-amber-500/20 bg-slate-900/90 text-white shadow-amber-500/10" 
                : "border-slate-200 bg-white text-slate-800 shadow-slate-200/60"
        }`}>
            {/* Live Client-Side Clock */}
            <div className={`rounded-2xl border p-3.5 text-center space-y-1 transition-colors ${
                isDark ? "border-amber-500/20 bg-slate-950/80" : "border-amber-500/20 bg-amber-500/5"
            }`}>
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                    <i className="fa-regular fa-clock mr-1.5 animate-pulse" /> WAKTU SISTEM SAAT INI (WIB)
                </span>
                <span className={`font-mono text-base font-bold tracking-wide block ${isDark ? "text-white" : "text-slate-900"}`}>
                    {clientTime || "Memuat waktu..."}
                </span>
            </div>

            <form onSubmit={handleVerifyToken} className="space-y-5">
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <label htmlFor="token_input" className={`block text-xs sm:text-sm font-extrabold uppercase tracking-wider ${
                            isDark ? "text-slate-200" : "text-slate-700"
                        }`}>
                            <i className="fa-solid fa-key text-amber-500 mr-1.5" /> Kode Token Ujian
                        </label>
                        {tokenInput && (
                            <button
                                type="button"
                                onClick={() => setTokenInput("")}
                                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            >
                                Hapus
                            </button>
                        )}
                    </div>
                    
                    {/* Token Input with Quick Paste Button inside */}
                    <div className="relative flex items-center">
                        <input
                            id="token_input"
                            type="text"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                            placeholder="MISAL: X7K9P2"
                            maxLength={10}
                            className={`w-full rounded-2xl border px-4 py-4 text-center text-2xl sm:text-3xl font-mono font-black uppercase tracking-widest transition-all focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 ${
                                isDark 
                                    ? "border-white/15 bg-slate-950 text-amber-400 placeholder:text-slate-700" 
                                    : "border-slate-300 bg-slate-50 text-amber-600 placeholder:text-slate-300"
                            }`}
                            required
                        />
                    </div>
                    
                    <p className={`text-xs text-center leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Masukkan 6 karakter kode token yang diberikan oleh ustadz/ustadzah pengawas ujian.
                    </p>
                </div>

                {initialToken && !tokenValid && (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-xs sm:text-sm font-bold text-red-500">
                        <i className="fa-solid fa-circle-exclamation mr-1.5" />
                        Token <span className="font-mono font-black">{initialToken}</span> tidak ditemukan atau sesi belum dimulai.
                    </div>
                )}

                <div className="space-y-3 pt-2">
                    {/* Primary Button */}
                    <button
                        type="submit"
                        className="w-full inline-flex min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-6 text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/30 shadow-xl shadow-amber-500/25 transition-all active:scale-[0.98]"
                    >
                        <i className="fa-solid fa-arrow-right-to-bracket text-base" /> Masuk ke Ruang Ujian
                    </button>

                    {/* Secondary Button: Tempel Token dari Papan Klip */}
                    <button
                        type="button"
                        onClick={handlePasteToken}
                        className={`w-full inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl px-5 text-xs sm:text-sm font-bold transition-all border shadow-sm active:scale-[0.98] ${
                            isDark 
                                ? "bg-slate-800/90 text-amber-300 hover:bg-slate-800 hover:border-amber-400 border-amber-500/30" 
                                : "bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 border-amber-300"
                        }`}
                        title="Tempel teks token yang baru saja Anda salin"
                    >
                        <i className="fa-solid fa-paste text-base text-amber-500" />
                        <span>Tempel Token dari Papan Klip (Keyboard)</span>
                    </button>
                </div>
            </form>
        </div>
    );
});

export default PublicTokenLoginForm;
