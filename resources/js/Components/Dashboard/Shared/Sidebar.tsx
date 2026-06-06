import { useEffect, useMemo, useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import { useSidebar } from "@/context/SidebarContext";
import { navigationConfig, NavGroup, NavItem, NavSubItem } from "@/config/navigation";
import { PageProps } from "@/types";

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
    staff:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    admin:     "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function Sidebar({ role }: Props) {
    const { isExpanded, isHovered, isMobileOpen, setIsHovered, toggleSidebar } = useSidebar();
    const { url, props } = usePage<PageProps>();
    const { app } = props;
    const navRef = useRef<HTMLDivElement>(null);
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
    const [storedStaffCandidateId, setStoredStaffCandidateId] = useState<string | null>(null);

    const isVisible = isExpanded || isHovered || isMobileOpen;
    const groups: NavGroup[] = navigationConfig[role] ?? [];
    const staffCandidateIdFromUrl = useMemo(() => {
        const match = url.match(/^\/dashboard\/staff\/candidates\/(\d+)/);
        return match?.[1] ?? null;
    }, [url]);
    const activeStaffCandidateId = staffCandidateIdFromUrl ?? storedStaffCandidateId;

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

    useEffect(() => {
        if (role !== "staff" || typeof window === "undefined") return;

        if (staffCandidateIdFromUrl) {
            window.localStorage.setItem("staff:selectedCandidateId", staffCandidateIdFromUrl);
            setStoredStaffCandidateId(staffCandidateIdFromUrl);
            return;
        }

        setStoredStaffCandidateId(window.localStorage.getItem("staff:selectedCandidateId"));
    }, [role, staffCandidateIdFromUrl]);

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return url === href;
        return url.startsWith(href);
    };

    const isStaffSectionActive = (section: NonNullable<NavItem["staffCandidateSection"]>) => {
        if (section === "data-diri" && /^\/dashboard\/staff\/candidates\/\d+$/.test(url)) {
            return true;
        }

        return url.endsWith(`/${section}`) && url.includes("/dashboard/staff/candidates/");
    };

    const getItemHref = (item: NavItem) => {
        if (item.staffCandidateHome) {
            if (!activeStaffCandidateId) return item.href;
            return `/dashboard/staff/candidates/${activeStaffCandidateId}`;
        }

        if (!item.staffCandidateSection) return item.href;
        if (!activeStaffCandidateId) return item.href;
        return `/dashboard/staff/candidates/${activeStaffCandidateId}/${item.staffCandidateSection}`;
    };

    const getSubItemHref = (subItem: NavSubItem) => {
        if (!subItem.staffCandidateSection) return subItem.href ?? "#";
        if (!activeStaffCandidateId) return "/dashboard/staff/candidates";
        return `/dashboard/staff/candidates/${activeStaffCandidateId}/${subItem.staffCandidateSection}`;
    };

    const isSubItemActive = (subItem: NavSubItem) => {
        if (!subItem.staffCandidateSection) return subItem.href ? isActive(subItem.href) : false;
        return isStaffSectionActive(subItem.staffCandidateSection);
    };

    const isChildrenActive = (children?: NavSubItem[]) => {
        if (!children) return false;
        return children.some(isSubItemActive);
    };

    const toggleSubmenu = (href: string) => {
        setOpenMenus(prev => ({ ...prev, [href]: !prev[href] }));
    };

    return (
        <aside
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setOpenMenus({});
            }}
            className={`
                fixed top-0 left-0 z-50 h-screen flex flex-col
                bg-white dark:bg-navy
                border-r border-slate-200 dark:border-white/5
                transition-all duration-300 ease-in-out
                ${isVisible ? "w-[272px]" : "w-[72px]"}
                ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
        >
            {/* ── Logo area ── */}
            <div className={`
                flex items-center h-16 px-4 shrink-0
                border-b border-slate-100 dark:border-white/5
                ${isVisible ? "justify-start gap-3" : "justify-center"}
            `}>
                {/* Logo: pakai gambar kalau APP_LOGO diset, fallback ke icon FA */}
                {app.logo ? (
                    <img
                        src={app.logo}
                        alt={app.name}
                        className="w-8 h-8 rounded-xl object-cover shrink-0"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-xl bg-gold flex items-center justify-center shrink-0 shadow-glow">
                        <i className="fa-solid fa-shield-halved text-navy text-sm"></i>
                    </div>
                )}

                {isVisible && (
                    <div className="overflow-hidden">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold leading-none">
                            {app.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                            {app.tagline}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Role badge ── */}
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

            {/* ── Navigation ── */}
            <div ref={navRef} className="flex-1 overflow-y-auto py-3 no-scrollbar">
                {groups.map((group) => (
                    <div key={group.group} className="mb-5">
                        {isVisible ? (
                            <p className="px-4 mb-2 text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-400 dark:text-slate-500">
                                {group.group}
                            </p>
                        ) : (
                            <div className="mx-auto w-6 h-px bg-slate-200 dark:bg-white/10 my-3" />
                        )}

                        <ul className="flex flex-col gap-0.5 px-2">
                            {group.items.map((item) => {
                                const hasChildren = !!item.children?.length;
                                const itemHref = getItemHref(item);
                                const waitingForCandidate = !!item.staffCandidateSection && !activeStaffCandidateId;
                                const active = !item.disabled
                                    && ((item.staffCandidateSection
                                        ? isStaffSectionActive(item.staffCandidateSection)
                                        : isActive(item.href, item.exact))
                                        || isChildrenActive(item.children));
                                const childOpen = hasChildren && isVisible && (openMenus[item.href] || active);
                                const baseItemClass = `
                                    flex items-center gap-3 rounded-xl px-3 py-2.5
                                    text-sm font-semibold transition-all duration-150
                                    ${active
                                        ? "bg-gold text-navy shadow-glow"
                                        : item.disabled
                                            ? "cursor-not-allowed text-slate-400/55 dark:text-slate-500/80"
                                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                    }
                                    ${!isVisible ? "justify-center" : ""}
                                `;

                                return (
                                    <li
                                        key={item.href}
                                        className="sidebar-nav-item opacity-0"
                                        onMouseEnter={() => hasChildren && !item.disabled && setOpenMenus(prev => ({ ...prev, [item.href]: true }))}
                                        onMouseLeave={() => {
                                            if (hasChildren && !active) {
                                                setOpenMenus(prev => ({ ...prev, [item.href]: false }));
                                            }
                                        }}
                                    >
                                        {hasChildren ? (
                                            <div
                                                className={`
                                                    flex items-center rounded-xl
                                                    text-sm font-semibold transition-all duration-150
                                                    ${active
                                                        ? "bg-gold text-navy shadow-glow"
                                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                                    }
                                                    ${!isVisible ? "justify-center" : ""}
                                                `}
                                                title={!isVisible ? item.label : undefined}
                                            >
                                                {item.disabled ? (
                                                    <div
                                                        className={`
                                                            flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5
                                                            ${!isVisible ? "justify-center" : ""}
                                                        `}
                                                        title="Segera hadir"
                                                        aria-disabled="true"
                                                    >
                                                        <i className={`${item.icon} text-[15px] shrink-0 ${active ? "text-navy" : ""}`}></i>
                                                        {isVisible && (
                                                            <>
                                                                <span className="truncate">{item.label}</span>
                                                                {item.comingSoon && (
                                                                    <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-500">
                                                                        Soon
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={itemHref}
                                                        className={`
                                                            flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5
                                                            ${!isVisible ? "justify-center" : ""}
                                                        `}
                                                        title={waitingForCandidate ? "Pilih kandidat dulu" : undefined}
                                                    >
                                                        <i className={`${item.icon} text-[15px] shrink-0 ${active ? "text-navy" : ""}`}></i>
                                                        {isVisible && (
                                                            <>
                                                                <span className="truncate">{item.label}</span>
                                                                {waitingForCandidate && (
                                                                    <i className="fa-solid fa-circle-info ml-auto text-[10px] text-slate-400"></i>
                                                                )}
                                                            </>
                                                        )}
                                                    </Link>
                                                )}

                                                {isVisible && !item.disabled && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSubmenu(item.href)}
                                                        className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"
                                                        aria-label={`Toggle ${item.label}`}
                                                    >
                                                        <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${childOpen ? "rotate-180" : ""}`}></i>
                                                    </button>
                                                )}

                                                {!isVisible && active && (
                                                    <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-gold" />
                                                )}
                                            </div>
                                        ) : (
                                            item.disabled ? (
                                                <div
                                                    className={baseItemClass}
                                                    title={!isVisible ? item.label : "Segera hadir"}
                                                    aria-disabled="true"
                                                >
                                                    <i className={`${item.icon} text-[15px] shrink-0 ${active ? "text-navy" : ""}`}></i>
                                                    {isVisible && (
                                                        <>
                                                            <span className="truncate">{item.label}</span>
                                                            {item.comingSoon && (
                                                                <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-500">
                                                                    Soon
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <Link
                                                    href={itemHref}
                                                    className={baseItemClass}
                                                    title={!isVisible ? item.label : waitingForCandidate ? "Pilih kandidat dulu" : undefined}
                                                >
                                                    <i className={`${item.icon} text-[15px] shrink-0 ${active ? "text-navy" : ""}`}></i>
                                                    {isVisible && (
                                                        <>
                                                            <span className="truncate">{item.label}</span>
                                                            {waitingForCandidate && (
                                                                <i className="fa-solid fa-circle-info ml-auto text-[10px] text-slate-400"></i>
                                                            )}
                                                        </>
                                                    )}
                                                    {!isVisible && active && (
                                                        <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-gold" />
                                                    )}
                                                </Link>
                                            )
                                        )}

                                        {hasChildren && isVisible && (
                                            <div
                                                className={[
                                                    "overflow-hidden transition-all duration-300 ease-out",
                                                    childOpen
                                                        ? "mt-1 max-h-72 opacity-100 translate-y-0"
                                                        : "mt-0 max-h-0 opacity-0 -translate-y-1 pointer-events-none",
                                                ].join(" ")}
                                                aria-hidden={!childOpen}
                                            >
                                            <ul className="ml-4 flex flex-col gap-0.5 border-l border-slate-200 pl-2 dark:border-white/10">
                                                {item.children?.map((subItem, subIndex) => {
                                                    const subActive = isSubItemActive(subItem);
                                                    const href = getSubItemHref(subItem);
                                                    const waitingForCandidate = !!subItem.staffCandidateSection && !activeStaffCandidateId;

                                                    return (
                                                        <li key={`${item.href}-${subItem.label}`}>
                                                            <Link
                                                                href={href}
                                                                className={[
                                                                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200",
                                                                    subActive
                                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200",
                                                                    waitingForCandidate ? "opacity-70" : "",
                                                                    childOpen ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
                                                                ].join(" ")}
                                                                style={{ transitionDelay: childOpen ? `${subIndex * 28}ms` : "0ms" }}
                                                                title={waitingForCandidate ? "Pilih kandidat dulu" : undefined}
                                                            >
                                                                <i className={`${subItem.icon} w-4 text-[12px]`}></i>
                                                                <span className="truncate">{subItem.label}</span>
                                                                {waitingForCandidate && (
                                                                    <i className="fa-solid fa-circle-info ml-auto text-[10px] text-slate-400"></i>
                                                                )}
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            {/* ── Collapse toggle (desktop) ── */}
            <div className={`
                shrink-0 p-3 border-t border-slate-100 dark:border-white/5
                hidden lg:flex
                ${isVisible ? "justify-end" : "justify-center"}
            `}>
                <button
                    onClick={toggleSidebar}
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
    );
}
