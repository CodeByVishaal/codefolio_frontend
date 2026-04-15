import { ActivityHeatmap } from '@/components/analytics/ActivityHeatMap';
import { DailyBarChart } from '@/components/analytics/DailyBarChart';
import { ProjectDonutChart } from '@/components/analytics/ProjectDonutChart';
import { StreakCards } from '@/components/analytics/StreakCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSessions } from '@/hooks/useSessions';
import { BarChart2, Clock, Terminal } from 'lucide-react';

export function Analytics() {
    const { data, isLoading, error } = useAnalytics();
    const { summary } = useSessions();


    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <div className="h-8 w-40 rounded-lg bg-card animate-pulse" />
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-xl bg-card animate-pulse" />
                    ))}
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-56 rounded-xl border border-border bg-card animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Your coding activity over time
                </p>
            </div>

            {/* ── Error ─────────────────────────────────────────────────────── */}
            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* ── Streak cards ──────────────────────────────────────────────── */}
            {data && <StreakCards streaks={data.streaks} />}

            {/* ── Summary strip (from useSessions) ──────────────────────────── */}
            {summary && summary.total_sessions > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total hours', value: `${summary.total_hours}h`, icon: Clock },
                        { label: 'Total sessions', value: summary.total_sessions, icon: Terminal },
                        { label: 'Avg per session', value: `${Math.round(summary.total_mins / summary.total_sessions)} min`, icon: BarChart2 },
                    ].map(({ label, value, icon: Icon }) => (
                        <Card key={label}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Icon size={12} className="text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                </div>
                                <p className="text-xl font-semibold text-foreground">{value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Daily bar chart ───────────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">
                        Daily coding activity
                        <span className="ml-2 text-xs font-normal text-muted-foreground">last 30 days</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data && data.daily.length > 0 ? (
                        <DailyBarChart daily={data.daily} />
                    ) : (
                        <div className="flex h-[180px] items-center justify-center">
                            <p className="text-sm text-muted-foreground">No sessions in the last 30 days</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Activity heatmap ──────────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">
                        Activity heatmap
                        <span className="ml-2 text-xs font-normal text-muted-foreground">last 15 weeks</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-5">
                    {data && (
                        <ActivityHeatmap weekly={data.daily} />
                    )}
                </CardContent>
            </Card>

            {/* ── Per-project donut ─────────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-medium text-foreground">
                        Time by project
                        <span className="ml-2 text-xs font-normal text-muted-foreground">all time</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data && (
                        <ProjectDonutChart
                            perProject={data.per_project}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}