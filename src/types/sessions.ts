// ── Coding Session ────────────────────────────────────────────────────────

export interface CodingSession {
    id: number;
    user_id: number;
    project_id: number | null;   // session can exist without a project link
    duration_mins: number;          // always stored as integer minutes
    session_date: string;          // date-only: "2024-06-15"
    notes: string | null;
    created_at: string;
}

export interface SessionCreateInput {
    duration_mins: number;
    session_date: string;
    project_id?: number | null;
    notes?: string;
}

export interface SessionUpdateInput {
    duration_mins?: number;
    session_date?: string;
    project_id?: number | null;
    notes?: string;
}

// Shape of GET /sessions/summary response
export interface SessionSummary {
    total_mins: number;
    total_hours: number;
    total_sessions: number;
    per_project: {
        project_id: number | null;
        total_mins: number;
        total_sessions: number;
    }[];
}

// ── Session Timer (Quick-Start Mode) ───────────────────────────────────────

export interface SessionTimerState {
    isRunning: boolean;
    isPaused: boolean;
    elapsedMs: number;           // total elapsed milliseconds (includes paused time)
    startedAt: number;           // timestamp when timer started (ms)
    pausedAt?: number;           // timestamp when paused (ms)
    notes: string;               // required
    projectId?: number | null;   // optional
    sessionId?: number;          // ID if already saved to backend
}

export interface SessionTimerInput {
    notes: string;               // required: at least some context
    projectId?: number | null;   // optional
}

export interface SessionTimerDraft {
    state: SessionTimerState;
    savedAt: number;             // timestamp for recovery validation
}

// ── Journal Entry ─────────────────────────────────────────────────────────

export interface JournalEntry {
    id: number;
    user_id: number;
    title: string;
    body: string;
    tags: string[];
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface JournalCreateInput {
    title: string;
    body: string;
    tags?: string[];
    is_public?: boolean;
}

export interface JournalUpdateInput {
    title?: string;
    body?: string;
    tags?: string[];
    is_public?: boolean;
}