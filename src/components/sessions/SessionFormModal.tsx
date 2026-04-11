import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { CodingSession, SessionCreateInput, SessionUpdateInput } from '@/types/sessions';
import type { Project } from '@/types/projects';

interface SessionFormModalProps {
    open: boolean;
    onClose: () => void;
    session?: CodingSession;
    projects: Project[];
    onCreate: (data: SessionCreateInput) => Promise<CodingSession>;
    onUpdate: (id: number, data: SessionUpdateInput) => Promise<CodingSession>;
}

export function SessionFormModal({
    open, onClose, session, projects, onCreate, onUpdate,
}: SessionFormModalProps) {
    const isEditing = !!session;

    // Store hours + minutes separately so the form is human-readable
    const [hours, setHours] = useState('0');
    const [minutes, setMinutes] = useState('30');
    const [sessionDate, setSessionDate] = useState('');
    const [projectId, setProjectId] = useState<string>('none');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            if (session) {
                // Convert stored total minutes back into hours + minutes for the form
                const h = Math.floor(session.duration_mins / 60);
                const m = session.duration_mins % 60;
                setHours(String(h));
                setMinutes(String(m));
                setSessionDate(session.session_date);
                setProjectId(session.project_id ? String(session.project_id) : 'none');
                setNotes(session.notes || '');
            } else {
                // Create mode defaults — today's date, 30 minutes
                setHours('0');
                setMinutes('30');
                setSessionDate(new Date().toISOString().split('T')[0]); // "YYYY-MM-DD"
                setProjectId('none');
                setNotes('');
            }
            setError('');
        }
    }, [session, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const totalMins = parseInt(hours || '0', 10) * 60 + parseInt(minutes || '0', 10);

        if (totalMins <= 0) {
            setError('Session duration must be greater than 0 minutes.');
            return;
        }
        if (!sessionDate) {
            setError('Please select a date.');
            return;
        }

        const payload = {
            duration_mins: totalMins,
            session_date: sessionDate,
            project_id: projectId !== 'none' ? parseInt(projectId, 10) : null,
            notes: notes.trim() || undefined,
        };

        setError('');
        setIsLoading(true);
        try {
            if (isEditing) {
                await onUpdate(session.id, payload);
            } else {
                await onCreate(payload);
            }
            onClose();
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit session' : 'Log session'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-1">
                    {error && (
                        <Alert variant="destructive" className="py-2">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Duration — split hours + minutes inputs */}
                    <div className="space-y-1.5">
                        <Label>Duration</Label>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <Input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    className="w-16 text-center"
                                    disabled={isLoading}
                                />
                                <span className="text-sm text-muted-foreground">hr</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={minutes}
                                    onChange={(e) => setMinutes(e.target.value)}
                                    className="w-16 text-center"
                                    disabled={isLoading}
                                />
                                <span className="text-sm text-muted-foreground">min</span>
                            </div>
                            {/* Live preview of total */}
                            <span className="ml-auto text-xs text-muted-foreground">
                                = {(parseInt(hours || '0', 10) * 60 + parseInt(minutes || '0', 10))} mins total
                            </span>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                        <Label htmlFor="session-date">Date</Label>
                        <Input
                            id="session-date"
                            type="date"
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                            disabled={isLoading}
                            className="[color-scheme:dark]"
                        />
                    </div>

                    {/* Project link — optional */}
                    <div className="space-y-1.5">
                        <Label>Project
                            <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">optional</span>
                        </Label>
                        <Select value={projectId} onValueChange={(value) => value && setProjectId(value)} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder="No project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No project</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={String(p.title)}>
                                        {p.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <Label htmlFor="session-notes">Notes
                            <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">optional</span>
                        </Label>
                        <Textarea
                            id="session-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="What did you work on?"
                            rows={2}
                            disabled={isLoading}
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? isEditing ? 'Saving…' : 'Logging…'
                                : isEditing ? 'Save changes' : 'Log session'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}