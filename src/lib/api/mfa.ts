import api from '@/lib/axios';
import type { MfaRecoveryCodesResponse, MfaSetupResponse, MfaStatus } from '@/types/mfa';

export const mfaApi = {
    status: async (): Promise<MfaStatus> => {
        const res = await api.get<MfaStatus>('/auth/mfa/status');
        return res.data;
    },

    setup: async (password: string): Promise<MfaSetupResponse> => {
        const res = await api.post<MfaSetupResponse>('/auth/mfa/setup', { password });
        return res.data;
    },

    enable: async (password: string, code: string): Promise<MfaRecoveryCodesResponse> => {
        const res = await api.post<MfaRecoveryCodesResponse>('/auth/mfa/enable', { password, code });
        return res.data;
    },

    verify: async (payload: { challenge_token: string; code?: string; recovery_code?: string }): Promise<{ message: string }> => {
        const res = await api.post<{ message: string }>('/auth/mfa/verify', payload);
        return res.data;
    },

    regenerateRecoveryCodes: async (payload: { password: string; code?: string; recovery_code?: string }): Promise<MfaRecoveryCodesResponse> => {
        const res = await api.post<MfaRecoveryCodesResponse>('/auth/mfa/recovery-codes', payload);
        return res.data;
    },

    disable: async (payload: { password: string; code?: string; recovery_code?: string }): Promise<{ message: string }> => {
        const res = await api.post<{ message: string }>('/auth/mfa/disable', payload);
        return res.data;
    },
};
