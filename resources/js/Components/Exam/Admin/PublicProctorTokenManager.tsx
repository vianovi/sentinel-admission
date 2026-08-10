import { FormEvent, useMemo } from "react";
import SentinelSelect from "@/Components/Dashboard/Shared/SentinelSelect";
import type { PublicTokenItem, TokenFormReturn } from "@/Pages/Dashboard/Admin/Exam/PublicSessions";

type Props = {
    tokens: PublicTokenItem[];
    activeProctorToken: PublicTokenItem | undefined;
    tokenForm: TokenFormReturn;
    handleGenerateToken: (e: FormEvent) => void;
    handleRotateToken: (tokenId: number) => void;
    handleDeleteToken: (tokenId: number) => void;
    copyToClipboard: (text: string, label: string) => void;
    onOpenProctorScreen: () => void;
};

export default function PublicProctorTokenManager({
    tokens,
    activeProctorToken,
    tokenForm,
    handleGenerateToken,
    handleRotateToken,
    handleDeleteToken,
    copyToClipboard,
    onOpenProctorScreen,
}: Props) {
    const tokenTypeOptions = useMemo(
        () => [
            { value: "multi_use", label: "Multi-Use (Banyak Peserta)" },
            { value: "single_use", label: "Single-Use (Sekali Pakai)" },
        ],
        []
    );

    return (
        <div className="rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 dark:from-amber-950/60 dark:via-slate-950 dark:to-slate-950 p-5 border border-amber-500/30 dark:border-amber-500/40 shadow-sm dark:shadow-inner space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-widest block">
                        TOKEN PROKTOR UTAMA (ANBK / CBT STYLE)
                    </span>
                    <div className="mt-1 flex items-center gap-3 flex-wrap">
                        <span className="text-3xl font-black tracking-widest text-amber-700 dark:text-amber-300 font-mono bg-white dark:bg-slate-900 px-4 py-1.5 rounded-xl border border-amber-500/40 shadow-md select-all">
                            {activeProctorToken ? activeProctorToken.token : "BELUM ADA TOKEN"}
                        </span>

                        {activeProctorToken && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => copyToClipboard(`${window.location.origin}/exam/p`, "Link Portal Ujian (Tanpa Token)")}
                                    className="rounded-lg bg-white dark:bg-slate-800/90 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-300 dark:border-white/10 shadow-sm"
                                    title="Salin URL Portal Ujian tempat peserta memasukkan token sendiri"
                                >
                                    <i className="fa-solid fa-globe mr-1 text-amber-600 dark:text-amber-400" /> Salin Link Portal (Tanpa Token)
                                </button>

                                <button
                                    onClick={() => copyToClipboard(`${window.location.origin}/exam/p/${activeProctorToken.token}`, "Link Direct Ujian (Dengan Token)")}
                                    className="rounded-lg bg-amber-500/10 dark:bg-amber-500/15 px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all border border-amber-500/30"
                                    title="Salin URL Ujian langsung beserta Token"
                                >
                                    <i className="fa-solid fa-link mr-1 text-amber-600 dark:text-amber-400" /> Salin Link Direct (Dengan Token)
                                </button>

                                <button
                                    onClick={() => copyToClipboard(activeProctorToken.token, "Kode Token Proktor")}
                                    className="rounded-lg bg-white dark:bg-slate-800/90 px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-amber-500/30 shadow-sm"
                                    title="Salin 6 Karakter Kode Token"
                                >
                                    <i className="fa-solid fa-key mr-1" /> Salin Token Saja
                                </button>

                                <button
                                    onClick={onOpenProctorScreen}
                                    className="rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all border border-emerald-500/30"
                                    title="Tampilkan layar proktor fullscreen"
                                >
                                    <i className="fa-solid fa-expand mr-1" /> Mode Proktor
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {activeProctorToken && (
                    <button
                        onClick={() => handleRotateToken(activeProctorToken.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
                    >
                        <i className="fa-solid fa-rotate text-xs" /> Rotasi Token Baru
                    </button>
                )}
            </div>

            {/* Token History & Generator */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <i className="fa-solid fa-key text-amber-600 dark:text-amber-400" /> Token Aktif & Riwayat Token ({tokens.length})
                    </span>
                </div>

                {/* Create Token Form with SentinelSelect */}
                <form onSubmit={handleGenerateToken} className="grid grid-cols-1 gap-2.5 sm:grid-cols-4 bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-white/5 items-center shadow-sm">
                    <input
                        type="text"
                        placeholder="Label Token (cth: Ruang A)"
                        value={tokenForm.data.label}
                        onChange={(e) => tokenForm.setData("label", e.target.value)}
                        className="sentinel-field"
                    />
                    <SentinelSelect
                        options={tokenTypeOptions}
                        value={tokenForm.data.type}
                        onChange={(val) => tokenForm.setData("type", val)}
                    />
                    <input
                        type="number"
                        placeholder="Batas Penggunaan (0 = Unlim)"
                        value={tokenForm.data.max_uses}
                        onChange={(e) => tokenForm.setData("max_uses", Number(e.target.value))}
                        className="sentinel-field"
                    />
                    <button
                        type="submit"
                        disabled={tokenForm.processing}
                        className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-amber-500/30"
                    >
                        {tokenForm.processing ? "Memproses..." : "+ Token Tambahan"}
                    </button>
                </form>

                {/* Tokens Table */}
                {tokens.length > 0 && (
                    <div className="overflow-x-auto max-h-44 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <table className="w-full text-left text-[11px]">
                            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-2 px-3">Token</th>
                                    <th className="py-2 px-3">Label</th>
                                    <th className="py-2 px-3">Tipe</th>
                                    <th className="py-2 px-3">Penggunaan</th>
                                    <th className="py-2 px-3">Status</th>
                                    <th className="py-2 px-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-slate-900/50">
                                {tokens.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-mono font-bold text-amber-700 dark:text-amber-300">{t.token}</td>
                                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{t.label ?? "-"}</td>
                                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 capitalize">{t.type === "multi_use" ? "Multi-Use" : "Single-Use"}</td>
                                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">{t.used_count} / {t.max_uses === 0 ? "∞" : t.max_uses}</td>
                                        <td className="py-2 px-3">
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                t.is_valid ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                            }`}>
                                                {t.is_valid ? "Aktif" : "Expired / Habis"}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                            <button
                                                onClick={() => handleDeleteToken(t.id)}
                                                className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                                                title="Hapus token"
                                            >
                                                <i className="fa-solid fa-trash-can" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
