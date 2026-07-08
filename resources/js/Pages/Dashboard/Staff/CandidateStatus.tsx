import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { Head, Link, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { ActionNeededBadge, LifecycleBadge, MiniMeter, ReadinessStrip, type ActionNeeded, type ReadinessItem } from "@/Components/Dashboard/Staff/Candidates/OperationalBadges";

type Tone = "success" | "warning" | "danger" | "primary" | "neutral" | "muted";

type Option = {
    value: string;
    label: string;
};

type Wave = {
    id: number;
    title: string;
};

type Filters = {
    search: string;
    status: string;
    wave: string;
    program: string;
    waiting: string;
};

type LifecycleStep = {
    key: string;
    label: string;
    status: string;
    tone: Tone | string;
    description: string;
};

type TimelineItem = {
    key: string;
    title: string;
    description: string;
    tone: Tone | string;
    at: string | null;
};

type CandidateStatusRow = {
    id: number;
    candidate_code: string | null;
    full_name: string;
    nisn: string | null;
    status: string;
    program_choice: string | null;
    admission_wave: string | null;
    school_origin: string | null;
    updated_at: string | null;
    waiting_side: string | null;
    waiting_side_label: string | null;
    lifecycle: {
        label: string;
        tone: Tone | string;
        description: string;
        waiting_side_label: string | null;
    };
    lifecycle_steps: LifecycleStep[];
    progress: {
        completion_percentage: number;
        verification_percentage: number;
        completed_checklist: number;
        total_checklist: number;
    };
    readiness: ReadinessItem[];
    primary_blocker: ActionNeeded;
    review_blockers: ActionNeeded[];
    selection: {
        status: string;
        label: string;
        latest_attempt?: {
            percentage_score: number | null;
            passed: boolean | null;
        } | null;
    };
    timeline: TimelineItem[];
    links: {
        profile: string;
        status_detail: string;
        primary_action: string | null;
    };
};

type Summary = {
    total: number;
    pipeline: Array<{ key: string; label: string; count: number }>;
    waiting_sides: Array<{ key: string; label: string; count: number }>;
    readiness: Array<{
        key: string;
        label: string;
        complete: number;
        pending_review: number;
        rejected: number;
        incomplete: number;
    }>;
    blockers: Array<{ key: string; label: string; tone: Tone | string; count: number }>;
};

type Props = {
    rows: CandidateStatusRow[];
    summary: Summary;
    waves: Wave[];
    programs: Option[];
    filters: Filters;
};

const BASE_PATH = "/dashboard/staff/candidate-status";

const statusOptions: Option[] = [
    { value: "", label: "Semua status" },
    { value: "draft", label: "Draft" },
    { value: "submitted", label: "Submitted" },
    { value: "verified", label: "Verified" },
    { value: "accepted", label: "Diterima" },
    { value: "rejected", label: "Ditolak" },
];

const toneClass: Record<Tone, string> = {
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    primary: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    neutral: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
    muted: "border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-500",
};

const stepDotClass: Record<string, string> = {
    complete: "bg-emerald-500",
    current: "bg-blue-500",
    pending: "bg-slate-300 dark:bg-slate-600",
    rejected: "bg-red-500",
    skipped: "bg-slate-300 dark:bg-slate-600",
};

function normalizedTone(tone: string | null | undefined): Tone {
    return ["success", "warning", "danger", "primary", "neutral", "muted"].includes(String(tone))
        ? String(tone) as Tone
        : "neutral";
}

function number(value: number) {
    return new Intl.NumberFormat("id-ID").format(value ?? 0);
}

function percent(value: number, total: number) {
    if (total <= 0) return 0;

    return Math.round((value / total) * 100);
}

function buildQuery(filters: Partial<Filters>) {
    const query: Record<string, string> = {};

    Object.entries(filters).forEach(([key, rawValue]) => {
        const value = String(rawValue ?? "").trim();
        if (value) query[key] = value;
    });

    return query;
}

function SelectFilter({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
    return (
        <label className="min-w-0">
            <span className="sr-only">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function PipelineSummary({ summary }: { summary: Summary }) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">Pipeline Kandidat</h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tahap sekarang dari semua kandidat pada snapshot status.</p>
                </div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{number(summary.total)}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {summary.pipeline.map((item) => (
                    <div key={item.key} className="rounded-md border border-slate-200 p-3 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                            <LifecycleBadge status={item.key} />
                            <span className="text-xs font-black text-slate-400">{percent(item.count, summary.total)}%</span>
                        </div>
                        <p className="mt-3 text-2xl font-black leading-none text-slate-900 dark:text-white">{number(item.count)}</p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${percent(item.count, summary.total)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ReadinessMatrix({ summary }: { summary: Summary }) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-white/10">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">Readiness Matrix</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kelengkapan perjalanan kandidat per area.</p>
            </div>
            <div className="grid gap-3 p-5 lg:grid-cols-2 xl:grid-cols-3">
                {summary.readiness.map((item) => (
                    <div key={item.key} className="rounded-md border border-slate-200 p-3 dark:border-white/10">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">{item.label}</p>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-300">{number(item.complete)} complete</span>
                        </div>
                        <div className="grid grid-cols-4 overflow-hidden rounded-md text-center text-[10px] font-black">
                            <div className="bg-emerald-500/15 px-2 py-2 text-emerald-700 dark:text-emerald-300">{number(item.complete)}</div>
                            <div className="bg-amber-500/15 px-2 py-2 text-amber-700 dark:text-amber-300">{number(item.pending_review)}</div>
                            <div className="bg-red-500/15 px-2 py-2 text-red-700 dark:text-red-300">{number(item.rejected)}</div>
                            <div className="bg-slate-500/10 px-2 py-2 text-slate-600 dark:text-slate-300">{number(item.incomplete)}</div>
                        </div>
                        <div className="mt-2 grid grid-cols-4 text-center text-[9px] font-bold uppercase text-slate-400">
                            <span>Done</span>
                            <span>Review</span>
                            <span>Reject</span>
                            <span>Kurang</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function WorkbenchGrid({ children }: { children: ReactNode }) {
    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,0.58fr)] 2xl:grid-cols-[minmax(0,1.75fr)_minmax(0,0.62fr)]">
            {children}
        </div>
    );
}

export default function CandidateStatus({ rows, summary, waves, programs, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [selectedId, setSelectedId] = useState<number | null>(rows[0]?.id ?? null);
    const selected = useMemo(
        () => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null,
        [rows, selectedId],
    );
    const waitingOptions = useMemo<Option[]>(() => [
        { value: "", label: "Semua waiting side" },
        ...summary.waiting_sides.map((item) => ({ value: item.key, label: `${item.label} (${number(item.count)})` })),
    ], [summary.waiting_sides]);

    useEffect(() => {
        if (rows.length === 0) {
            setSelectedId(null);
            return;
        }

        const stored = typeof window !== "undefined"
            ? Number(window.localStorage.getItem("staff:selectedCandidateStatusId"))
            : null;
        const storedRow = stored ? rows.find((row) => row.id === stored) : null;

        if (storedRow) {
            setSelectedId(storedRow.id);
            return;
        }

        if (!rows.some((row) => row.id === selectedId)) {
            setSelectedId(rows[0].id);
        }
    }, [rows, selectedId]);

    const applyFilter = (patch: Partial<Filters>) => {
        router.get(BASE_PATH, buildQuery({ ...filters, ...patch }), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        applyFilter({ search });
    };

    const rememberSelected = (id: number) => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem("staff:selectedCandidateStatusId", String(id));
        }
        setSelectedId(id);
    };

    const hasActiveFilter = Boolean(filters.search || filters.status || filters.wave || filters.program || filters.waiting);

    return (
        <DashboardLayout>
            <Head title="Status Kandidat - Staff" />

            <div className="flex flex-col gap-6 pb-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                            <i className="fa-solid fa-route text-sm" />
                        </div>
                        <div>
                            <h1 className="font-display text-xl font-bold leading-tight text-slate-800 dark:text-white">
                                Status Kandidat
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Workbench agregat perjalanan kandidat, readiness, dan langkah berikutnya.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/dashboard/staff/candidates"
                            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-300"
                        >
                            <i className="fa-solid fa-list text-xs" />
                            Semua Kandidat
                        </Link>
                        <Link
                            href="/dashboard/staff/change-requests"
                            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        >
                            <i className="fa-solid fa-triangle-exclamation text-xs" />
                            Perlu Tindakan
                        </Link>
                    </div>
                </div>

                <PipelineSummary summary={summary} />
                <ReadinessMatrix summary={summary} />

                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))_minmax(0,0.55fr)]">
                        <form onSubmit={submitSearch} className="flex min-w-0 gap-2 lg:col-span-2 2xl:col-span-1">
                            <div className="relative min-w-0 flex-1">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <i className="fa-solid fa-magnifying-glass text-xs" />
                                </span>
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari nama, kode, atau NISN..."
                                    className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                                />
                            </div>
                            <button type="submit" className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900">
                                <i className="fa-solid fa-arrow-right" />
                            </button>
                        </form>
                        <SelectFilter label="Status" value={filters.status} options={statusOptions} onChange={(value) => applyFilter({ status: value })} />
                        <SelectFilter label="Gelombang" value={filters.wave} options={[{ value: "", label: "Semua gelombang" }, ...waves.map((wave) => ({ value: String(wave.id), label: wave.title }))]} onChange={(value) => applyFilter({ wave: value })} />
                        <SelectFilter label="Program" value={filters.program} options={[{ value: "", label: "Semua program" }, ...programs]} onChange={(value) => applyFilter({ program: value })} />
                        <SelectFilter label="Waiting" value={filters.waiting} options={waitingOptions} onChange={(value) => applyFilter({ waiting: value })} />
                        {hasActiveFilter ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    router.get(BASE_PATH, {}, { preserveState: true, preserveScroll: true, replace: true });
                                }}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-white/10 dark:text-slate-300"
                            >
                                <i className="fa-solid fa-xmark text-[11px]" />
                                Reset
                            </button>
                        ) : null}
                    </div>
                </div>

                <WorkbenchGrid>
                    <CandidateStatusList rows={rows} selectedId={selectedId} onSelect={rememberSelected} />
                    <CandidateStatusPreview row={selected} />
                </WorkbenchGrid>
            </div>
        </DashboardLayout>
    );
}

function CandidateStatusList({ rows, selectedId, onSelect }: { rows: CandidateStatusRow[]; selectedId: number | null; onSelect: (id: number) => void }) {
    if (rows.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">Tidak ada kandidat pada filter ini</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ubah filter untuk melihat status kandidat lain.</p>
            </div>
        );
    }

    return (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="hidden border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03] 2xl:grid 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.55fr)]">
                {["Kandidat", "Tahap", "Readiness", "Next Step", "Preview"].map((header) => (
                    <p key={header} className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{header}</p>
                ))}
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-white/10">
                {rows.map((row) => {
                    const selected = selectedId === row.id;

                    return (
                        <li key={row.id}>
                            <div className={[
                                "grid gap-4 px-4 py-4 transition 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.55fr)] 2xl:items-center",
                                selected ? "bg-blue-50/70 dark:bg-blue-500/[0.07]" : "hover:bg-slate-50 dark:hover:bg-white/[0.03]",
                            ].join(" ")}>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-slate-900 dark:text-white">{row.full_name}</p>
                                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        {row.candidate_code ?? "-"} · NISN {row.nisn ?? "-"}
                                    </p>
                                    <p className="mt-0.5 truncate text-xs text-slate-400">
                                        {row.admission_wave ?? "Tanpa gelombang"} · {row.program_choice ?? "Program belum dipilih"}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <LifecycleBadge status={row.status} />
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{row.waiting_side_label ?? "Belum diketahui"}</p>
                                </div>
                                <div className="space-y-2">
                                    <ReadinessStrip items={row.readiness} compact />
                                    <div className="grid grid-cols-2 gap-3">
                                        <MiniMeter label="Data" value={row.progress.completion_percentage} />
                                        <MiniMeter label="Verif" value={row.progress.verification_percentage} />
                                    </div>
                                </div>
                                <ActionNeededBadge action={row.primary_blocker} />
                                <div className="flex flex-wrap gap-2 2xl:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => onSelect(row.id)}
                                        className={[
                                            "inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-bold transition",
                                            selected
                                                ? "bg-blue-600 text-white"
                                                : "border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-700 dark:border-white/10 dark:text-slate-300",
                                        ].join(" ")}
                                    >
                                        <i className="fa-solid fa-eye text-[10px]" />
                                        Preview
                                    </button>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

function CandidateStatusPreview({ row }: { row: CandidateStatusRow | null }) {
    if (!row) {
        return (
            <aside className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900 xl:sticky xl:top-20 xl:self-start">
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">Tidak ada kandidat dipilih</p>
            </aside>
        );
    }

    return (
        <aside className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 xl:sticky xl:top-20 xl:self-start">
            <div className="border-b border-slate-100 p-5 dark:border-white/10">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">{row.full_name}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{row.candidate_code ?? "-"} · {row.admission_wave ?? "Tanpa gelombang"}</p>
                    </div>
                    <LifecycleBadge status={row.status} />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{row.lifecycle.description}</p>
            </div>

            <div className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-3">
                    <MiniMeter label="Data" value={row.progress.completion_percentage} />
                    <MiniMeter label="Verifikasi" value={row.progress.verification_percentage} />
                </div>

                <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Journey</p>
                    <div className="space-y-3">
                        {row.lifecycle_steps.map((step) => (
                            <div key={step.key} className="flex gap-3">
                                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${stepDotClass[step.status] ?? "bg-slate-300"}`} />
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-800 dark:text-slate-100">{step.label}</p>
                                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Blocker Utama</p>
                    <div className={`rounded-md border p-3 ${toneClass[normalizedTone(row.primary_blocker.tone)]}`}>
                        <p className="text-sm font-black">{row.primary_blocker.label}</p>
                        <p className="mt-1 text-xs leading-5 opacity-90">{row.primary_blocker.description}</p>
                    </div>
                </div>

                <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Timeline Singkat</p>
                    <div className="space-y-3">
                        {row.timeline.slice(0, 4).map((item) => (
                            <div key={item.key} className="rounded-md border border-slate-200 p-3 dark:border-white/10">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-100">{item.title}</p>
                                <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{item.description}</p>
                                {item.at ? <p className="mt-1 text-[10px] font-bold text-slate-400">{item.at}</p> : null}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {row.links.primary_action ? (
                        <Link href={row.links.primary_action} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-black text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900">
                            <i className="fa-solid fa-bolt text-[10px]" />
                            Buka Langkah Berikutnya
                        </Link>
                    ) : null}
                    <Link href={row.links.status_detail} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-300">
                        <i className="fa-solid fa-route text-[10px]" />
                        Detail Status
                    </Link>
                    <Link href={row.links.profile} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-300">
                        <i className="fa-solid fa-user text-[10px]" />
                        Profil Kandidat
                    </Link>
                </div>
            </div>
        </aside>
    );
}
