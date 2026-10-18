import { Link } from "@inertiajs/react";

type TabKey = "activity-logs" | "trash-media" | "trash-candidates";

type Props = {
    active: TabKey;
};

export default function SystemWorkspaceTabs({ active }: Props) {
    const tabs: Array<{ key: TabKey; label: string; href: string; icon: string }> = [
        {
            key: "activity-logs",
            label: "Riwayat Aktivitas",
            href: "/dashboard/admin/system/activity-logs",
            icon: "fa-solid fa-clock-rotate-left",
        },
        {
            key: "trash-media",
            label: "Sampah Bank Media",
            href: "/dashboard/admin/system/trash/media",
            icon: "fa-solid fa-photo-film",
        },
        {
            key: "trash-candidates",
            label: "Sampah Draft Kandidat",
            href: "/dashboard/admin/system/trash/candidates",
            icon: "fa-solid fa-user-xmark",
        },
    ];

    return (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
            {tabs.map((tab) => {
                const isActive = active === tab.key;
                return (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isActive
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                        }`}
                    >
                        <i className={tab.icon} />
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
