import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimerDisplayProps {
    elapsedMs: number;
    isRunning: boolean;
}

function formatTimeMMSS(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTimeHHMMSS(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function TimerDisplay({ elapsedMs, isRunning }: TimerDisplayProps) {
    const [showHours, setShowHours] = useState(false);

    const displayTime = showHours ? formatTimeHHMMSS(elapsedMs) : formatTimeMMSS(elapsedMs);
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const totalHours = Math.floor(totalSeconds / 3600);

    return (
        <div className="space-y-3">
            <div
                className={`text-center p-6 rounded-lg border-2 transition-colors ${isRunning
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'border-muted-foreground/20 bg-muted/30'
                    }`}
            >
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock
                        size={18}
                        className={isRunning ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}
                    />
                    <span className="text-xs text-muted-foreground font-medium">
                        {isRunning ? 'Running' : 'Paused'}
                    </span>
                </div>
                <div
                    className="font-mono text-5xl font-bold text-foreground tracking-tighter"
                    style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
                        letterSpacing: '0.05em',
                    }}
                >
                    {displayTime}
                </div>
            </div>

            {/* Format toggle - only show if timer has run long enough to matter */}
            {totalHours > 0 && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHours(!showHours)}
                    className="w-full text-xs"
                >
                    {showHours ? 'Show MM:SS' : 'Show HH:MM:SS'}
                </Button>
            )}
        </div>
    );
}
