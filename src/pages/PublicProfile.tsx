import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    FolderKanban, Terminal, Clock, CheckSquare,
    Tag, Globe, BookOpen, Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/profile/StatCard';
import { projectStatusConfig } from '@/lib/statusConfig';
import { profileApi } from '@/lib/api/profile';
import type { PublicProfile as PublicProfileType } from '@/types/analytics';
import { cn } from '@/lib/utils';

export function PublicProfile() {
    const { id } = useParams<{ id: string }>();
    const userId = parseInt(id ?? '0', 10);

    const [profile, setProfile] = useState<PublicProfileType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        setIsLoading(true);
        profileApi.public(userId)
            .then(setProfile)
            .catch(() => setError('Profile not found or not available.'))
            .finally(() => setIsLoading(false));
    }, [userId]);

    // ── Loading ────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="mx-auto max-w-3xl p-8 space-y-6">
                <div className="h-24 rounded-xl bg-card animate-pulse" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-card animate-pulse" />
                    ))}
                </div>
                <div className="h-48 rounded-xl bg-card animate-pulse" />
            </div>
        );
    }

    // ── Error / not found ──────────────────────────────────────────────────
    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-8 min-h-[60vh]">
                <Globe size={28} className="text-muted-foreground/30" />
                <p className="text-muted-foreground">{error ?? 'Profile not found.'}</p>
                <Link to="/dashboard" className="text-sm text-primary hover:underline">
                    ← Back to dashboard
                </Link>
            </div>
        );
    }

    const initials = profile.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const memberSince = new Date(profile.member_since).toLocaleDateString('en-US', {
        month: 'long', year: 'numeric',
    });

    return (
        <div className="mx-auto max-w-3xl p-8 space-y-8">

            {/* ── Identity header ─────────────────────────────────────────── */}
            <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-xl font-semibold text-primary">
                    {initials}
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">{profile.name}</h1>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Calendar size={11} />
                        Member since {memberSince}
                    </div>
                </div>
            </div>

            {/* ── Public stats grid ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard icon={FolderKanban} label="Projects" value={profile.stats.total_public_projects} />
                <StatCard icon={Terminal} label="Sessions" value={profile.stats.total_sessions} />
                <StatCard icon={Clock} label="Hours coded" value={profile.stats.total_hours} sub="h" />
                <StatCard icon={CheckSquare} label="Tasks done" value={profile.stats.total_tasks_completed} />
            </div>

            {/* ── Public projects ─────────────────────────────────────────── */}
            {profile.projects.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-base font-medium text-foreground flex items-center gap-2">
                        <FolderKanban size={15} className="text-primary" />
                        Projects
                        <span className="text-sm font-normal text-muted-foreground">
                            {profile.projects.length}
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {profile.projects.map((project) => {
                            const statusCfg = projectStatusConfig[project.status as keyof typeof projectStatusConfig]
                                ?? { label: project.status, className: '' };
                            return (
                                <Card key={project.id} className="hover:border-border/80 transition-colors">
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-foreground text-sm leading-snug">
                                                {project.title}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className={cn('text-[11px] shrink-0', statusCfg.className)}
                                            >
                                                {statusCfg.label}
                                            </Badge>
                                        </div>
                                        {project.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {project.description}
                                            </p>
                                        )}
                                        {project.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {project.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center gap-0.5 rounded-sm bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground"
                                                    >
                                                        <Tag size={8} />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Public journal entries ──────────────────────────────────── */}
            {profile.journal.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-base font-medium text-foreground flex items-center gap-2">
                        <BookOpen size={15} className="text-primary" />
                        Journal
                        <span className="text-sm font-normal text-muted-foreground">
                            {profile.journal.length} public entr{profile.journal.length === 1 ? 'y' : 'ies'}
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {profile.journal.map((entry) => (
                            <Card key={entry.id} className="hover:border-border/80 transition-colors">
                                <CardContent className="p-4 space-y-2">
                                    <p className="font-medium text-foreground text-sm leading-snug line-clamp-1">
                                        {entry.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-3 font-mono leading-relaxed">
                                        {entry.body}
                                    </p>
                                    {entry.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {entry.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-0.5 rounded-sm bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground"
                                                >
                                                    <Tag size={8} />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-[11px] text-muted-foreground/60">
                                        {new Date(entry.updated_at).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                        })}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Empty state — public profile has no content yet ────────── */}
            {profile.projects.length === 0 && profile.journal.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <Globe size={28} className="text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                        {profile.name.split(' ')[0]} hasn't made any public content yet.
                    </p>
                </div>
            )}
        </div>
    );
}