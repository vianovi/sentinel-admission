import { Link } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";

export type QueueStat = {
    bucket: string;
    label: string;
    count: number;
};

export type QueueItem = {
    id: string;
    bucket: string;
    bucket_label: string;
    candidate: {
        id: number;
        candidate_code: string;
        full_name: string;
        nisn: string | null;
        status: string;
        admission_wave: string | null;
        program_choice: string | null;
    };
    title: string;
    description: string;
    tone: string;
    href: string | null;
    waiting_side_label: string | null;
    updated_at: string | null;
};

export type OperationalQueue = {
    items: QueueItem[];
    stats: QueueStat[];
    buckets: { value: string; label: string }[];
    active_bucket: string | null;
};

type Props = {
    queue: OperationalQueue;
    basePath: string;
};

const toneClass: Record<string, string> = {
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    neutral: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
};

export default function OperationalQueuePanel({ queue, basePath }: Props) {
    const activeBucket = queue.active_bucket ?? "";
    const allHref = `${basePath}/change-requests`;
    const total = queue.stats.reduce((sum, item) => sum + item.count, 0);
    const [selectedId, setSelectedId] = useState<string | null>(queue.items[0]?.id ?? null);
    const selectedItem = useMemo(
        () => queue.items.find((item) => item.id === selectedId) ?? queue.items[0] ?? null,
        [queue.items, selectedId],
    );

    useEffect(() => {
        if (queue.items.length === 0) {
            setSelectedId(null);
            return;
        }

        if (!queue.items.some((item) => item.id === selectedId)) {
            setSelectedId(queue.items[0].id);
        }
    }, [queue.items, selectedId]);

    return (
        <section className="change-request-card opacity-0 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">
                        Workbench Perlu Tindakan
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Kandidat yang membutuhkan keputusan, review, atau follow-up berdasarkan data yang sudah tersedia.
                    </p>
                </div>
                <span className="inline-flex min-h-9 items-center gap-2 self-start rounded-md border border-amber-500/20 bg-amber-500/10 px-3 text-sm font-bold text-amber-700 dark:text-amber-300">
                    <i className="fa-solid fa-triangle-exclamation text-xs" />
                    {total.toLocaleString("id-ID")} item
                </span>
            </div>

            <div className="grid min-h-[420px] xl:grid-cols-[230px_minmax(0,1fr)_360px]">
                <aside className="border-b border-slate-100 p-4 dark:border-white/10 xl:border-b-0 xl:border-r">
                    <div className="space-y-2">
                        <BucketLink
                            href={allHref}
                            active={activeBucket === ""}
                            label="Semua"
                            count={total}
                        />
                        {queue.stats.map((stat) => (
                            <BucketLink
                                key={stat.bucket}
                                href={`${basePath}/change-requests?bucket=${stat.bucket}`}
                                active={activeBucket === stat.bucket}
                                label={stat.label}
                                count={stat.count}
                            />
                        ))}
                    </div>
                </aside>

                <div className="border-b border-slate-100 dark:border-white/10 xl:border-b-0 xl:border-r">
                    {queue.items.length === 0 ? (
                        <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-5 py-10 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                                <i className="fa-solid fa-inbox text-lg text-slate-400" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Antrean kosong</p>
                            <p className="mt-1 text-xs text-slate-400">Tidak ada item untuk filter antrean ini.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/10">
                            {queue.items.map((item) => (
                                <QueueListItem
                                    key={item.id}
                                    item={item}
                                    selected={selectedItem?.id === item.id}
                                    onSelect={() => setSelectedId(item.id)}
                                />
                            ))}
                        </ul>
                    )}
                </div>

                <QueueDetail item={selectedItem} basePath={basePath} />
            </div>
        </section>
    );
}

function BucketLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
    return (
        <Link
            href={href}
            preserveScroll
            preserveState
            className={[
                "flex min-h-10 items-center justify-between gap-3 rounded-md border px-3 text-xs font-bold transition",
                active
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300",
            ].join(" ")}
        >
            <span className="truncate">{label}</span>
            <span className={active ? "rounded-full bg-white/15 px-2 py-0.5" : "rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 dark:bg-white/10 dark:text-slate-300"}>
                {count}
            </span>
        </Link>
    );
}

function QueueListItem({ item, selected, onSelect }: { item: QueueItem; selected: boolean; onSelect: () => void }) {
    const tone = toneClass[item.tone] ?? toneClass.neutral;

    return (
        <li>
            <button
                type="button"
                onClick={onSelect}
                className={[
                    "grid w-full gap-3 px-4 py-4 text-left transition md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_120px] md:items-center",
                    selected ? "bg-emerald-50/70 dark:bg-emerald-500/[0.06]" : "hover:bg-slate-50 dark:hover:bg-white/[0.03]",
                ].join(" ")}
            >
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-display font-bold text-slate-900 dark:text-white">
                        {item.candidate.full_name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {item.candidate.candidate_code}
                        {item.candidate.admission_wave ? ` - ${item.candidate.admission_wave}` : ""}
                    </p>
                </div>

                <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-bold ${tone}`}>
                            {item.bucket_label}
                        </span>
                    </div>
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>

                <div className="text-left md:text-right">
                    <span className="text-[11px] font-semibold text-slate-400">
                        {item.waiting_side_label ?? "Operasional"}
                    </span>
                    {item.updated_at && <p className="mt-1 text-[10px] font-semibold text-slate-400">{item.updated_at}</p>}
                </div>
            </button>
        </li>
    );
}

function QueueDetail({ item, basePath }: { item: QueueItem | null; basePath: string }) {
    if (!item) {
        return (
            <aside className="flex min-h-[320px] flex-col items-center justify-center p-5 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                    <i className="fa-solid fa-list-check text-lg text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Tidak ada item dipilih</p>
            </aside>
        );
    }

    const href = item.href ?? `${basePath}/candidates/${item.candidate.id}`;
    const candidateHref = `${basePath}/candidates/${item.candidate.id}`;
    const statusHref = `${basePath}/candidates/${item.candidate.id}/status-pendaftaran`;
    const tone = toneClass[item.tone] ?? toneClass.neutral;

    return (
        <aside className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-bold ${tone}`}>
                    {item.bucket_label}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                    {item.waiting_side_label ?? "Operasional"}
                </span>
            </div>

            <h3 className="font-display text-lg font-black text-slate-900 dark:text-white">
                {item.candidate.full_name}
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {item.candidate.candidate_code}
                {item.candidate.nisn ? ` - NISN ${item.candidate.nisn}` : ""}
                {item.candidate.program_choice ? ` - ${item.candidate.program_choice}` : ""}
            </p>

            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
                {item.updated_at && <p className="mt-3 text-[10px] font-semibold text-slate-400">Update {item.updated_at}</p>}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2">
                <Link
                    href={href}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                    <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                    Buka Aksi
                </Link>
                <div className="grid grid-cols-2 gap-2">
                    <Link
                        href={candidateHref}
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
        </aside>
    );
}
