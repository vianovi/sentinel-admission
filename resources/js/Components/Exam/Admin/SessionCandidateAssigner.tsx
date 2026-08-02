import { FormEvent, memo, useMemo, useState } from "react";
import { useForm } from "@inertiajs/react";
import { EmptyState, inputClass, labelClass, primaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";

export type CandidateRow = {
    id: number;
    candidate_code: string | null;
    full_name: string | null;
    nisn: string | null;
    status: string | null;
    program_choice: string | null;
    admission_wave?: string | null;
};

type AssignmentForm = {
    candidate_ids: number[];
    note: string;
};

type Props = {
    sessionId: number;
    availableCandidates: CandidateRow[];
};

export const SessionCandidateAssigner = memo(function SessionCandidateAssigner({ sessionId, availableCandidates }: Props) {
    const [query, setQuery] = useState("");

    const form = useForm<AssignmentForm>({
        candidate_ids: [],
        note: "",
    });

    const filteredCandidates = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return availableCandidates;

        return availableCandidates.filter((candidate) => [
            candidate.full_name,
            candidate.candidate_code,
            candidate.nisn,
            candidate.program_choice,
            candidate.admission_wave,
        ].some((value) => value?.toLowerCase().includes(term)));
    }, [availableCandidates, query]);

    const toggleCandidate = (candidateId: number) => {
        form.setData("candidate_ids", form.data.candidate_ids.includes(candidateId)
            ? form.data.candidate_ids.filter((id) => id !== candidateId)
            : [...form.data.candidate_ids, candidateId]);
    };

    const selectVisible = () => {
        const ids = filteredCandidates.map((candidate) => candidate.id);
        const allSelected = ids.every((id) => form.data.candidate_ids.includes(id));
        form.setData("candidate_ids", allSelected ? form.data.candidate_ids.filter((id) => !ids.includes(id)) : Array.from(new Set([...form.data.candidate_ids, ...ids])));
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.post(`/dashboard/admin/exams/sessions/${sessionId}/candidates`, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <section id="atur-peserta" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Tugaskan Kandidat</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Daftar ini dibatasi 200 kandidat terbaru yang memenuhi status dasar dan belum ditugaskan.</p>

            <form onSubmit={submit} className="mt-4 space-y-4">
                <div>
                    <label className={labelClass} htmlFor="candidate-search">Cari kandidat</label>
                    <input
                        id="candidate-search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className={inputClass}
                        placeholder="Nama, kode, NISN, program, gelombang"
                    />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 dark:bg-white/[0.03]">
                    <span>{form.data.candidate_ids.length.toLocaleString("id-ID")} dipilih</span>
                    <button type="button" onClick={selectVisible} className="font-bold text-gold">
                        Pilih terlihat
                    </button>
                </div>

                <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
                    {filteredCandidates.length === 0 ? (
                        <EmptyState icon="fa-solid fa-user-slash" title="Tidak ada kandidat" description="Coba kata kunci lain atau pastikan kandidat sudah memiliki status yang sesuai." />
                    ) : filteredCandidates.map((candidate) => (
                        <label key={candidate.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm hover:border-gold/60 dark:border-white/10">
                            <input
                                type="checkbox"
                                checked={form.data.candidate_ids.includes(candidate.id)}
                                onChange={() => toggleCandidate(candidate.id)}
                                className="mt-1 rounded border-slate-300 text-gold focus:ring-gold"
                            />
                            <span className="min-w-0">
                                <span className="block font-bold text-slate-900 dark:text-white">{candidate.full_name ?? "Tanpa nama"}</span>
                                <span className="mt-1 block text-xs text-slate-500">{candidate.candidate_code ?? "-"} · NISN {candidate.nisn ?? "-"} · {candidate.program_choice ?? "-"}</span>
                                <span className="mt-1 block text-xs text-slate-400">{candidate.admission_wave ?? "Gelombang tidak terdata"}</span>
                            </span>
                        </label>
                    ))}
                </div>

                <div>
                    <label className={labelClass} htmlFor="assignment-note">Catatan</label>
                    <textarea
                        id="assignment-note"
                        value={form.data.note}
                        onChange={(event) => form.setData("note", event.target.value)}
                        className={`${inputClass} min-h-20 resize-y`}
                        maxLength={500}
                    />
                </div>

                <button
                    type="submit"
                    disabled={form.processing || form.data.candidate_ids.length === 0}
                    className={`${primaryButtonClass} w-full min-h-11`}
                >
                    {form.processing ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-user-plus text-xs" />}
                    Tugaskan Kandidat
                </button>
            </form>
        </section>
    );
});

export default SessionCandidateAssigner;
