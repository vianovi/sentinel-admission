// resources/js/Components/UI/ProgressRing.tsx

type Props = {
    pct:   number;
    size?: number;
};

export default function ProgressRing({ pct, size = 56 }: Props) {
    const r      = (size / 2) - 5;
    const circ   = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    const color  = pct >= 80 ? "#10b981" : pct >= 50 ? "#d4a017" : "#64748b";

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4"
                />
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke={color}
                    strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.7s ease" }}
                />
            </svg>
            <span
                className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
                style={{ color }}
            >
                {pct}%
            </span>
        </div>
    );
}
