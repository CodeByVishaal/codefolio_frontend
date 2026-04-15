import type { DailyActivity } from '@/types/analytics';

interface ActivityHeatmapProps {
    weekly: DailyActivity[]; // we use the daily data, just arranged in a weekly grid
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKS = 15;         // how many weeks to show
const CELL = 13;          // px per cell
const GAP = 3;            // px gap between cells
const STEP = CELL + GAP;  // total step per cell

// Returns a teal color at varying opacity based on hours coded
function cellColor(hours: number): string {
    if (hours === 0) return 'var(--muted)';
    if (hours < 1) return 'oklch(0.68 0.13 186 / 0.3)';
    if (hours < 2) return 'oklch(0.68 0.13 186 / 0.5)';
    if (hours < 3) return 'oklch(0.68 0.13 186 / 0.7)';
    return 'oklch(0.68 0.13 186 / 1.0)';
}

// Build a flat array of {date, hours} for the last WEEKS×7 days
function buildGrid(daily: DailyActivity[]) {
    const map = new Map(daily.map((d) => [d.date, d.duration_mins / 60]));
    const cells: { date: string; hours: number; label: string }[] = [];
    const today = new Date();

    // Find the most recent Sunday and go back WEEKS weeks from there
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    // Adjust so week starts Monday
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - mondayOffset);

    for (let w = WEEKS - 1; w >= 0; w--) {
        for (let d = 0; d < 7; d++) {
            const date = new Date(lastMonday);
            date.setDate(lastMonday.getDate() - (w * 7) + d);
            // Don't show future days
            if (date > today) {
                cells.push({ date: '', hours: -1, label: '' });
                continue;
            }
            const dateStr = date.toISOString().split('T')[0];
            const hours = map.get(dateStr) ?? 0;
            cells.push({
                date: dateStr,
                hours,
                label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            });
        }
    }
    return cells;
}

// Month labels — find where each month starts in the grid
function buildMonthLabels(cells: ReturnType<typeof buildGrid>) {
    const labels: { week: number; month: string }[] = [];
    let lastMonth = '';
    cells.forEach((cell, i) => {
        if (!cell.date) return;
        const month = cell.date.slice(0, 7); // "2024-06"
        const weekIndex = Math.floor(i / 7);
        if (month !== lastMonth) {
            lastMonth = month;
            const d = new Date(cell.date + 'T00:00:00');
            labels.push({
                week: weekIndex,
                month: d.toLocaleDateString('en-US', { month: 'short' }),
            });
        }
    });
    return labels;
}

export function ActivityHeatmap({ weekly }: ActivityHeatmapProps) {
    const cells = buildGrid(weekly);
    const months = buildMonthLabels(cells);

    const svgWidth = WEEKS * STEP + 36; // 36px for day labels on left
    const svgHeight = 7 * STEP + 24;     // 24px for month labels on top

    return (
        <div className="overflow-x-auto">
            <svg
                width={svgWidth}
                height={svgHeight}
                style={{ display: 'block' }}
                aria-label="Activity heatmap"
            >
                {/* Month labels along the top */}
                {months.map(({ week, month }) => (
                    <text
                        key={`${week}-${month}`}
                        x={36 + week * STEP}
                        y={12}
                        fontSize={10}
                        fill="var(--muted-foreground)"
                    >
                        {month}
                    </text>
                ))}

                {/* Day labels on the left — only Mon / Wed / Fri / Sun */}
                {DAYS.map((day, i) => (
                    [0, 2, 4, 6].includes(i) && (
                        <text
                            key={day}
                            x={0}
                            y={24 + i * STEP + CELL * 0.75}
                            fontSize={9}
                            fill="var(--muted-foreground)"
                        >
                            {day}
                        </text>
                    )
                ))}

                {/* Grid cells */}
                {cells.map((cell, idx) => {
                    const week = Math.floor(idx / 7);
                    const day = idx % 7;
                    const x = 36 + week * STEP;
                    const y = 24 + day * STEP;

                    if (cell.hours === -1) return null; // future day

                    return (
                        <g key={idx}>
                            <rect
                                x={x} y={y}
                                width={CELL} height={CELL}
                                rx={2}
                                fill={cellColor(cell.hours)}
                            />
                            {/* Invisible hover target with tooltip via title */}
                            {cell.date && (
                                <title>
                                    {cell.label}: {cell.hours === 0 ? 'No sessions' : `${cell.hours.toFixed(1)}h`}
                                </title>
                            )}
                        </g>
                    );
                })}

                {/* Legend */}
                <text x={36} y={svgHeight} fontSize={9} fill="var(--muted-foreground)">Less</text>
                {[0, 0.5, 1.5, 2.5, 4].map((h, i) => (
                    <rect
                        key={i}
                        x={36 + 32 + i * (CELL + 2)} y={svgHeight - CELL}
                        width={CELL} height={CELL}
                        rx={2}
                        fill={cellColor(h)}
                    />
                ))}
                <text
                    x={36 + 32 + 5 * (CELL + 2) + 4}
                    y={svgHeight}
                    fontSize={9}
                    fill="var(--muted-foreground)"
                >
                    More
                </text>
            </svg>
        </div>
    );
}