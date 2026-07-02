import { usePage } from "@inertiajs/react";
import type { PageProps } from "@/types";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Sidebar from "@/Components/Dashboard/Shared/Sidebar";
import Topbar from "@/Components/Dashboard/Shared/Topbar";
import Backdrop from "@/Components/Dashboard/Shared/Backdrop";
import { useIdleLogout } from "@/hooks/useIdleLogout";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    children:    React.ReactNode;
    // Slot kolom kanan — isi dengan CandidateSidebar atau component lain
    aside?:      React.ReactNode;
    // Lebar kolom kanan — default 280px
    asideWidth?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// INNER LAYOUT — butuh SidebarContext
// ─────────────────────────────────────────────────────────────────────────────

function LayoutInner({ children, aside, asideWidth = "280px" }: Props) {
    const { isExpanded } = useSidebar();
    const { auth } = usePage<PageProps>().props;

    const role   = (auth.user.role ?? "candidate") as "candidate" | "staff" | "admin";
    const isWide = isExpanded;

    // Auto-logout setelah 5 menit idle (testing) — ganti ke 1800/120 untuk production
    useIdleLogout({ timeoutSeconds: 300, warningSeconds: 300 })

    return (
        <div className="min-h-screen bg-light dark:bg-slate-950 font-sans">

            {/* ── Sidebar ───────────────────────────────────────────────── */}
            <Sidebar role={role} />

            {/* ── Mobile backdrop ───────────────────────────────────────── */}
            <Backdrop />

            {/* ── Main wrapper — shifts right on desktop, full viewport height ── */}
            <div className={`
                flex flex-col h-screen
                transition-all duration-300 ease-in-out
                ${isWide ? "lg:ml-[272px]" : "lg:ml-[72px]"}
            `}>

                {/* Topbar — h-16 = 64px, shrink-0 agar tidak diperkecil flex */}
                <div className="shrink-0">
                    <Topbar user={auth.user} />
                </div>

                {/*
                ── Content area ─────────────────────────────────────────────
                    flex-1 flex-row → sisa tinggi setelah topbar, baris horizontal
                    Masing-masing kolom punya overflow-y-auto sendiri
                    sehingga scroll tiap kolom independen — aside tidak ikut scroll
                ─────────────────────────────────────────────────────────────
                */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

                    {/* ── Kolom KIRI — konten utama, bisa scroll ────────────── */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
                        <div className="p-4 sm:p-6">
                            {/* Mobile: aside tampil di atas konten */}
                            {aside && (
                                <div className="lg:hidden mb-5">
                                    {aside}
                                </div>
                            )}
                            {children}
                        </div>
                    </div>

                    {/* ── Kolom KANAN — aside, scroll sendiri, tidak ikut kiri ── */}
                    {aside && (
                        <div
                            className="hidden lg:block overflow-y-auto overflow-x-hidden shrink-0 border-l border-white/5"
                            style={{ width: asideWidth }}
                        >
                            <div className="p-4 sm:p-5">
                                {aside}
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTER LAYOUT — provides all contexts
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardSplitLayout({ children, aside, asideWidth }: Props) {
    return (
        <ThemeProvider>
            <SidebarProvider>
                <LayoutInner aside={aside} asideWidth={asideWidth}>
                    {children}
                </LayoutInner>
            </SidebarProvider>
        </ThemeProvider>
    );
}
