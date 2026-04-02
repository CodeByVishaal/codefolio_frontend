import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

export function DashboardLayout() {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main
                style={{ marginLeft: 'var(--sidebar-width)' }}
                className="min-h-screen"
            >
                <Outlet />
            </main>
        </div>
    );
}