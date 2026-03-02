import { usePage } from "@inertiajs/react";
import type { PageProps } from '@/types';
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Sidebar from "@/Components/Dashboard/Shared/Sidebar";
import Topbar from "@/Components/Dashboard/Shared/Topbar";
import Backdrop from "@/Components/Dashboard/Shared/Backdrop";

type Props = {
    children: React.ReactNode;
};

// Inner layout — needs SidebarContext
function LayoutInner({ children }: Props) {
    const { isExpanded, isHovered } = useSidebar();
    const { auth } = usePage<PageProps>().props;

    const role = (auth.user.role ?? "candidate") as "candidate" | "staff" | "admin";
    const isWide = isExpanded || isHovered;

    return (
        <div className="min-h-screen bg-light dark:bg-slate-950 font-sans">
            {/* Sidebar */}
            <Sidebar role={role} />

            {/* Mobile backdrop */}
            <Backdrop />

            {/* Main content area — shifts right on desktop */}
            <div className={`
                flex flex-col min-h-screen
                transition-all duration-300 ease-in-out
                ${isWide ? "lg:ml-[272px]" : "lg:ml-[72px]"}
            `}>
                <Topbar user={auth.user} />

                <main className="flex-1 p-4 sm:p-6 max-w-screen-2xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}

// Outer layout — provides all contexts
export default function DashboardLayout({ children }: Props) {
    return (
        <ThemeProvider>
            <SidebarProvider>
                <LayoutInner>{children}</LayoutInner>
            </SidebarProvider>
        </ThemeProvider>
    );
}
