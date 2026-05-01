import { useState, useEffect, useCallback } from 'react';
import { Pause, Play, Square, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TimerDisplay } from '@/components/sessions/TimerDisplay';
import { useSessionTimer as useTimerContext } from '@/contexts/SessionTimerContext';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useSessions } from '@/hooks/useSessions';
import type { Project } from '@/types/projects';

interface SessionTimerModalProps {
    open: boolean;
    onClose: () => void;
    projects: Project[];
    onSessionSaved?: () => void;
}

export function SessionTimerModal({
    open,
    onClose,
    projects,
    onSessionSaved,
}: SessionTimerModalProps) {
    const {
        timerState,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        clearTimer,
        autoSaveError,
        setAutoSaveError,
    } = useTimerContext();

    const {
        currentElapsedMs,
    } = useSessionTimer();

    const { createSession } = useSessions();

    // Form state for input mode (before timer starts)
    const [notes, setNotes] = useState('');
    const [projectId, setProjectId] = useState<string>('none');
    const [validationError, setValidationError] = useState('');
    const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Reset form when dialog closes
    useEffect(() => {
        if (!open && !timerState) {
            setNotes('');
            setProjectId('none');
            setValidationError('');
            setAutoSaveError(null);
            setSaveError('');
        }
    }, [open, timerState, setAutoSaveError]);

    const handleStart = useCallback(() => {
        if (!notes.trim()) {
            setValidationError('Please enter at least a note to start the timer.');
            return;
        }

        const projId = projectId !== 'none' ? parseInt(projectId, 10) : undefined;
        startTimer(notes, projId);
        setValidationError('');
        setSaveError('');
    }, [notes, projectId, startTimer]);

    const handlePause = useCallback(() => {
        pauseTimer();
    }, [pauseTimer]);

    const handleResume = useCallback(() => {
        resumeTimer();
    }, [resumeTimer]);

    const handleStop = useCallback(async () => {
        setIsSaving(true);
        setSaveError('');

        try {
            const finalState = stopTimer();
            if (!finalState) {
                setSaveError('Failed to stop timer.');
                setIsSaving(false);
                return;
            }

            // Calculate final duration in minutes (at least 1 minute)
            const durationMins = Math.max(1, Math.round(currentElapsedMs / 1000 / 60));

            const payload = {
                duration_mins: durationMins,
                session_date: new Date().toISOString().split('T')[0],
                project_id: finalState.projectId ?? null,
                notes: finalState.notes,
            };

            await createSession(payload);

            // Success - refresh sessions list and close
            clearTimer();
            onSessionSaved?.();
            onClose();
        } catch (err) {
            setSaveError('Failed to save session. Please try again.');
            console.error('Error saving session:', err);
            setIsSaving(false);
        }
    }, [stopTimer, currentElapsedMs, createSession, clearTimer, onSessionSaved, onClose]);

    const handleCloseModal = useCallback(() => {
        if (timerState?.isRunning && !timerState.isPaused) {
            setCloseConfirmOpen(true);
        } else {
            clearTimer();
            onClose();
        }
    }, [timerState, clearTimer, onClose]);

    const confirmClose = useCallback(async () => {
        setCloseConfirmOpen(false);
        setIsSaving(true);
        setSaveError('');

        try {
            const finalState = stopTimer();
            if (finalState) {
                const durationMins = Math.max(1, Math.round(currentElapsedMs / 1000 / 60));

                const payload = {
                    duration_mins: durationMins,
                    session_date: new Date().toISOString().split('T')[0],
                    project_id: finalState.projectId ?? null,
                    notes: finalState.notes,
                };

                await createSession(payload);
                onSessionSaved?.();
            }
            clearTimer();
            onClose();
        } catch (err) {
            setSaveError('Failed to save session. Please try again.');
            console.error('Error saving session:', err);
            setIsSaving(false);
        }
    }, [stopTimer, currentElapsedMs, createSession, clearTimer, onSessionSaved, onClose]);

    return (
        <>
            <Dialog open={open} onOpenChange={(o) => !o && handleCloseModal()}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {timerState ? 'Coding Session Timer' : 'Start Quick Session'}
                        </DialogTitle>
                        <DialogDescription>
                            {timerState
                                ? 'Track your coding session with a live timer.'
                                : 'Start a session with just notes. Project is optional.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Timer display and controls */}
                        {timerState ? (
                            <>
                                <TimerDisplay
                                    elapsedMs={currentElapsedMs}
                                    isRunning={timerState.isRunning && !timerState.isPaused}
                                />

                                {/* Info section */}
                                <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                                    <div className="text-sm">
                                        <Label className="text-xs text-muted-foreground block mb-1">
                                            Notes
                                        </Label>
                                        <p className="text-sm text-foreground break-words">{timerState.notes}</p>
                                    </div>
                                    {timerState.projectId && (
                                        <div className="text-sm">
                                            <Label className="text-xs text-muted-foreground block mb-1">
                                                Project
                                            </Label>
                                            <p className="text-sm text-foreground">
                                                {projects.find((p) => p.id === timerState.projectId)?.title || 'Unknown'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Save error message */}
                                {saveError && (
                                    <Alert variant="destructive" className="py-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="ml-2 text-xs">
                                            {saveError}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Context auto-save error (from localStorage/sync issues) */}
                                {autoSaveError && (
                                    <Alert variant="destructive" className="py-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="ml-2 text-xs">
                                            {autoSaveError}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Controls */}
                                <div className="grid grid-cols-2 gap-2">
                                    {timerState.isPaused ? (
                                        <Button
                                            onClick={handleResume}
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700"
                                            disabled={isSaving}
                                        >
                                            <Play size={16} className="mr-1" />
                                            Resume
                                        </Button>
                                    ) : timerState.isRunning ? (
                                        <Button
                                            onClick={handlePause}
                                            size="sm"
                                            variant="outline"
                                            disabled={isSaving}
                                        >
                                            <Pause size={16} className="mr-1" />
                                            Pause
                                        </Button>
                                    ) : null}
                                    <Button
                                        onClick={handleStop}
                                        size="sm"
                                        className="bg-red-600 hover:bg-red-700"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <span className="animate-spin mr-1">⏳</span>
                                                Saving…
                                            </>
                                        ) : (
                                            <>
                                                <Square size={16} className="mr-1" />
                                                Stop & Save
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Pre-timer form */}
                                <div className="space-y-3">
                                    {validationError && (
                                        <Alert variant="destructive" className="py-2">
                                            <AlertDescription className="text-xs">
                                                {validationError}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Notes - required */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="timer-notes" className="text-sm font-medium">
                                            Notes
                                            <span className="text-red-500 ml-1">*</span>
                                        </Label>
                                        <Textarea
                                            id="timer-notes"
                                            value={notes}
                                            onChange={(e) => {
                                                setNotes(e.target.value);
                                                setValidationError('');
                                            }}
                                            placeholder="What are you working on? (required)"
                                            rows={3}
                                            className="resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {notes.length} characters
                                        </p>
                                    </div>

                                    {/* Project - optional */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="timer-project" className="text-sm font-medium">
                                            Project
                                            <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">
                                                optional
                                            </span>
                                        </Label>
                                        <Select value={projectId} onValueChange={(value) => setProjectId(value ?? 'none')}>
                                            <SelectTrigger id="timer-project">
                                                <SelectValue placeholder="No project" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No project</SelectItem>
                                                {projects.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        {timerState ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleCloseModal}
                                disabled={timerState.isRunning && !timerState.isPaused}
                            >
                                Close
                            </Button>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleStart}
                                    disabled={!notes.trim()}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Play size={16} className="mr-1.5" />
                                    Start Timer
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Close confirmation dialog */}
            <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Stop the running timer?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your timer is still running. Clicking stop will save the session with the time elapsed so far.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Timer Running</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmClose} className="bg-red-600 hover:bg-red-700" disabled={isSaving}>
                            {isSaving ? 'Saving…' : 'Stop & Save'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
