import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { DailyActivity } from '@/types/analytics';

interface DailyBarChartProps {
    daily: DailyActivity[];
}

// Build a full 30-day array, filling gaps with zero — so every day has a bar slot
function buildChartData(daily: DailyActivity[]) {
    // Create a map from date string → activity
    const map = new Map(daily.map((d) => [d.date, d]));

    const result = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const activity = map.get(dateStr);
        result.push({
            date: dateStr,
            label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            hours: activity ? +(activity.total_mins / 60).toFixed(1) : 0,  // ← total_mins not duration_mins
            mins: activity?.total_mins ?? 0,                               // ← total_mins not duration_mins
        });
    }
    return result;
}

// Custom tooltip shown on hover
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const { hours, mins } = payload[0].payload;
    if (mins === 0) return null; // don't show tooltip for zero days

    return (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
            <p className="font-medium text-foreground">{label}</p>
            <p className="mt-0.5 text-muted-foreground">
                {hours}h ({mins} min)
            </p>
        </div>
    );
}

export function DailyBarChart({ daily }: DailyBarChartProps) {
    const chartData = buildChartData(daily);

    // Only label every 5th day to avoid crowding the X axis
    const xTicks = chartData
        .filter((_, i) => i % 5 === 0 || i === 29)
        .map((d) => d.date);

    return (
        <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis
                    dataKey="date"
                    ticks={xTicks}
                    tickFormatter={(date) => {
                        const d = new Date(date + 'T00:00:00');
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}h`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
                <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, i) => (
                        <Cell
                            key={i}
                            fill={entry.hours > 0 ? 'var(--primary)' : 'var(--muted)'}
                            opacity={entry.hours > 0 ? 0.85 : 0.3}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}