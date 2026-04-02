export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'developer';
    is_verified: boolean;
    created_at: string;
}

// The login endpoint has two possible outcomes — either a full session
// is issued (success: true), or 2FA is required first.
export type LoginResult =
    | { success: true }
    | { requires_2fa: true; challenge_token: string };

export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<LoginResult>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}