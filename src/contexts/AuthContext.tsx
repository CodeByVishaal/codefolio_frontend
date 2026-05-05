import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { mfaApi } from '@/lib/api/mfa';
import api from '@/lib/axios';
import type { AuthContextType, LoginResult, User } from '@/types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const authRequestIdRef = useRef(0);

    const beginAuthRequest = () => {
        const requestId = ++authRequestIdRef.current;
        setIsLoading(true);
        return requestId;
    };

    const finishAuthRequest = (requestId: number, nextUser: User | null) => {
        if (authRequestIdRef.current !== requestId) return;
        setUser(nextUser);
        setIsLoading(false);
    };

    const loadCurrentUser = async (requestId: number) => {
        const userRes = await api.get<User>('/users/me');
        finishAuthRequest(requestId, userRes.data);
    };

    useEffect(() => {
        const requestId = beginAuthRequest();

        api.get<User>('/users/me')
            .then((res) => finishAuthRequest(requestId, res.data))
            .catch(() => finishAuthRequest(requestId, null));
    }, []);

    const login = async (email: string, password: string): Promise<LoginResult> => {
        const requestId = beginAuthRequest();

        try {
            const res = await api.post('/auth/login', { email, password });

            if (res.data.requires_2fa || res.data.requires_mfa) {
                if (authRequestIdRef.current === requestId) {
                    setIsLoading(false);
                }

                return {
                    requires_2fa: true,
                    requires_mfa: true,
                    challenge_token: res.data.challenge_token,
                    expires_in: res.data.expires_in,
                };
            }

            await loadCurrentUser(requestId);
            return { success: true };
        } catch (error) {
            if (authRequestIdRef.current === requestId) {
                setIsLoading(false);
            }
            throw error;
        }
    };

    const verifyMfa = async (
        challengeToken: string,
        factor: { code?: string; recoveryCode?: string },
    ): Promise<void> => {
        const requestId = beginAuthRequest();

        try {
            await mfaApi.verify({
                challenge_token: challengeToken,
                code: factor.code,
                recovery_code: factor.recoveryCode,
            });
            await loadCurrentUser(requestId);
        } catch (error) {
            if (authRequestIdRef.current === requestId) {
                setIsLoading(false);
            }
            throw error;
        }
    };

    const register = async (name: string, email: string, password: string): Promise<void> => {
        const requestId = beginAuthRequest();

        try {
            await api.post('/auth/register', { name, email, password });
            await loadCurrentUser(requestId);
        } catch (error) {
            if (authRequestIdRef.current === requestId) {
                setIsLoading(false);
            }
            throw error;
        }
    };

    const logout = async (): Promise<void> => {
        const requestId = beginAuthRequest();

        try {
            await api.post('/auth/logout');
        } finally {
            finishAuthRequest(requestId, null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                verifyMfa,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>');
    return ctx;
}
