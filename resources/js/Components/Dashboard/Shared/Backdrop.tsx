import { useSidebar } from "@/context/SidebarContext";

export default function Backdrop() {
    const { isMobileOpen, toggleMobileSidebar } = useSidebar();

    if (!isMobileOpen) return null;

    return (
        <div
            className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm lg:hidden"
            onClick={toggleMobileSidebar}
            aria-hidden="true"
        />
    );
}
