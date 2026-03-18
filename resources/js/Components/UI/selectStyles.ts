// resources/js/Components/UI/selectStyles.ts
// Shared react-select styles — dark mode, gold accent

export const makeSelectStyles = (isMulti = false) => ({
    control: (base: any, state: any) => ({
        ...base,
        backgroundColor: "rgba(15,23,42,0.6)",
        borderColor: state.isFocused ? "#d4a017" : "rgba(255,255,255,0.1)",
        borderRadius: "0.75rem",
        padding: "2px 4px",
        boxShadow: "none",
        minHeight: "44px",
        "&:hover": { borderColor: "#d4a017" },
    }),
    menu: (base: any) => ({
        ...base,
        backgroundColor: "#1e293b",
        borderRadius: "0.75rem",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        zIndex: 100,
    }),
    menuList: (base: any) => ({ ...base, maxHeight: "200px" }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "#d4a017"
            : state.isFocused ? "rgba(212,160,23,0.15)" : "transparent",
        color: state.isSelected ? "#0f172a" : "#e2e8f0",
        cursor: "pointer",
        fontSize: "13px",
    }),
    singleValue:      (base: any) => ({ ...base, color: "#e2e8f0", fontSize: "14px" }),
    multiValue:       (base: any) => ({ ...base, backgroundColor: "rgba(212,160,23,0.2)", borderRadius: "6px" }),
    multiValueLabel:  (base: any) => ({ ...base, color: "#d4a017", fontSize: "12px" }),
    multiValueRemove: (base: any) => ({ ...base, color: "#d4a017", "&:hover": { backgroundColor: "rgba(212,160,23,0.3)", color: "#fff" } }),
    placeholder:      (base: any) => ({ ...base, color: "#64748b", fontSize: "14px" }),
    input:            (base: any) => ({ ...base, color: "#e2e8f0" }),
});
