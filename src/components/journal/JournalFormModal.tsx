import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { JournalEntry, JournalCreateInput, JournalUpdateInput } from '@/types/sessions';

interface JournalFormModalProps {
    open: boolean;
    onClose: () => void;
    entry?: JournalEntry;
    onCreate: (data: JournalCreateInput) => Promise<JournalEntry>;
    onUpdate: (id: number, data: JournalUpdateInput) => Promise<JournalEntry>;
}

export function JournalFormModal({
    open, onClose, entry, onCreate, onUpdate,
}: JournalFormModalProps) {
    const isEditing = !!entry;

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setTitle(entry?.title ?? '');
            setBody(entry?.body ?? '');
            setTagsInput(entry?.tags?.join(', ') ?? '');
            setIsPublic(entry?.is_public ?? false);
            setError('');
        }
    }, [entry, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError('Title is required.'); return; }
        if (!body.trim()) { setError('Entry body cannot be empty.'); return; }

        const tags = tagsInput
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);

        const payload = {
            title: title.trim(),
            body: body.trim(),
            tags,
            is_public: isPublic,
        };

        setError('');
        setIsLoading(true);
        try {
            if (isEditing) {
                await onUpdate(entry.id, payload);
            } else {
                await onCreate(payload);
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
            {/* max-w-2xl — journal entries need space for the body textarea */}
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit entry' : 'New journal entry'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-1">
                    {error && (
                        <Alert variant="destructive" className="py-2">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="journal-title">Title *</Label>
                        <Input
                            id="journal-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What did you learn or build today?"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="journal-body">Entry *</Label>
                        <Textarea
                            id="journal-body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Write your thoughts, progress, or reflections…"
                            rows={8}
                            disabled={isLoading}
                            className="resize-none font-mono text-sm leading-relaxed"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="journal-tags">Tags
                            <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">
                                comma-separated, stored lowercase
                            </span>
                        </Label>
                        <Input
                            id="journal-tags"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="react, typescript, debugging"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Public toggle — inline checkbox row */}
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div
                            role="checkbox"
                            aria-checked={isPublic}
                            onClick={() => setIsPublic(!isPublic)}
                            className={`h-4 w-4 shrink-0 rounded border transition-colors cursor-pointer ${isPublic
                                ? 'bg-primary border-primary'
                                : 'border-border bg-transparent'
                                }`}
                        >
                            {isPublic && (
                                <svg viewBox="0 0 10 10" className="w-full h-full p-0.5 text-primary-foreground">
                                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Make this entry public</p>
                            <p className="text-xs text-muted-foreground">Visible on your public profile page</p>
                        </div>
                    </label>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? isEditing ? 'Saving…' : 'Publishing…'
                                : isEditing ? 'Save changes' : 'Save entry'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}