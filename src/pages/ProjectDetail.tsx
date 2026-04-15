import { ProjectFormModal } from '@/components/projects/ProjectFormModal';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { projectStatusConfig } from '@/lib/statusConfig';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/projects';
import { CheckSquare, ChevronLeft, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export function ProjectDetail() {
    // useParams reads the :id segment from the URL — e.g. /projects/3 → { id: "3" }
    // URL params are always strings, so we parseInt() it for API calls.
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const projectId = parseInt(id ?? '0', 10);

    const {
        projects, isLoading: projectsLoading,
        updateProject,
    } = useProjects();

    const {
        tasks, isLoading: tasksLoading,
        createTask, updateTask, deleteTask,
    } = useTasks({ projectId });

    const project = projects.find((p) => p.id === projectId);

    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
    const [projectModalOpen, setProjectModalOpen] = useState(false);

    const openCreateTask = () => { setEditingTask(undefined); setTaskModalOpen(true); };
    const openEditTask = (task: Task) => { setEditingTask(task); setTaskModalOpen(true); };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (projectsLoading) {
        return (
            <div className="p-8 space-y-6">
                <div className="h-8 w-48 rounded-lg bg-card animate-pulse" />
                <div className="h-24 rounded-xl bg-card animate-pulse" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    // ── Not found ─────────────────────────────────────────────────────────────
    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-8">
                <p className="text-muted-foreground">Project not found.</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
                    Back to projects
                </Button>
            </div>
        );
    }

    const statusCfg = projectStatusConfig[project.status];

    return (
        <div className="p-8 space-y-6">
            {/* ── Back breadcrumb ─────────────────────────────────────────── */}
            <Link
                to="/projects"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ChevronLeft size={14} /> Projects
            </Link>

            {/* ── Project header ──────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold text-foreground">{project.title}</h1>
                        <Badge
                            variant="outline"
                            className={cn('text-[11px]', statusCfg.className)}
                        >
                            {statusCfg.label}
                        </Badge>
                    </div>

                    {project.description && (
                        <p className="text-sm text-muted-foreground max-w-xl">{project.description}</p>
                    )}

                    {project.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {project.tags?.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-sm bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => setProjectModalOpen(true)}
                >
                    <Pencil size={13} /> Edit project
                </Button>
            </div>

            <Separator />

            {/* ── Tasks section ───────────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-medium text-foreground">
                        Tasks
                        {tasks.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                {tasks.filter((t) => t.status === 'done').length}/{tasks.length} done
                            </span>
                        )}
                    </h2>
                    <Button onClick={openCreateTask} size="sm" className="gap-1.5">
                        <Plus size={14} /> New task
                    </Button>
                </div>

                {/* Loading skeleton */}
                {tasksLoading && (
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!tasksLoading && tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-14">
                        <CheckSquare size={22} className="text-muted-foreground/40" />
                        <div className="text-center space-y-0.5">
                            <p className="text-sm font-medium text-foreground">No tasks yet</p>
                            <p className="text-xs text-muted-foreground">Add the first task for this project.</p>
                        </div>
                        <Button onClick={openCreateTask} size="sm" variant="outline" className="gap-1.5">
                            <Plus size={13} /> Add task
                        </Button>
                    </div>
                )}

                {/* Task cards */}
                {!tasksLoading && tasks.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={openEditTask}
                                onDelete={deleteTask}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modals ──────────────────────────────────────────────────── */}
            <TaskFormModal
                open={taskModalOpen}
                onClose={() => { setTaskModalOpen(false); setEditingTask(undefined); }}
                task={editingTask}
                projects={projects}
                projectId={projectId}
                onCreate={createTask}
                onUpdate={updateTask}
            />

            <ProjectFormModal
                open={projectModalOpen}
                onClose={() => setProjectModalOpen(false)}
                project={project}
                onCreate={async () => project} // not used in edit-only mode here
                onUpdate={updateProject}
            />
        </div>
    );
}