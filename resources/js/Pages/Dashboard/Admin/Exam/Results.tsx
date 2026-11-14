import { FormEvent, useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import Select from "react-select";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { BackLink, EmptyState, ExamWorkspace, PageHeader, StatCard, StatusPill, inputClass, labelClass, primaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { makeSelectStyles } from "@/Components/UI/selectStyles";
import { useTheme } from "@/context/ThemeContext";
import { useSessionState } from "@/hooks/useSessionState";
import { confirmAction, showErrorToast } from "@/utils/swal";

type CandidateSummary = { id: number | null; candidate_code: string | null; full_name: string | null; nisn: string | null; program_choice?: string | null };
type AttemptRow = {
    id: number; candidate: CandidateSummary; session_title: string | null; package_title: string | null; status: string; attempt_number: number;
    answered_questions: number; total_questions: number; correct_answers: number; raw_score: number; max_score: number;
    percentage_score: number | null; passed: boolean | null; violations_count: number; submitted_at: string | null; created_at: string | null;
};
type PaginationLink = { url: string | null; label: string; active: boolean };
type Paginated<T> = { data: T[]; current_page: number; last_page: number; total: number; links: PaginationLink[] };
type Filters = { status?: string | null; passed?: string | null; search?: string | null; session?: string | null };
type SessionOption = { id: number; title: string };
type Option = { value: string; label: string };
type Summary = { total: number; active: number; flagged: number; completed: number };
type Props = { attempts: Paginated<AttemptRow>; filters: Filters; sessions: SessionOption[]; summary: Summary };

const statusOptions: Option[] = [
    { value: "", label: "Semua status" }, { value: "in_progress", label: "Berlangsung" }, { value: "submitted", label: "Submitted" },
    { value: "auto_submitted", label: "Auto-submitted" }, { value: "expired", label: "Expired" }, { value: "cancelled", label: "Cancelled" }, { value: "invalidated", label: "Invalidated" },
];
const passOptions: Option[] = [{ value: "", label: "Semua hasil" }, { value: "1", label: "Lulus" }, { value: "0", label: "Belum lulus" }];

export default function ExamResults({ attempts, filters, sessions, summary }: Props) {
    const { theme } = useTheme();
    const selectStyles = useMemo(() => makeSelectStyles(false, theme === "dark"), [theme]);
    const [search, setSearch] = useSessionState("admin:exams:results:search", filters.search ?? "");
    const [status, setStatus] = useSessionState("admin:exams:results:status", filters.status ?? "");
    const [passed, setPassed] = useSessionState("admin:exams:results:passed", filters.passed ?? "");
    const [session, setSession] = useSessionState("admin:exams:results:session", filters.session ?? "");
    const [busyAttemptId, setBusyAttemptId] = useState<number | null>(null);
    const sessionOptions = useMemo<Option[]>(() => [{ value: "", label: "Semua sesi" }, ...sessions.map((item) => ({ value: String(item.id), label: item.title }))], [sessions]);

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get("/dashboard/admin/exams/results", { search: search.trim() || undefined, status: status || undefined, passed: passed || undefined, session: session || undefined }, { preserveState: true, preserveScroll: true });
    };

    const forceStop = async (attempt: AttemptRow) => {
        if (!await confirmAction("Hentikan ujian peserta?", "Jawaban yang sudah tersimpan akan langsung dinilai dan peserta tidak dapat melanjutkan.", "Ya, hentikan ujian")) return;
        setBusyAttemptId(attempt.id);
        router.post(`/dashboard/admin/exams/results/${attempt.id}/force-stop`, {}, { preserveScroll: true, onError: () => showErrorToast("Ujian tidak dapat dihentikan. Muat ulang data lalu coba kembali."), onFinish: () => setBusyAttemptId(null) });
    };

    const deleteHistory = async (attempt: AttemptRow) => {
        if (!await confirmAction("Hapus riwayat ujian peserta?", "Seluruh attempt peserta pada sesi ini akan dihapus. Akses ujian akan dibuka kembali. Tindakan ini tidak dapat dibatalkan.", "Ya, hapus riwayat")) return;
        setBusyAttemptId(attempt.id);
        router.delete(`/dashboard/admin/exams/results/${attempt.id}/history`, { preserveScroll: true, onError: () => showErrorToast("Riwayat tidak dapat dihapus. Pastikan tidak ada ujian peserta yang masih berlangsung."), onFinish: () => setBusyAttemptId(null) });
    };

    return <>
        <Head title="Hasil Ujian" />
        <ExamWorkspace active="sessions">
            <PageHeader title="Hasil Ujian" description="Pantau progres, keamanan, skor, serta tindak lanjut tiap peserta dalam satu tempat." icon="fa-solid fa-square-poll-vertical" actions={<BackLink href="/dashboard/admin/exams/sessions" label="Pengaturan Sesi" />} />

            <section aria-label="Ringkasan hasil ujian" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total attempt" value={summary.total} icon="fa-solid fa-clipboard-list" />
                <StatCard label="Ujian berlangsung" value={summary.active} icon="fa-solid fa-clock" tone="text-amber-500" />
                <StatCard label="Ada pelanggaran" value={summary.flagged} icon="fa-solid fa-shield-halved" tone="text-red-500" />
                <StatCard label="Sudah selesai" value={summary.completed} icon="fa-solid fa-circle-check" tone="text-emerald-500" />
            </section>

            <section aria-labelledby="result-filter-title" className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                <div className="mb-4"><h2 id="result-filter-title" className="text-sm font-black text-slate-900 dark:text-white">Filter hasil</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Saring data tanpa kehilangan posisi saat meninjau attempt.</p></div>
                <form onSubmit={applyFilters} className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:items-end">
                    <div><label className={labelClass} htmlFor="result-search">Cari peserta atau ujian</label><input id="result-search" value={search} onChange={(event) => setSearch(event.target.value)} className={inputClass} placeholder="Nama, kode, NISN, sesi, paket" /></div>
                    <FilterSelect id="result-status" label="Status attempt" value={status} options={statusOptions} styles={selectStyles} onChange={setStatus} />
                    <FilterSelect id="result-passed" label="Kelulusan" value={passed} options={passOptions} styles={selectStyles} onChange={setPassed} />
                    <FilterSelect id="result-session" label="Sesi" value={session} options={sessionOptions} styles={selectStyles} onChange={setSession} />
                    <button type="submit" className={`${primaryButtonClass} min-h-11 px-4`}><i className="fa-solid fa-filter text-xs" aria-hidden="true" /> Terapkan filter</button>
                </form>
            </section>

            <section aria-labelledby="attempt-list-title" className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="attempt-list-title" className="text-sm font-black text-slate-900 dark:text-white">Attempt peserta</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Menampilkan {attempts.data.length} dari {attempts.total.toLocaleString("id-ID")} attempt.</p></div><span className="text-xs font-semibold text-slate-500">Halaman {attempts.current_page} dari {attempts.last_page}</span></div>
                {attempts.data.length === 0 ? <EmptyState icon="fa-solid fa-clipboard-list" title="Belum ada hasil" description="Attempt yang dibuat peserta akan tampil di sini." /> : (
                    <div role="region" aria-label="Daftar hasil ujian peserta" tabIndex={0} className="overflow-x-auto rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold/30 dark:border-white/10">
                        <table className="min-w-[1060px] w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                            <caption className="sr-only">Daftar hasil ujian peserta beserta status, skor, pelanggaran, dan tindakan administrasi.</caption>
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400"><tr><th scope="col" className="px-4 py-3 text-left">Peserta</th><th scope="col" className="px-4 py-3 text-left">Ujian</th><th scope="col" className="px-4 py-3 text-left">Status & keamanan</th><th scope="col" className="px-4 py-3 text-right">Progres</th><th scope="col" className="px-4 py-3 text-right">Skor</th><th scope="col" className="px-4 py-3 text-right">Tindakan</th></tr></thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                {attempts.data.map((attempt) => {
                                    const isBusy = busyAttemptId === attempt.id;
                                    return <tr key={attempt.id} className="align-top transition hover:bg-slate-50/80 dark:hover:bg-white/[0.025]">
                                        <td className="px-4 py-3"><p className="font-bold text-slate-900 dark:text-white">{attempt.candidate.full_name ?? "Tanpa nama"}</p><p className="mt-1 text-xs text-slate-500">{attempt.candidate.candidate_code ?? "-"} · NISN {attempt.candidate.nisn ?? "-"}</p><p className="mt-1 text-xs text-slate-400">{attempt.candidate.program_choice ?? "Program belum dipilih"}</p></td>
                                        <td className="px-4 py-3"><p className="font-semibold text-slate-700 dark:text-slate-200">{attempt.session_title ?? "-"}</p><p className="mt-1 text-xs text-slate-500">{attempt.package_title ?? "-"} · Attempt {attempt.attempt_number}</p><p className="mt-1 text-xs text-slate-400">{attempt.submitted_at ?? attempt.created_at ?? "-"}</p></td>
                                        <td className="px-4 py-3"><div className="flex flex-col items-start gap-2"><StatusPill value={attempt.status} /><StatusPill value={attempt.passed === null ? "pending" : attempt.passed ? "lulus" : "belum lulus"} /><span className={`text-xs font-bold ${attempt.violations_count > 0 ? "text-red-600 dark:text-red-300" : "text-slate-500 dark:text-slate-400"}`}><i className="fa-solid fa-shield-halved mr-1" aria-hidden="true" />{attempt.violations_count > 0 ? `${attempt.violations_count} pelanggaran` : "Tanpa pelanggaran"}</span></div></td>
                                        <td className="px-4 py-3 text-right"><p className="font-semibold text-slate-800 dark:text-slate-100">{attempt.answered_questions}/{attempt.total_questions}</p><p className="mt-1 text-xs text-slate-500">{attempt.correct_answers} jawaban benar</p></td>
                                        <td className="px-4 py-3 text-right"><p className="font-black text-slate-900 dark:text-white">{attempt.percentage_score === null ? "-" : `${attempt.percentage_score}%`}</p><p className="mt-1 text-xs text-slate-500">{attempt.raw_score}/{attempt.max_score}</p></td>
                                        <td className="px-4 py-3 text-right"><div className="flex flex-wrap justify-end gap-2"><Link href={`/dashboard/admin/exams/results/${attempt.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-gold/60 hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold/30 dark:border-white/10 dark:text-slate-200" aria-label={`Lihat detail hasil ${attempt.candidate.full_name ?? "peserta"}`}><i className="fa-solid fa-eye" aria-hidden="true" /> Detail</Link>{attempt.status === "in_progress" ? <button type="button" disabled={isBusy} onClick={() => forceStop(attempt)} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-bold text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/50 disabled:cursor-not-allowed disabled:opacity-60" aria-label={`Hentikan paksa ujian ${attempt.candidate.full_name ?? "peserta"}`}><i className="fa-solid fa-stop" aria-hidden="true" /> Hentikan</button> : <button type="button" disabled={isBusy} onClick={() => deleteHistory(attempt)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10" aria-label={`Hapus riwayat ujian ${attempt.candidate.full_name ?? "peserta"}`}><i className="fa-solid fa-trash-can" aria-hidden="true" /> Hapus riwayat</button>}</div></td>
                                    </tr>;
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {attempts.links.length > 3 ? <nav aria-label="Halaman hasil ujian" className="mt-4 flex flex-wrap gap-2">{attempts.links.map((link, index) => <Link key={`${link.label}-${index}`} href={link.url ?? "#"} className={`rounded-lg border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-gold/30 ${link.active ? "border-gold bg-gold text-navy" : "border-slate-200 text-slate-600 hover:border-gold/60 hover:text-gold dark:border-white/10 dark:text-slate-300"} ${!link.url ? "pointer-events-none opacity-40" : ""}`} preserveScroll preserveState>{decodePaginationLabel(link.label)}</Link>)}</nav> : null}
            </section>
        </ExamWorkspace>
    </>;
}

function FilterSelect({ id, label, value, options, styles, onChange }: { id: string; label: string; value: string; options: Option[]; styles: any; onChange: (value: string) => void }) {
    return <div><label className={labelClass} htmlFor={id}>{label}</label><Select inputId={id} instanceId={id} value={options.find((option) => option.value === value) ?? options[0]} options={options} styles={styles} onChange={(option) => onChange(option?.value ?? "")} isSearchable={false} /></div>;
}

function decodePaginationLabel(label: string): string { return label.replace("&laquo;", "‹").replace("&raquo;", "›").replace("Previous", "Sebelumnya").replace("Next", "Berikutnya"); }

ExamResults.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
