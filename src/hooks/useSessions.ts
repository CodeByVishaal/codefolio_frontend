import { useState, useEffect, useCallback } from 'react';
import { sessionsApi } from '@/lib/api/sessions';
import type { CodingSession, SessionCreateInput, SessionUpdateInput, SessionSummary } from '@/types/sessions';

interface UseSessionsReturn {
    sessions: CodingSession[];
    summary: SessionSummary | null;
    isLoading: boolean;
    error: string | null;
    createSession: (data: SessionCreateInput) => Promise<CodingSession>;
    updateSession: (id: number, data: SessionUpdateInput) => Promise<CodingSession>;
    deleteSession: (id: number) => Promise<void>;
    refresh: () => void;
}

export function useSessions(): UseSessionsReturn {
    const [sessions, setSessions] = useState<CodingSession[]>([]);
    const [summary, setSummary] = useState<SessionSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fire both requests in parallel — faster than sequential awaits
            const [sessionData, summaryData] = await Promise.all([
                sessionsApi.list(),
                sessionsApi.summary(),
            ]);

            // Defensive normalization — same pattern as useProjects
            const normalized = sessionData.map((s) => ({
                ...s,
                notes: s.notes || null,
            }));

            setSessions(normalized);
            setSummary(summaryData);
        } catch {
            setError('Failed to load sessions. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const createSession = async (data: SessionCreateInput): Promise<CodingSession> => {
        const newSession = await sessionsApi.create(data);
        setSessions((prev) => [newSession, ...prev]);
        // Refresh summary since totals have changed
        sessionsApi.summary().then(setSummary).catch(() => null);
        return newSession;
    };

    const updateSession = async (id: number, data: SessionUpdateInput): Promise<CodingSession> => {
        const updated = await sessionsApi.update(id, data);
        setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
        // Refresh summary — duration might have changed
        sessionsApi.summary().then(setSummary).catch(() => null);
        return updated;
    };

    const deleteSession = async (id: number): Promise<void> => {
        const previous = sessions;
        setSessions((prev) => prev.filter((s) => s.id !== id));
        try {
            await sessionsApi.delete(id);
            // Refresh summary after confirmed delete
            sessionsApi.summary().then(setSummary).catch(() => null);
        } catch (err) {
            setSessions(previous);
            throw err;
        }
    };

    return {
        sessions,
        summary,
        isLoading,
        error,
        createSession,
        updateSession,
        deleteSession,
        refresh: fetchAll,
    };
}