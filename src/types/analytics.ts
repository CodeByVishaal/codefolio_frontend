// ── Analytics ─────────────────────────────────────────────────────────────

// DailyActivity — backend returns total_mins, total_hours, total_sessions
export interface DailyActivity {
    date: string;
    total_mins: number;   // ← was duration_mins
    total_hours: number;   // ← new field, backend computes this
    total_sessions: number;   // ← was session_count
}

// WeeklyActivity — backend returns week_start (not week_start as before)
export interface WeeklyActivity {
    week_start: string;
    total_mins: number;
    total_hours: number;
    total_sessions: number;
}

// StreakData — backend nests this inside AnalyticsSummary AND has its own endpoint
export interface StreakData {
    current_streak: number;
    longest_streak: number;
    last_coded_date: string | null;
}

// ProjectActivity — backend returns project_title directly (not needing a lookup)
export interface ProjectActivity {
    project_id: number;
    project_title: string;   // ← backend joins and returns the title directly
    total_mins: number;
    total_hours: number;
    total_sessions: number;
}

// The full analytics payload — all four resources
export interface AnalyticsData {
    streaks: StreakData;
    daily: DailyActivity[];    // last 30 days, sorted oldest → newest
    weekly: WeeklyActivity[];   // last 12 weeks, sorted oldest → newest
    per_project: ProjectActivity[];  // all time, sorted by total_mins desc
}

// ── Private Profile ───────────────────────────────────────────────────────

// Shape of GET /api/users/me — full private profile with stats
export interface PrivateProfile {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'developer';
    is_verified: boolean;
    created_at: string;
    total_projects: number;
    total_sessions: number;
    total_hours: number;
    total_tasks_completed: number;
}

// ── Public Profile ────────────────────────────────────────────────────────

export interface PublicStats {
    total_projects: number;
    total_public_projects: number;
    total_sessions: number;
    total_hours: number;
    total_tasks_completed: number;
}

// Shape of GET /api/users/:id/public
export interface PublicProfile {
    id: number;
    name: string;
    member_since: string;
    stats: PublicStats;
    projects: {
        id: number;
        title: string;
        description: string | null;
        status: string;
        tags: string[];
        updated_at: string;
    }[];
    journal: {
        id: number;
        title: string;
        body: string;
        tags: string[];
        updated_at: string;
    }[];
}