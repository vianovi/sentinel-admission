import { memo } from "react";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

type Props = {
    value: number;
};

function ProgressRing({ value }: Props) {
    const data = [{ name: "progress", value }];

    return (
        <div className="h-32 w-32 sm:h-36 sm:w-36" aria-label={`Progress ${value}%`}>
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    data={data}
                    startAngle={90}
                    endAngle={-270}
                    innerRadius="72%"
                    outerRadius="100%"
                    barSize={10}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={10} fill="#d4a017" background={{ fill: "#e2e8f0" }} />
                </RadialBarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default memo(ProgressRing);
