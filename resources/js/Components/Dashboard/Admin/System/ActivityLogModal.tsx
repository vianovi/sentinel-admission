import type { ActivityLog } from "@/Pages/Dashboard/Admin/System/ActivityLogs";

export default function ActivityLogModal({
    log,
    onClose,
}: {
    log: ActivityLog;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#171f33] border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <i className="fa-solid fa-circle-info text-amber-500" /> Rincian Metadata Aktivitas
                    </h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <i className="fa-solid fa-xmark text-sm" />
                    </button>
                </div>
                <div className="mt-4 space-y-3 text-xs">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold">Deskripsi</p>
                        <p className="text-slate-900 dark:text-white font-medium mt-0.5">{log.description}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold mb-1">Payload Metadata</p>
                        <pre className="max-h-48 overflow-y-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-amber-400 border border-amber-500/20">
                            {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                    </div>
                </div>
                <div className="mt-5 text-right">
                    <button type="button" onClick={onClose} className="rounded-lg bg-slate-100 dark:bg-white/10 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 transition">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
