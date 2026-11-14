import type { FormEvent } from 'react';

type Props = {
    token: string;
    themeMode: 'dark' | 'light';
    clientTime: string;
    busy: boolean;
    error: string;
    onTokenChange: (token: string) => void;
    onVerify: (event: FormEvent<HTMLFormElement>) => void;
    onPaste: () => void;
};

export default function PublicTokenLoginForm({
    token,
    themeMode,
    clientTime,
    busy,
    error,
    onTokenChange,
    onVerify,
    onPaste,
}: Props) {
    const isDark = themeMode === 'dark';

    return (
        <div
            className={`mx-auto w-full max-w-lg space-y-6 rounded-3xl border p-6 shadow-2xl backdrop-blur-xl transition-colors sm:p-8 ${
                isDark
                    ? 'border-amber-500/20 bg-slate-900/90 text-white shadow-amber-500/10'
                    : 'border-slate-200 bg-white text-slate-800 shadow-slate-200/60'
            }`}
        >
            <div
                className={`space-y-1 rounded-2xl border p-3.5 text-center ${
                    isDark
                        ? 'border-amber-500/20 bg-slate-950/80'
                        : 'border-amber-500/20 bg-amber-500/5'
                }`}
            >
                <span className="block text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    <i className="fa-regular fa-clock mr-1.5" aria-hidden="true" />
                    Waktu Sistem Saat Ini (WIB)
                </span>
                <span
                    className={`block font-mono text-base font-bold tracking-wide ${
                        isDark ? 'text-white' : 'text-slate-900'
                    }`}
                >
                    {clientTime || 'Memuat waktu…'}
                </span>
            </div>

            <form onSubmit={onVerify} className="space-y-5">
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <label
                            htmlFor="room-token"
                            className={`block text-xs font-extrabold uppercase tracking-wider sm:text-sm ${
                                isDark ? 'text-slate-200' : 'text-slate-700'
                            }`}
                        >
                            <i
                                className="fa-solid fa-key mr-1.5 text-amber-500"
                                aria-hidden="true"
                            />
                            Kode Token Ujian
                        </label>
                        {token && (
                            <button
                                type="button"
                                onClick={() => onTokenChange('')}
                                className="min-h-11 px-2 text-xs text-slate-400 transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            >
                                Hapus
                            </button>
                        )}
                    </div>
                    <input
                        id="room-token"
                        type="text"
                        required
                        minLength={5}
                        maxLength={5}
                        autoComplete="off"
                        value={token}
                        onChange={(event) =>
                            onTokenChange(
                                event.target.value
                                    .toUpperCase()
                                    .replace(/[^A-Z0-9]/g, ''),
                            )
                        }
                        placeholder="MISAL: X7K9P"
                        className={`w-full rounded-2xl border px-4 py-4 text-center font-mono text-2xl font-black uppercase tracking-[0.35em] outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 sm:text-3xl ${
                            isDark
                                ? 'border-white/15 bg-slate-950 text-amber-400 placeholder:text-slate-700'
                                : 'border-slate-300 bg-slate-50 text-amber-600 placeholder:text-slate-300'
                        }`}
                    />
                    <p
                        className={`text-center text-xs leading-relaxed ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                    >
                        Masukkan 5 karakter kode token yang diberikan oleh
                        pengawas ujian.
                    </p>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-xs font-bold text-red-500 sm:text-sm"
                    >
                        <i
                            className="fa-solid fa-circle-exclamation mr-1.5"
                            aria-hidden="true"
                        />
                        {error}
                    </div>
                )}

                <div className="space-y-3 pt-2">
                    <button
                        type="submit"
                        disabled={busy || token.length !== 5}
                        className="inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-6 text-sm font-black uppercase tracking-wider text-slate-950 shadow-xl shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                    >
                        <i
                            className="fa-solid fa-arrow-right-to-bracket text-base"
                            aria-hidden="true"
                        />
                        {busy ? 'Memeriksa…' : 'Masuk ke Ruang Ujian'}
                    </button>
                    <button
                        type="button"
                        onClick={onPaste}
                        className={`inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-2xl border px-5 text-xs font-bold shadow-sm transition-all hover:border-amber-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/30 sm:text-sm ${
                            isDark
                                ? 'border-amber-500/30 bg-slate-800/90 text-amber-300 hover:bg-slate-800'
                                : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                    >
                        <i
                            className="fa-solid fa-paste text-base text-amber-500"
                            aria-hidden="true"
                        />
                        Tempel Token dari Papan Klip
                    </button>
                </div>
            </form>
        </div>
    );
}
