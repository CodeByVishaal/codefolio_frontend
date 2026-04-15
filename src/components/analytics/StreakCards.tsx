import { Flame, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { StreakData } from '@/types/analytics';

interface StreakCardsProps {
    streaks: StreakData;
}

export function StreakCards({ streaks }: StreakCardsProps) {
    const { current_streak, longest_streak } = streaks;

    return (
        <div className="grid grid-cols-2 gap-3">
            {/* Current streak */}
            <Card className={current_streak > 0 ? 'border-primary/30' : ''}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame
                            size={15}
                            className={current_streak > 0 ? 'text-orange-400' : 'text-muted-foreground/40'}
                        />
                        <span className="text-xs text-muted-foreground">Current streak</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground leading-none">
                        {current_streak}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {current_streak === 1 ? 'day' : 'days'}
                        {current_streak === 0 && ' — code today to start one'}
                    </p>
                </CardContent>
            </Card>

            {/* Longest streak */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy size={15} className="text-amber-400" />
                        <span className="text-xs text-muted-foreground">Longest streak</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground leading-none">
                        {longest_streak}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {longest_streak === 1 ? 'day' : 'days'} all-time best
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}