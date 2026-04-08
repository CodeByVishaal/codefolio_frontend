import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/types/projects';
import { CheckSquare, Plus } from 'lucide-react';
import { useState } from 'react';

export function Tasks() {
    const { projects } = useProjects();
    const { tasks, isLoading, error, createTask, updateTask, deleteTask } = useTasks();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

    // Filter state — 'all' means no filter applied
    const [filterProject, setFilterProject] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');

    const openEditModal = (task: Task) => { setEditingTask(task); setModalOpen(true); };

    // Build a project name lookup map — { 1: "Portfolio", 2: "DevPulse" }
    // Record<number, string> is a TypeScript type for an object with number keys and string values
    const projectMap = projects.reduce<Record<number, string>>((acc, p) => {
        acc[p.id] = p.title;
        return acc;
    }, {});

    // Apply filters — chaining .filter() calls is clean and readable
    const filteredTasks = tasks
        .filter((t) => filterProject === 'all' || String(t.project_id) === filterProject)
        .filter((t) => filterStatus === 'all' || t.status === filterStatus)
        .filter((t) => filterPriority === 'all' || t.priority === filterPriority);

    return (
        <div className="p-8 space-y-6">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
                        {filterProject !== 'all' || filterStatus !== 'all' || filterPriority !== 'all'
                            ? ' (filtered)' : ''}
                    </p>
                </div>
                <Button onClick={() => { setEditingTask(undefined); setModalOpen(true); }} size="sm" className="gap-1.5">
                    <Plus size={15} /> New task
                </Button>
            </div>

            {/* ── Filters ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
                <Select value={filterProject} onValueChange={(value) => { if (value !== null) setFilterProject(value); }}>
                    <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All projects</SelectItem>
                        {projects.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={(value) => { if (value !== null) setFilterStatus(value); }}>
                    <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={(value) => { if (value !== null) setFilterPriority(value); }}>
                    <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All priorities</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ── Error ───────────────────────────────────────────────────── */}
            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* ── Loading skeleton ─────────────────────────────────────────── */}
            {isLoading && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
                    ))}
                </div>
            )}

            {/* ── Empty state ─────────────────────────────────────────────── */}
            {!isLoading && !error && filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20">
                    <CheckSquare size={22} className="text-muted-foreground/40" />
                    <div className="text-center space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                            {tasks.length === 0 ? 'No tasks yet' : 'No tasks match the current filters'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {tasks.length === 0
                                ? 'Create a task inside any project, or add one here.'
                                : 'Try clearing the filters.'}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Task grid ───────────────────────────────────────────────── */}
            {!isLoading && filteredTasks.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            projectName={projectMap[task.project_id]}
                            onEdit={openEditModal}
                            onDelete={deleteTask}
                        />
                    ))}
                </div>
            )}

            {/* ── Modal ─────────────────────────────────────────────────────── */}
            <TaskFormModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingTask(undefined); }}
                task={editingTask}
                projects={projects}
                onCreate={createTask}
                onUpdate={updateTask}
            />
        </div>
    );
}