import { LayoutDashboard, FolderKanban, CheckSquare, Terminal, BookOpen } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const STAT_CARDS = [
    {
        label: 'Projects',
        value: '—',
        description: 'Active',
        icon: FolderKanban,
    },
    {
        label: 'Open Tasks',
        value: '—',
        description: 'Across all projects',
        icon: CheckSquare,
    },
    {
        label: 'Coding Hours',
        value: '—',
        description: 'This week',
        icon: Terminal,
    },
    {
        label: 'Journal Entries',
        value: '—',
        description: 'Total',
        icon: BookOpen,
    },
] as const;

export function Dashboard() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] ?? 'there';

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-foreground">
                    Hey, {firstName} 👋
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Here's a snapshot of your developer activity.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {STAT_CARDS.map(({ label, value, description, icon: Icon }) => (
                    <Card key={label} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {label}
                            </CardTitle>
                            <Icon size={15} className="text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold text-foreground">{value}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}