import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { projectStatusConfig } from '@/lib/statusConfig';
import type { Project } from '@/types/projects';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
    project: Project;
    onEdit: (project: Project) => void;
    onDelete: (id: number) => Promise<void>;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const statusCfg = projectStatusConfig[project.status] ?? {
        label: project.status,
        className: '',
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(project.id);
        } finally {
            setIsDeleting(false);
            setDeleteOpen(false);
        }
    };


    return (
        <>
            <Card
                className="group flex flex-col gap-0 cursor-pointer transition-colors hover:border-border/80 hover:bg-card/80"
                onClick={() => navigate(`/projects/${project.id}`)}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        {/* Project name + status badge */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <h3 className="truncate font-medium text-foreground leading-tight">
                                {project.title}
                            </h3>
                            <Badge
                                variant="outline"
                                className={cn('text-[11px] px-1.5 py-0', statusCfg.className)}
                            >
                                {statusCfg.label}
                            </Badge>
                        </div>

                        {/* Three-dot menu — stop propagation so clicking it doesn't navigate */}
                        <DropdownMenu>
                            <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreHorizontal size={14} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                                >
                                    <Pencil size={13} className="mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
                                >
                                    <Trash2 size={13} className="mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 pb-4">
                    {/* Description */}
                    {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {project.description}
                        </p>
                    )}

                    {/* Tags */}
                    {project.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {project.tags?.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 rounded-sm bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground"
                                >
                                    <Tag size={9} />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Footer — created date */}
                    <p className="mt-auto text-[11px] text-muted-foreground/60">
                        Created {new Date(project.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                        })}
                    </p>
                </CardContent>
            </Card>

            {/* Delete confirmation dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete project?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>"{project.title}"</strong> and all its tasks will be permanently deleted.
                            This cannot be undone.
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