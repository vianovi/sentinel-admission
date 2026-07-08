import { FormEvent, useEffect, useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    ActionNeededBadge,
    LifecycleBadge,
    MiniMeter,
    type ActionNeeded,
    type ReadinessItem,
} from "@/Components/Dashboard/Staff/Candidates/OperationalBadges";

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

const toneBarClass: Record<Tone, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    primary: "bg-blue-500",
    neutral: "bg-slate-400",
    muted: "bg-slate-300 dark:bg-slate-600",
};

const toneTextClass: Record<Tone, string> = {
    success: "text-emerald-600 dark:text-emerald-300",
    warning: "text-amber-600 dark:text-amber-300",
    danger: "text-red-600 dark:text-red-300",
    primary: "text-blue-600 dark:text-blue-300",
    neutral: "text-slate-500 dark:text-slate-300",
    muted: "text-slate-400 dark:text-slate-500",
};

const dotClass: Record<string, string> = {
    complete: "bg-emerald-500",
    current: "bg-blue-500",
    pending: "bg-slate-300 dark:bg-slate-600",
    rejected: "bg-red-500",
    skipped: "bg-slate-300 dark:bg-slate-600",
};

const readinessDotClass: Record<string, string> = {
    complete: "bg-emerald-500",
    pending_review: "bg-amber-500",
    rejected: "bg-red-500",
    incomplete: "bg-slate-300 dark:bg-slate-600",
    locked: "bg-slate-300 dark:bg-slate-600",
    unavailable: "bg-slate-300 dark:bg-slate-600",
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

function pipelineTone(key: string): Tone {
    if (key === "accepted") return "success";
    if (key === "rejected") return "danger";
    if (key === "submitted") return "warning";
    if (key === "verified") return "primary";

    return "neutral";
}

function pipelineIcon(key: string) {
    if (key === "accepted") return "fa-solid fa-circle-check";
    if (key === "rejected") return "fa-solid fa-circle-xmark";
    if (key === "submitted") return "fa-solid fa-clock";
    if (key === "verified") return "fa-solid fa-shield-check";

    return "fa-solid fa-circle-dot";
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

function StatusOverview({ summary }: { summary: Summary }) {
    const topWaiting = summary.waiting_sides.slice(0, 2);
    const topBlockers = summary.blockers.slice(0, 2);
    const cards = [
        { key: "total", label: "Total", value: summary.total, icon: "fa-solid fa-users", tone: "primary" as Tone },
        ...summary.pipeline.map((item) => ({
            key: item.key,
            label: item.label,
            value: item.count,
            icon: pipelineIcon(item.key),
            tone: pipelineTone(item.key),
        })),
    ];

    return (
        <div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-slate-100 dark:bg-white/10 md:grid-cols-3 xl:grid-cols-6">
                {cards.map((card) => (
                    <div key={card.key} className="min-w-0 bg-white px-3 py-2 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[10px] font-black uppercase text-slate-400">{card.label}</p>
                            <i className={`${card.icon} text-[10px] ${toneTextClass[card.tone]}`} />
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-2">
                            <p className="text-base font-black leading-none text-slate-900 dark:text-white">{number(card.value)}</p>
                            {card.key !== "total" ? (
                                <span className="shrink-0 text-[10px] font-black text-slate-400">{percent(card.value, summary.total)}%</span>
                            ) : null}
                        </div>
                        {card.key !== "total" ? (
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                <div className={`h-full rounded-full ${toneBarClass[card.tone]}`} style={{ width: `${percent(card.value, summary.total)}%` }} />
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
                {topWaiting.length > 0 ? topWaiting.map((item) => (
                    <StatusChip key={`waiting-${item.key}`} label={item.label} value={item.count} tone="primary" prefix="Wait" />
                )) : null}
                {topBlockers.length > 0 ? topBlockers.map((item) => (
                    <StatusChip key={`blocker-${item.key}`} label={item.label} value={item.count} tone={normalizedTone(item.tone)} prefix="Blocker" />
                )) : null}
                {topWaiting.length === 0 && topBlockers.length === 0 ? (
                    <span className="text-xs font-semibold text-slate-400">Tidak ada blocker prioritas.</span>
                ) : null}
            </div>
        </div>
    );
}

function StatusChip({ label, value, tone, prefix }: { label: string; value: number; tone: Tone; prefix: string }) {
    return (
        <span className="inline-flex min-h-6 min-w-0 max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
            <span className="shrink-0 text-[10px] font-black uppercase text-slate-400">{prefix}</span>
            <span className="truncate">{label}</span>
            <span className={`shrink-0 rounded border px-1 py-0.5 text-[10px] font-black ${toneClass[tone]}`}>{number(value)}</span>
        </span>
    );
}

function ReadinessDots({ items }: { items: ReadinessItem[] }) {
    return (
        <div className="flex min-w-0 items-center gap-1.5">
            {items.map((item) => (
                <span
                    key={item.key}
                    title={`${item.label}: ${item.status_label}`}
                    className={`h-2 w-2 shrink-0 rounded-full ${readinessDotClass[item.status] ?? "bg-slate-300 dark:bg-slate-600"}`}
                />
            ))}
        </div>
    );
}

function DetailLine({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-3">
            <span className="shrink-0 text-[10px] font-bold uppercase text-slate-400">{label}</span>
            <span className="min-w-0 truncate text-xs font-bold text-slate-700 dark:text-slate-200">{value || "-"}</span>
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

            <div className="flex flex-col gap-4 pb-8">
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
                                Perjalanan kandidat, blocker, dan next step dalam satu workbench compact.
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

                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <StatusOverview summary={summary} />

                    <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 dark:border-white/10 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.65fr)_repeat(4,minmax(0,1fr))_auto]">
                        <form onSubmit={submitSearch} className="flex min-w-0 gap-2 lg:col-span-2 xl:col-span-1">
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

                <div className="grid gap-4 xl:grid-cols-[minmax(0,2.35fr)_minmax(0,0.72fr)]">
                    <CandidateStatusList rows={rows} selectedId={selectedId} onSelect={rememberSelected} />
                    <CandidateInspector row={selected} />
                </div>
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
            <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">Daftar Status</h2>
                    <p className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">{number(rows.length)} kandidat</p>
                </div>
            </div>
            <div className="hidden border-b border-slate-100 px-3 py-2 dark:border-white/10 xl:grid xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.72fr)_minmax(0,0.9fr)_minmax(0,0.88fr)_auto] xl:items-center xl:gap-3">
                {["Kandidat", "Tahap", "Readiness", "Next Step", "Preview"].map((header) => (
                    <p key={header} className="text-[10px] font-black uppercase tracking-wide text-slate-400">{header}</p>
                ))}
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-white/10">
                {rows.map((row) => {
                    const selected = selectedId === row.id;
                    const initial = row.full_name.charAt(0).toUpperCase();

                    return (
                        <li key={row.id}>
                            <div className={[
                                "grid gap-2 px-3 py-2 transition xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.72fr)_minmax(0,0.9fr)_minmax(0,0.88fr)_auto] xl:items-center",
                                selected ? "bg-blue-50/70 dark:bg-blue-500/[0.07]" : "hover:bg-slate-50 dark:hover:bg-white/[0.03]",
                            ].join(" ")}>
                                <button type="button" onClick={() => onSelect(row.id)} className="group flex min-w-0 items-start gap-2 text-left">
                                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-900 text-[10px] font-black text-white shadow-sm dark:bg-white dark:text-slate-900">
                                        {initial}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-bold text-slate-900 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">{row.full_name}</span>
                                        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            {row.candidate_code ?? "-"} · NISN {row.nisn ?? "-"}
                                        </span>
                                        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                                            {row.admission_wave ?? "Tanpa gelombang"} · {row.program_choice ?? "Program belum dipilih"}
                                        </span>
                                    </span>
                                </button>

                                <div className="flex min-w-0 flex-wrap items-center gap-2 xl:block xl:space-y-1.5">
                                    <LifecycleBadge status={row.status} />
                                    <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{row.waiting_side_label ?? "Belum diketahui"}</p>
                                </div>

                                <div className="min-w-0 space-y-1">
                                    <ReadinessDots items={row.readiness} />
                                    <p className="truncate text-[11px] font-semibold text-slate-400">
                                        Data {row.progress.completion_percentage}% · Verif {row.progress.verification_percentage}%
                                    </p>
                                </div>

                                <div className="min-w-0 space-y-1">
                                    <ActionNeededBadge action={row.primary_blocker} />
                                    <p className="truncate text-[11px] font-semibold text-slate-400">
                                        Seleksi: {row.selection.label}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onSelect(row.id)}
                                    className={[
                                        "inline-flex min-h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition xl:justify-self-end",
                                        selected
                                            ? "bg-blue-600 text-white"
                                            : "border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-700 dark:border-white/10 dark:text-slate-300",
                                    ].join(" ")}
                                >
                                    <i className="fa-solid fa-eye text-[10px]" />
                                    Detail
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

function CandidateInspector({ row }: { row: CandidateStatusRow | null }) {
    if (!row) {
        return (
            <aside className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900 xl:sticky xl:top-20 xl:self-start">
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">Tidak ada kandidat dipilih</p>
            </aside>
        );
    }

    const blockerTone = normalizedTone(row.primary_blocker.tone);

    return (
        <aside className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 xl:sticky xl:top-20 xl:self-start">
            <div className="border-b border-slate-100 p-3 dark:border-white/10">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">{row.full_name}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{row.candidate_code ?? "-"} · {row.admission_wave ?? "Tanpa gelombang"}</p>
                    </div>
                    <LifecycleBadge status={row.status} />
                </div>
            </div>

            <div className="space-y-3 p-3">
                <div className="space-y-1.5 rounded-md bg-slate-50 px-2.5 py-2 dark:bg-white/[0.03]">
                    <DetailLine label="Program" value={row.program_choice} />
                    <DetailLine label="Sekolah" value={row.school_origin} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <MiniMeter label="Data" value={row.progress.completion_percentage} />
                    <MiniMeter label="Verifikasi" value={row.progress.verification_percentage} />
                </div>

                <section>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">Journey</p>
                    <div className="rounded-md border border-slate-200 p-2.5 dark:border-white/10">
                        <div className="flex items-center gap-2">
                            {row.lifecycle_steps.map((step) => (
                                <span key={step.key} title={step.label} className={`h-2.5 flex-1 rounded-full ${dotClass[step.status] ?? "bg-slate-300"}`} />
                            ))}
                        </div>
                        <p className="mt-2.5 text-xs font-bold text-slate-700 dark:text-slate-200">{row.lifecycle.label}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{row.lifecycle.description}</p>
                    </div>
                </section>

                <section>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">Next Step</p>
                    <div className={`rounded-md border p-2.5 ${toneClass[blockerTone]}`}>
                        <p className="text-xs font-black">{row.primary_blocker.label}</p>
                        <p className="mt-1 line-clamp-3 text-[11px] leading-4 opacity-90">{row.primary_blocker.description}</p>
                    </div>
                </section>

                <section>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">Readiness Detail</p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {row.readiness.map((item) => (
                            <div key={item.key} className="flex min-h-7 items-center justify-between gap-2 rounded-md border border-slate-200 px-2 dark:border-white/10">
                                <span className="min-w-0 truncate text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                                <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-black ${toneClass[normalizedTone(String(item.tone))]}`}>
                                    {item.status_label}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">Timeline</p>
                    <div className="space-y-2">
                        {row.timeline.slice(0, 2).map((item) => (
                            <div key={item.key} className="rounded-md border border-slate-200 px-2.5 py-2 dark:border-white/10">
                                <p className="line-clamp-1 text-xs font-black text-slate-800 dark:text-slate-100">{item.title}</p>
                                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-2">
                    {row.links.primary_action ? (
                        <Link href={row.links.primary_action} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-black text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900">
                            <i className="fa-solid fa-bolt text-[10px]" />
                            Buka Langkah Berikutnya
                        </Link>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2">
                        <Link href={row.links.status_detail} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-300">
                            Status
                        </Link>
                        <Link href={row.links.profile} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-300">
                            Profil
                        </Link>
                    </div>
                </div>
            </div>
        </aside>
    );
}
