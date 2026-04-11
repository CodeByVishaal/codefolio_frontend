import { useState, useEffect, useCallback } from 'react';
import { journalApi } from '@/lib/api/journal';
import type { JournalEntry, JournalCreateInput, JournalUpdateInput } from '@/types/sessions';

interface UseJournalReturn {
    entries: JournalEntry[];
    isLoading: boolean;
    error: string | null;
    createEntry: (data: JournalCreateInput) => Promise<JournalEntry>;
    updateEntry: (id: number, data: JournalUpdateInput) => Promise<JournalEntry>;
    deleteEntry: (id: number) => Promise<void>;
    refresh: () => void;
}

export function useJournal(): UseJournalReturn {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEntries = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await journalApi.list();
            // Normalize tags — same || [] pattern as projects
            const normalized = data.map((e) => ({
                ...e,
                tags: e.tags || [],
            }));
            setEntries(normalized);
        } catch {
            setError('Failed to load journal entries. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const createEntry = async (data: JournalCreateInput): Promise<JournalEntry> => {
        const newEntry = await journalApi.create(data);
        const normalized = { ...newEntry, tags: newEntry.tags || [] };
        setEntries((prev) => [normalized, ...prev]);
        return normalized;
    };

    const updateEntry = async (id: number, data: JournalUpdateInput): Promise<JournalEntry> => {
        const updated = await journalApi.update(id, data);
        const normalized = { ...updated, tags: updated.tags || [] };
        setEntries((prev) => prev.map((e) => (e.id === id ? normalized : e)));
        return normalized;
    };

    const deleteEntry = async (id: number): Promise<void> => {
        const previous = entries;
        setEntries((prev) => prev.filter((e) => e.id !== id));
        try {
            await journalApi.delete(id);
        } catch (err) {
            setEntries(previous);
            throw err;
        }
    };

    return {
        entries,
        isLoading,
        error,
        createEntry,
        updateEntry,
        deleteEntry,
        refresh: fetchEntries,
    };
}