import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    sub?: string;  // optional sub-label e.g. "hours"
}

export function StatCard({ icon: Icon, label, value, sub }: StatCardProps) {
    return (
        <Card>
            <CardContent className="p-4 flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon size={15} className="text-primary" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-xl font-semibold text-foreground leading-tight">
                        {value}
                        {sub && (
                            <span className="ml-1 text-sm font-normal text-muted-foreground">{sub}</span>
                        )}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}