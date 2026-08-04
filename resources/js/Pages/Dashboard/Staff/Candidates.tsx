// resources/js/Pages/Dashboard/Staff/Candidates.tsx

import { useEffect, useMemo, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import CandidateFilters from "@/Components/Dashboard/Staff/Candidates/CandidateFilters";
import CandidateTable from "@/Components/Dashboard/Staff/Candidates/CandidateTable";
import CandidatePagination from "@/Components/Dashboard/Staff/Candidates/CandidatePagination";
import ResizableSplitGrid from "@/Components/Dashboard/Shared/ResizableSplitGrid";
import {
    ActionNeededBadge,
    LifecycleBadge,
    MiniMeter,
    ReadinessStrip,
} from "@/Components/Dashboard/Staff/Candidates/OperationalBadges";
import type { FilterOption, Filters, Wave } from "@/Components/Dashboard/Staff/Candidates/CandidateFilters";
import type { CandidateRow } from "@/Components/Dashboard/Staff/Candidates/CandidateTable";
import type { PaginationLink } from "@/Components/Dashboard/Staff/Candidates/CandidatePagination";
import type { PageProps } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Paginated<T> = {
    data:         T[];
    current_page: number;
    last_page:    number;
    per_page:     number;
    total:        number;
    links:        PaginationLink[];
};

type Props = {
    candidates: Paginated<CandidateRow>;
    waves:      Wave[];
    programs:   FilterOption[];
    action_options: FilterOption[];
    summary: {
        total: number;
        submitted: number;
        document_review: number;
        payment_review: number;
        change_requests: number;
        verified_unassigned: number;
    };
    filters:    Filters;
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function StaffCandidates({ candidates, waves, programs, action_options, summary, filters }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(candidates.data[0]?.id ?? null);
    const selectedCandidate = useMemo(
        () => candidates.data.find((candidate) => candidate.id === selectedCandidateId) ?? candidates.data[0] ?? null,
        [candidates.data, selectedCandidateId],
    );
    const summaryCards = [
        { label: "Total Kandidat", value: summary.total, icon: "fa-solid fa-users", tone: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300" },
        { label: "Menunggu Review", value: summary.submitted, icon: "fa-solid fa-clock", tone: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300" },
        { label: "Dokumen Pending", value: summary.document_review, icon: "fa-solid fa-file-circle-check", tone: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300" },
        { label: "Pembayaran Pending", value: summary.payment_review, icon: "fa-solid fa-money-check-dollar", tone: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-300" },
        { label: "Perubahan Data", value: summary.change_requests, icon: "fa-solid fa-arrows-rotate", tone: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300" },
        { label: "Verified tanpa Sesi", value: summary.verified_unassigned, icon: "fa-solid fa-calendar-xmark", tone: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300" },
    ];

    useEffect(() => {
        if (candidates.data.length === 0) {
            setSelectedCandidateId(null);
            return;
        }

        const stored = typeof window !== "undefined"
            ? Number(window.localStorage.getItem("staff:selectedCandidateId"))
            : null;
        const storedCandidate = stored
            ? candidates.data.find((candidate) => candidate.id === stored)
            : null;

        if (storedCandidate) {
            setSelectedCandidateId(storedCandidate.id);
            return;
        }

        if (!candidates.data.some((candidate) => candidate.id === selectedCandidateId)) {
            setSelectedCandidateId(candidates.data[0].id);
        }
    }, [candidates.data, selectedCandidateId]);

    return (
        <DashboardLayout>
            <Head title="Kandidat — Staff" />

            <div className="flex flex-col gap-6 pb-8">

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                            <i className="fa-solid fa-users text-sm" />
                        </div>
                        <div>
                            <h1 className="font-display text-xl font-bold leading-tight text-slate-800 dark:text-white">
                                Daftar Kandidat
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {candidates.total.toLocaleString("id-ID")} kandidat pada hasil saat ini
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/dashboard/staff/change-requests"
                            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:border-amber-400 hover:text-amber-600 dark:border-white/10 dark:text-slate-300"
                        >
                            <i className="fa-solid fa-triangle-exclamation text-xs" />
                            Perlu Tindakan
                        </Link>
                        <Link
                            href="/dashboard/staff/payment-operations"
                            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        >
                            <i className="fa-solid fa-money-check-dollar text-xs" />
                            Payment Ops
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    {summaryCards.map((card) => (
                        <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${card.tone}`}>
                                    <i className={`${card.icon} text-sm`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl font-black leading-none text-slate-900 dark:text-white">
                                        {card.value.toLocaleString("id-ID")}
                                    </p>
                                    <p className="mt-1 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        {card.label}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {flash.error && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                        {flash.error}
                    </div>
                )}

                {/* ── Filters ──────────────────────────────────────────────── */}
                <CandidateFilters
                    filters={filters}
                    waves={waves}
                    programs={programs}
                    actionOptions={action_options}
                    basePath="/dashboard/staff/candidates"
                />

                <ResizableSplitGrid
                    storageKey="staff-candidates"
                    initialLeftWidth={820}
                    minLeftWidth={500}
                    maxLeftWidth={1150}
                    left={
                        <div className="space-y-4">
                            <CandidateTable
                                candidates={candidates.data}
                                basePath="/dashboard/staff/candidates"
                                selectedCandidateStorageKey="staff:selectedCandidateId"
                                selectedCandidateId={selectedCandidateId}
                                onSelectCandidate={(candidate) => setSelectedCandidateId(candidate.id)}
                            />

                            <CandidatePagination
                                currentPage={candidates.current_page}
                                lastPage={candidates.last_page}
                                total={candidates.total}
                                links={candidates.links}
                                filters={filters}
                                basePath="/dashboard/staff/candidates"
                            />
                        </div>
                    }
                    right={
                        <CandidateWorkbenchPanel
                            candidate={selectedCandidate}
                            basePath="/dashboard/staff/candidates"
                        />
                    }
                />

            </div>
        </DashboardLayout>
    );
}

function CandidateWorkbenchPanel({ candidate, basePath }: { candidate: CandidateRow | null; basePath: string }) {
    if (!candidate) {
        return (
            <aside className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900 xl:sticky xl:top-20 xl:self-start">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                    <i className="fa-solid fa-user-check text-lg text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Tidak ada kandidat dipilih</p>
            </aside>
        );
    }

    const operational = candidate.operational;
    const detailHref = `${basePath}/${candidate.id}`;
    const statusHref = `${basePath}/${candidate.id}/status-pendaftaran`;
    const actionHref = operational?.action_needed?.href && operational.action_needed.key !== "clear"
        ? operational.action_needed.href
        : detailHref;
    const primaryButtonLabel = operational?.action_needed?.key === "clear"
        ? "Buka Profil"
        : "Buka Aksi Utama";

    return (
        <aside className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 xl:sticky xl:top-20 xl:self-start">
            <div className="border-b border-slate-100 p-5 dark:border-white/10">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-base font-display font-black text-slate-900 dark:text-white">
                            {candidate.full_name}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                            {candidate.candidate_code}
                            {candidate.nisn ? ` - NISN ${candidate.nisn}` : ""}
                        </p>
                    </div>
                    <LifecycleBadge status={candidate.status} />
                </div>
            </div>

            <div className="space-y-5 p-5">
                <section className="grid grid-cols-2 gap-3">
                    <Info label="Gelombang" value={candidate.admission_wave ?? "-"} />
                    <Info label="Program" value={candidate.program_choice ?? "-"} />
                    <Info label="Asal Sekolah" value={candidate.school_origin ?? "-"} wide />
                    <Info label="Update" value={candidate.updated_at} />
                </section>

                {operational ? (
                    <>
                        <section>
                            <p className="mb-2 text-[11px] font-bold uppercase text-slate-400">Primary Blocker</p>
                            <ActionNeededBadge action={operational.action_needed} />
                            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {operational.action_needed.description}
                            </p>
                        </section>

                        <section>
                            <p className="mb-2 text-[11px] font-bold uppercase text-slate-400">Readiness</p>
                            <ReadinessStrip items={operational.readiness} />
                        </section>

                        <section className="grid grid-cols-2 gap-3">
                            <MiniMeter label="Data" value={operational.completion_percentage} />
                            <MiniMeter label="Verifikasi" value={operational.verification_percentage} />
                        </section>

                        <section className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                            <p className="text-[11px] font-bold uppercase text-slate-400">Seleksi</p>
                            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                                {operational.selection?.label ?? "Belum tersedia"}
                            </p>
                            {operational.selection?.latest_attempt ? (
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Skor {operational.selection.latest_attempt.percentage_score ?? "-"}
                                    {operational.selection.latest_attempt.passed === null
                                        ? ""
                                        : operational.selection.latest_attempt.passed
                                            ? " - Lulus"
                                            : " - Tidak lulus"}
                                </p>
                            ) : null}
                        </section>
                    </>
                ) : null}

                <div className="grid grid-cols-1 gap-2">
                    <Link
                        href={actionHref}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                        <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                        {primaryButtonLabel}
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                        <Link
                            href={detailHref}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:text-slate-300"
                        >
                            <i className="fa-solid fa-user text-[10px]" />
                            Profil
                        </Link>
                        <Link
                            href={statusHref}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-amber-400 hover:text-amber-600 dark:border-white/10 dark:text-slate-300"
                        >
                            <i className="fa-solid fa-list-check text-[10px]" />
                            Status
                        </Link>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
    return (
        <div className={`min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03] ${wide ? "col-span-2" : ""}`}>
            <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-200" title={value}>
                {value}
            </p>
        </div>
    );
}
