import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Terminal,
    BookOpen,
    BarChart3,
    UserCircle,
    LogOut,
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

    // User's initials for the avatar — "Vishal R" → "V"
    const initials = user?.name
        ?.split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() ?? '?';

    return (
        <aside
            style={{ width: 'var(--sidebar-width)' }}
            className="fixed inset-y-0 left-0 flex flex-col border-r border-sidebar-border bg-sidebar"
        >
            {/* ── Brand ───────────────────────────────────────────────── */}
            <div className="flex h-14 items-center border-b border-sidebar-border px-5">
                <span className="font-mono text-sm font-semibold tracking-tight select-none">
                    <span className="text-primary">Code</span>
                    <span className="text-foreground">Folio</span>
                </span>
            </div>

            {/* ── Navigation ─────────────────────────────────────────── */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                                isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                            )
                        }
                    >
                        <Icon size={15} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* ── User footer ────────────────────────────────────────── */}
            <div className="border-t border-sidebar-border p-2">
                <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
                    {/* Avatar — initials circle */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                        {initials}
                    </div>

                    {/* Name + email — truncated to fit */}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground leading-tight">
                            {user?.name ?? '—'}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground leading-tight">
                            {user?.email ?? '—'}
                        </p>
                    </div>

                    {/* Logout button */}
                    <button
                        onClick={handleLogout}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Log out"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </aside>
    );
}