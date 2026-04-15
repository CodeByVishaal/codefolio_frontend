import { useState } from 'react';
import {
    FolderKanban, Terminal, Clock, CheckSquare,
    BadgeCheck, Shield, Pencil, X, Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/profile/StatCard';
import { useProfile } from '@/hooks/useProfile';

export function Profile() {
    const { profile, isLoading, error, updateName } = useProfile();

    // Inline name editor state
    const [editing, setEditing] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [nameError, setNameError] = useState('');

    const startEdit = () => {
        setNameInput(profile?.name ?? '');
        setNameError('');
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setNameError('');
    };

    const saveName = async () => {
        if (!nameInput.trim()) { setNameError('Name cannot be empty.'); return; }
        setSavingName(true);
        try {
            await updateName(nameInput.trim());
            setEditing(false);
        } catch {
            setNameError('Failed to save. Please try again.');
        } finally {
            setSavingName(false);
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="p-8 space-y-6 max-w-2xl">
                <div className="h-8 w-40 rounded-lg bg-card animate-pulse" />
                <div className="h-32 rounded-xl bg-card animate-pulse" />
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-card animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!profile) return null;

    // Build initials for the avatar
    const initials = profile.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long', year: 'numeric',
    });

    return (
        <div className="p-8 space-y-6 max-w-2xl">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">Your account details</p>
            </div>

            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* ── Identity card ───────────────────────────────────────────── */}
            <Card>
                <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-lg font-semibold text-primary">
                            {initials}
                        </div>

                        {/* Name + email + badges */}
                        <div className="flex-1 min-w-0 space-y-2">
                            {/* Inline name editor */}
                            {editing ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={nameInput}
                                        onChange={(e) => setNameInput(e.target.value)}
                                        className="h-8 text-sm w-48"
                                        disabled={savingName}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveName();
                                            if (e.key === 'Escape') cancelEdit();
                                        }}
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-primary"
                                        onClick={saveName}
                                        disabled={savingName}
                                    >
                                        <Check size={14} />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={cancelEdit}
                                        disabled={savingName}
                                    >
                                        <X size={14} />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-foreground">{profile.name}</p>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 opacity-50 hover:opacity-100"
                                        onClick={startEdit}
                                    >
                                        <Pencil size={11} />
                                    </Button>
                                </div>
                            )}

                            {nameError && (
                                <p className="text-xs text-destructive">{nameError}</p>
                            )}

                            <p className="text-sm text-muted-foreground">{profile.email}</p>

                            {/* Badges row */}
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-[11px] gap-1">
                                    <Shield size={10} />
                                    {profile.role}
                                </Badge>
                                {profile.is_verified && (
                                    <Badge variant="outline" className="text-[11px] gap-1 text-teal-400 border-teal-500/20">
                                        <BadgeCheck size={10} />
                                        Verified
                                    </Badge>
                                )}
                                <span className="text-[11px] text-muted-foreground self-center">
                                    Member since {joinDate}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Stats grid ──────────────────────────────────────────────── */}
            <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                    Activity
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <StatCard icon={FolderKanban} label="Projects" value={profile.total_projects} />
                    <StatCard icon={Terminal} label="Sessions" value={profile.total_sessions} />
                    <StatCard icon={Clock} label="Hours coded" value={profile.total_hours} sub="h" />
                    <StatCard icon={CheckSquare} label="Tasks done" value={profile.total_tasks_completed} />
                </div>
            </div>

            {/* ── Public profile link ─────────────────────────────────────── */}
            <Card className="border-dashed">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-foreground">Your public profile</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Share your public projects and journal entries
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                    >
                        <a href={`/profile/${profile.id}`}>View</a>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}