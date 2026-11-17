import PublicExamSummary from "@/Components/Exam/Admin/PublicExamSummary";
import RichExamText from "@/Components/Dashboard/Exam/RichExamText";
import { useState, type FormEvent, type ReactNode } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    ExamWorkspace,
    FlashMessage,
    PageHeader,
    EmptyState,
    StatusPill,
    cardClass,
    inputClass,
    labelClass,
    primaryButtonClass,
    secondaryButtonClass,
    BackLink,
} from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import type { PageProps } from "@/types";
import { confirmAction, showErrorToast } from "@/utils/swal";
import axios from "axios";

type Participant = {
    id: number;
    participant_code: string;
    name: string;
    school_origin: string;
    status: string;
    average_score: number | null;
    is_passed: boolean | null;
    completed_at: string | null;
    exam_public_session_id: number;
    session_title: string;
    has_active_attempt: boolean;
    display_status: string;
    requires_evaluation: boolean;
    subjects: SubjectResult[];
};

type SubjectResult = {
    subject_id: number;
    subject_name: string;
    package_title: string;
    primary_score: number | null;
    remedial_score: number | null;
    effective_score: number | null;
    passing_score: number | null;
    is_passed: boolean | null;
};

type AnswerReview = {
    participant: { id: number; participant_code: string; name: string };
    subject_name: string;
    attempts: Array<{
        id: number;
        attempt_type: "primary" | "remedial";
        attempt_number: number;
        package_title: string;
        percentage_score: number | null;
        correct_answers: number;
        total_questions: number;
        questions: Array<{
            id: number;
            question_text: string;
            options: Record<string, string | null>;
            correct_answer: string;
            selected_option: string | null;
            is_correct: boolean | null;
            point_awarded: number;
            point: number;
        }>;
    }>;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginationLink[];
};

type Filters = {
    session: number | null;
    status: string;
    passed: string;
    search: string;
};

type SessionOption = {
    id: number;
    title: string;
};

type Props = {
    participants: Paginated<Participant>;
    sessions: SessionOption[];
    filters: Filters;
    stats: {
        total: number;
        passed: number;
        failed: number;
        average_score: number;
    };
};

const statusOptions = [
    ["", "Semua status"],
    ["in_progress", "Sedang Mengerjakan"],
    ["completed", "Selesai"],
];

export default function PublicResults({ participants, sessions, filters, stats }: Props) {
    const { flash } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [passed, setPassed] = useState(filters.passed ?? "");
    const [session, setSession] = useState(filters.session ? String(filters.session) : "");
    const [busyParticipantId, setBusyParticipantId] = useState<number | null>(null);
    const [detailParticipant, setDetailParticipant] = useState<Participant | null>(null);
    const [answerReview, setAnswerReview] = useState<AnswerReview | null>(null);
    const [reviewLoading, setReviewLoading] = useState<number | null>(null);

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            "/dashboard/admin/public-exams/results",
            {
                search: search.trim() || undefined,
                status: status || undefined,
                passed: passed || undefined,
                session: session || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const resetFilters = () => {
        setSearch("");
        setStatus("");
        setPassed("");
        setSession("");
        router.get("/dashboard/admin/public-exams/results", {}, { preserveState: true, preserveScroll: true });
    };

    const forceStop = async (participant: Participant) => {
        if (!await confirmAction("Hentikan ujian peserta?", "Pengerjaan aktif " + participant.name + " akan langsung dinilai. Peserta tidak dapat melanjutkan ujian.", "Ya, hentikan ujian")) {
            return;
        }

        setBusyParticipantId(participant.id);
        router.post(route("admin.public-exams.results.participants.force-stop", { participant: participant.id }), {}, {
            preserveScroll: true,
            onError: () => showErrorToast("Ujian tidak dapat dihentikan. Muat ulang data lalu coba kembali."),
            onFinish: () => setBusyParticipantId(null),
        });
    };

    const deleteHistory = async (participant: Participant) => {
        if (!await confirmAction("Hapus riwayat peserta?", "Identitas dan seluruh riwayat ujian " + participant.name + " akan dihapus. Peserta harus masuk kembali melalui portal ujian. Tindakan ini tidak dapat dibatalkan.", "Ya, hapus riwayat")) {
            return;
        }

        setBusyParticipantId(participant.id);
        router.delete(route("admin.public-exams.results.participants.destroy", { participant: participant.id }), {
            preserveScroll: true,
            onSuccess: () => {
                if (typeof BroadcastChannel !== "undefined") {
                    const channel = new BroadcastChannel("public-exam-participants");
                    channel.postMessage({ type: "deleted", participantId: participant.id });
                    channel.close();
                }
            },
            onError: () => showErrorToast("Riwayat tidak dapat dihapus. Hentikan dahulu ujian yang masih berlangsung."),
            onFinish: () => setBusyParticipantId(null),
        });
    };

    const openAnswerReview = async (participant: Participant, subject: SubjectResult) => {
        setReviewLoading(subject.subject_id);
        try {
            const response = await axios.get<AnswerReview>(route("admin.public-exams.results.participants.subjects.answers", {
                participant: participant.id,
                subject: subject.subject_id,
            }));
            setDetailParticipant(null);
            setAnswerReview(response.data);
        } catch {
            showErrorToast("Rincian jawaban belum tersedia untuk mapel ini.");
        } finally {
            setReviewLoading(null);
        }
    };

    const formatDate = (isoString: string | null) => {
        if (!isoString) return "—";
        try {
            return new Date(isoString).toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return isoString;
        }
    };

    return (
        <>
            <Head title="Hasil Ujian Publik" />

            <ExamWorkspace active="sessions">
                <PageHeader
                    title="Hasil Ujian Publik"
                    badge="REKAP & EVALUASI KELULUSAN"
                    description="Review agregat skor seluruh mata pelajaran sesi, status kelulusan (passing grade > 65), dan hasil remedial peserta ujian publik."
                    icon="fa-solid fa-square-poll-vertical"
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            {session && (
                                <a
                                    href={route("admin.exams.public-sessions.results.export", { session: Number(session) })}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20"
                                >
                                    <i className="fa-solid fa-file-csv text-xs" /> Unduh CSV Sesi Ini
                                </a>
                            )}
                            <BackLink href="/dashboard/admin/public-exams/sessions" label="Kembali ke Sesi" />
                        </div>
                    }
                />

                <FlashMessage value={flash.success} type="success" />

                <PublicExamSummary title="Ringkasan hasil ujian" value={stats.total} label="peserta" description="Rekap hasil ujian publik" items={[
                    { label: "Peserta lulus", value: stats.passed, description: "Sesuai ambang kelulusan", tone: "success" },
                    { label: "Belum lulus", value: stats.failed, description: "Sesuai ambang kelulusan", tone: "warning" },
                    { label: "Rata-rata nilai", value: stats.average_score, description: "Rekap nilai peserta" },
                ]} progress={{ value: stats.passed, total: stats.total, label: `${stats.passed} dari ${stats.total} peserta lulus` }} />

                {/* Filter Toolbar Section */}
                <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                    <form onSubmit={applyFilters} className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:items-end">
                        <div>
                            <label className={labelClass} htmlFor="result-search">Cari Peserta</label>
                            <input
                                id="result-search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={inputClass}
                                placeholder="Nama siswa, kode peserta, asal sekolah..."
                            />
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="result-status">Status Pengerjaan</label>
                            <select
                                id="result-status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className={inputClass}
                            >
                                {statusOptions.map(([val, lbl]) => (
                                    <option key={val} value={val}>{lbl}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="result-passed">Status Kelulusan</label>
                            <select
                                id="result-passed"
                                value={passed}
                                onChange={(e) => setPassed(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Semua kelulusan</option>
                                <option value="1">Lulus (&gt; 65)</option>
                                <option value="0">Belum Lulus (≤ 65)</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="result-session">Sesi Ujian</label>
                            <select
                                id="result-session"
                                value={session}
                                onChange={(e) => setSession(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Semua sesi publik</option>
                                {sessions.map((item) => (
                                    <option key={item.id} value={item.id}>{item.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button type="submit" className={`${primaryButtonClass} min-h-10 px-4`}>
                                <i className="fa-solid fa-filter text-xs" /> Terapkan
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className={`${secondaryButtonClass} min-h-10 px-3`}
                                title="Reset Filter"
                            >
                                <i className="fa-solid fa-rotate-left text-xs" />
                            </button>
                        </div>
                    </form>
                </section>

                {/* Results Table Section */}
                <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <i className="fa-solid fa-users-rectangle text-amber-500" />
                                <span>Daftar Evaluasi Peserta Ujian Publik</span>
                                <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {participants.total}
                                </span>
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Skor akhir dihitung dari jumlah nilai efektif dibagi jumlah paket dalam sesi. Lulus jika rata-rata lebih dari 65.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 pt-0">
                        {participants.data.length === 0 ? (
                            <EmptyState
                                icon="fa-solid fa-chart-simple"
                                title="Belum ada data hasil ujian"
                                description="Peserta yang menyelesaikan ujian publik akan muncul di sini."
                            />
                        ) : (
                            <div role="region" aria-label="Daftar evaluasi peserta ujian publik" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-white/10">
                                <table className="min-w-full text-left text-xs dark:text-white">
                                    <caption className="sr-only">Daftar hasil, status pengerjaan, dan tindakan administrasi peserta ujian publik. Rincian pelanggaran tersedia di Monitoring Ujian.</caption>
                                    <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 uppercase font-bold tracking-wider">
                                        <tr>
                                            <th scope="col" className="p-3">Kode Peserta</th>
                                            <th scope="col" className="p-3">Nama Siswa & Sekolah</th>
                                            <th scope="col" className="p-3">Sesi Ujian</th>
                                            <th scope="col" className="p-3 text-center">Rata-rata Skor</th>
                                            <th scope="col" className="p-3 text-center">Kelulusan</th>
                                            <th scope="col" className="p-3 text-center">Status</th>
                                            <th scope="col" className="p-3">Waktu Selesai</th>
                                            <th scope="col" className="p-3 text-right">Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {participants.data.map((p) => {
                                            const isPassed = p.is_passed;
                                            const isBusy = busyParticipantId === p.id;
                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all">
                                                    <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                                                        {p.participant_code}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                                                        <div className="text-[11px] text-slate-400">{p.school_origin}</div>
                                                    </td>
                                                    <td className="p-3 font-medium text-slate-600 dark:text-slate-300">
                                                        {p.session_title}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {p.average_score !== null ? (
                                                            <span className={`text-base font-black ${
                                                                p.average_score > 65 ? "text-emerald-500" : "text-red-500"
                                                            }`}>
                                                                {p.average_score}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 font-bold">—</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {isPassed === true ? (
                                                            <span className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                                                <i className="fa-solid fa-circle-check mr-1 text-[10px]" /> Lulus
                                                            </span>
                                                        ) : isPassed === false ? (
                                                            <span className="inline-flex items-center rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
                                                                <i className="fa-solid fa-circle-xmark mr-1 text-[10px]" /> Belum Lulus
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">Dalam Proses</span>
                                                        )}
                                                        {p.requires_evaluation && (
                                                            <span className="mt-1 inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                                                Perlu Evaluasi
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <StatusPill value={p.display_status} />
                                                    </td>
                                                    <td className="p-3 text-slate-400">
                                                        {formatDate(p.completed_at)}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex min-w-48 flex-wrap justify-end gap-2">
                                                            <button type="button" onClick={() => setDetailParticipant(p)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-sky-500/30 px-3 text-xs font-bold text-sky-700 transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:text-sky-300 dark:hover:bg-sky-500/10" aria-label={"Lihat detail nilai " + p.name}>
                                                                <i className="fa-solid fa-chart-column" aria-hidden="true" /> Detail nilai
                                                            </button>
                                                            {p.has_active_attempt ? (
                                                                <button type="button" disabled={isBusy} onClick={() => forceStop(p)} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-bold text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/50 disabled:cursor-not-allowed disabled:opacity-60" aria-label={"Hentikan paksa ujian " + p.name}>
                                                                    <i className="fa-solid fa-stop" aria-hidden="true" /> Hentikan
                                                                </button>
                                                            ) : (
                                                                <button type="button" disabled={isBusy} onClick={() => deleteHistory(p)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10" aria-label={"Hapus riwayat " + p.name}>
                                                                    <i className="fa-solid fa-trash-can" aria-hidden="true" /> Hapus riwayat
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Links */}
                        {participants.links && participants.links.length > 3 && (
                            <nav aria-label="Navigasi halaman" className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                                {participants.links.map((link, idx) => (
                                    link.url ? (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                                                link.active
                                                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                                                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            }`}
                                        >
                                            {link.label.replace(/&laquo;|&raquo;/g, "") || (idx === 0 ? "«" : "»")}
                                        </Link>
                                    ) : (
                                        <span
                                            key={idx}
                                            className="rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-400 opacity-60"
                                        >
                                            {link.label.replace(/&laquo;|&raquo;/g, "") || (idx === 0 ? "«" : "»")}
                                        </span>
                                    )
                                ))}
                            </nav>
                        )}
                    </div>
                </section>
                {detailParticipant && <SubjectScoreModal participant={detailParticipant} onClose={() => setDetailParticipant(null)} onReview={openAnswerReview} reviewLoading={reviewLoading} />}
                {answerReview && <AnswerReviewModal review={answerReview} onClose={() => setAnswerReview(null)} />}
            </ExamWorkspace>
        </>
    );
}

function SubjectScoreModal({ participant, onClose, onReview, reviewLoading }: { participant: Participant; onClose: () => void; onReview: (participant: Participant, subject: SubjectResult) => Promise<void>; reviewLoading: number | null }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={onClose}>
            <section aria-modal="true" aria-labelledby="subject-score-title" role="dialog" className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900" onMouseDown={(event) => event.stopPropagation()}>
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-white/10">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">Rincian nilai per mapel</p>
                        <h2 id="subject-score-title" className="mt-1 text-lg font-black text-slate-900 dark:text-white">{participant.name}</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{participant.participant_code} · {participant.session_title}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 dark:hover:bg-white/10" aria-label="Tutup detail nilai">
                        <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                </header>
                <div className="overflow-x-auto p-5">
                    <table className="min-w-full text-left text-sm text-slate-700 dark:text-slate-200">
                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-300">
                            <tr><th className="p-3">Mapel</th><th className="p-3 text-center">Utama</th><th className="p-3 text-center">Remedial</th><th className="p-3 text-center">Nilai akhir</th><th className="p-3 text-center">Ambang</th><th className="p-3 text-center">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                            {participant.subjects.map((subject) => (
                                <tr key={subject.subject_name}>
                                    <td className="p-3"><p className="font-bold text-slate-900 dark:text-white">{subject.subject_name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{subject.package_title}</p></td>
                                    <td className="p-3 text-center font-medium">{subject.primary_score ?? "—"}</td>
                                    <td className="p-3 text-center font-medium">{subject.remedial_score ?? "—"}</td>
                                    <td className="p-3 text-center font-black text-slate-950 dark:text-white">{subject.effective_score ?? "—"}</td>
                                    <td className="p-3 text-center font-medium">{subject.passing_score ?? "—"}</td>
                                    <td className="p-3 text-center">{subject.is_passed === null ? <span className="text-slate-400">Belum dinilai</span> : subject.is_passed ? <span className="font-bold text-emerald-600 dark:text-emerald-300">Lulus</span> : <span className="font-bold text-red-600 dark:text-red-300">Belum lulus</span>}<div className="mt-2">{subject.primary_score === null && subject.remedial_score === null ? <span className="text-xs text-slate-400">Belum ada jawaban dinilai</span> : <button type="button" onClick={() => void onReview(participant, subject)} disabled={reviewLoading !== null} className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-sky-500/30 px-2 text-xs font-bold text-sky-700 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 disabled:cursor-wait disabled:opacity-60 dark:text-sky-300 dark:hover:bg-sky-500/10"><i className="fa-solid fa-list-check" aria-hidden="true" />{reviewLoading === subject.subject_id ? "Memuat..." : "Review jawaban"}</button>}</div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <footer className="flex justify-end border-t border-slate-200 p-4 dark:border-white/10"><button type="button" onClick={onClose} className={secondaryButtonClass}>Tutup</button></footer>
            </section>
        </div>
    );
}

function AnswerReviewModal({ review, onClose }: { review: AnswerReview; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4" role="presentation" onMouseDown={onClose}>
            <section aria-modal="true" aria-labelledby="answer-review-title" role="dialog" className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900" onMouseDown={(event) => event.stopPropagation()}>
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-white/10">
                    <div><p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">Review jawaban per mapel</p><h2 id="answer-review-title" className="mt-1 text-lg font-black text-slate-900 dark:text-white">{review.subject_name} · {review.participant.name}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{review.participant.participant_code}</p></div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 dark:hover:bg-white/10" aria-label="Tutup review jawaban"><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
                </header>
                <div className="space-y-6 p-5">
                    {review.attempts.map((attempt) => <section key={attempt.id}>
                        <div className="mb-3"><h3 className="font-black text-slate-900 dark:text-white">{attempt.attempt_type === "remedial" ? "Remedial" : "Ujian utama"} #{attempt.attempt_number}</h3><p className="text-xs text-slate-500 dark:text-slate-400">{attempt.package_title} · {attempt.percentage_score ?? "—"}% · {attempt.correct_answers}/{attempt.total_questions} benar</p></div>
                        <div className="space-y-3">{attempt.questions.map((question, index) => <article key={question.id} className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><p className="text-sm font-bold leading-6 text-slate-900 dark:text-white">{index + 1}. <RichExamText text={question.question_text} /></p><span className={question.is_correct === true ? "inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300" : question.is_correct === false ? "inline-flex rounded-full bg-red-500/10 px-2 py-1 text-xs font-bold text-red-700 dark:text-red-300" : "inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300"}>{question.is_correct === true ? "Benar" : question.is_correct === false ? "Salah" : "Belum dijawab"}</span></div><div className="mt-3 grid gap-2">{Object.entries(question.options).map(([key, value]) => value ? <div key={key} className={question.correct_answer === key ? "rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200" : question.selected_option === key ? "rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200" : "rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-white/[0.03] dark:text-slate-200"}><span className="font-black">{key}.</span> <RichExamText text={value} />{question.correct_answer === key ? <span className="ml-2 text-xs font-bold">(kunci)</span> : null}{question.selected_option === key ? <span className="ml-2 text-xs font-bold">(dipilih)</span> : null}</div> : null)}</div><p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Jawaban peserta: {question.selected_option ?? "—"} · Kunci: {question.correct_answer} · Poin: {question.point_awarded}/{question.point}</p></article>)}</div>
                    </section>)}
                </div>
                <footer className="flex justify-end border-t border-slate-200 p-4 dark:border-white/10"><button type="button" onClick={onClose} className={secondaryButtonClass}>Tutup</button></footer>
            </section>
        </div>
    );
}

PublicResults.layout = (page: ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
