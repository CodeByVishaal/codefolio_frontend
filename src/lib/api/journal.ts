import api from '@/lib/axios';
import type { JournalEntry, JournalCreateInput, JournalUpdateInput } from '@/types/sessions';

export const journalApi = {

    // GET /journal — optionally filter by tag or is_public
    list: async (params?: {
        tag?: string;
        is_public?: boolean;
    }): Promise<JournalEntry[]> => {
        const res = await api.get<JournalEntry[]>('/journal', { params });
        return res.data;
    },

    // GET /journal/:id
    get: async (id: number): Promise<JournalEntry> => {
        const res = await api.get<JournalEntry>(`/journal/${id}`);
        return res.data;
    },

    // POST /journal
    create: async (data: JournalCreateInput): Promise<JournalEntry> => {
        const res = await api.post<JournalEntry>('/journal', data);
        return res.data;
    },

    // PATCH /journal/:id
    update: async (id: number, data: JournalUpdateInput): Promise<JournalEntry> => {
        const res = await api.patch<JournalEntry>(`/journal/${id}`, data);
        return res.data;
    },

    // DELETE /journal/:id
    delete: async (id: number): Promise<void> => {
        await api.delete(`/journal/${id}`);
    },
};