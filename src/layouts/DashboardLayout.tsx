import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

export function DashboardLayout() {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="min-h-screen md:ml-[var(--sidebar-width)]">
                <Outlet />
            </main>
        </div>
    );
}
