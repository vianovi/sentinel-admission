import { Fragment, useState, type ReactNode } from "react";
import { Head, usePoll } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    EmptyState,
    ExamWorkspace,
    PageHeader,
    StatCard,
    StatusPill,
} from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";

type Violation = {
    type: string;
    at: string;
};

type Participant = {
    id: number;
    participant_code: string;
    name: string;
    school_origin: string;
    status: string;
    display_status: string;
    started_at: string | null;
    completed_at: string | null;
    session_title: string;
    violations_count: number;
    violations: Violation[];
    active_attempt: {
        subject_name: string;
        package_title: string;
        started_at: string;
        expires_at: string;
    } | null;
};

type Props = {
    participants: Participant[];
    summary: {
        total: number;
        active: number;
        completed: number;
        with_violations: number;
    };
    refreshedAt: string;
};

export default function PublicExamMonitoring({ participants, summary, refreshedAt }: Props) {
    const [expandedParticipantId, setExpandedParticipantId] = useState<number | null>(null);

    usePoll(60_000, { only: ["participants", "summary", "refreshedAt"] });

    return (
        <>
            <Head title="Monitoring Ujian Publik" />

            <ExamWorkspace active="sessions">
                <PageHeader
                    title="Monitoring Ujian Publik"
                    badge="PEMANTAUAN LANGSUNG"
                    description="Pantau peserta yang telah masuk, status pengerjaan, dan pelanggaran keamanan. Data diperbarui otomatis setiap 60 detik."
                    icon="fa-solid fa-tower-cell"
                />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Total peserta" value={summary.total} icon="fa-solid fa-users" />
                    <StatCard label="Sedang mengerjakan" value={summary.active} icon="fa-solid fa-person-circle-check" tone="text-amber-500" />
                    <StatCard label="Selesai" value={summary.completed} icon="fa-solid fa-circle-check" tone="text-emerald-500" />
                    <StatCard label="Ada pelanggaran" value={summary.with_violations} icon="fa-solid fa-triangle-exclamation" tone="text-red-500" />
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-white/10">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                                <i className="fa-solid fa-user-shield text-amber-500" /> Peserta terpantau
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Klik peserta untuk melihat mata pelajaran aktif dan riwayat pelanggarannya.</p>
                        </div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Diperbarui {formatDate(refreshedAt)}</p>
                    </div>

                    {participants.length === 0 ? (
                        <div className="p-5">
                            <EmptyState icon="fa-solid fa-users" title="Belum ada peserta" description="Peserta akan muncul setelah masuk melalui portal ujian publik." />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-xs dark:text-white">
                                <caption className="sr-only">Peserta ujian publik, status pengerjaan, dan ringkasan pelanggaran.</caption>
                                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-white/5">
                                    <tr>
                                        <th scope="col" className="p-3">Peserta</th>
                                        <th scope="col" className="p-3">Sesi</th>
                                        <th scope="col" className="p-3">Status</th>
                                        <th scope="col" className="p-3">Pelanggaran</th>
                                        <th scope="col" className="p-3">Aktivitas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {participants.map((participant) => {
                                        const expanded = expandedParticipantId === participant.id;

                                        return (
                                            <Fragment key={participant.id}>
                                                <tr key={participant.id} className="transition hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                                    <td className="p-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedParticipantId(expanded ? null : participant.id)}
                                                            aria-expanded={expanded}
                                                            className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                                        >
                                                            <span className="block font-bold text-slate-900 dark:text-white">{participant.name}</span>
                                                            <span className="mt-0.5 block font-mono text-[11px] text-amber-600 dark:text-amber-400">{participant.participant_code} <i className={`fa-solid ${expanded ? "fa-chevron-up" : "fa-chevron-down"} ml-1`} aria-hidden="true" /></span>
                                                            <span className="mt-0.5 block text-[11px] text-slate-400">{participant.school_origin}</span>
                                                        </button>
                                                    </td>
                                                    <td className="p-3 font-medium text-slate-600 dark:text-slate-300">{participant.session_title}</td>
                                                    <td className="p-3"><StatusPill value={participant.display_status} /></td>
                                                    <td className="p-3">
                                                        {participant.violations_count > 0 ? (
                                                            <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 font-bold text-red-700 dark:text-red-300"><i className="fa-solid fa-triangle-exclamation" /> {participant.violations_count} kali</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-bold text-emerald-700 dark:text-emerald-300"><i className="fa-solid fa-shield-halved" /> Aman</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-slate-500 dark:text-slate-400">{participant.active_attempt ? `${participant.active_attempt.subject_name} · aktif` : participant.completed_at ? `Selesai ${formatDate(participant.completed_at)}` : "Belum memulai"}</td>
                                                </tr>
                                                {expanded ? (
                                                    <tr key={`${participant.id}-detail`}>
                                                        <td colSpan={5} className="bg-slate-50 p-4 dark:bg-slate-950">
                                                            <div className="grid gap-3 lg:grid-cols-2">
                                                                <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pengerjaan saat ini</h3>
                                                                    {participant.active_attempt ? (
                                                                        <dl className="mt-3 space-y-2 text-xs">
                                                                            <div><dt className="text-slate-500">Mata pelajaran</dt><dd className="font-semibold text-slate-900 dark:text-white">{participant.active_attempt.subject_name} · {participant.active_attempt.package_title}</dd></div>
                                                                            <div><dt className="text-slate-500">Mulai</dt><dd className="font-semibold text-slate-900 dark:text-white">{formatDate(participant.active_attempt.started_at)}</dd></div>
                                                                            <div><dt className="text-slate-500">Berakhir</dt><dd className="font-semibold text-slate-900 dark:text-white">{formatDate(participant.active_attempt.expires_at)}</dd></div>
                                                                        </dl>
                                                                    ) : <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Tidak ada mata pelajaran yang sedang dikerjakan.</p>}
                                                                </section>
                                                                <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Riwayat pelanggaran</h3>
                                                                    {participant.violations.length > 0 ? (
                                                                        <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                                                            {participant.violations.map((violation, index) => <li key={`${violation.at}-${index}`} className="flex gap-2"><i className="fa-solid fa-triangle-exclamation mt-0.5 text-red-500" /><span>{violation.type === "tab_switch" ? "Berpindah tab" : "Keluar dari layar penuh"} · {formatDate(violation.at)}</span></li>)}
                                                                        </ul>
                                                                    ) : <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-300"><i className="fa-solid fa-shield-halved mr-1.5" />Belum ada pelanggaran tercatat.</p>}
                                                                </section>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : null}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </ExamWorkspace>
        </>
    );
}

function formatDate(value: string | null): string {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

PublicExamMonitoring.layout = (page: ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
