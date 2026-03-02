import { useState, useRef, useEffect } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { animate } from "animejs";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";

type User = {
    name: string;
    email: string;
    role: string;
};

type Props = {
    user: User;
};

export default function Topbar({ user }: Props) {
    const { isExpanded, isHovered, toggleSidebar, toggleMobileSidebar } = useSidebar();
    const { theme, toggleTheme } = useTheme();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const isExpandedOrHovered = isExpanded || isHovered;

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Animate dropdown open
    useEffect(() => {
        if (userMenuOpen) {
            animate(".user-dropdown", {
                opacity:    [0, 1],
                translateY: [-8, 0],
                duration:   250,
                ease:       "outExpo",
            });
        }
    }, [userMenuOpen]);

    useEffect(() => {
        if (notifOpen) {
            animate(".notif-dropdown", {
                opacity:    [0, 1],
                translateY: [-8, 0],
                duration:   250,
                ease:       "outExpo",
            });
        }
    }, [notifOpen]);

    const handleToggle = () => {
        if (window.innerWidth >= 1024) {
            toggleSidebar();
        } else {
            toggleMobileSidebar();
        }
    };

    const handleLogout = () => {
        router.post("/logout");
    };

    const avatarInitials = user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    return (
        <header className={`
            sticky top-0 z-40 h-16 flex items-center
            bg-white/90 dark:bg-navy/90 backdrop-blur-md
            border-b border-slate-200 dark:border-white/5
            transition-all duration-300
            pr-4 pl-4 gap-3
        `}>
            {/* Hamburger */}
            <button
                onClick={handleToggle}
                className="w-9 h-9 rounded-xl flex items-center justify-center
                           text-slate-500 dark:text-slate-400
                           hover:bg-slate-100 dark:hover:bg-white/5
                           border border-slate-200 dark:border-white/10
                           transition shrink-0"
                aria-label="Toggle Sidebar"
            >
                <i className="fa-solid fa-bars text-sm"></i>
            </button>

            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-sm relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <i className="fa-solid fa-magnifying-glass text-xs"></i>
                </span>
                <input
                    type="text"
                    placeholder="Cari atau ketik perintah..."
                    className="w-full h-9 pl-9 pr-12 rounded-xl
                               text-sm text-slate-700 dark:text-slate-200
                               bg-slate-100 dark:bg-white/5
                               border border-transparent
                               placeholder:text-slate-400 dark:placeholder:text-slate-500
                               focus:outline-none focus:border-gold
                               transition"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2
                                text-[10px] text-slate-400 dark:text-slate-500
                                border border-slate-200 dark:border-white/10
                                bg-white dark:bg-white/5
                                rounded px-1.5 py-0.5 font-sans">
                    ⌘K
                </kbd>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right actions */}
            <div className="flex items-center gap-1.5">

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-xl flex items-center justify-center
                               text-slate-500 dark:text-slate-400
                               hover:bg-slate-100 dark:hover:bg-white/5
                               transition"
                    aria-label="Toggle theme"
                    title={theme === "dark" ? "Mode terang" : "Mode gelap"}
                >
                    <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} text-sm`}></i>
                </button>

                {/* Notification bell */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setNotifOpen((prev) => !prev)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center
                                   text-slate-500 dark:text-slate-400
                                   hover:bg-slate-100 dark:hover:bg-white/5
                                   transition relative"
                        aria-label="Notifikasi"
                    >
                        <i className="fa-solid fa-bell text-sm"></i>
                        {/* Unread dot */}
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold border-2 border-white dark:border-navy"></span>
                    </button>

                    {notifOpen && (
                        <div className="notif-dropdown absolute right-0 top-11 w-80
                                        bg-white dark:bg-slate-900
                                        border border-slate-200 dark:border-white/10
                                        rounded-2xl shadow-xl overflow-hidden z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">Notifikasi</p>
                                <span className="text-[11px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-lg">1 baru</span>
                            </div>
                            <div className="px-4 py-3">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <i className="fa-solid fa-circle-info text-gold text-xs"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Verifikasi Email</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Silakan verifikasi email kamu untuk melanjutkan pendaftaran.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/5">
                                <button className="text-xs font-semibold text-gold hover:text-goldhover transition w-full text-center">
                                    Lihat semua notifikasi
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

                {/* User dropdown */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setUserMenuOpen((prev) => !prev)}
                        className="flex items-center gap-2.5 pl-1 pr-2 py-1
                                   rounded-xl hover:bg-slate-100 dark:hover:bg-white/5
                                   transition group"
                    >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-xl bg-gold flex items-center justify-center
                                        text-navy text-xs font-bold shrink-0">
                            {avatarInitials}
                        </div>
                        {/* Name (hidden on small screens) */}
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight max-w-[120px] truncate">
                                {user.name}
                            </p>
                        </div>
                        <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 dark:text-slate-500
                                      group-hover:text-slate-600 dark:group-hover:text-slate-300 transition"></i>
                    </button>

                    {userMenuOpen && (
                        <div className="user-dropdown absolute right-0 top-12 w-56
                                        bg-white dark:bg-slate-900
                                        border border-slate-200 dark:border-white/10
                                        rounded-2xl shadow-xl overflow-hidden z-50">
                            {/* User info */}
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                            </div>

                            {/* Menu items */}
                            <div className="p-1.5">
                                <Link
                                    href="/dashboard/profile"
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl
                                               text-sm text-slate-700 dark:text-slate-300
                                               hover:bg-slate-100 dark:hover:bg-white/5
                                               hover:text-slate-900 dark:hover:text-white
                                               transition font-medium"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <i className="fa-solid fa-circle-user text-slate-400 dark:text-slate-500 w-4 text-center"></i>
                                    Profil Saya
                                </Link>
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl
                                               text-sm text-slate-700 dark:text-slate-300
                                               hover:bg-slate-100 dark:hover:bg-white/5
                                               hover:text-slate-900 dark:hover:text-white
                                               transition font-medium"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <i className="fa-solid fa-gear text-slate-400 dark:text-slate-500 w-4 text-center"></i>
                                    Pengaturan
                                </Link>
                            </div>

                            {/* Logout */}
                            <div className="p-1.5 border-t border-slate-100 dark:border-white/5">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                                               text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10
                                               transition font-medium"
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
