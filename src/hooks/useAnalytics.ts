import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '@/lib/api/analytics';
import type { AnalyticsData, StreakData, DailyActivity, WeeklyActivity, ProjectActivity } from '@/types/analytics';

interface UseAnalyticsReturn {
    data: AnalyticsData | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
}

// Empty defaults so components never crash on null checks
const EMPTY_STREAKS: StreakData = { current_streak: 0, longest_streak: 0, last_coded_date: null };
const EMPTY_DAILY: DailyActivity[] = [];
const EMPTY_WEEKLY: WeeklyActivity[] = [];
const EMPTY_PROJECTS: ProjectActivity[] = [];

export function useAnalytics(): UseAnalyticsReturn {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // All four fire simultaneously — total wait = slowest single request
            const [streaks, daily, weekly, perProject] = await Promise.all([
                analyticsApi.streaks(),
                analyticsApi.daily(30),
                analyticsApi.weekly(12),
                analyticsApi.projects(),
            ]);

            setData({
                streaks: streaks ?? EMPTY_STREAKS,
                daily: daily ?? EMPTY_DAILY,
                weekly: weekly ?? EMPTY_WEEKLY,
                per_project: perProject ?? EMPTY_PROJECTS,
            });
        } catch {
            setError('Failed to load analytics. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return { data, isLoading, error, refresh: fetchAll };
}