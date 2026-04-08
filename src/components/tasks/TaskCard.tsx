import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { taskPriorityConfig, taskStatusConfig } from '@/lib/statusConfig';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/projects';
import { Calendar, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface TaskCardProps {
    task: Task;
    projectName?: string; // shown on the cross-project /tasks page
    onEdit: (task: Task) => void;
    onDelete: (projectId: number, taskId: number) => Promise<void>;
}

export function TaskCard({ task, projectName, onEdit, onDelete }: TaskCardProps) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const statusCfg = taskStatusConfig[task.status];
    const priorityCfg = taskPriorityConfig[task.priority];

    // Format the due date — only the date portion, no time
    const dueDate = task.due_date
        ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short', day: 'numeric',
        })
        : null;

    // A task is "overdue" if it has a due date, isn't done/cancelled, and the date has passed
    const isOverdue =
        task.due_date &&
        !['done', 'cancelled'].includes(task.status) &&
        new Date(task.due_date) < new Date();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(task.project_id, task.id);
        } finally {
            setIsDeleting(false);
            setDeleteOpen(false);
        }
    };

    return (
        <>
            <Card className="group transition-colors hover:border-border/80">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        {/* Priority dot */}
                        <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', priorityCfg.dot)} />

                        <div className="min-w-0 flex-1 space-y-2">
                            {/* Title row */}
                            <div className="flex items-start justify-between gap-2">
                                <p className={cn(
                                    'text-sm font-medium leading-snug',
                                    task.status === 'done' && 'line-through text-muted-foreground',
                                )}>
                                    {task.title}
                                </p>

                                <DropdownMenu>
                                    <DropdownMenuTrigger>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreHorizontal size={13} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36">
                                        <DropdownMenuItem onClick={() => onEdit(task)}>
                                            <Pencil size={13} className="mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => setDeleteOpen(true)}
                                        >
                                            <Trash2 size={13} className="mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Description */}
                            {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {task.description}
                                </p>
                            )}

                            {/* Meta row — badges + due date */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={cn('text-[11px] px-1.5 py-0', statusCfg.className)}
                                >
                                    {statusCfg.label}
                                </Badge>

                                <Badge
                                    variant="outline"
                                    className={cn('text-[11px] px-1.5 py-0', priorityCfg.className)}
                                >
                                    {priorityCfg.label}
                                </Badge>

                                {dueDate && (
                                    <span className={cn(
                                        'inline-flex items-center gap-1 text-[11px]',
                                        isOverdue ? 'text-red-400' : 'text-muted-foreground',
                                    )}>
                                        <Calendar size={10} />
                                        {dueDate}
                                        {isOverdue && ' · overdue'}
                                    </span>
                                )}

                                {/* Project name — shown on the all-tasks page */}
                                {projectName && (
                                    <span className="ml-auto text-[11px] text-muted-foreground/60">
                                        {projectName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete task?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>"{task.title}"</strong> will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}