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