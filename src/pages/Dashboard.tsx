import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart, Bar, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
    FolderKanban, CheckSquare, Clock, BookOpen,
    Flame, Trophy, Terminal, ArrowRight,
    TrendingUp, Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useSessions } from '@/hooks/useSessions';
import { useJournal } from '@/hooks/useJournal';
import { useAnalytics } from '@/hooks/useAnalytics';
import { projectStatusConfig } from '@/lib/statusConfig';
import { cn } from '@/lib/utils';

// ── Skeleton primitive ────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
    return (
        <div className={cn('animate-pulse rounded-lg bg-card', className)} />
    );
}

// ── Duration formatter — 90 → "1h 30m" ───────────────────────────────────────
function fmtDuration(mins: number): string {
    if (!mins) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── Greeting based on time of day ─────────────────────────────────────────────
function greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

// ── Mini bar chart tooltip ────────────────────────────────────────────────────
function MiniTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    if (!d.mins) return null;
    return (
        <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
            <p className="font-medium text-foreground">{d.label}</p>
            <p className="text-muted-foreground">{fmtDuration(d.mins)}</p>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export function Dashboard() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] ?? 'there';

    const { projects, isLoading: projLoading } = useProjects();
    const { tasks, isLoading: taskLoading } = useTasks();
    const { sessions, summary,
        isLoading: sessLoading } = useSessions();
    const { entries, isLoading: journLoading } = useJournal();
    const { data: analyticsData,
        isLoading: analyticsLoading } = useAnalytics();

    // ── Derived values ──────────────────────────────────────────────────────────

    // Count tasks that are not done or cancelled
    const openTasks = useMemo(
        () => tasks.filter(t => !['done', 'cancelled'].includes(t.status)).length,
        [tasks],
    );

    // Active projects (not archived or completed)
    const activeProjects = useMemo(
        () => projects.filter(p => !['archived', 'completed'].includes(p.status)),
        [projects],
    );

    // 3 most recently updated projects
    const recentProjects = useMemo(
        () => [...projects]
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 3),
        [projects],
    );

    // Last 3 sessions
    const recentSessions = useMemo(() => sessions.slice(0, 3), [sessions]);

    // Build a 7-day mini chart from analytics daily data
    const weekChart = useMemo(() => {
        const map = new Map(
            (analyticsData?.daily ?? []).map(d => [d.date, d.total_mins])
        );
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            return {
                date: dateStr,
                label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                mins: map.get(dateStr) ?? 0,
                hours: +((map.get(dateStr) ?? 0) / 60).toFixed(1),
            };
        });
    }, [analyticsData]);

    const weekTotal = useMemo(
        () => weekChart.reduce((s, d) => s + d.mins, 0),
        [weekChart],
    );

    const streaks = analyticsData?.streaks;

    // ── Stat card config ────────────────────────────────────────────────────────
    const statCards = [
        {
            label: 'Projects',
            value: projLoading ? null : projects.length,
            sub: projLoading ? null : `${activeProjects.length} active`,
            icon: FolderKanban,
            href: '/projects',
            loading: projLoading,
        },
        {
            label: 'Open Tasks',
            value: taskLoading ? null : openTasks,
            sub: taskLoading ? null : `across ${projects.length} project${projects.length !== 1 ? 's' : ''}`,
            icon: CheckSquare,
            href: '/tasks',
            loading: taskLoading,
        },
        {
            label: 'Hours coded',
            value: sessLoading ? null : (summary?.total_hours ?? 0),
            sub: sessLoading ? null : `${summary?.total_sessions ?? 0} session${(summary?.total_sessions ?? 0) !== 1 ? 's' : ''} total`,
            icon: Clock,
            href: '/sessions',
            loading: sessLoading,
        },
        {
            label: 'Journal entries',
            value: journLoading ? null : entries.length,
            sub: journLoading ? null : `${entries.filter(e => e.is_public).length} public`,
            icon: BookOpen,
            href: '/journal',
            loading: journLoading,
        },
    ];

    return (
        <div className="p-6 sm:p-8 space-y-6 max-w-[1400px]">

            {/* ── Greeting ────────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        {greeting()}, {firstName} 👋
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Here's what's happening with your dev activity.
                    </p>
                </div>

                {/* Streak badge — only shown when active */}
                {!analyticsLoading && streaks && streaks.current_streak > 0 && (
                    <Link to="/analytics">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-sm text-orange-400 hover:bg-orange-500/15 transition-colors">
                            <Flame size={14} />
                            <span className="font-medium">{streaks.current_streak}-day streak</span>
                        </div>
                    </Link>
                )}
            </div>

            {/* ── Stat cards ──────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {statCards.map(({ label, value, sub, icon: Icon, href, loading }) => (
                    <Link key={label} to={href}>
                        <Card className="group transition-all hover:border-border/80 hover:bg-card/80 h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {label}
                                </CardTitle>
                                <Icon size={13} className="text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {loading ? (
                                    <>
                                        <Skeleton className="h-7 w-16 mt-1" />
                                        <Skeleton className="h-3 w-24 mt-2" />
                                    </>
                                ) : (
                                    <>
                                        <p className="text-2xl font-semibold text-foreground mt-0.5">{value}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* ── Middle row: chart + streaks ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                {/* Weekly mini chart — spans 2 columns */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-0 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-medium text-foreground">
                                This week
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {analyticsLoading ? '…' : `${fmtDuration(weekTotal)} coded in the last 7 days`}
                            </p>
                        </div>
                        <Link
                            to="/analytics"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            Full analytics <ArrowRight size={11} />
                        </Link>
                    </CardHeader>
                    <CardContent className="pt-4 pb-3">
                        {analyticsLoading ? (
                            <Skeleton className="h-[120px] w-full" />
                        ) : weekTotal === 0 ? (
                            <div className="flex h-[120px] flex-col items-center justify-center gap-2">
                                <TrendingUp size={20} className="text-muted-foreground/30" />
                                <p className="text-xs text-muted-foreground">No sessions this week</p>
                                <Link
                                    to="/sessions"
                                    className="text-xs text-primary hover:underline underline-offset-4"
                                >
                                    Log your first session →
                                </Link>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={120}>
                                <BarChart data={weekChart} barCategoryGap="28%" margin={{ top: 2, right: 4, bottom: 0, left: -28 }}>
                                    <Tooltip content={<MiniTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.25 }} />
                                    <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
                                        {weekChart.map((entry, i) => (
                                            <Cell
                                                key={i}
                                                fill={entry.mins > 0 ? 'var(--primary)' : 'var(--muted)'}
                                                opacity={entry.mins > 0 ? 0.85 : 0.35}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}

                        {/* Day labels below chart */}
                        {!analyticsLoading && (
                            <div className="mt-1 grid grid-cols-7 text-center">
                                {weekChart.map((d) => (
                                    <span
                                        key={d.date}
                                        className={cn(
                                            'text-[10px]',
                                            d.date === new Date().toISOString().split('T')[0]
                                                ? 'font-semibold text-primary'
                                                : 'text-muted-foreground/60',
                                        )}
                                    >
                                        {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Streaks + best — 1 column */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-foreground">Streaks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {analyticsLoading ? (
                            <>
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </>
                        ) : (
                            <>
                                {/* Current streak */}
                                <div className={cn(
                                    'flex items-center gap-3 rounded-lg p-3',
                                    streaks && streaks.current_streak > 0
                                        ? 'bg-orange-500/10 border border-orange-500/20'
                                        : 'bg-secondary/50',
                                )}>
                                    <Flame
                                        size={20}
                                        className={streaks && streaks.current_streak > 0 ? 'text-orange-400' : 'text-muted-foreground/30'}
                                    />
                                    <div>
                                        <p className="text-xl font-bold text-foreground leading-none">
                                            {streaks?.current_streak ?? 0}
                                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                                                {streaks?.current_streak === 1 ? 'day' : 'days'}
                                            </span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {streaks && streaks.current_streak > 0 ? 'Current streak' : 'No active streak — code today!'}
                                        </p>
                                    </div>
                                </div>

                                {/* Longest streak */}
                                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                                    <Trophy size={20} className="text-amber-400" />
                                    <div>
                                        <p className="text-xl font-bold text-foreground leading-none">
                                            {streaks?.longest_streak ?? 0}
                                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                                                {streaks?.longest_streak === 1 ? 'day' : 'days'}
                                            </span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Best streak ever</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Bottom row: recent sessions + recent projects ────────────────────── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                {/* Recent sessions */}
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-foreground">Recent sessions</CardTitle>
                        <Link
                            to="/sessions"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            All sessions <ArrowRight size={11} />
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-0 p-0">
                        {sessLoading ? (
                            <div className="space-y-px px-4 pb-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full" />
                                ))}
                            </div>
                        ) : recentSessions.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-10">
                                <Terminal size={20} className="text-muted-foreground/30" />
                                <p className="text-xs text-muted-foreground">No sessions logged yet</p>
                                <Link to="/sessions" className="text-xs text-primary hover:underline underline-offset-4">
                                    Log your first session →
                                </Link>
                            </div>
                        ) : (
                            <div>
                                {recentSessions.map((session, i) => {
                                    const dateStr = new Date(session.session_date + 'T00:00:00')
                                        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    const isLast = i === recentSessions.length - 1;
                                    return (
                                        <div
                                            key={session.id}
                                            className={cn(
                                                'flex items-center justify-between px-4 py-3',
                                                !isLast && 'border-b border-border/50',
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                    <Clock size={13} className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground leading-tight">
                                                        {fmtDuration(session.duration_mins)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{dateStr}</p>
                                                </div>
                                            </div>
                                            {session.notes && (
                                                <p className="max-w-[140px] truncate text-xs text-muted-foreground/60">
                                                    {session.notes}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent projects */}
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-foreground">Recent projects</CardTitle>
                        <Link
                            to="/projects"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            All projects <ArrowRight size={11} />
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-0 p-0">
                        {projLoading ? (
                            <div className="space-y-px px-4 pb-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : recentProjects.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-10">
                                <FolderKanban size={20} className="text-muted-foreground/30" />
                                <p className="text-xs text-muted-foreground">No projects yet</p>
                                <Link to="/projects" className="text-xs text-primary hover:underline underline-offset-4">
                                    Create your first project →
                                </Link>
                            </div>
                        ) : (
                            <div>
                                {recentProjects.map((project, i) => {
                                    const statusCfg = projectStatusConfig[project.status];
                                    const isLast = i === recentProjects.length - 1;
                                    const updatedStr = new Date(project.updated_at).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric',
                                    });
                                    return (
                                        <Link
                                            key={project.id}
                                            to={`/projects/${project.id}`}
                                            className={cn(
                                                'flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors',
                                                !isLast && 'border-b border-border/50',
                                            )}
                                        >
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-sm font-medium text-foreground">
                                                        {project.title}
                                                    </p>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn('text-[10px] px-1.5 py-0 shrink-0', statusCfg.className)}
                                                    >
                                                        {statusCfg.label}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] text-muted-foreground/60">
                                                        Updated {updatedStr}
                                                    </span>
                                                    {project.tags?.slice(0, 2).map(tag => (
                                                        <span
                                                            key={tag}
                                                            className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground/60"
                                                        >
                                                            <Tag size={8} />
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <ArrowRight size={13} className="ml-3 shrink-0 text-muted-foreground/30" />
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* ── Quick actions strip ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                    { label: 'Log a session', href: '/sessions', icon: Terminal },
                    { label: 'New task', href: '/tasks', icon: CheckSquare },
                    { label: 'Write in journal', href: '/journal', icon: BookOpen },
                    { label: 'View analytics', href: '/analytics', icon: TrendingUp },
                ].map(({ label, href, icon: Icon }) => (
                    <Link key={href} to={href}>
                        <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-card px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground transition-all">
                            <Icon size={13} className="shrink-0 text-primary" />
                            {label}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}