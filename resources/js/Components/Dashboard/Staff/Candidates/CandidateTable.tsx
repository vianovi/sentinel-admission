// resources/js/Components/Dashboard/Staff/Candidates/CandidateTable.tsx

import { useEffect } from "react";
import { Link } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import {
    ActionNeededBadge,
    LifecycleBadge,
    MiniMeter,
    ReadinessStrip,
    type ActionNeeded,
    type ReadinessItem,
} from "@/Components/Dashboard/Staff/Candidates/OperationalBadges";

export type CandidateOperational = {
    readiness: ReadinessItem[];
    action_needed: ActionNeeded;
    waiting_side: string | null;
    waiting_side_label: string | null;
    completion_percentage: number;
    verification_percentage: number;
    selection?: {
        status: string;
        label: string;
        latest_attempt?: {
            percentage_score: number | null;
            passed: boolean | null;
        } | null;
    };
};

export type CandidateRow = {
    id: number;
    candidate_code: string;
    full_name: string;
    nisn: string;
    gender_label: string;
    school_origin: string;
    program_choice?: string | null;
    status: "draft" | "submitted" | "verified" | "accepted" | "rejected";
    admission_wave: string | null;
    doc_count: number;
    doc_pending: number;
    created_at: string;
    operational?: CandidateOperational;
};

type Props = {
    candidates: CandidateRow[];
    basePath?: string;
    selectedCandidateStorageKey?: string;
};

const TABLE_HEADERS = ["Kandidat", "Lifecycle", "Readiness", "Progress", "Aksi"];

export default function CandidateTable({
    candidates,
    basePath = "/dashboard/staff/candidates",
    selectedCandidateStorageKey = "staff:selectedCandidateId",
}: Props) {
    useEffect(() => {
        if (candidates.length === 0) return;
        animate(".candidate-row", {
            opacity: [0, 1],
            translateY: [10, 0],
            duration: 400,
            delay: stagger(35),
            ease: "outExpo",
        });
    }, [candidates]);

    const rememberCandidate = (id: number) => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(selectedCandidateStorageKey, String(id));
        }
    };

    if (candidates.length === 0) {
        return (
            <div className="overflow-hidden rounded-lg border border-dashed border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                        <i className="fa-solid fa-users text-lg text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        Tidak ada kandidat ditemukan
                    </p>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
                        Ubah kata kunci atau filter antrean untuk melihat kandidat lain.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="hidden border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03] xl:grid xl:grid-cols-[minmax(260px,1.3fr)_190px_minmax(330px,1.2fr)_190px_180px]">
                {TABLE_HEADERS.map((header) => (
                    <p key={header} className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {header}
                    </p>
                ))}
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-white/10">
                {candidates.map((candidate) => {
                    const initial = candidate.full_name.charAt(0).toUpperCase();
                    const detailHref = `${basePath}/${candidate.id}`;
                    const statusHref = `${basePath}/${candidate.id}/status-pendaftaran`;
                    const documentHref = `${basePath}/${candidate.id}/dokumen`;
                    const paymentHref = `${basePath}/${candidate.id}/pembayaran`;
                    const operational = candidate.operational;

                    return (
                        <li key={candidate.id} className="candidate-row opacity-0">
                            <div className="grid gap-4 px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] xl:grid-cols-[minmax(260px,1.3fr)_190px_minmax(330px,1.2fr)_190px_180px] xl:items-center">
                                <Link
                                    href={detailHref}
                                    onClick={() => rememberCandidate(candidate.id)}
                                    className="group flex min-w-0 items-center gap-3"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white shadow-sm dark:bg-white dark:text-slate-900">
                                        {initial}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-300">
                                            {candidate.full_name}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                            {candidate.candidate_code} · NISN {candidate.nisn || "-"}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-slate-400">
                                            {candidate.school_origin || "-"}
                                        </p>
                                    </div>
                                </Link>

                                <div className="flex flex-wrap items-center gap-2 xl:block xl:space-y-2">
                                    <LifecycleBadge status={candidate.status} />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {candidate.admission_wave ?? "Tanpa gelombang"}
                                    </p>
                                    {candidate.program_choice && (
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                            {candidate.program_choice}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {operational ? (
                                        <>
                                            <ReadinessStrip items={operational.readiness} compact />
                                            <ActionNeededBadge action={operational.action_needed} />
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <i className="fa-solid fa-circle-info" />
                                            Ringkasan operasional belum tersedia
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:max-w-sm xl:max-w-none">
                                    <MiniMeter label="Data" value={operational?.completion_percentage ?? 0} />
                                    <MiniMeter label="Verif" value={operational?.verification_percentage ?? 0} />
                                </div>

                                <div className="flex flex-wrap gap-2 xl:justify-end">
                                    <Link
                                        href={statusHref}
                                        onClick={() => rememberCandidate(candidate.id)}
                                        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-amber-300 px-3 text-xs font-bold text-amber-700 transition hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/10"
                                    >
                                        <i className="fa-solid fa-list-check text-[10px]" />
                                        Status
                                    </Link>
                                    <Link
                                        href={documentHref}
                                        onClick={() => rememberCandidate(candidate.id)}
                                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:text-slate-300"
                                        title="Review dokumen"
                                    >
                                        <i className="fa-solid fa-file-circle-check text-[11px]" />
                                    </Link>
                                    <Link
                                        href={paymentHref}
                                        onClick={() => rememberCandidate(candidate.id)}
                                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-orange-400 hover:text-orange-600 dark:border-white/10 dark:text-slate-300"
                                        title="Review pembayaran"
                                    >
                                        <i className="fa-solid fa-money-check-dollar text-[11px]" />
                                    </Link>
                                    <Link
                                        href={detailHref}
                                        onClick={() => rememberCandidate(candidate.id)}
                                        aria-label={`Buka detail ${candidate.full_name}`}
                                        className="inline-flex min-h-9 items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                    >
                                        <i className="fa-solid fa-arrow-right text-[10px]" />
                                    </Link>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
