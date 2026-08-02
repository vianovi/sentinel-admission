import { memo } from "react";
import { EmptyState, StatusPill } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import type { CandidateRow } from "./SessionCandidateAssigner";

export type Assignment = {
    id: number;
    status: string;
    assigned_at: string | null;
    candidate: CandidateRow;
};

type Props = {
    assignedCandidates: Assignment[];
};

export const SessionAssignedTable = memo(function SessionAssignedTable({ assignedCandidates }: Props) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Kandidat Ditugaskan</h2>
                <span className="text-xs font-semibold text-slate-500">{assignedCandidates.length.toLocaleString("id-ID")} kandidat</span>
            </div>

            {assignedCandidates.length === 0 ? (
                <EmptyState icon="fa-solid fa-users-slash" title="Belum ada kandidat" description="Tugaskan kandidat agar mereka dapat melihat sesi ujian di dashboard masing-masing." />
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3 text-left">Kandidat</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Ditugaskan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                            {assignedCandidates.map((assignment) => (
                                <tr key={assignment.id}>
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-slate-900 dark:text-white">{assignment.candidate.full_name ?? "Tanpa nama"}</p>
                                        <p className="mt-1 text-xs text-slate-500">{assignment.candidate.candidate_code ?? "-"} · NISN {assignment.candidate.nisn ?? "-"}</p>
                                        <p className="mt-1 text-xs text-slate-400">{assignment.candidate.program_choice ?? "-"}</p>
                                    </td>
                                    <td className="px-4 py-3"><StatusPill value={assignment.status} /></td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{assignment.assigned_at ?? "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
});

export default SessionAssignedTable;
