import api from '@/lib/axios';
import type {
    CodingSession,
    SessionCreateInput,
    SessionUpdateInput,
    SessionSummary,
} from '@/types/sessions';

export const sessionsApi = {

    // GET /sessions — optionally filter by project, date range
    list: async (params?: {
        project_id?: number;
        date_from?: string;
        date_to?: string;
    }): Promise<CodingSession[]> => {
        const res = await api.get<CodingSession[]>('/sessions', { params });
        return res.data;
    },

    // GET /sessions/summary — aggregate stats (declared before /:id in backend)
    summary: async (params?: {
        date_from?: string;
        date_to?: string;
    }): Promise<SessionSummary> => {
        const res = await api.get<SessionSummary>('/sessions/summary', { params });
        return res.data;
    },

    // POST /sessions
    create: async (data: SessionCreateInput): Promise<CodingSession> => {
        const res = await api.post<CodingSession>('/sessions', data);
        return res.data;
    },

    // PATCH /sessions/:id
    update: async (id: number, data: SessionUpdateInput): Promise<CodingSession> => {
        const res = await api.patch<CodingSession>(`/sessions/${id}`, data);
        return res.data;
    },

    // DELETE /sessions/:id
    delete: async (id: number): Promise<void> => {
        await api.delete(`/sessions/${id}`);
    },
};