import React, { createContext, useContext, useState, useEffect } from "react";

export type CardSize = "compact" | "normal" | "expanded";

type CardSizeContextType = {
    cardSize: CardSize;
    setCardSize: (size: CardSize) => void;
    toggleCardSize: () => void;
    getCardPaddingClass: () => string;
    getCardGapClass: () => string;
    getCardTextClass: () => string;
};

const CardSizeContext = createContext<CardSizeContextType | undefined>(undefined);

export const useCardSize = () => {
    const context = useContext(CardSizeContext);
    if (!context) {
        return {
            cardSize: "normal" as CardSize,
            setCardSize: () => {},
            toggleCardSize: () => {},
            getCardPaddingClass: () => "p-4 sm:p-6",
            getCardGapClass: () => "gap-4 sm:gap-6",
            getCardTextClass: () => "text-sm",
        };
    }
    return context;
};

export const CardSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cardSize, setCardSizeState] = useState<CardSize>("normal");
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("sentinel-card-size") as CardSize | null;
        if (saved && ["compact", "normal", "expanded"].includes(saved)) {
            setCardSizeState(saved);
        }
        setInitialized(true);
    }, []);

    useEffect(() => {
        if (!initialized) return;
        localStorage.setItem("sentinel-card-size", cardSize);
        document.documentElement.setAttribute("data-card-size", cardSize);
    }, [cardSize, initialized]);

    const setCardSize = (size: CardSize) => setCardSizeState(size);

    const toggleCardSize = () => {
        setCardSizeState((prev) => {
            if (prev === "normal") return "compact";
            if (prev === "compact") return "expanded";
            return "normal";
        });
    };

    const getCardPaddingClass = () => {
        if (cardSize === "compact") return "p-2.5 sm:p-3.5";
        if (cardSize === "expanded") return "p-6 sm:p-8";
        return "p-4 sm:p-6";
    };

    const getCardGapClass = () => {
        if (cardSize === "compact") return "gap-2.5 sm:gap-3";
        if (cardSize === "expanded") return "gap-6 sm:gap-8";
        return "gap-4 sm:gap-6";
    };

    const getCardTextClass = () => {
        if (cardSize === "compact") return "text-xs";
        if (cardSize === "expanded") return "text-base";
        return "text-sm";
    };

    return (
        <CardSizeContext.Provider
            value={{
                cardSize,
                setCardSize,
                toggleCardSize,
                getCardPaddingClass,
                getCardGapClass,
                getCardTextClass,
            }}
        >
            {children}
        </CardSizeContext.Provider>
    );
};
