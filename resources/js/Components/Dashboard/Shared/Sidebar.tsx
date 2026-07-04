import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import { useSidebar } from "@/context/SidebarContext";
import {
    CandidateSection,
    navigationConfig,
    NavActiveRule,
    NavGroup,
    NavItem,
    NavSubItem,
} from "@/config/navigation";
import { PageProps } from "@/types";

type Props = {
    role: "candidate" | "staff" | "admin";
};

type ParsedNavUrl = {
    path: string;
    query: URLSearchParams;
};

type FlyoutState = {
    key: string;
    top: number;
    item: NavItem;
    active: boolean;
};

const roleLabel: Record<Props["role"], string> = {
    candidate: "Pendaftar",
    staff: "Staff",
    admin: "Administrator",
};

const roleBadgeClass: Record<Props["role"], string> = {
    candidate: "bg-gold/10 text-gold border-gold/20",
    staff: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    admin: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const parseNavUrl = (value: string): ParsedNavUrl => {
    const [pathAndQuery] = value.split("#");
    const [path = "/", queryString = ""] = pathAndQuery.split("?");

    return {
        path: path || "/",
        query: new URLSearchParams(queryString),
    };
};

const pathMatches = (currentPath: string, targetPath: string, exact?: boolean): boolean => {
    if (exact) return currentPath === targetPath;
    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};

const activeRuleMatches = (rule: NavActiveRule, currentUrl: ParsedNavUrl): boolean => {
    if (rule.prefixes?.some((prefix) => currentUrl.path.startsWith(prefix))) {
        return true;
    }

    if (rule.path && !pathMatches(currentUrl.path, rule.path, rule.exact)) {
        return false;
    }

    if (rule.query) {
        const matchesQuery = Object.entries(rule.query).every(
            ([key, value]) => currentUrl.query.get(key) === value,
        );

        if (!matchesQuery) return false;
    }

    if (rule.absentQuery?.some((key) => currentUrl.query.has(key))) {
        return false;
    }

    return Boolean(rule.path || rule.query || rule.absentQuery?.length || rule.prefixes?.length);
};

const itemKeyFor = (group: string, item: NavItem): string => {
    return `${group}:${item.label}:${item.href ?? item.icon}`;
};

const controlIdFor = (key: string): string => {
    return key.replace(/[^a-zA-Z0-9_-]/g, "-");
};

export default function Sidebar({ role }: Props) {
    const { isExpanded, isMobileOpen, toggleSidebar } = useSidebar();
    const { url, props } = usePage<PageProps>();
    const { app } = props;
    const navRef = useRef<HTMLDivElement>(null);
    const flyoutTimerRef = useRef<number | null>(null);
    const pendingOpenMenuRef = useRef<string | null>(null);
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
    const [flyout, setFlyout] = useState<FlyoutState | null>(null);
    const [storedStaffCandidateId, setStoredStaffCandidateId] = useState<string | null>(null);
    const [storedAdminCandidateId, setStoredAdminCandidateId] = useState<string | null>(null);

    const isVisible = isExpanded || isMobileOpen;
    const isCollapsed = !isVisible;
    const groups: NavGroup[] = navigationConfig[role] ?? [];
    const currentUrl = useMemo(() => parseNavUrl(url), [url]);
    const hasFocusedMenu = useMemo(() => Object.values(openMenus).some(Boolean), [openMenus]);

    const staffCandidateIdFromUrl = useMemo(() => {
        const match = currentUrl.path.match(/^\/dashboard\/staff\/candidates\/(\d+)/);
        return match?.[1] ?? null;
    }, [currentUrl.path]);

    const adminCandidateIdFromUrl = useMemo(() => {
        const match = currentUrl.path.match(/^\/dashboard\/admin\/candidates\/(\d+)/);
        return match?.[1] ?? null;
    }, [currentUrl.path]);

    const activeStaffCandidateId = staffCandidateIdFromUrl ?? storedStaffCandidateId;
    const activeAdminCandidateId = adminCandidateIdFromUrl ?? storedAdminCandidateId;
    const activeCandidateId = role === "admin" ? activeAdminCandidateId : activeStaffCandidateId;
    const candidateBasePath = role === "admin" ? "/dashboard/admin/candidates" : "/dashboard/staff/candidates";

    useEffect(() => {
        if (!navRef.current) return;

        animate(".sidebar-nav-item", {
            opacity: [0, 1],
            translateX: [-12, 0],
            duration: 360,
            delay: stagger(28),
            ease: "outExpo",
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

    useEffect(() => {
        if (role !== "admin" || typeof window === "undefined") return;

        if (adminCandidateIdFromUrl) {
            window.localStorage.setItem("admin:selectedCandidateId", adminCandidateIdFromUrl);
            setStoredAdminCandidateId(adminCandidateIdFromUrl);
            return;
        }

        setStoredAdminCandidateId(window.localStorage.getItem("admin:selectedCandidateId"));
    }, [role, adminCandidateIdFromUrl]);

    useEffect(() => {
        setFlyout(null);

        if (pendingOpenMenuRef.current && isVisible) {
            setOpenMenus({ [pendingOpenMenuRef.current]: true });
            pendingOpenMenuRef.current = null;
            return;
        }

        setOpenMenus({});
    }, [isVisible, role, url]);

    useEffect(() => {
        return () => {
            if (flyoutTimerRef.current !== null) {
                window.clearTimeout(flyoutTimerRef.current);
            }
        };
    }, []);

    const isHrefActive = useCallback((href?: string, exact?: boolean): boolean => {
        if (!href) return false;

        const target = parseNavUrl(href);
        const targetHasQuery = Array.from(target.query.keys()).length > 0;

        if (!pathMatches(currentUrl.path, target.path, targetHasQuery || exact)) {
            return false;
        }

        if (!targetHasQuery) return true;

        return Array.from(target.query.entries()).every(
            ([key, value]) => currentUrl.query.get(key) === value,
        );
    }, [currentUrl]);

    const isRuleActive = useCallback((rules?: NavActiveRule[]): boolean => {
        return rules?.some((rule) => activeRuleMatches(rule, currentUrl)) ?? false;
    }, [currentUrl]);

    const isCandidateSectionActive = useCallback((section: CandidateSection): boolean => {
        const escapedBase = candidateBasePath.replace(/\//g, "\\/");

        if (section === "data-diri" && new RegExp(`^${escapedBase}\\/\\d+$`).test(currentUrl.path)) {
            return true;
        }

        return currentUrl.path.endsWith(`/${section}`) && currentUrl.path.includes(`${candidateBasePath}/`);
    }, [candidateBasePath, currentUrl.path]);

    const getItemHref = useCallback((item: NavItem): string | undefined => {
        const candidateSection = item.staffCandidateSection ?? item.adminCandidateSection;
        const candidateStatus = item.staffCandidateStatus ?? item.adminCandidateStatus;

        if (item.staffCandidateHome || item.adminCandidateHome) {
            if (!activeCandidateId) return item.href ?? candidateBasePath;
            return `${candidateBasePath}/${activeCandidateId}`;
        }

        if (candidateStatus) {
            if (!activeCandidateId) return item.href ?? candidateBasePath;
            return `${candidateBasePath}/${activeCandidateId}/status-pendaftaran`;
        }

        if (!candidateSection) return item.href;
        if (!activeCandidateId) return item.href ?? candidateBasePath;
        return `${candidateBasePath}/${activeCandidateId}/${candidateSection}`;
    }, [activeCandidateId, candidateBasePath]);

    const getSubItemHref = useCallback((subItem: NavSubItem): string | undefined => {
        const candidateSection = subItem.staffCandidateSection ?? subItem.adminCandidateSection;
        const candidateStatus = subItem.staffCandidateStatus ?? subItem.adminCandidateStatus;

        if (candidateStatus) {
            if (!activeCandidateId) return subItem.href ?? candidateBasePath;
            return `${candidateBasePath}/${activeCandidateId}/status-pendaftaran`;
        }

        if (!candidateSection) return subItem.href;
        if (!activeCandidateId) return subItem.href ?? candidateBasePath;
        return `${candidateBasePath}/${activeCandidateId}/${candidateSection}`;
    }, [activeCandidateId, candidateBasePath]);

    const isSubItemActive = useCallback((subItem: NavSubItem): boolean => {
        const candidateSection = subItem.staffCandidateSection ?? subItem.adminCandidateSection;
        const candidateStatus = subItem.staffCandidateStatus ?? subItem.adminCandidateStatus;

        if (subItem.disabled) return false;

        if (isRuleActive(subItem.activeRules)) {
            return true;
        }

        if (subItem.activePrefixes?.some((prefix) => currentUrl.path.startsWith(prefix))) {
            return true;
        }

        if (candidateSection) {
            return isCandidateSectionActive(candidateSection);
        }

        if (candidateStatus) {
            return currentUrl.path === `${candidateBasePath}/${activeCandidateId}/status-pendaftaran`;
        }

        return isHrefActive(subItem.href, subItem.exact);
    }, [activeCandidateId, candidateBasePath, currentUrl.path, isCandidateSectionActive, isHrefActive, isRuleActive]);

    const isItemActive = useCallback((item: NavItem): boolean => {
        const candidateSection = item.staffCandidateSection ?? item.adminCandidateSection;
        const candidateStatus = item.staffCandidateStatus ?? item.adminCandidateStatus;

        if (item.disabled) return false;

        if (isRuleActive(item.activeRules)) {
            return true;
        }

        if (candidateSection) {
            return isCandidateSectionActive(candidateSection);
        }

        if (candidateStatus) {
            return currentUrl.path === `${candidateBasePath}/${activeCandidateId}/status-pendaftaran`;
        }

        return isHrefActive(item.href, item.exact);
    }, [activeCandidateId, candidateBasePath, currentUrl.path, isCandidateSectionActive, isHrefActive, isRuleActive]);

    const isChildrenActive = useCallback((children?: NavSubItem[]): boolean => {
        return children?.some(isSubItemActive) ?? false;
    }, [isSubItemActive]);

    const toggleSubmenu = useCallback((key: string) => {
        setOpenMenus((prev) => {
            if (prev[key]) {
                return {};
            }

            return { [key]: true };
        });
    }, []);

    const handleParentMenuClick = useCallback((key: string) => {
        if ((role === "candidate" || role === "staff" || role === "admin") && isCollapsed) {
            pendingOpenMenuRef.current = key;
            toggleSidebar();
            return;
        }

        toggleSubmenu(key);
    }, [isCollapsed, role, toggleSidebar, toggleSubmenu]);

    const clearFlyoutTimer = useCallback(() => {
        if (flyoutTimerRef.current === null) return;
        window.clearTimeout(flyoutTimerRef.current);
        flyoutTimerRef.current = null;
    }, []);

    const closeFlyoutSoon = useCallback(() => {
        clearFlyoutTimer();
        flyoutTimerRef.current = window.setTimeout(() => {
            setFlyout(null);
            flyoutTimerRef.current = null;
        }, 120);
    }, [clearFlyoutTimer]);

    const openCollapsedFlyout = useCallback((target: HTMLElement, item: NavItem, key: string, active: boolean) => {
        if (role === "candidate" || role === "staff" || role === "admin" || !isCollapsed || !item.children?.length || item.disabled) return;

        clearFlyoutTimer();

        const rect = target.getBoundingClientRect();
        const estimatedHeight = Math.min(384, 70 + item.children.length * 38);
        const maxTop = Math.max(16, window.innerHeight - estimatedHeight - 16);

        setFlyout({
            key,
            item,
            active,
            top: Math.min(Math.max(rect.top, 16), maxTop),
        });
    }, [clearFlyoutTimer, isCollapsed, role]);

    const renderSoonBadge = (visible: boolean) => {
        if (!visible) return null;

        return (
            <span className="ml-auto rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-goldhover dark:border-gold/20 dark:bg-gold/10 dark:text-gold">
                Soon
            </span>
        );
    };

    const renderSubItem = (subItem: NavSubItem, parentKey: string, index: number, childOpen = true) => {
        const subActive = isSubItemActive(subItem);
        const href = getSubItemHref(subItem);
        const candidateSection = subItem.staffCandidateSection ?? subItem.adminCandidateSection;
        const candidateStatus = subItem.staffCandidateStatus ?? subItem.adminCandidateStatus;
        const waitingForCandidate = Boolean((candidateSection || candidateStatus) && !activeCandidateId);
        const disabled = Boolean(subItem.disabled || !href);
        const className = [
            "flex min-h-9 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 dark:focus-visible:ring-gold/15",
            subActive
                ? "bg-gold/10 text-goldhover shadow-sm dark:bg-gold/10 dark:text-gold"
                : "text-slate-500 hover:bg-slate-100 hover:text-goldhover dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-gold",
            disabled ? "cursor-not-allowed opacity-55" : "",
            childOpen ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
        ].join(" ");
        const content = (
            <>
                <i className={`${subItem.icon} w-4 shrink-0 text-[12px]`}></i>
                <span className="truncate">{subItem.label}</span>
                {waitingForCandidate && (
                    <i className="fa-solid fa-circle-info ml-auto shrink-0 text-[10px] text-slate-400"></i>
                )}
                {renderSoonBadge(Boolean(subItem.comingSoon && !waitingForCandidate))}
            </>
        );

        return (
            <li key={`${parentKey}-${subItem.label}-${subItem.href ?? subItem.icon}`}>
                {disabled ? (
                    <div
                        className={className}
                        style={{ transitionDelay: childOpen ? `${index * 24}ms` : "0ms" }}
                        title={waitingForCandidate ? "Pilih kandidat dulu" : undefined}
                        aria-disabled="true"
                    >
                        {content}
                    </div>
                ) : (
                    <Link
                        href={href ?? "#"}
                        className={className}
                        style={{ transitionDelay: childOpen ? `${index * 24}ms` : "0ms" }}
                        title={waitingForCandidate ? "Buka daftar kandidat atau pilih kandidat dulu" : undefined}
                    >
                        {content}
                    </Link>
                )}
            </li>
        );
    };

    return (
        <aside
            className={`
                fixed left-0 top-0 z-50 flex h-screen flex-col
                border-r border-slate-200 bg-white transition-all duration-300 ease-in-out
                dark:border-white/5 dark:bg-navy
                ${isVisible ? "w-[272px]" : "w-[72px]"}
                ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
        >
            <div className={`
                flex h-16 shrink-0 items-center border-b border-slate-100 px-4 dark:border-white/5
                ${isVisible ? "justify-start gap-3" : "justify-center"}
            `}>
                {app.logo ? (
                    <img
                        src={app.logo}
                        alt={app.name}
                        className="h-8 w-8 shrink-0 rounded-lg object-cover"
                    />
                ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold shadow-glow">
                        <i className="fa-solid fa-shield-halved text-sm text-navy"></i>
                    </div>
                )}

                {isVisible && (
                    <div className="min-w-0 overflow-hidden">
                        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                            {app.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs leading-tight text-slate-500 dark:text-slate-400">
                            {app.tagline}
                        </p>
                    </div>
                )}
            </div>

            {isVisible && (
                <div className="px-4 pb-2 pt-4">
                    <span className={`
                        inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1
                        text-[11px] font-semibold
                        ${roleBadgeClass[role]}
                    `}>
                        <i className="fa-solid fa-circle text-[6px]"></i>
                        {roleLabel[role]}
                    </span>
                </div>
            )}

            <div ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden py-3 no-scrollbar">
                {groups.map((group) => (
                    <div key={group.group} className="mb-5">
                        {isVisible ? (
                            <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                {group.group}
                            </p>
                        ) : (
                            <div className="mx-auto my-3 h-px w-6 bg-slate-200 dark:bg-white/10" />
                        )}

                        <ul className="flex flex-col gap-0.5 px-2">
                            {group.items.map((item) => {
                                const itemKey = itemKeyFor(group.group, item);
                                const submenuId = `sidebar-submenu-${controlIdFor(itemKey)}`;
                                const hasChildren = Boolean(item.children?.length);
                                const itemHref = getItemHref(item);
                                const candidateSection = item.staffCandidateSection ?? item.adminCandidateSection;
                                const waitingForCandidate = Boolean(candidateSection && !activeCandidateId);
                                const childActive = isChildrenActive(item.children);
                                const active = !item.disabled && (isItemActive(item) || childActive);
                                const childOpen = hasChildren && isVisible && (hasFocusedMenu ? Boolean(openMenus[itemKey]) : active);
                                const disabled = Boolean(item.disabled || (!hasChildren && !itemHref));
                                const baseItemClass = [
                                    "relative flex min-h-11 w-full items-center gap-3 rounded-[1.35rem] px-3 py-2.5 text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 dark:focus-visible:ring-gold/15",
                                    active
                                        ? "bg-gold/10 text-goldhover shadow-sm ring-1 ring-gold/20 dark:bg-gold/10 dark:text-gold dark:ring-gold/10"
                                        : disabled
                                            ? "cursor-not-allowed text-slate-400/55 dark:text-slate-500/80"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-goldhover dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-gold",
                                    !isVisible ? "justify-center" : "",
                                ].join(" ");
                                const itemContent = (
                                    <>
                                        <i className={`${item.icon} shrink-0 text-[15px] ${active ? "text-goldhover dark:text-gold" : ""}`}></i>
                                        {isVisible && (
                                            <>
                                                <span className="truncate">{item.label}</span>
                                                {waitingForCandidate && (
                                                    <i className="fa-solid fa-circle-info ml-auto shrink-0 text-[10px] text-slate-400"></i>
                                                )}
                                                {renderSoonBadge(Boolean(item.comingSoon && !waitingForCandidate))}
                                            </>
                                        )}
                                        {!isVisible && active && (
                                            <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-gold" />
                                        )}
                                    </>
                                );

                                return (
                                    <li
                                        key={itemKey}
                                        className="sidebar-nav-item relative opacity-0"
                                        onMouseEnter={(event) => openCollapsedFlyout(event.currentTarget, item, itemKey, active)}
                                        onMouseLeave={closeFlyoutSoon}
                                        onFocus={(event) => openCollapsedFlyout(event.currentTarget, item, itemKey, active)}
                                        onBlur={closeFlyoutSoon}
                                    >
                                        {hasChildren ? (
                                            <button
                                                type="button"
                                                className={baseItemClass}
                                                onClick={() => handleParentMenuClick(itemKey)}
                                                aria-expanded={childOpen}
                                                aria-controls={submenuId}
                                                title={!isVisible ? item.label : undefined}
                                            >
                                                {itemContent}
                                                {isVisible && (
                                                    <i className={`fa-solid fa-chevron-down ml-auto shrink-0 text-[10px] transition-transform duration-200 ${childOpen ? "rotate-180 text-goldhover dark:text-gold" : ""}`}></i>
                                                )}
                                            </button>
                                        ) : disabled ? (
                                            <div
                                                className={baseItemClass}
                                                title={!isVisible ? item.label : "Segera hadir"}
                                                aria-disabled="true"
                                            >
                                                {itemContent}
                                            </div>
                                        ) : (
                                            <Link
                                                href={itemHref ?? "#"}
                                                className={baseItemClass}
                                                title={!isVisible ? item.label : waitingForCandidate ? "Buka daftar kandidat atau pilih kandidat dulu" : undefined}
                                            >
                                                {itemContent}
                                            </Link>
                                        )}

                                        {hasChildren && isVisible && (
                                            <div
                                                id={submenuId}
                                                className={[
                                                    "overflow-hidden transition-all duration-300 ease-out",
                                                    childOpen
                                                        ? "mt-1 max-h-[420px] opacity-100 translate-y-0"
                                                        : "mt-0 max-h-0 -translate-y-1 opacity-0 pointer-events-none",
                                                ].join(" ")}
                                                aria-hidden={!childOpen}
                                            >
                                                <ul className="ml-4 flex flex-col gap-0.5 border-l border-slate-200 pl-2 dark:border-white/10">
                                                    {item.children?.map((subItem, subIndex) => renderSubItem(subItem, itemKey, subIndex, childOpen))}
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

            <div className={`
                hidden shrink-0 border-t border-slate-100 p-3 dark:border-white/5 lg:flex
                ${isVisible ? "justify-end" : "justify-center"}
            `}>
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-gold/10 hover:text-goldhover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-gold/10 dark:hover:text-gold dark:focus-visible:ring-gold/15"
                    title={isVisible ? "Minimize sidebar" : "Expand sidebar"}
                    aria-label={isVisible ? "Minimize sidebar" : "Expand sidebar"}
                >
                    <i className={`fa-solid ${isVisible ? "fa-chevron-left" : "fa-chevron-right"} text-xs`}></i>
                </button>
            </div>

            {flyout && isCollapsed && (
                <div
                    className="fixed left-[76px] z-[60] w-64 overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900"
                    style={{ top: flyout.top }}
                    onMouseEnter={clearFlyoutTimer}
                    onMouseLeave={closeFlyoutSoon}
                >
                    <div className={[
                        "flex items-center gap-3 border-b px-3 py-3 dark:border-white/10",
                        flyout.active
                            ? "border-gold/20 bg-gold/10 text-goldhover dark:border-gold/10 dark:bg-gold/10 dark:text-gold"
                            : "border-slate-100 text-slate-700 dark:text-slate-100",
                    ].join(" ")}>
                        <i className={`${flyout.item.icon} shrink-0 text-sm`}></i>
                        <span className="truncate text-sm font-bold">{flyout.item.label}</span>
                    </div>

                    <ul className="max-h-80 overflow-y-auto p-2">
                        {flyout.item.children?.map((subItem, index) => renderSubItem(subItem, flyout.key, index))}
                    </ul>
                </div>
            )}
        </aside>
    );
}
