// ── Project ───────────────────────────────────────────────────────────────

export type ProjectStatus =
    | 'planning'
    | 'in_progress'
    | 'on_hold'
    | 'completed';

export type UIProjectStatus =
    | 'planning'
    | 'active'
    | 'on_hold'
    | 'completed';

export interface Project {
    id: number;
    title: string;
    description: string | null;
    status: ProjectStatus;
    tags: string[];
    owner_id: number;
    created_at: string;
    updated_at: string;
}

// What we send when creating a project — no id/timestamps (backend sets those)
export interface ProjectCreateInput {
    title: string;
    description?: string;
    status?: ProjectStatus;
    tags?: string[];
}

// PATCH — every field optional. Backend ignores fields not sent.
export interface ProjectUpdateInput {
    title?: string;
    description?: string;
    status?: ProjectStatus;
    tags?: string[];
}

// ── Task ─────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;   // ISO date string "2024-06-15"
    completed_at: string | null;
    project_id: number;
    created_at: string;
}

export interface TaskCreateInput {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
}

export interface TaskUpdateInput {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
}