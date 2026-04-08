import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectFormModal } from '@/components/projects/ProjectFormModal';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus } from 'lucide-react';
import { useState } from 'react';

import { useProjects } from '@/hooks/useProjects';
import type { Project } from '@/types/projects';

export function Projects() {
    const { projects, isLoading, error, createProject, updateProject, deleteProject } = useProjects();

    // Track which project is being edited — null means the modal is closed or in create mode
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

    const openCreateModal = () => {
        setEditingProject(undefined); // clear any previous edit target
        setModalOpen(true);
    };

    const openEditModal = (project: Project) => {
        setEditingProject(project);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingProject(undefined);
    };

    return (
        <div className="p-8 space-y-6">
            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {projects.length > 0
                            ? `${projects.length} project${projects.length === 1 ? '' : 's'}`
                            : 'No projects yet'}
                    </p>
                </div>
                <Button onClick={openCreateModal} size="sm" className="gap-1.5">
                    <Plus size={15} /> New project
                </Button>
            </div>

            {/* ── Error state ─────────────────────────────────────────────── */}
            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* ── Loading skeleton ─────────────────────────────────────────── */}
            {isLoading && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-44 rounded-xl border border-border bg-card animate-pulse"
                        />
                    ))}
                </div>
            )}

            {/* ── Empty state ─────────────────────────────────────────────── */}
            {!isLoading && !error && projects.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <FolderKanban size={22} className="text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="font-medium text-foreground">No projects yet</p>
                        <p className="text-sm text-muted-foreground">
                            Create your first project to start tracking tasks.
                        </p>
                    </div>
                    <Button onClick={openCreateModal} size="sm" variant="outline" className="gap-1.5">
                        <Plus size={14} /> Create project
                    </Button>
                </div>
            )}

            {/* ── Project grid ─────────────────────────────────────────────── */}
            {!isLoading && projects.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onEdit={openEditModal}
                            onDelete={deleteProject}
                        />
                    ))}
                </div>
            )}

            {/* ── Modal ─────────────────────────────────────────────────────── */}
            <ProjectFormModal
                open={modalOpen}
                onClose={closeModal}
                project={editingProject}
                onCreate={createProject}
                onUpdate={updateProject}
            />
        </div>
    );
}