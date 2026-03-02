import { useEffect, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import { useSidebar } from "@/context/SidebarContext";
import { navigationConfig, NavGroup } from "@/config/navigation";

type Props = {
    role: "candidate" | "staff" | "admin";
};

const roleLabel: Record<string, string> = {
    candidate: "Pendaftar",
    staff:     "Staff",
    admin:     "Administrator",
};

const roleBadgeClass: Record<string, string> = {
    candidate: "bg-gold/10 text-gold border-gold/20",
    staff:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
    admin:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function Sidebar({ role }: Props) {
    const { isExpanded, isHovered, isMobileOpen, setIsHovered } = useSidebar();
    const { url } = usePage();
    const navRef = useRef<HTMLDivElement>(null);

    const isVisible = isExpanded || isHovered || isMobileOpen;
    const groups: NavGroup[] = navigationConfig[role] ?? [];

    // Entrance animation on mount
    useEffect(() => {
        if (!navRef.current) return;
        animate(".sidebar-nav-item", {
            opacity:    [0, 1],
            translateX: [-12, 0],
            duration:   450,
            delay:      stagger(45),
            ease:       "outExpo",
        });
    }, []);

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return url === href;
        return url.startsWith(href);
    };

    return (
        <>
            {/* Sidebar */}
            <aside
                onMouseEnter={() => !isExpanded && setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                    fixed top-0 left-0 z-50 h-screen flex flex-col
                    bg-white dark:bg-navy
                    border-r border-slate-200 dark:border-white/5
                    transition-all duration-300 ease-in-out
                    ${isVisible ? "w-[272px]" : "w-[72px]"}
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                {/* Logo area */}
                <div className={`
                    flex items-center h-16 px-4 shrink-0
                    border-b border-slate-100 dark:border-white/5
                    ${isVisible ? "justify-start gap-3" : "justify-center"}
                `}>
                    <div className="w-8 h-8 rounded-xl bg-gold flex items-center justify-center shrink-0 shadow-glow">
                        <i className="fa-solid fa-shield-halved text-navy text-sm"></i>
                    </div>
                    {isVisible && (
                        <div className="overflow-hidden">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold leading-none">
                                Sentinel
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                                Sistem SPMB
                            </p>
                        </div>
                    )}
                </div>

                {/* Role badge */}
                {isVisible && (
                    <div className="px-4 pt-4 pb-2">
                        <span className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1
                            rounded-lg text-[11px] font-semibold border
                            ${roleBadgeClass[role]}
                        `}>
                            <i className="fa-solid fa-circle text-[6px]"></i>
                            {roleLabel[role]}
                        </span>
                    </div>
                )}

                {/* Navigation */}
                <div ref={navRef} className="flex-1 overflow-y-auto py-3 no-scrollbar">
                    {groups.map((group) => (
                        <div key={group.group} className="mb-5">
                            {/* Group label */}
                            {isVisible ? (
                                <p className="px-4 mb-2 text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-400 dark:text-slate-500">
                                    {group.group}
                                </p>
                            ) : (
                                <div className="mx-auto w-6 h-px bg-slate-200 dark:bg-white/10 my-3" />
                            )}

                            <ul className="flex flex-col gap-0.5 px-2">
                                {group.items.map((item) => {
                                    const active = isActive(item.href, item.exact);
                                    return (
                                        <li key={item.href} className="sidebar-nav-item opacity-0">
                                            <Link
                                                href={item.href}
                                                className={`
                                                    flex items-center gap-3 rounded-xl px-3 py-2.5
                                                    text-sm font-semibold transition-all duration-150
                                                    ${active
                                                        ? "bg-gold text-navy shadow-glow"
                                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                                    }
                                                    ${!isVisible ? "justify-center" : ""}
                                                `}
                                                title={!isVisible ? item.label : undefined}
                                            >
                                                <i className={`${item.icon} text-[15px] shrink-0 ${active ? "text-navy" : ""}`}></i>
                                                {isVisible && (
                                                    <span className="truncate">{item.label}</span>
                                                )}
                                                {/* Active indicator dot when collapsed */}
                                                {!isVisible && active && (
                                                    <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-gold" />
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom: collapse toggle (desktop only) */}
                <div className={`
                    shrink-0 p-3 border-t border-slate-100 dark:border-white/5
                    hidden lg:flex
                    ${isVisible ? "justify-end" : "justify-center"}
                `}>
                    <button
                        onClick={() => {/* toggled from Topbar hamburger */}}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5
                                   flex items-center justify-center
                                   text-slate-500 dark:text-slate-400
                                   hover:bg-slate-200 dark:hover:bg-white/10 transition"
                        title="Toggle sidebar"
                    >
                        <i className={`fa-solid ${isVisible ? "fa-chevron-left" : "fa-chevron-right"} text-xs`}></i>
                    </button>
                </div>
            </aside>
        </>
    );
}
