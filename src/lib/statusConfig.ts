import type { ProjectStatus, TaskStatus, TaskPriority } from '@/types/projects';

// Each entry has a Tailwind className for the badge and a human-readable label.
// We use bg-*/text-* with opacity variants to stay consistent with the design system.

export const projectStatusConfig: Record<ProjectStatus, { label: string; className: string }> = {
    planning: { label: 'Planning', className: 'bg-blue-500/10   text-blue-400   border-blue-500/20' },
    in_progress: { label: 'Active', className: 'bg-teal-500/10   text-teal-400   border-teal-500/20' },
    on_hold: { label: 'On Hold', className: 'bg-amber-500/10  text-amber-400  border-amber-500/20' },
    completed: { label: 'Completed', className: 'bg-green-500/10  text-green-400  border-green-500/20' },
};

export const taskStatusConfig: Record<TaskStatus, { label: string; className: string }> = {
    todo: { label: 'To Do', className: 'bg-zinc-500/10   text-zinc-400   border-zinc-500/20' },
    in_progress: { label: 'In Progress', className: 'bg-blue-500/10   text-blue-400   border-blue-500/20' },
    in_review: { label: 'In Review', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    done: { label: 'Done', className: 'bg-green-500/10  text-green-400  border-green-500/20' },
    cancelled: { label: 'Cancelled', className: 'bg-red-500/10    text-red-400    border-red-500/20' },
};

export const taskPriorityConfig: Record<TaskPriority, { label: string; className: string; dot: string }> = {
    low: { label: 'Low', className: 'bg-zinc-500/10   text-zinc-400', dot: 'bg-zinc-400' },
    medium: { label: 'Medium', className: 'bg-blue-500/10   text-blue-400', dot: 'bg-blue-400' },
    high: { label: 'High', className: 'bg-amber-500/10  text-amber-400', dot: 'bg-amber-400' },
    urgent: { label: 'Urgent', className: 'bg-red-500/10    text-red-400', dot: 'bg-red-400' },
};