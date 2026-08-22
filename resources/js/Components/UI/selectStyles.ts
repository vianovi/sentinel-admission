// resources/js/Components/UI/selectStyles.ts
// Shared react-select styles — dark/light mode adaptive + error state support
//
// Catatan arsitektur:
// react-select hanya support inline style objects — tidak bisa Tailwind class.
// isDark di-pass sebagai parameter dari komponen yang sudah subscribe ke
// ThemeContext, sehingga re-render terjadi setiap kali theme berubah.

export const makeSelectStyles = (hasError = false, isDark = false, accentColor = "#d4a017") => ({
    control: (base: any, state: any) => ({
        ...base,
        backgroundColor: hasError
            ? isDark ? "rgba(244, 63, 94, 0.08)" : "rgba(255, 241, 242, 1)"
            : isDark ? "rgba(15, 23, 42, 0.6)"   : "#ffffff",
        borderColor: hasError
            ? isDark ? "rgba(244, 63, 94, 0.55)" : "#e11d48"
            : state.isFocused ? accentColor
            : isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        borderRadius: "0.625rem",
        padding:      "2px 4px",
        boxShadow:    state.isFocused
            ? isDark ? `0 0 0 2px ${accentColor}40` : `0 0 0 2px ${accentColor}30`
            : "none",
        minHeight:    "44px",
        transition:   "border-color 0.2s, background-color 0.2s, box-shadow 0.2s",
        "&:hover": {
            borderColor: hasError
                ? isDark ? "rgba(244, 63, 94, 0.55)" : "#e11d48"
                : accentColor,
        },
    }),
    menu: (base: any) => ({
        ...base,
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        borderRadius:    "0.625rem",
        border:          isDark
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(0,0,0,0.08)",
        boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 8px 32px rgba(0,0,0,0.12)",
        marginTop: 6,
        overflow: "hidden",
        zIndex:   9999,
        minWidth: "100%",
    }),
    menuPortal: (base: any) => ({
        ...base,
        zIndex: 9999,
    }),
    menuList: (base: any) => ({
        ...base,
        maxHeight: "280px",
        padding: "6px",
        overscrollBehavior: "contain",
    }),
    option: (base: any, state: any) => ({
        ...base,
        borderRadius: "0.5rem",
        backgroundColor: state.isSelected
            ? accentColor
            : state.isFocused ? (accentColor === "#d4a017" ? "rgba(212,160,23,0.15)" : "rgba(139,92,246,0.15)") : "transparent",
        color:    state.isSelected ? "#ffffff" : isDark ? "#e2e8f0" : "#1e293b",
        cursor:   "pointer",
        fontSize: "13px",
        lineHeight: "1.35",
        padding: "10px 12px",
        whiteSpace: "normal",
    }),
    singleValue: (base: any) => ({
        ...base,
        color: hasError
            ? isDark ? "#fda4af" : "#9f1239"
            : isDark ? "#e2e8f0" : "#1e293b",
        fontSize: "14px",
    }),
    multiValue:       (base: any) => ({ ...base, backgroundColor: `${accentColor}33`, borderRadius: "6px" }),
    multiValueLabel:  (base: any) => ({ ...base, color: accentColor, fontSize: "12px" }),
    multiValueRemove: (base: any) => ({ ...base, color: accentColor, "&:hover": { backgroundColor: `${accentColor}4d`, color: "#fff" } }),
    placeholder: (base: any) => ({
        ...base,
        color: hasError
            ? isDark ? "rgba(244,63,94,0.6)" : "#9ca3af"
            : isDark ? "#64748b" : "#9ca3af",
        fontSize: "14px",
    }),
    input: (base: any) => ({
        ...base,
        color: hasError
            ? isDark ? "#fda4af" : "#9f1239"
            : isDark ? "#e2e8f0" : "#1e293b",
    }),
    indicatorSeparator: (base: any) => ({
        ...base,
        backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    }),
    dropdownIndicator: (base: any, state: any) => ({
        ...base,
        color: state.isFocused ? accentColor : isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
        "&:hover": { color: accentColor },
        transition: "color 0.2s",
    }),
});
