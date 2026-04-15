import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ProjectActivity } from '@/types/analytics';

interface ProjectDonutChartProps {
    perProject: ProjectActivity[];
}

// Teal-family palette for slices — stays on-brand
const SLICE_COLORS = [
    'oklch(0.68 0.13 186)',   // primary teal
    'oklch(0.60 0.12 220)',   // blue-teal
    'oklch(0.72 0.15 145)',   // green
    'oklch(0.75 0.14 80)',    // amber
    'oklch(0.68 0.18 30)',    // coral
    'oklch(0.55 0.10 260)',   // indigo
];

function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const { name, value, sessions } = payload[0].payload;
    return (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
            <p className="font-medium text-foreground">{name}</p>
            <p className="mt-0.5 text-muted-foreground">
                {(value / 60).toFixed(1)}h · {sessions} session{sessions !== 1 ? 's' : ''}
            </p>
        </div>
    );
}

export function ProjectDonutChart({ perProject }: ProjectDonutChartProps) {
    if (perProject.length === 0) {
        return (
            <div className="flex h-[220px] items-center justify-center">
                <p className="text-sm text-muted-foreground">No session data yet</p>
            </div>
        );
    }

    // Map to chart-friendly shape. Combine tiny slices into "Other" if > 6 projects
    const sorted = [...perProject].sort((a, b) => b.total_mins - a.total_mins);
    const top = sorted.slice(0, 5);
    const rest = sorted.slice(5);

    const chartData = [
        ...top.map((p) => ({
            name: p.project_title,
            value: p.total_mins,
            sessions: p.total_sessions,
        })),
        ...(rest.length > 0
            ? [{ name: 'Other', value: rest.reduce((s, p) => s + p.total_mins, 0), sessions: rest.reduce((s, p) => s + p.total_sessions, 0) }]
            : []),
    ];

    return (
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}   // the hole — makes it a donut
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                >
                    {chartData.map((_, i) => (
                        <Cell
                            key={i}
                            fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                            stroke="transparent"
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{value}</span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}