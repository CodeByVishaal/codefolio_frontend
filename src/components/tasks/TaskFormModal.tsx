import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Project, Task, TaskCreateInput, TaskPriority, TaskStatus, TaskUpdateInput } from '@/types/projects';
import { useEffect, useState } from 'react';

interface TaskFormModalProps {
    open: boolean;
    onClose: () => void;
    task?: Task;              // present in edit mode
    projects: Project[];         // for the project selector (create mode only)
    projectId?: number;            // pre-selected project (when opened from ProjectDetail)
    onCreate: (projectId: number, data: TaskCreateInput) => Promise<Task>;
    onUpdate: (projectId: number, taskId: number, data: TaskUpdateInput) => Promise<Task>;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'done', label: 'Done' },
    { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

export function TaskFormModal({
    open, onClose, task, projects, projectId, onCreate, onUpdate,
}: TaskFormModalProps) {
    const isEditing = !!task;

    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<TaskStatus>('todo');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [dueDate, setDueDate] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setTitle(task?.title ?? '');
            setDescription(task?.description ?? '');
            setStatus(task?.status ?? 'todo');
            setPriority(task?.priority ?? 'medium');
            setDueDate(task?.due_date ?? '');
            // Pre-select project: from existing task, or from the passed projectId prop
            setSelectedProjectId(
                String(task?.project_id ?? projectId ?? projects[0]?.id ?? '')
            );
            setError('');
        }
    }, [task, open, projectId, projects]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError('Task title is required.'); return; }
        if (!selectedProjectId) { setError('Please select a project.'); return; }

        const pid = parseInt(selectedProjectId, 10);
        const payload = {
            title: title.trim(),
            description: description.trim() || undefined,
            status,
            priority,
            due_date: dueDate || null,
        };

        setError('');
        setIsLoading(true);
        try {
            if (isEditing) {
                await onUpdate(pid, task.id, payload);
            } else {
                await onCreate(pid, payload);
            }
            onClose();
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit task' : 'New task'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-1">
                    {error && (
                        <Alert variant="destructive" className="py-2">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Project selector — shown in create mode, or when editing a task from the all-tasks page */}
                    {(!isEditing || !projectId) && (
                        <div className="space-y-1.5">
                            <Label>Project *</Label>
                            <Select
                                value={selectedProjectId}
                                onValueChange={(value) => { if (value !== null) setSelectedProjectId(value); }}
                                disabled={isLoading || (isEditing)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="task-title">Title *</Label>
                        <Input
                            id="task-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Implement login page"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="task-desc">Description</Label>
                        <Textarea
                            id="task-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Any notes or details…"
                            rows={2}
                            disabled={isLoading}
                            className="resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)} disabled={isLoading}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)} disabled={isLoading}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {PRIORITY_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="task-due">Due date</Label>
                        <Input
                            id="task-due"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            disabled={isLoading}
                            // Style the date input to match the dark theme
                            className="[color-scheme:dark]"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? isEditing ? 'Saving…' : 'Creating…'
                                : isEditing ? 'Save changes' : 'Create task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}