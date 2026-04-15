import api from '@/lib/axios';
import type { DailyActivity, WeeklyActivity, StreakData, ProjectActivity } from '@/types/analytics';

// Helper — returns a date string N days ago: "2024-06-15"
function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
}

// Helper — today's date as a string
function today(): string {
    return new Date().toISOString().split('T')[0];
}

export const analyticsApi = {

    // Sends date_from + date_to that the backend actually expects
    daily: async (days = 30): Promise<DailyActivity[]> => {
        const res = await api.get<DailyActivity[]>('/analytics/daily', {
            params: {
                date_from: daysAgo(days),
                date_to: today(),
            },
        });
        return res.data;
    },

    weekly: async (weeks = 12): Promise<WeeklyActivity[]> => {
        const res = await api.get<WeeklyActivity[]>('/analytics/weekly', {
            params: {
                date_from: daysAgo(weeks * 7),
                date_to: today(),
            },
        });
        return res.data;
    },

    // streak endpoint is /streak not /streaks — matches analytics.py router
    streaks: async (): Promise<StreakData> => {
        const res = await api.get<StreakData>('/analytics/streak');
        return res.data;
    },

    // projects endpoint takes optional date range — omit for all-time
    projects: async (): Promise<ProjectActivity[]> => {
        const res = await api.get<ProjectActivity[]>('/analytics/projects');
        return res.data;
    },
};