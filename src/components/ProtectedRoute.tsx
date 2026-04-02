import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();

    // While checking the session, show a neutral loading state.
    // This prevents a false redirect on every page refresh.
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Authenticated — render child routes
    return <Outlet />;
}