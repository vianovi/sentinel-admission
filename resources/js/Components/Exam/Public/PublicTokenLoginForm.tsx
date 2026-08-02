import { FormEvent, memo, useState } from "react";

type Props = {
    initialToken: string | null;
    tokenValid: boolean;
};

export const PublicTokenLoginForm = memo(function PublicTokenLoginForm({ initialToken, tokenValid }: Props) {
    const [tokenInput, setTokenInput] = useState(initialToken ?? "");

    const handleVerifyToken = (e: FormEvent) => {
        e.preventDefault();
        if (!tokenInput.trim()) return;
        window.location.href = route("exam.public.landing", { token: tokenInput.trim().toUpperCase() });
    };

    return (
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

                {initialToken && !tokenValid && (
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
    );
});

export default PublicTokenLoginForm;
