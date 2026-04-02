import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '@/lib/axios';
import type { User, AuthContextType, LoginResult } from '@/types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); // true while we check the session

    // ── Session restoration on page load ─────────────────────────────────────
    // Fires once when the app mounts. If the access_token cookie is valid,
    // FastAPI returns the user and we populate state. If it's expired, the
    // axios interceptor will try to refresh it first. If that also fails,
    // the catch block sets user to null.
    useEffect(() => {
        api.get<User>('/users/me')
            .then((res) => setUser(res.data))
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));
    }, []);

    // ── Auth actions ──────────────────────────────────────────────────────────

    const login = async (email: string, password: string): Promise<LoginResult> => {
        const res = await api.post('/auth/login', { email, password });

        if (res.data.requires_2fa) {
            // Don't set user yet — 2FA still needs to be verified
            return { requires_2fa: true, challenge_token: res.data.challenge_token };
        }

        // Cookies are now set by the server. Fetch the full user object.
        const userRes = await api.get<User>('/users/me');
        setUser(userRes.data);
        return { success: true };
    };

    const register = async (name: string, email: string, password: string): Promise<void> => {
        await api.post('/auth/register', { name, email, password });
        const userRes = await api.get<User>('/users/me');
        setUser(userRes.data);
    };

    const logout = async (): Promise<void> => {
        try {
            await api.post('/auth/logout');
        } finally {
            // Always clear local state, even if the request fails
            setUser(null);
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