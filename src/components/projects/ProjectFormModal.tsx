import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent,
    DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Project, ProjectCreateInput, ProjectUpdateInput, ProjectStatus, UIProjectStatus } from '@/types/projects';
import { useEffect, useState } from 'react';

interface ProjectFormModalProps {
    open: boolean;
    onClose: () => void;
    // If project is provided → edit mode. If not → create mode.
    project?: Project;
    onCreate: (data: ProjectCreateInput) => Promise<Project>;
    onUpdate: (id: number, data: ProjectUpdateInput) => Promise<Project>;
}

const STATUS_OPTIONS = [
    { value: 'planning', label: 'Planning' },
    { value: 'in_progress', label: 'Active' }, // 🔥 key idea
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
];

function mapStatusToAPI(status: UIProjectStatus): ProjectStatus {
    switch (status) {
        case 'active':
            return 'in_progress';
        case 'planning':
            return 'planning';
        case 'completed':
            return 'completed';
        case 'on_hold':
            return 'on_hold';
        default:
            return 'planning';
    }
}
export function ProjectFormModal({
    open, onClose, project, onCreate, onUpdate,
}: ProjectFormModalProps) {
    const isEditing = !!project; // true if a project was passed in

    // Form state — pre-filled from project if editing, blank if creating
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<string>('active');
    const [tagsInput, setTagsInput] = useState(''); // comma-separated string
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // When the modal opens or the project changes, reset the form fields.
    // useEffect with [project, open] means: re-run whenever these values change.
    useEffect(() => {
        if (open) {
            setTitle(project?.title ?? '');
            setDescription(project?.description ?? '');
            setStatus(project?.status ?? 'active');
            setTagsInput(project?.tags?.join(', ') ?? '');
            setError('');
        }
    }, [project, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError('Project title is required.'); return; }

        // Parse the comma-separated tags into a clean array
        const tags = tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean); // removes empty strings

        setError('');
        setIsLoading(true);

        try {
            if (isEditing) {
                await onUpdate(project.id, { title: title.trim(), description: description.trim() || undefined, status: status as Project['status'], tags });
            } else {
                await onCreate({ title: title.trim(), description: description.trim() || undefined, status: status as Project['status'], tags });
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
                    <DialogTitle>{isEditing ? 'Edit project' : 'New project'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-1">
                    {error && (
                        <Alert variant="destructive" className="py-2">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="proj-name">Name *</Label>
                        <Input
                            id="proj-name"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Portfolio website"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="proj-desc">Description</Label>
                        <Textarea
                            id="proj-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this project about?"
                            rows={3}
                            disabled={isLoading}
                            className="resize-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="proj-status">Status</Label>
                        <Select value={status} onValueChange={(value) => {
                            if (value !== null) setStatus(value);
                        }} disabled={isLoading}>
                            <SelectTrigger id="proj-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="proj-tags">
                            Tags
                            <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">
                                comma-separated
                            </span>
                        </Label>
                        <Input
                            id="proj-tags"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="react, typescript, fastapi"
                            disabled={isLoading}
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? isEditing ? 'Saving…' : 'Creating…'
                                : isEditing ? 'Save changes' : 'Create project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}