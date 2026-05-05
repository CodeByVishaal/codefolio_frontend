import { NavLink, useNavigate } from 'react-router-dom';
import {
    BarChart3,
    BookOpen,
    CheckSquare,
    FolderKanban,
    LayoutDashboard,
    LogOut,
    Terminal,
    UserCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/sessions', label: 'Sessions', icon: Terminal },
    { to: '/journal', label: 'Journal', icon: BookOpen },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: UserCircle },
] as const;

export function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const initials = user?.name
        ?.split(' ')
        .map((segment) => segment[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() ?? '?';

    return (
        <>
            <div className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl md:hidden">
                <div className="flex items-center justify-between px-4 py-3">
                    <div>
                        <span className="font-mono text-sm font-semibold tracking-tight">
                            <span className="text-primary">Code</span>
                            <span className="text-foreground">Folio</span>
                        </span>
                        <p className="mt-1 text-xs text-muted-foreground">Developer workspace</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
                            {initials}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="rounded-xl border border-border/70 bg-card/70 p-2 text-muted-foreground transition-colors hover:text-destructive"
                            title="Log out"
                        >
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>

                <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                cn(
                                    'flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors',
                                    isActive
                                        ? 'border-primary/25 bg-primary text-primary-foreground'
                                        : 'border-border/70 bg-card/70 text-muted-foreground hover:text-foreground',
                                )
                            }
                        >
                            <Icon size={13} />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <aside
                style={{ width: 'var(--sidebar-width)' }}
                className="fixed inset-y-0 left-0 hidden flex-col border-r border-sidebar-border bg-sidebar md:flex"
            >
                <div className="flex h-16 items-center border-b border-sidebar-border px-5">
                    <span className="font-mono text-sm font-semibold tracking-tight select-none">
                        <span className="text-primary">Code</span>
                        <span className="text-foreground">Folio</span>
                    </span>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                                    isActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                                )
                            }
                        >
                            <Icon size={16} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-sidebar-border p-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 px-3 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-xs font-semibold text-primary">
                            {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground leading-tight">
                                {user?.name ?? '-'}
                            </p>
                            <p className="truncate text-xs text-muted-foreground leading-tight">
                                {user?.email ?? '-'}
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-background/60 hover:text-destructive"
                            title="Log out"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
