import { FormEvent, memo, useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import { inputClass, labelClass, primaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";

export type PublicTokenRow = {
    id: number;
    token: string;
    label: string | null;
    type: string;
    max_uses: number;
    used_count: number;
    expires_at: string | null;
    is_valid: boolean;
    public_url: string;
};

type TokenForm = {
    label: string;
    type: "single_use" | "multi_use";
    max_uses: number;
    count: number;
};

type Props = {
    sessionId: number;
    tokens?: PublicTokenRow[];
};

export const SessionTokenManager = memo(function SessionTokenManager({ sessionId, tokens = [] }: Props) {
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const tokenForm = useForm<TokenForm>({
        label: "",
        type: "single_use",
        max_uses: 1,
        count: 1,
    });

    const submitGenerateToken = (event: FormEvent) => {
        event.preventDefault();
        tokenForm.post(route("admin.exams.sessions.tokens.store", { session: sessionId }), {
            preserveScroll: true,
            onSuccess: () => tokenForm.reset(),
        });
    };

    const copyToClipboard = (text: string, token: string) => {
        void navigator.clipboard.writeText(text);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    return (
        <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.03]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-xl">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <i className="fa-solid fa-globe text-xs" /> Ujian Umum / Guest Tokens
                    </span>
                    <h2 className="mt-2 text-base font-black text-slate-900 dark:text-white">Token Akses Ujian Publik</h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        Generate token akses agar peserta tanpa akun kandidat dapat langsung masuk dan mengerjakan ujian secara independent melalui link umum.
                    </p>
                </div>

                <form onSubmit={submitGenerateToken} className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
                    <div>
                        <label className={labelClass} htmlFor="token_count">Jumlah Token</label>
                        <input
                            id="token_count"
                            type="number"
                            min={1}
                            max={50}
                            value={tokenForm.data.count}
                            onChange={(e) => tokenForm.setData("count", Number(e.target.value))}
                            className={`${inputClass} w-24`}
                        />
                    </div>
                    <div>
                        <label className={labelClass} htmlFor="token_type">Tipe Token</label>
                        <select
                            id="token_type"
                            value={tokenForm.data.type}
                            onChange={(e) => tokenForm.setData("type", e.target.value as "single_use" | "multi_use")}
                            className={inputClass}
                        >
                            <option value="single_use">Sekali Pakai</option>
                            <option value="multi_use">Multi Pakai</option>
                        </select>
                    </div>
                    {tokenForm.data.type === "multi_use" && (
                        <div>
                            <label className={labelClass} htmlFor="token_max">Max Pakai</label>
                            <input
                                id="token_max"
                                type="number"
                                min={1}
                                max={10000}
                                value={tokenForm.data.max_uses}
                                onChange={(e) => tokenForm.setData("max_uses", Number(e.target.value))}
                                className={`${inputClass} w-28`}
                            />
                        </div>
                    )}
                    <div>
                        <label className={labelClass} htmlFor="token_label">Label / Catatan</label>
                        <input
                            id="token_label"
                            type="text"
                            placeholder="Opsional"
                            value={tokenForm.data.label}
                            onChange={(e) => tokenForm.setData("label", e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={tokenForm.processing}
                        className={`${primaryButtonClass} col-span-2 min-h-10 sm:col-span-1`}
                    >
                        <i className="fa-solid fa-plus text-xs" /> Generate Token
                    </button>
                </form>
            </div>

            {tokens.length > 0 && (
                <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
                    <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-white/10">
                        <thead className="bg-slate-50 uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-2.5 text-left">Token</th>
                                <th className="px-4 py-2.5 text-left">Tipe</th>
                                <th className="px-4 py-2.5 text-left">Label</th>
                                <th className="px-4 py-2.5 text-left">Penggunaan</th>
                                <th className="px-4 py-2.5 text-left">Aksi & Link Direct</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                            {tokens.map((tokenItem) => (
                                <tr key={tokenItem.id}>
                                    <td className="px-4 py-2.5 font-mono font-black text-amber-600 dark:text-amber-400">
                                        {tokenItem.token}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                            {tokenItem.type === "single_use" ? "Sekali Pakai" : "Multi Pakai"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                                        {tokenItem.label || "-"}
                                    </td>
                                    <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200">
                                        {tokenItem.used_count} / {tokenItem.max_uses}
                                    </td>
                                    <td className="px-4 py-2.5 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(tokenItem.public_url, tokenItem.token)}
                                            className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2.5 py-1 font-bold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                                        >
                                            <i className="fa-solid fa-copy text-[10px]" />
                                            {copiedToken === tokenItem.token ? "Tersalin!" : "Salin Link Direct"}
                                        </button>

                                        <Link
                                            href={route("admin.exams.tokens.destroy", { token: tokenItem.id })}
                                            method="delete"
                                            as="button"
                                            preserveScroll
                                            className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-1 font-bold text-red-600 hover:bg-red-500/20 dark:text-red-400"
                                        >
                                            <i className="fa-solid fa-trash text-[10px]" /> Hapus
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
});

export default SessionTokenManager;
