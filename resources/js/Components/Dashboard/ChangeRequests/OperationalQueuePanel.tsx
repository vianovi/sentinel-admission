import { Link } from "@inertiajs/react";

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

    return (
        <section className="change-request-card opacity-0 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">
                        Antrean Operasional
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

            <div className="flex gap-2 overflow-x-auto pb-1">
                <Link
                    href={allHref}
                    preserveScroll
                    preserveState
                    className={[
                        "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-bold transition",
                        activeBucket === ""
                            ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                            : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300",
                    ].join(" ")}
                >
                    Semua
                    <span className="rounded-full bg-white/15 px-2 py-0.5">{total}</span>
                </Link>
                {queue.stats.map((stat) => (
                    <Link
                        key={stat.bucket}
                        href={`${basePath}/change-requests?bucket=${stat.bucket}`}
                        preserveScroll
                        preserveState
                        className={[
                            "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-bold transition",
                            activeBucket === stat.bucket
                                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                                : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300",
                        ].join(" ")}
                    >
                        {stat.label}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 dark:bg-white/10 dark:text-slate-300">
                            {stat.count}
                        </span>
                    </Link>
                ))}
            </div>

            <div>
                {queue.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 px-5 py-10 text-center dark:border-white/10">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Antrean kosong</p>
                        <p className="mt-1 text-xs text-slate-400">Tidak ada item untuk filter antrean ini.</p>
                    </div>
                ) : (
                    <div className="grid gap-3 xl:grid-cols-2">
                        {queue.items.map((item) => (
                            <QueueCard key={item.id} item={item} basePath={basePath} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function QueueCard({ item, basePath }: { item: QueueItem; basePath: string }) {
    const href = item.href ?? `${basePath}/candidates/${item.candidate.id}`;
    const tone = toneClass[item.tone] ?? toneClass.neutral;

    return (
        <article className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-bold ${tone}`}>
                            {item.bucket_label}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                            {item.waiting_side_label ?? "Operasional"}
                        </span>
                    </div>
                    <h3 className="truncate text-sm font-display font-bold text-slate-900 dark:text-white">
                        {item.candidate.full_name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {item.candidate.candidate_code}
                        {item.candidate.admission_wave ? ` - ${item.candidate.admission_wave}` : ""}
                        {item.candidate.program_choice ? ` - ${item.candidate.program_choice}` : ""}
                    </p>
                </div>
                <Link
                    href={href}
                    className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                    Buka
                    <i className="fa-solid fa-arrow-right text-[10px]" />
                </Link>
            </div>
            <div className="mt-4 rounded-md bg-slate-50 p-3 dark:bg-white/[0.03]">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
                {item.updated_at && <p className="mt-2 text-[10px] font-semibold text-slate-400">Update {item.updated_at}</p>}
            </div>
        </article>
    );
}
