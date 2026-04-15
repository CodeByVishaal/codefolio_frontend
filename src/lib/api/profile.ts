import api from '@/lib/axios';
import type { PrivateProfile, PublicProfile } from '@/types/analytics';

export const profileApi = {

    // GET /api/users/me — private profile, requires auth cookie
    me: async (): Promise<PrivateProfile> => {
        const res = await api.get<PrivateProfile>('/users/me');
        return res.data;
    },

    // PATCH /api/users/me — update only the name (email needs verification flow)
    updateMe: async (data: { name: string }): Promise<PrivateProfile> => {
        const res = await api.patch<PrivateProfile>('/users/me', data);
        return res.data;
    },

    // GET /api/users/:id/public — public profile, no auth required
    public: async (userId: number): Promise<PublicProfile> => {
        const res = await api.get<PublicProfile>(`/users/${userId}/profile`);
        return res.data;
    },
};