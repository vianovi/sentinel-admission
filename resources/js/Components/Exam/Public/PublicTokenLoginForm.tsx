import { FormEvent, memo, useState } from "react";
import { showSuccessToast } from "@/utils/swal";

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

    const copyDirectLink = () => {
        const cleanToken = tokenInput.trim().toUpperCase();
        if (cleanToken.length >= 4) {
            const directUrl = `${window.location.origin}/exam/p/${cleanToken}`;
            navigator.clipboard.writeText(directUrl);
            showSuccessToast("Link Direct Ujian dengan Token berhasil disalin!");
        } else {
            const portalUrl = `${window.location.origin}/exam/p`;
            navigator.clipboard.writeText(portalUrl);
            showSuccessToast("Link Portal Ujian berhasil disalin!");
        }
    };

    const isDark = themeMode === "dark";
    const hasTokenEntered = tokenInput.trim().length >= 4;

    return (
        <div className={`mx-auto max-w-md rounded-2xl border p-6 shadow-2xl backdrop-blur-xl sm:p-8 space-y-6 transition-all duration-300 ${
            isDark 
                ? "border-amber-500/20 bg-slate-900/80 text-white shadow-amber-500/5" 
                : "border-slate-200 bg-white text-slate-800 shadow-slate-200/50"
        }`}>
            {/* Live Client-Side Clock */}
            <div className={`rounded-xl border p-3 text-center space-y-0.5 transition-colors ${
                isDark ? "border-amber-500/20 bg-slate-950/80" : "border-amber-500/20 bg-amber-500/5"
            }`}>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-500 block">
                    <i className="fa-regular fa-clock mr-1 animate-pulse" /> WAKTU SISTEM SAAT INI (WIB)
                </span>
                <span className={`font-mono text-sm font-bold tracking-wide block ${isDark ? "text-white" : "text-slate-900"}`}>
                    {clientTime || "Memuat waktu..."}
                </span>
            </div>

            <form onSubmit={handleVerifyToken} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="token_input" className={`block text-xs font-extrabold uppercase tracking-wider ${
                        isDark ? "text-slate-300" : "text-slate-700"
                    }`}>
                        Token Akses Ujian
                    </label>
                    <div className="relative">
                        <input
                            id="token_input"
                            type="text"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                            placeholder="CONTOH: X7K9P2"
                            maxLength={10}
                            className={`w-full rounded-xl border px-4 py-3.5 text-center text-2xl font-mono font-black uppercase tracking-widest transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                                isDark 
                                    ? "border-white/10 bg-slate-950 text-amber-400 placeholder:text-slate-800" 
                                    : "border-slate-200 bg-slate-50 text-amber-700 placeholder:text-slate-300"
                            }`}
                            required
                        />
                    </div>
                    <p className={`text-[10px] text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        Kode token terdiri dari 6 karakter huruf & angka yang diberikan proktor.
                    </p>
                </div>

                {initialToken && !tokenValid && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-center text-xs font-bold text-red-500">
                        <i className="fa-solid fa-circle-exclamation mr-1.5" />
                        Token <span className="font-mono font-black">{initialToken}</span> tidak valid.
                    </div>
                )}

                <div className="space-y-2.5 pt-1">
                    <button
                        type="submit"
                        className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 text-xs font-black uppercase tracking-wider text-slate-950 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98]"
                    >
                        <i className="fa-solid fa-key text-xs" /> Verifikasi Token Ujian
                    </button>

                    <button
                        type="button"
                        onClick={copyDirectLink}
                        className={`w-full inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-all border shadow-sm active:scale-[0.98] ${
                            isDark 
                                ? "bg-slate-800 text-amber-300 hover:bg-slate-700/80 border-amber-500/20" 
                                : "bg-slate-50 text-amber-700 hover:bg-slate-100 border-amber-500/30"
                        }`}
                    >
                        <i className={`fa-solid ${hasTokenEntered ? "fa-link" : "fa-copy"} text-xs`} />{" "}
                        {hasTokenEntered ? "Salin Link Direct dengan Token" : "Salin Link Portal Ujian"}
                    </button>
                </div>
            </form>
        </div>
    );
});

export default PublicTokenLoginForm;
