import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Globe, Lock, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { JournalEntry } from '@/types/sessions';

interface JournalCardProps {
    entry: JournalEntry;
    onEdit: (entry: JournalEntry) => void;
    onDelete: (id: number) => Promise<void>;
}

export function JournalCard({ entry, onEdit, onDelete }: JournalCardProps) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(entry.id);
        } finally {
            setIsDeleting(false);
            setDeleteOpen(false);
        }
    };

    const displayDate = new Date(entry.updated_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });

    return (
        <>
            <Card className="group flex flex-col transition-colors hover:border-border/80">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="font-medium text-foreground leading-snug line-clamp-1">
                                {entry.title}
                            </h3>
                            <div className="flex items-center gap-2">
                                {/* Public / private badge */}
                                <span className={`inline-flex items-center gap-1 text-[11px] ${entry.is_public ? 'text-teal-400' : 'text-muted-foreground/60'
                                    }`}>
                                    {entry.is_public
                                        ? <><Globe size={10} /> Public</>
                                        : <><Lock size={10} /> Private</>
                                    }
                                </span>
                                <span className="text-[11px] text-muted-foreground/40">·</span>
                                <span className="text-[11px] text-muted-foreground/60">{displayDate}</span>
                            </div>
                        </div>

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
                                <DropdownMenuItem onClick={() => onEdit(entry)}>
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
                </CardHeader>

                <CardContent className="flex flex-col gap-3 pb-4">
                    {/* Body preview — 3 lines max */}
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-mono">
                        {entry.body}
                    </p>

                    {/* Tags */}
                    {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {entry.tags.map((tag) => (
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
                </CardContent>
            </Card>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete entry?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>"{entry.title}"</strong> will be permanently deleted.
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