import { useState } from 'react';
import { Clock, Plus, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionFormModal } from '@/components/sessions/SessionFormModal';
import { useSessions } from '@/hooks/useSessions';
import { useProjects } from '@/hooks/useProjects';
import type { CodingSession } from '@/types/sessions';

export function Sessions() {
    const { sessions, summary, isLoading, error, createSession, updateSession, deleteSession } = useSessions();
    const { projects } = useProjects();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<CodingSession | undefined>(undefined);

    const openCreateModal = () => { setEditingSession(undefined); setModalOpen(true); };
    const openEditModal = (s: CodingSession) => { setEditingSession(s); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditingSession(undefined); };

    // Build a project name lookup map — same pattern as Tasks.tsx
    const projectMap = projects.reduce<Record<number, string>>((acc, p) => {
        acc[p.id] = p.title;
        return acc;
    }, {});

    return (
        <div className="p-8 space-y-6">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Sessions</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {sessions.length > 0
                            ? `${sessions.length} session${sessions.length === 1 ? '' : 's'} logged`
                            : 'No sessions yet'}
                    </p>
                </div>
                <Button onClick={openCreateModal} size="sm" className="gap-1.5">
                    <Plus size={15} /> Log session
                </Button>
            </div>

            {/* ── Summary strip — only shown when data exists ──────────────── */}
            {summary && summary.total_sessions > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Total hours</p>
                            <p className="mt-1 text-2xl font-semibold text-foreground">
                                {summary.total_hours}
                                <span className="ml-1 text-sm font-normal text-muted-foreground">h</span>
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Total sessions</p>
                            <p className="mt-1 text-2xl font-semibold text-foreground">
                                {summary.total_sessions}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="col-span-2 sm:col-span-1">
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Avg per session</p>
                            <p className="mt-1 text-2xl font-semibold text-foreground">
                                {Math.round(summary.total_mins / summary.total_sessions)}
                                <span className="ml-1 text-sm font-normal text-muted-foreground">min</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── Error ───────────────────────────────────────────────────── */}
            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* ── Loading skeleton ─────────────────────────────────────────── */}
            {isLoading && (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
                    ))}
                </div>
            )}

            {/* ── Empty state ─────────────────────────────────────────────── */}
            {!isLoading && !error && sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Terminal size={22} className="text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="font-medium text-foreground">No sessions logged yet</p>
                        <p className="text-sm text-muted-foreground">
                            Start tracking your coding time.
                        </p>
                    </div>
                    <Button onClick={openCreateModal} size="sm" variant="outline" className="gap-1.5">
                        <Clock size={14} /> Log first session
                    </Button>
                </div>
            )}

            {/* ── Sessions list ────────────────────────────────────────────── */}
            {!isLoading && sessions.length > 0 && (
                <div className="space-y-2">
                    {sessions.map((session) => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            projectName={session.project_id ? projectMap[session.project_id] : undefined}
                            onEdit={openEditModal}
                            onDelete={deleteSession}
                        />
                    ))}
                </div>
            )}

            <SessionFormModal
                open={modalOpen}
                onClose={closeModal}
                session={editingSession}
                projects={projects}
                onCreate={createSession}
                onUpdate={updateSession}
            />
        </div>
    );
}