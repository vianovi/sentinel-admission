import { useMemo, useState } from "react";
import SentinelSelect from "@/Components/Dashboard/Shared/SentinelSelect";
import type { PublicAttemptItem } from "@/Pages/Dashboard/Admin/Exam/PublicSessions";

type Props = {
    attempts: PublicAttemptItem[];
    handleResetAttempt: (attemptId: number, name: string) => void;
    handleForceSubmit: (attemptId: number, name: string) => void;
};

export default function PublicParticipantMonitorTable({
    attempts,
    handleResetAttempt,
    handleForceSubmit,
}: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const statusFilterOptions = useMemo(
        () => [
            { value: "all", label: `Semua Status (${attempts.length})` },
            { value: "in_progress", label: "Sedang Mengerjakan" },
            { value: "submitted", label: "Sudah Selesai" },
        ],
        [attempts.length]
    );

    const filteredAttempts = useMemo(() => {
        return attempts.filter((att) => {
            const matchesSearch =
                att.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                att.guest_school.toLowerCase().includes(searchTerm.toLowerCase()) ||
                att.token.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "in_progress" && att.status === "in_progress") ||
                (statusFilter === "submitted" && (att.status === "submitted" || att.status === "auto_submitted"));
            return matchesSearch && matchesStatus;
        });
    }, [attempts, searchTerm, statusFilter]);

    return (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Monitoring Peserta Ujian Publik ({filteredAttempts.length} / {attempts.length})
                    </h4>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <input
                        type="text"
                        placeholder="Cari nama / sekolah / token..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="sentinel-field text-xs py-1.5 px-3 w-48"
                    />
                    <SentinelSelect
                        options={statusFilterOptions}
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val)}
                        className="text-xs py-1.5 px-3"
                    />
                </div>
            </div>

            {filteredAttempts.length === 0 ? (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                    Belum ada peserta yang memulai sesi ujian publik ini.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/5">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="py-2.5 px-3">Peserta / Sekolah</th>
                                <th className="py-2.5 px-3">Token Digunakan</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Skor</th>
                                <th className="py-2.5 px-3">Waktu Mulai</th>
                                <th className="py-2.5 px-3 text-right">Aksi Proktor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-slate-900/50">
                            {filteredAttempts.map((att) => (
                                <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="py-2.5 px-3">
                                        <div className="font-bold text-slate-900 dark:text-slate-100">{att.guest_name}</div>
                                        <div className="text-[10px] text-slate-500">{att.guest_school} {att.guest_email ? `• ${att.guest_email}` : ""}</div>
                                    </td>
                                    <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{att.token}</td>
                                    <td className="py-2.5 px-3">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                            att.status === "in_progress"
                                                ? "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 animate-pulse"
                                                : att.status === "submitted" || att.status === "auto_submitted"
                                                ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                : "bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300"
                                        }`}>
                                            {att.status === "in_progress" ? "Mengerjakan" : att.status === "submitted" ? "Selesai" : att.status}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                        {att.score !== null ? (
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{att.score} pt</span>
                                        ) : (
                                            <span className="text-slate-400 dark:text-slate-500 text-[11px]">Belum</span>
                                        )}
                                    </td>
                                    <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400">
                                        {att.started_at ? new Date(att.started_at).toLocaleTimeString("id-ID") : "-"}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {att.status === "in_progress" && (
                                                <button
                                                    onClick={() => handleForceSubmit(att.id, att.guest_name)}
                                                    className="rounded bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 hover:bg-amber-500/30"
                                                    title="Paksa Kumpulkan"
                                                >
                                                    Force Submit
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleResetAttempt(att.id, att.guest_name)}
                                                className="rounded bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-700 dark:bg-red-500/20 dark:text-red-300 hover:bg-red-500/30"
                                                title="Reset Pelanggaran"
                                            >
                                                Reset Violations
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
