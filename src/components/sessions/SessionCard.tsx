import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Clock, Calendar, FolderKanban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CodingSession } from '@/types/sessions';

interface SessionCardProps {
    session: CodingSession;
    projectName?: string;
    onEdit: (session: CodingSession) => void;
    onDelete: (id: number) => Promise<void>;
}

// Converts total minutes into a readable string: 90 → "1h 30m", 45 → "45m"
function formatDuration(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function SessionCard({ session, projectName, onEdit, onDelete }: SessionCardProps) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(session.id);
        } finally {
            setIsDeleting(false);
            setDeleteOpen(false);
        }
    };

    // Format date: "2024-06-15" → "Jun 15, 2024"
    const displayDate = new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });

    return (
        <>
            <Card className="group transition-colors hover:border-border/80">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">

                        {/* Left — duration (the primary data point) */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Clock size={16} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-foreground leading-tight">
                                    {formatDuration(session.duration_mins)}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar size={10} />
                                        {displayDate}
                                    </span>
                                    {projectName && (
                                        <>
                                            <span className="text-muted-foreground/30 text-xs">·</span>
                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                <FolderKanban size={10} />
                                                {projectName}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right — menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreHorizontal size={14} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem onClick={() => onEdit(session)}>
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

                    {/* Notes — shown below if present */}
                    {session.notes && (
                        <p className="mt-3 text-xs text-muted-foreground line-clamp-2 pl-[52px]">
                            {session.notes}
                        </p>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The <strong>{formatDuration(session.duration_mins)}</strong> session on{' '}
                            <strong>{displayDate}</strong> will be permanently deleted.
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