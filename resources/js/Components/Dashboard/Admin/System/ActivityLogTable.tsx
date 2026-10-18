import { Link } from "@inertiajs/react";
import { EmptyState, cardClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import type { ActivityLog } from "@/Pages/Dashboard/Admin/System/ActivityLogs";

type Props = {
    logs: {
        data: ActivityLog[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
    };
    onSelectLog: (log: ActivityLog) => void;
};

export default function ActivityLogTable({ logs, onSelectLog }: Props) {
    const badge = (action: string) => {
        if (action.includes("delete")) return { bg: "bg-amber-500/10 text-amber-500", label: "Ke Sampah" };
        if (action.includes("restored")) return { bg: "bg-emerald-500/10 text-emerald-500", label: "Dipulihkan" };
        if (action.includes("purge")) return { bg: "bg-red-500/10 text-red-500", label: "Hapus Permanen" };
        if (action.includes("upload")) return { bg: "bg-blue-500/10 text-blue-500", label: "Unggah" };
        return { bg: "bg-slate-500/10 text-slate-400", label: "Sistem" };
    };

    return (
        <div className={`${cardClass} overflow-hidden p-0`}>
            {logs.data.length === 0 ? (
                <div className="p-8">
                    <EmptyState icon="fa-solid fa-list-check" title="Belum Ada Riwayat" description="Aktivitas tercatat otomatis di sini." />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
                                <th className="py-3 px-4 font-bold uppercase">Aktor</th>
                                <th className="py-3 px-4 font-bold uppercase">Aksi</th>
                                <th className="py-3 px-4 font-bold uppercase">Rincian Narasi</th>
                                <th className="py-3 px-4 font-bold uppercase">Target</th>
                                <th className="py-3 px-4 font-bold uppercase">Waktu</th>
                                <th className="py-3 px-4 font-bold uppercase text-right">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {logs.data.map((log) => {
                                const b = badge(log.action);
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                        <td className="py-3 px-4 font-bold">{log.actor_name}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-bold ${b.bg}`}>{b.label}</span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{log.description}</td>
                                        <td className="py-3 px-4">{log.target_label || "-"}</td>
                                        <td className="py-3 px-4">{new Date(log.created_at).toLocaleString("id-ID")}</td>
                                        <td className="py-3 px-4 text-right">
                                            {log.metadata ? (
                                                <button type="button" onClick={() => onSelectLog(log)} className="rounded border border-slate-200 dark:border-white/10 px-2 py-0.5 font-bold">Detail</button>
                                            ) : "-"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {logs.links && logs.links.length > 3 && (
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 px-4 py-3 text-xs">
                    <span className="text-slate-400">Total {logs.total} data</span>
                    <div className="flex items-center gap-1">
                        {logs.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || "#"}
                                className={`rounded px-2.5 py-1 font-bold ${link.active ? "bg-amber-500 text-slate-950" : link.url ? "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5" : "text-slate-400 opacity-50 cursor-not-allowed"}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
