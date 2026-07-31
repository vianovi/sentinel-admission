import { FormEvent, useMemo, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { BackLink, EmptyState, ExamWorkspace, FlashMessage, PageHeader, StatCard, StatusPill, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import type { PageProps } from "@/types";

type SessionDetail = {
    id: number;
    package_title: string | null;
    package_subject: string | null;
    admission_wave: string | null;
    title: string;
    description: string | null;
    instructions: string | null;
    status: string;
    opens_at: string | null;
    closes_at: string | null;
    duration_minutes: number;
    passing_score: number;
    max_attempts: number;
    show_result_to_candidate: boolean;
    is_public: boolean;
    public_access_type: string;
    candidates_count: number;
    attempts_count: number;
};

type PublicTokenRow = {
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

type CandidateRow = {
    id: number;
    candidate_code: string | null;
    full_name: string | null;
    nisn: string | null;
    status: string | null;
    program_choice: string | null;
    admission_wave?: string | null;
};

type Assignment = {
    id: number;
    status: string;
    assigned_at: string | null;
    candidate: CandidateRow;
};

type AssignmentForm = {
    candidate_ids: number[];
    note: string;
};

type TokenForm = {
    label: string;
    type: "single_use" | "multi_use";
    max_uses: number;
    count: number;
};

type Props = {
    session: SessionDetail;
    assigned_candidates: Assignment[];
    available_candidates: CandidateRow[];
    public_tokens?: PublicTokenRow[];
};

export default function ExamSessionShow({ session, assigned_candidates, available_candidates, public_tokens = [] }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const [query, setQuery] = useState("");
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const form = useForm<AssignmentForm>({
        candidate_ids: [],
        note: "",
    });

    const tokenForm = useForm<TokenForm>({
        label: "",
        type: "single_use",
        max_uses: 1,
        count: 1,
    });

    const filteredCandidates = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return available_candidates;

        return available_candidates.filter((candidate) => [
            candidate.full_name,
            candidate.candidate_code,
            candidate.nisn,
            candidate.program_choice,
            candidate.admission_wave,
        ].some((value) => value?.toLowerCase().includes(term)));
    }, [available_candidates, query]);

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

        form.post(`/dashboard/admin/exams/sessions/${session.id}/candidates`, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const submitGenerateToken = (event: FormEvent) => {
        event.preventDefault();
        tokenForm.post(route("admin.exams.sessions.tokens.store", { session: session.id }), {
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
        <DashboardLayout>
            <Head title={`${session.title} - Sesi Ujian`} />

            <ExamWorkspace active="sessions">
                <PageHeader
                    title={session.title}
                    description={`${session.package_title ?? "Tanpa paket"} · ${session.package_subject ?? "Tanpa kategori"}`}
                    icon="fa-solid fa-calendar-check"
                    actions={
                        <>
                            <BackLink href="/dashboard/admin/exams/sessions" label="Kembali ke Pengaturan Sesi" />
                            <Link href={`/dashboard/admin/exams/results?session=${session.id}`} className={secondaryButtonClass}>
                                <i className="fa-solid fa-chart-simple text-xs" /> Lihat Hasil
                            </Link>
                            <Link href={`/dashboard/admin/exams/sessions/${session.id}/edit`} className={secondaryButtonClass}>
                                <i className="fa-solid fa-pen text-xs" /> Edit
                            </Link>
                        </>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.session ?? pageErrors.candidate_ids} />

                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <StatusPill value={session.status} />
                                <StatusPill value={session.is_public ? "akses umum aktif" : "akses khusus kandidat"} />
                                <StatusPill value={session.show_result_to_candidate ? "hasil kandidat aktif" : "hasil kandidat tersembunyi"} />
                            </div>
                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{session.description || "Belum ada deskripsi sesi."}</p>
                            {session.instructions ? (
                                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">
                                    {session.instructions}
                                </div>
                            ) : null}
                        </div>
                        <div className="min-w-[220px] rounded-lg bg-slate-50 p-3 text-sm dark:bg-white/[0.03]">
                            <p className="font-bold text-slate-900 dark:text-white">Jadwal</p>
                            <p className="mt-2 text-slate-600 dark:text-slate-300">{session.opens_at ?? "-"} sampai {session.closes_at ?? "-"}</p>
                            <p className="mt-2 text-xs text-slate-500">{session.admission_wave ?? "Semua gelombang"}</p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-3 md:grid-cols-5">
                    <StatCard label="Durasi" value={`${session.duration_minutes} menit`} icon="fa-solid fa-clock" tone="text-blue-500" />
                    <StatCard label="Passing" value={`${session.passing_score}%`} icon="fa-solid fa-bullseye" tone="text-emerald-500" />
                    <StatCard label="Attempt" value={session.max_attempts} icon="fa-solid fa-repeat" tone="text-violet-500" />
                    <StatCard label="Kandidat" value={session.candidates_count} icon="fa-solid fa-users" tone="text-amber-500" />
                    <StatCard label="Pengerjaan" value={session.attempts_count} icon="fa-solid fa-clipboard-check" tone="text-gold" />
                </div>

                {/* Public Token Generator Section */}
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

                    {public_tokens.length > 0 && (
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
                                    {public_tokens.map((tokenItem) => (
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

                <div className="grid gap-4 xl:grid-cols-[460px_1fr]">
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

                    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Kandidat Ditugaskan</h2>
                            <span className="text-xs font-semibold text-slate-500">{assigned_candidates.length.toLocaleString("id-ID")} kandidat</span>
                        </div>

                        {assigned_candidates.length === 0 ? (
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
                                        {assigned_candidates.map((assignment) => (
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
                </div>
            </ExamWorkspace>
        </DashboardLayout>
    );
}
