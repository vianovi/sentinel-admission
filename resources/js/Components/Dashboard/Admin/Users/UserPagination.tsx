import React from 'react';
import { Link } from '@inertiajs/react';

type LinkData = {
    url: string | null;
    label: string;
    active: boolean;
};

export default function UserPagination({ links }: { links: LinkData[] }) {
    if (links.length <= 3) return null;
    return (
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
            {links.map((link, idx) => (
                link.url === null ? (
                    <div
                        key={idx}
                        className="px-3 py-1.5 text-xs text-slate-400 dark:text-slate-600 rounded-lg"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <Link
                        key={idx}
                        href={link.url}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            link.active
                                ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                )
            ))}
        </div>
    );
}
