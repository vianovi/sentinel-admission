// resources/js/Components/Dashboard/Shared/Topbar.tsx

import { Link, router, usePage } from "@inertiajs/react";
import { animate } from "animejs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import { useCardSize } from "@/context/CardSizeContext";
import type { PageProps, User } from "@/types";

type Props = {
    user: User;
};

type CalendarDay = {
    date: Date;
    label: number;
    inCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
};

const roleLabel: Record<User["role"], string> = {
    candidate: "Candidate",
    staff: "Staff",
    admin: "Admin",
};

const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const getGreeting = (date: Date): string => {
    const hour = date.getHours();

    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
};

const isSameDay = (left: Date, right: Date): boolean => {
    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate()
    );
};

const formatDateValue = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    });
};

const buildCalendarDays = (visibleMonth: Date, selectedDate: Date, today: Date): CalendarDay[] => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(year, month, 1 - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);

        return {
            date,
            label: date.getDate(),
            inCurrentMonth: date.getMonth() === month,
            isToday: isSameDay(date, today),
            isSelected: isSameDay(date, selectedDate),
        };
    });
};

export default function Topbar({ user }: Props) {
    const { toggleSidebar, toggleMobileSidebar } = useSidebar();
    const { theme, toggleTheme } = useTheme();
    const { cardSize, toggleCardSize } = useCardSize();
    const { props } = usePage<PageProps>();
    const { app } = props;

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [visibleMonth, setVisibleMonth] = useState(() => new Date());
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const desktopSearchInputRef = useRef<HTMLInputElement>(null);

    const role = props.auth?.user?.role ?? "candidate";
    const profileHref = useMemo(() => {
        if (role === "staff") return "/dashboard/staff/profile";
        if (role === "admin") return "/dashboard/admin/profile";
        return "/dashboard/profile";
    }, [role]);

    const now = useMemo(() => new Date(), []);
    const greeting = useMemo(() => getGreeting(now), [now]);
    const greetingName = user.name?.trim() || roleLabel[role];
    const welcomeText = useMemo(() => {
        if (role === "staff") return `Ruang kerja operasional untuk verifikasi dan tindak lanjut di ${app.name}`;
        if (role === "admin") return `Pusat kendali untuk pengaturan, monitoring, dan evaluasi ${app.name}`;
        return `Portal pribadi untuk memantau progres dan langkah berikutnya di ${app.name}`;
    }, [app.name, role]);
    const formattedSelectedDate = useMemo(() => formatDateValue(selectedDate), [selectedDate]);
    const calendarDays = useMemo(
        () => buildCalendarDays(visibleMonth, selectedDate, now),
        [now, selectedDate, visibleMonth],
    );
    const visibleMonthTitle = useMemo(
        () => `${monthNames[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`,
        [visibleMonth],
    );

    const closeFloatingPanels = useCallback((except?: "calendar" | "search" | "notif" | "user") => {
        if (except !== "calendar") setCalendarOpen(false);
        if (except !== "search") setSearchOpen(false);
        if (except !== "notif") setNotifOpen(false);
        if (except !== "user") setUserMenuOpen(false);
    }, []);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            const target = event.target as Node;

            if (calendarRef.current && !calendarRef.current.contains(target)) {
                setCalendarOpen(false);
            }

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

            setCalendarOpen(false);
            setUserMenuOpen(false);
            setNotifOpen(false);
            setSearchOpen(false);
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        if (!calendarOpen) return;

        animate(".dashboard-calendar-popover", {
            opacity: [0, 1],
            translateY: [-10, 0],
            scale: [0.98, 1],
            duration: 260,
            ease: "outExpo",
        });
    }, [calendarOpen]);

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

        desktopSearchInputRef.current?.focus();
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
        closeFloatingPanels("search");
        setSearchOpen((prev) => !prev);
    }, [closeFloatingPanels]);

    const toggleCalendar = useCallback(() => {
        closeFloatingPanels("calendar");
        setCalendarOpen((prev) => !prev);
    }, [closeFloatingPanels]);

    const toggleNotif = useCallback(() => {
        closeFloatingPanels("notif");
        setNotifOpen((prev) => !prev);
    }, [closeFloatingPanels]);

    const toggleUserMenu = useCallback(() => {
        closeFloatingPanels("user");
        setUserMenuOpen((prev) => !prev);
    }, [closeFloatingPanels]);

    const moveMonth = useCallback((direction: -1 | 1) => {
        setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    }, []);

    const chooseDate = useCallback((date: Date) => {
        setSelectedDate(date);
        setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5 dark:focus-visible:ring-white/15"
                aria-label="Toggle sidebar"
                title="Toggle sidebar"
            >
                <i className="fa-solid fa-bars text-sm"></i>
            </button>

            <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">
                    {greeting}, {greetingName}
                </p>
                <p className="mt-0.5 hidden max-w-[42vw] truncate text-xs font-medium text-slate-500 dark:text-slate-400 sm:block">
                    {welcomeText}
                </p>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-1.5">
                <div className="relative hidden sm:block" ref={calendarRef}>
                    <button
                        type="button"
                        onClick={toggleCalendar}
                        className="group flex h-11 w-[176px] overflow-hidden rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/35 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-gold/30 dark:focus-visible:ring-gold/15"
                        aria-label="Open calendar"
                        aria-expanded={calendarOpen}
                        aria-controls="dashboard-calendar-popover"
                        title="Kalender"
                    >
                        <span className="flex h-full w-10 items-center justify-center border-r border-slate-200 text-slate-500 transition group-hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:group-hover:bg-white/[0.04]">
                            <i className="fa-regular fa-calendar-days text-sm"></i>
                        </span>
                        <span className="flex flex-1 items-center justify-center tracking-[0.01em]">
                            {formattedSelectedDate}
                        </span>
                    </button>

                    {calendarOpen && (
                        <div
                            id="dashboard-calendar-popover"
                            className="dashboard-calendar-popover absolute right-0 top-[3.25rem] z-50 w-[min(32rem,calc(100vw-1.5rem))] rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-950 sm:p-5"
                        >
                            <div className="mb-4 flex justify-end">
                                <button
                                    type="button"
                                    className="flex h-10 w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 sm:w-[170px]"
                                    aria-label="Selected date"
                                >
                                    <span className="flex h-full w-10 items-center justify-center border-r border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400">
                                        <i className="fa-regular fa-calendar-days text-sm"></i>
                                    </span>
                                    <span className="flex flex-1 items-center justify-center">{formattedSelectedDate}</span>
                                </button>
                            </div>

                            <div className="rounded-[1.15rem] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
                                <div className="mb-5 grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
                                    <button
                                        type="button"
                                        onClick={() => moveMonth(-1)}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition hover:bg-gold/10 hover:text-goldhover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 dark:text-slate-300 dark:hover:bg-gold/10 dark:hover:text-gold dark:focus-visible:ring-gold/15"
                                        aria-label="Previous month"
                                    >
                                        <i className="fa-solid fa-angles-left text-xs"></i>
                                    </button>
                                    <p className="text-center text-lg font-bold text-slate-800 dark:text-slate-100">
                                        {visibleMonthTitle}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => moveMonth(1)}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition hover:bg-gold/10 hover:text-goldhover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 dark:text-slate-300 dark:hover:bg-gold/10 dark:hover:text-gold dark:focus-visible:ring-gold/15"
                                        aria-label="Next month"
                                    >
                                        <i className="fa-solid fa-angles-right text-xs"></i>
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-y-2 text-center">
                                    {weekDays.map((day) => (
                                        <div key={day} className="py-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {day}
                                        </div>
                                    ))}

                                    {calendarDays.map((day) => {
                                        const dateKey = day.date.toISOString();
                                        const buttonClass = [
                                            "mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 dark:focus-visible:ring-gold/15",
                                            day.isSelected
                                                ? "bg-gold text-navy shadow-lg shadow-gold/20 hover:bg-goldhover hover:text-white"
                                                : day.isToday
                                                    ? "bg-navy text-white shadow-md shadow-slate-900/20 hover:bg-slate-800"
                                                    : day.inCurrentMonth
                                                        ? "text-slate-700 hover:bg-gold/10 hover:text-goldhover dark:text-slate-200 dark:hover:bg-gold/10 dark:hover:text-gold"
                                                        : "text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-white/[0.04]",
                                        ].join(" ");

                                        return (
                                            <button
                                                type="button"
                                                key={dateKey}
                                                onClick={() => chooseDate(day.date)}
                                                className={buttonClass}
                                                aria-label={`Choose ${formatDateValue(day.date)}`}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={searchRef}>
                    <div className="hidden items-end gap-3 px-2 sm:flex">
                        <button
                            type="button"
                            onClick={toggleSearch}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80 dark:text-slate-200 dark:hover:bg-white/5 dark:focus-visible:ring-white/15"
                            aria-label="Search"
                            aria-expanded={searchOpen}
                            title="Search"
                        >
                            <i className="fa-solid fa-magnifying-glass text-[1.15rem]"></i>
                        </button>

                        <div
                            className={[
                                "overflow-hidden border-b pb-1 transition-all duration-300 ease-out",
                                searchOpen
                                    ? "w-[148px] border-gold/75 opacity-100"
                                    : "w-0 border-transparent opacity-0 pointer-events-none",
                                "dark:border-gold/40",
                            ].join(" ")}
                        >
                            <input
                                ref={desktopSearchInputRef}
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search Here"
                                className="h-8 w-[148px] border-0 bg-transparent px-0 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={toggleSearch}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-goldhover hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-gold dark:focus-visible:ring-gold/15 sm:hidden"
                        aria-label="Search"
                        aria-expanded={searchOpen}
                        aria-controls="dashboard-search-popover"
                        title="Search"
                    >
                        <i className="fa-solid fa-magnifying-glass text-lg"></i>
                    </button>

                    {searchOpen && (
                        <div
                            id="dashboard-search-popover"
                            className="dashboard-search-popover absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900 sm:hidden"
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
                                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80 dark:hover:bg-white/10 dark:hover:text-slate-200 dark:focus-visible:ring-white/15"
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
                    onClick={toggleCardSize}
                    className="hidden h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-goldhover hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-gold dark:focus-visible:ring-gold/15 md:flex"
                    title={`Ukuran Card: ${cardSize.toUpperCase()}. Klik untuk mengubah ukuran card di seluruh dashboard.`}
                >
                    <i className={`fa-solid ${cardSize === "compact" ? "fa-compress" : cardSize === "expanded" ? "fa-expand" : "fa-up-right-and-down-left-from-center"} text-sm`} />
                </button>

                <button
                    type="button"
                    onClick={toggleTheme}
                    className="hidden h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-goldhover hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-gold dark:focus-visible:ring-gold/15 md:flex"
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    title={theme === "dark" ? "Mode terang" : "Mode gelap"}
                >
                    <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} text-base`}></i>
                </button>

                <div className="relative" ref={notifRef}>
                    <button
                        type="button"
                        onClick={toggleNotif}
                        className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-goldhover hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-gold dark:focus-visible:ring-gold/15"
                        aria-label="Notifications"
                        aria-expanded={notifOpen}
                        title="Notifikasi"
                    >
                        <i className="fa-regular fa-bell text-xl"></i>
                        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border border-white bg-red-500 dark:border-navy"></span>
                    </button>

                    {notifOpen && (
                        <div className="notif-dropdown absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900">
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
                        onClick={toggleUserMenu}
                        className="flex min-h-11 items-center gap-2 rounded-2xl py-1 pl-1 pr-2 transition hover:bg-slate-100 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 dark:hover:bg-white/5 dark:focus-visible:ring-gold/15"
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
                        <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition dark:text-slate-500 ${userMenuOpen ? "rotate-180" : ""}`}></i>
                    </button>

                    {userMenuOpen && (
                        <div className="user-dropdown absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900">
                            <div className="border-b border-slate-100 px-4 py-3 dark:border-white/5">
                                <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{user.name}</p>
                                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                            </div>

                            <div className="p-1.5">
                                <Link
                                    href={profileHref}
                                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:ring-white/15"
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
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70 dark:hover:bg-red-500/10 dark:focus-visible:ring-red-400/20"
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
