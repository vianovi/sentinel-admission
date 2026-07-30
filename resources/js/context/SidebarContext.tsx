import { createContext, useContext, useState, useEffect } from "react";

type SidebarContextType = {
    isExpanded: boolean;
    isMobileOpen: boolean;
    toggleSidebar: () => void;
    toggleMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) throw new Error("useSidebar must be used within SidebarProvider");
    return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("sidebar_expanded");
            return saved !== null ? saved === "true" : true;
        }
        return true;
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsMobileOpen(false);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsExpanded((prev) => {
            const next = !prev;
            if (typeof window !== "undefined") {
                localStorage.setItem("sidebar_expanded", String(next));
            }
            return next;
        });
    };
    const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev);

    return (
        <SidebarContext.Provider
            value={{
                isExpanded: isMobile ? false : isExpanded,
                isMobileOpen,
                toggleSidebar,
                toggleMobileSidebar,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
};
