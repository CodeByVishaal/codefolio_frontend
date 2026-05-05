import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BadgeCheck,
    Check,
    CheckSquare,
    Clock,
    FolderKanban,
    Pencil,
    Shield,
    Terminal,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MfaSecurityCard } from '@/components/profile/MfaSecurityCard';
import { StatCard } from '@/components/profile/StatCard';
import { useProfile } from '@/hooks/useProfile';

export function Profile() {
    const { profile, isLoading, error, updateName, refresh } = useProfile();
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
        if (!nameInput.trim()) {
            setNameError('Name cannot be empty.');
            return;
        }

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

    if (isLoading) {
        return (
            <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6 lg:px-8">
                <div className="h-10 w-56 rounded-2xl bg-card animate-pulse" />
                <div className="h-56 rounded-3xl bg-card animate-pulse" />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-24 rounded-2xl bg-card animate-pulse" />
                    ))}
                </div>
                <div className="h-96 rounded-3xl bg-card animate-pulse" />
            </div>
        );
    }

    if (!profile) return null;

    const initials = profile.name
        .split(' ')
        .map((segment) => segment[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Account</p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Profile & security</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Keep your public identity polished and lock down how sign-in works across devices.
                    </p>
                </div>

                <Link to={`/profile/${profile.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    View public profile
                </Link>
            </div>

            {error && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <Card className="overflow-hidden border-border/70 bg-card/80 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
                <CardContent className="p-0">
                    <div className="bg-[radial-gradient(circle_at_top_left,rgba(41,217,194,0.18),transparent_38%),linear-gradient(135deg,rgba(16,24,32,0.96),rgba(13,18,24,0.92))] px-5 py-6 sm:px-6 lg:px-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.7rem] border border-primary/20 bg-primary/10 text-2xl font-semibold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                    {initials}
                                </div>

                                <div className="min-w-0 space-y-3">
                                    {editing ? (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <Input
                                                value={nameInput}
                                                onChange={(e) => setNameInput(e.target.value)}
                                                className="h-10 w-full bg-background/70 sm:w-64"
                                                disabled={savingName}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveName();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                            />
                                            <div className="flex gap-2">
                                                <Button size="icon-sm" variant="outline" className="border-primary/20 bg-background/60 text-primary" onClick={saveName} disabled={savingName}>
                                                    <Check size={14} />
                                                </Button>
                                                <Button size="icon-sm" variant="outline" className="border-border/70 bg-background/60" onClick={cancelEdit} disabled={savingName}>
                                                    <X size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-2xl font-semibold text-foreground">{profile.name}</h2>
                                            <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={startEdit}>
                                                <Pencil size={13} />
                                            </Button>
                                        </div>
                                    )}

                                    {nameError && <p className="text-xs text-destructive">{nameError}</p>}

                                    <p className="text-sm text-muted-foreground">{profile.email}</p>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="border-primary/20 bg-background/45 text-foreground">
                                            <Shield className="mr-1 h-3.5 w-3.5 text-primary" />
                                            {profile.role}
                                        </Badge>
                                        {profile.is_verified && (
                                            <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                                                <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                                                Verified
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className={profile.mfa_enabled ? 'border-primary/20 bg-primary/10 text-primary' : 'border-amber-500/20 bg-amber-500/10 text-amber-300'}>
                                            {profile.mfa_enabled ? 'MFA enabled' : 'MFA off'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">Member since {joinDate}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-4">
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Projects</p>
                                    <p className="mt-2 text-xl font-semibold text-foreground">{profile.total_projects}</p>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sessions</p>
                                    <p className="mt-2 text-xl font-semibold text-foreground">{profile.total_sessions}</p>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hours</p>
                                    <p className="mt-2 text-xl font-semibold text-foreground">{profile.total_hours}</p>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tasks</p>
                                    <p className="mt-2 text-xl font-semibold text-foreground">{profile.total_tasks_completed}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div>
                <h2 className="mb-3 text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">Activity snapshot</h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={FolderKanban} label="Projects" value={profile.total_projects} />
                    <StatCard icon={Terminal} label="Sessions" value={profile.total_sessions} />
                    <StatCard icon={Clock} label="Hours coded" value={profile.total_hours} sub="h" />
                    <StatCard icon={CheckSquare} label="Tasks done" value={profile.total_tasks_completed} />
                </div>
            </div>

            <MfaSecurityCard enabled={profile.mfa_enabled} onStateChange={refresh} />
        </div>
    );
}
