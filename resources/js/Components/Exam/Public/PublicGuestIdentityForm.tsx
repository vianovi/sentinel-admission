import type { FormEvent } from 'react';

type SessionInfo = {
    title: string;
    instructions: string | null;
    order_type: string;
};

type Props = {
    session: SessionInfo;
    name: string;
    school: string;
    themeMode: 'dark' | 'light';
    busy: boolean;
    error: string;
    onNameChange: (value: string) => void;
    onSchoolChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onChangeToken: () => void;
};

const inputClass =
    'mt-1.5 w-full rounded-2xl border px-4 py-3 text-sm font-medium transition-all focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 sm:text-base';

export default function PublicGuestIdentityForm({
    session,
    name,
    school,
    themeMode,
    busy,
    error,
    onNameChange,
    onSchoolChange,
    onSubmit,
    onChangeToken,
}: Props) {
    const isDark = themeMode === 'dark';

    return (
        <div className="mt-10 grid w-full items-start gap-6 md:grid-cols-12">
            <section className="space-y-6 md:col-span-7">
                <article
                    className={`rounded-2xl border p-6 shadow-xl backdrop-blur-xl transition-colors ${
                        isDark
                            ? 'border-white/10 bg-slate-900/80 text-white'
                            : 'border-slate-200 bg-white text-slate-800'
                    }`}
                >
                    <div
                        className={`flex items-start justify-between gap-3 border-b pb-4 ${
                            isDark ? 'border-white/10' : 'border-slate-200'
                        }`}
                    >
                        <div className="min-w-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                                Ujian Publik
                            </span>
                            <h2
                                className={`mt-0.5 break-words text-xl font-black ${
                                    isDark ? 'text-white' : 'text-slate-950'
                                }`}
                            >
                                {session.title}
                            </h2>
                        </div>
                        <span className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Sesi tersedia
                        </span>
                    </div>

                    <div
                        className={`mt-6 grid grid-cols-2 gap-4 rounded-xl border p-4 transition-colors md:grid-cols-3 ${
                            isDark
                                ? 'border-white/5 bg-slate-950/60'
                                : 'border-slate-200 bg-slate-50'
                        }`}
                    >
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Status Token
                            </span>
                            <p className="mt-0.5 text-sm font-bold text-amber-500">
                                Aktif
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Urutan Mapel
                            </span>
                            <p
                                className={`mt-0.5 text-sm font-bold ${
                                    isDark ? 'text-white' : 'text-slate-900'
                                }`}
                            >
                                {session.order_type === 'sequential'
                                    ? 'Berurutan'
                                    : 'Bebas'}
                            </p>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Identitas
                            </span>
                            <p
                                className={`mt-0.5 text-sm font-bold ${
                                    isDark ? 'text-white' : 'text-slate-900'
                                }`}
                            >
                                Nama dan sekolah
                            </p>
                        </div>
                    </div>

                    {session.instructions && (
                        <div className="mt-6">
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                Petunjuk Ujian
                            </h3>
                            <div
                                className={`whitespace-pre-wrap rounded-xl border p-4 text-xs leading-relaxed transition-colors ${
                                    isDark
                                        ? 'border-white/5 bg-slate-950/40 text-slate-300'
                                        : 'border-slate-200 bg-slate-50 text-slate-700'
                                }`}
                            >
                                {session.instructions}
                            </div>
                        </div>
                    )}
                </article>
            </section>

            <section className="md:col-span-5">
                <div
                    className={`rounded-2xl border p-6 shadow-2xl backdrop-blur-xl transition-colors ${
                        isDark
                            ? 'border-amber-500/20 bg-slate-900/80 text-white shadow-amber-500/5'
                            : 'border-slate-200 bg-white text-slate-800 shadow-slate-200/50'
                    }`}
                >
                    <h3
                        className={`flex items-center gap-2 text-lg font-black ${
                            isDark ? 'text-white' : 'text-slate-950'
                        }`}
                    >
                        <i
                            className="fa-solid fa-user-pen text-amber-500"
                            aria-hidden="true"
                        />
                        Identitas Peserta
                    </h3>
                    <p
                        className={`mt-1 text-xs leading-relaxed sm:text-sm ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                    >
                        Isi nama dan asal sekolah dengan benar sebelum
                        memulai pengerjaan soal.
                    </p>

                    {error && (
                        <div
                            role="alert"
                            className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-500 sm:text-sm"
                        >
                            <i
                                className="fa-solid fa-circle-exclamation mt-0.5 shrink-0 text-base"
                                aria-hidden="true"
                            />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="mt-5 space-y-4">
                        <div>
                            <label
                                htmlFor="participant-name"
                                className={`block text-xs font-bold sm:text-sm ${
                                    isDark ? 'text-slate-200' : 'text-slate-700'
                                }`}
                            >
                                Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="participant-name"
                                type="text"
                                required
                                maxLength={255}
                                autoComplete="name"
                                value={name}
                                onChange={(event) =>
                                    onNameChange(event.target.value)
                                }
                                placeholder="Contoh: Muhammad Farhan"
                                className={`${inputClass} ${
                                    isDark
                                        ? 'border-white/10 bg-slate-950 text-white placeholder:text-slate-700'
                                        : 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400'
                                }`}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="participant-school"
                                className={`block text-xs font-bold sm:text-sm ${
                                    isDark ? 'text-slate-200' : 'text-slate-700'
                                }`}
                            >
                                Asal Sekolah / Madrasah{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="participant-school"
                                type="text"
                                required
                                maxLength={255}
                                autoComplete="organization"
                                value={school}
                                onChange={(event) =>
                                    onSchoolChange(event.target.value)
                                }
                                placeholder="Contoh: SD Muhammadiyah 1"
                                className={`${inputClass} ${
                                    isDark
                                        ? 'border-white/10 bg-slate-950 text-white placeholder:text-slate-700'
                                        : 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400'
                                }`}
                            />
                        </div>

                        <div className="flex flex-col gap-2 pt-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={onChangeToken}
                                className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/30 ${
                                    isDark
                                        ? 'border-white/10 text-slate-200 hover:bg-slate-800'
                                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                Ganti token
                            </button>
                            <button
                                type="submit"
                                disabled={busy}
                                className="inline-flex min-h-14 flex-1 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 px-5 text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/25 transition-all hover:from-emerald-400 hover:to-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                            >
                                <i
                                    className="fa-solid fa-play text-sm"
                                    aria-hidden="true"
                                />
                                {busy
                                    ? 'Menyiapkan…'
                                    : 'Mulai Kerjakan Ujian'}
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </div>
    );
}
