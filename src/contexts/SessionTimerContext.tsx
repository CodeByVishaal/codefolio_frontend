import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { SessionTimerState, SessionTimerDraft } from '@/types/sessions';

interface SessionTimerContextType {
    timerState: SessionTimerState | null;
    isInitialized: boolean;
    pendingResume: boolean;
    autoSaveError: string | null;
    startTimer: (notes: string, projectId?: number | null) => void;
    pauseTimer: () => void;
    resumeTimer: () => void;
    stopTimer: () => SessionTimerState | null;
    clearTimer: () => void;
    resumeFromDraft: () => void;
    discardDraft: () => void;
    setAutoSaveError: (error: string | null) => void;
}

const SessionTimerContext = createContext<SessionTimerContextType | undefined>(undefined);

const STORAGE_KEY = 'session_timer_draft';
const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function validateTimerState(state: unknown): state is SessionTimerState {
    if (!state || typeof state !== 'object') return false;
    const s = state as any;
    return (
        typeof s.isRunning === 'boolean' &&
        typeof s.isPaused === 'boolean' &&
        typeof s.elapsedMs === 'number' &&
        typeof s.startedAt === 'number' &&
        typeof s.notes === 'string' &&
        (typeof s.projectId === 'number' || s.projectId === null || s.projectId === undefined) &&
        (typeof s.sessionId === 'number' || s.sessionId === undefined)
    );
}

function loadDraftFromStorage(): SessionTimerState | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const draft: SessionTimerDraft = JSON.parse(stored);
        const now = Date.now();

        // Check if draft is too old (older than 24 hours)
        if (now - draft.savedAt > MAX_DRAFT_AGE_MS) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        // Validate schema
        if (!validateTimerState(draft.state)) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        return draft.state;
    } catch (err) {
        console.error('Failed to load timer draft from localStorage:', err);
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

function saveDraftToStorage(state: SessionTimerState): void {
    try {
        const draft: SessionTimerDraft = {
            state,
            savedAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (err) {
        console.error('Failed to save timer draft to localStorage:', err);
    }
}

function clearStorageDraft(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.error('Failed to clear timer draft from localStorage:', err);
    }
}

export function SessionTimerProvider({ children }: { children: ReactNode }) {
    const [timerState, setTimerState] = useState<SessionTimerState | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [pendingResume, setPendingResume] = useState(false);
    const [autoSaveError, setAutoSaveError] = useState<string | null>(null);

    // Load draft on mount
    useEffect(() => {
        const draft = loadDraftFromStorage();
        if (draft && draft.isRunning) {
            setPendingResume(true);
            // Don't restore state yet — wait for user confirmation
        }
        setIsInitialized(true);
    }, []);

    const startTimer = useCallback((notes: string, projectId?: number | null) => {
        if (!notes.trim()) {
            setAutoSaveError('Please enter at least a note to start the timer.');
            return;
        }

        const newState: SessionTimerState = {
            isRunning: true,
            isPaused: false,
            elapsedMs: 0,
            startedAt: Date.now(),
            notes: notes.trim(),
            projectId,
        };

        setTimerState(newState);
        saveDraftToStorage(newState);
        setAutoSaveError(null);
    }, []);

    const pauseTimer = useCallback(() => {
        setTimerState((prev) => {
            if (!prev || !prev.isRunning || prev.isPaused) return prev;

            const updated: SessionTimerState = {
                ...prev,
                isRunning: false,
                isPaused: true,
                pausedAt: Date.now(),
            };

            saveDraftToStorage(updated);
            return updated;
        });
    }, []);

    const resumeTimer = useCallback(() => {
        setTimerState((prev) => {
            if (!prev || prev.isRunning || !prev.isPaused) return prev;

            const pausedDuration = (prev.pausedAt ?? Date.now()) - (prev.startedAt + prev.elapsedMs);
            const updated: SessionTimerState = {
                ...prev,
                isRunning: true,
                isPaused: false,
                startedAt: Date.now() - pausedDuration,
                pausedAt: undefined,
            };

            saveDraftToStorage(updated);
            return updated;
        });
    }, []);

    const stopTimer = useCallback((): SessionTimerState | null => {
        const finalState = timerState;
        clearStorageDraft();
        setTimerState(null);
        return finalState;
    }, [timerState]);

    const clearTimer = useCallback(() => {
        clearStorageDraft();
        setTimerState(null);
        setPendingResume(false);
        setAutoSaveError(null);
    }, []);

    const resumeFromDraft = useCallback(() => {
        const draft = loadDraftFromStorage();
        if (draft) {
            // Adjust elapsed time if timer was paused
            let adjustedState = draft;
            if (draft.isPaused && draft.pausedAt) {
                const timeSincePause = Date.now() - draft.pausedAt;
                adjustedState = {
                    ...draft,
                    startedAt: Date.now() - timeSincePause,
                };
            }
            setTimerState(adjustedState);
        }
        setPendingResume(false);
    }, []);

    const discardDraft = useCallback(() => {
        clearStorageDraft();
        setPendingResume(false);
        setTimerState(null);
    }, []);

    return (
        <SessionTimerContext.Provider
            value={{
                timerState,
                isInitialized,
                pendingResume,
                autoSaveError,
                startTimer,
                pauseTimer,
                resumeTimer,
                stopTimer,
                clearTimer,
                resumeFromDraft,
                discardDraft,
                setAutoSaveError,
            }}
        >
            {children}
        </SessionTimerContext.Provider>
    );
}

export function useSessionTimer(): SessionTimerContextType {
    const context = useContext(SessionTimerContext);
    if (!context) {
        throw new Error('useSessionTimer must be used within SessionTimerProvider');
    }
    return context;
}
