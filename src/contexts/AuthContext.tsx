import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import api from '@/lib/axios';
import type { AuthContextType, LoginResult, User } from '@/types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); // true while we check the session
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

    // ── Session restoration on page load ─────────────────────────────────────
    // Fires once when the app mounts. If the access_token cookie is valid,
    // FastAPI returns the user and we populate state. If it's expired, the
    // axios interceptor will try to refresh it first. If that also fails,
    // the catch block sets user to null.
    useEffect(() => {
        const requestId = beginAuthRequest();

        api.get<User>('/users/me')
            .then((res) => finishAuthRequest(requestId, res.data))
            .catch(() => finishAuthRequest(requestId, null));
    }, []);

    // ── Auth actions ──────────────────────────────────────────────────────────

    const login = async (email: string, password: string): Promise<LoginResult> => {
        const requestId = beginAuthRequest();

        try {
            const res = await api.post('/auth/login', { email, password });

            if (res.data.requires_2fa) {
            // Don't set user yet — 2FA still needs to be verified
                if (authRequestIdRef.current === requestId) {
                    setIsLoading(false);
                }
                return { requires_2fa: true, challenge_token: res.data.challenge_token };
            }

            const userRes = await api.get<User>('/users/me');
            finishAuthRequest(requestId, userRes.data);
            return { success: true };
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
            const userRes = await api.get<User>('/users/me');
            finishAuthRequest(requestId, userRes.data);
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
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook — throws a clear error if you accidentally use it outside
// the provider (common beginner mistake that produces confusing errors)
export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>');
    return ctx;
}
