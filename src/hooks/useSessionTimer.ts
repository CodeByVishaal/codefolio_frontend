import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionTimer as useTimerContext } from '@/contexts/SessionTimerContext';
import type { SessionTimerState } from '@/types/sessions';

interface UseSessionTimerReturn {
    currentElapsedMs: number;
}

export function useSessionTimer(): UseSessionTimerReturn {
    const { timerState } = useTimerContext();
    const [currentElapsedMs, setCurrentElapsedMs] = useState(0);
    const tickIntervalRef = useRef<number | null>(null);

    // Timer tick: update elapsed time every ~100ms
    useEffect(() => {
        if (!timerState || !timerState.isRunning || timerState.isPaused) {
            if (tickIntervalRef.current) {
                clearInterval(tickIntervalRef.current);
                tickIntervalRef.current = null;
            }
            return;
        }

        const updateElapsed = () => {
            const now = Date.now();
            const elapsed = now - timerState.startedAt + timerState.elapsedMs;
            setCurrentElapsedMs(Math.max(0, elapsed));
        };

        tickIntervalRef.current = window.setInterval(updateElapsed, 100);
        updateElapsed(); // Immediate update

        return () => {
            if (tickIntervalRef.current) {
                clearInterval(tickIntervalRef.current);
                tickIntervalRef.current = null;
            }
        };
    }, [timerState]);

    return {
        currentElapsedMs,
    };
}
