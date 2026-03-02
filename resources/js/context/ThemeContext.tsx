import { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
    theme: Theme;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>("light");
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("sentinel-theme") as Theme | null;
        const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setTheme(saved ?? preferred);
        setInitialized(true);
    }, []);

    useEffect(() => {
        if (!initialized) return;
        localStorage.setItem("sentinel-theme", theme);
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme, initialized]);

    const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
