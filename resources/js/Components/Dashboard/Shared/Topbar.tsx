// resources/js/Components/Dashboard/Shared/Topbar.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { animate } from "animejs";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import type { PageProps, User } from "@/types";

type Props = {
    user: User;
};

const roleLabel: Record<User["role"], string> = {
    candidate: "Candidate",
    staff: "Staff",
    admin: "Admin",
};

const getGreeting = (date: Date): string => {
    const hour = date.getHours();

    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
};

export default function Topbar({ user }: Props) {
    const { toggleSidebar, toggleMobileSidebar } = useSidebar();
    const { theme, toggleTheme } = useTheme();
    const { props } = usePage<PageProps>();

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const role = props.auth?.user?.role ?? "candidate";
    const profileHref = useMemo(() => {
        if (role === "staff") return "/dashboard/staff/profile";
        if (role === "admin") return "/dashboard/admin/profile";
        return "/dashboard/profile";
    }, [role]);

    const now = useMemo(() => new Date(), []);
    const greeting = useMemo(() => getGreeting(now), [now]);
    const greetingName = user.name?.trim() || roleLabel[role];
    const currentDate = useMemo(() => {
        return now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    }, [now]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            const target = event.target as Node;

            if (userMenuRef.current && !userMenuRef.current.contains(target)) {
                setUserMenuOpen(false);
            }

            if (notifRef.current && !notifRef.current.contains(target)) {
                setNotifOpen(false);
            }

            if (searchRef.current && !searchRef.current.contains(target)) {
                setSearchOpen(false);
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;

            setUserMenuOpen(false);
            setNotifOpen(false);
            setSearchOpen(false);
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        if (!userMenuOpen) return;

        animate(".user-dropdown", {
            opacity: [0, 1],
            translateY: [-8, 0],
            duration: 220,
            ease: "outExpo",
        });
    }, [userMenuOpen]);

    useEffect(() => {
        if (!notifOpen) return;

        animate(".notif-dropdown", {
            opacity: [0, 1],
            translateY: [-8, 0],
            duration: 220,
            ease: "outExpo",
        });
    }, [notifOpen]);

    useEffect(() => {
        if (!searchOpen) return;

        searchInputRef.current?.focus();
        animate(".dashboard-search-popover", {
            opacity: [0, 1],
            translateY: [-8, 0],
            duration: 220,
            ease: "outExpo",
        });
    }, [searchOpen]);

    const handleToggle = useCallback(() => {
        if (window.innerWidth >= 1024) {
            toggleSidebar();
            return;
        }

        toggleMobileSidebar();
    }, [toggleMobileSidebar, toggleSidebar]);

    const handleLogout = useCallback(() => {
        router.post("/logout");
    }, []);

    const toggleSearch = useCallback(() => {
        setSearchOpen((prev) => !prev);
    }, []);

    return (
        <header className="
            sticky top-0 z-40 flex h-16 items-center gap-3
            border-b border-slate-200 bg-white/90 px-3 backdrop-blur-md
            transition-all duration-300
            dark:border-white/5 dark:bg-navy/90 sm:px-4
        ">
            <button
                type="button"
                onClick={handleToggle}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gold/45 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
                aria-label="Toggle sidebar"
                title="Toggle sidebar"
            >
                <i className="fa-solid fa-bars text-sm"></i>
            </button>

            <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">
                    {greeting}, {greetingName}
                </p>
                <p className="mt-0.5 hidden truncate text-xs font-medium text-slate-500 dark:text-slate-400 sm:block">
                    {currentDate}
                </p>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-1.5">
                <div className="relative" ref={searchRef}>
                    <button
                        type="button"
                        onClick={toggleSearch}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gold/45 dark:text-slate-400 dark:hover:bg-white/5"
                        aria-label="Search"
                        aria-expanded={searchOpen}
                        aria-controls="dashboard-search-popover"
                        title="Search"
                    >
                        <i className="fa-solid fa-magnifying-glass text-sm"></i>
                    </button>

                    {searchOpen && (
                        <div
                            id="dashboard-search-popover"
                            className="dashboard-search-popover absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900"
                        >
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                    <i className="fa-solid fa-magnifying-glass text-xs"></i>
                                </span>
                                <input
                                    ref={searchInputRef}
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search dashboard..."
                                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-10 text-sm text-slate-700 transition placeholder:text-slate-400 focus:border-gold focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-gold/45 dark:hover:bg-white/10 dark:hover:text-slate-200"
                                        aria-label="Clear search"
                                    >
                                        <i className="fa-solid fa-xmark text-xs"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gold/45 dark:text-slate-400 dark:hover:bg-white/5"
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    title={theme === "dark" ? "Mode terang" : "Mode gelap"}
                >
                    <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} text-sm`}></i>
                </button>

                <div className="relative" ref={notifRef}>
                    <button
                        type="button"
                        onClick={() => setNotifOpen((prev) => !prev)}
                        className="relative flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gold/45 dark:text-slate-400 dark:hover:bg-white/5"
                        aria-label="Notifications"
                        aria-expanded={notifOpen}
                        title="Notifikasi"
                    >
                        <i className="fa-solid fa-bell text-sm"></i>
                    </button>

                    {notifOpen && (
                        <div className="notif-dropdown absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900">
                            <div className="border-b border-slate-100 px-4 py-3 dark:border-white/5">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">Notifikasi</p>
                            </div>
                            <div className="px-4 py-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                                Belum ada notifikasi baru.
                            </div>
                        </div>
                    )}
                </div>

                <div className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-white/10 sm:block" />

                <div className="relative" ref={userMenuRef}>
                    <button
                        type="button"
                        onClick={() => setUserMenuOpen((prev) => !prev)}
                        className="flex min-h-11 items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gold/45 dark:hover:bg-white/5"
                        aria-expanded={userMenuOpen}
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gold">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-xs font-bold text-navy">{user.initials}</span>
                            )}
                        </div>

                        <div className="hidden text-left sm:block">
                            <p className="max-w-[128px] truncate text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100">
                                {user.name}
                            </p>
                            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                                {roleLabel[role]}
                            </p>
                        </div>
                        <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 transition dark:text-slate-500"></i>
                    </button>

                    {userMenuOpen && (
                        <div className="user-dropdown absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900">
                            <div className="border-b border-slate-100 px-4 py-3 dark:border-white/5">
                                <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{user.name}</p>
                                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                            </div>

                            <div className="p-1.5">
                                <Link
                                    href={profileHref}
                                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-gold/45 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <i className="fa-solid fa-circle-user w-4 text-center text-slate-400 dark:text-slate-500"></i>
                                    Profil Saya
                                </Link>
                            </div>

                            <div className="border-t border-slate-100 p-1.5 dark:border-white/5">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400/45 dark:hover:bg-red-500/10"
                                >
                                    <i className="fa-solid fa-right-from-bracket w-4 text-center"></i>
                                    Keluar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
