// resources/js/Components/Dashboard/Staff/Candidates/CandidatePagination.tsx

import { router } from "@inertiajs/react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PaginationLink = {
    url:    string | null;
    label:  string;
    active: boolean;
};

type Props = {
    currentPage: number;
    lastPage:    number;
    total:       number;
    links:       PaginationLink[];
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CandidatePagination({ currentPage, lastPage, total, links }: Props) {
    if (lastPage <= 1) return null;

    const handlePage = (url: string | null) => {
        if (!url) return;
        router.get(url, {}, { preserveState: true, preserveScroll: false });
    };

    return (
        <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
                Halaman {currentPage} dari {lastPage}
                {" "}· {total.toLocaleString("id-ID")} total
            </p>

            <div className="flex items-center gap-1.5">
                {links.map((link, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => handlePage(link.url)}
                        disabled={!link.url}
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        className={`min-w-[36px] h-9 px-3 rounded-xl text-xs font-semibold
                                    transition-all duration-150
                                    flex items-center justify-center
                                    ${link.active
                                        ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                                        : link.url
                                            ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-500"
                                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40"
                                    }`}
                    />
                ))}
            </div>
        </div>
    );
}
