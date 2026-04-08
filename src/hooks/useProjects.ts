import { useState, useEffect, useCallback } from 'react';
import { projectsApi } from '@/lib/api/projects';
import type { Project, ProjectCreateInput, ProjectUpdateInput } from '@/types/projects';

interface UseProjectsReturn {
    projects: Project[];
    isLoading: boolean;
    error: string | null;
    createProject: (data: ProjectCreateInput) => Promise<Project>;
    updateProject: (id: number, data: ProjectUpdateInput) => Promise<Project>;
    deleteProject: (id: number) => Promise<void>;
    refresh: () => void;
}

function mapStatusToAPI(status?: string) {
    if (!status) return 'planning';

    switch (status) {
        case 'active':
            return 'in_progress';
        case 'planning':
            return 'planning';
        case 'completed':
            return 'completed';
        case 'on_hold':
            return 'on_hold';
        case 'archived':
            return 'completed'; // or your logic
        default:
            return 'planning';
    }
}

export function useProjects(): UseProjectsReturn {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // useCallback memoizes the function — same function reference across renders.
    // This matters because we pass `refresh` as a dependency in useEffect below.
    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await projectsApi.list();

            const normalized = data.map((p: any) => ({
                ...p,
                tags: p.tags || [],   // prevent crash
            }));

            setProjects(normalized);
        } catch {
            setError('Failed to load projects. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []); // empty deps — this function never changes

    // Fetch on mount
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const createProject = async (data: ProjectCreateInput): Promise<Project> => {
        const newProject = await projectsApi.create({
            ...data,
            status: mapStatusToAPI(data.status),
        });
        // Add to local state immediately — no need to re-fetch the whole list
        setProjects((prev) => [newProject, ...prev]);
        return newProject;
    };

    const updateProject = async (id: number, data: ProjectUpdateInput): Promise<Project> => {
        const updated = await projectsApi.update(id, {
            ...data,
            status: mapStatusToAPI(data.status),
        });
        // Replace the old project in the array with the updated one
        setProjects((prev) =>
            prev.map((p) => (p.id === id ? updated : p))
        );
        return updated;
    };

    const deleteProject = async (id: number): Promise<void> => {
        // Optimistic update — remove from UI immediately
        const previous = projects; // snapshot in case we need to roll back
        setProjects((prev) => prev.filter((p) => p.id !== id));

        try {
            await projectsApi.delete(id);
        } catch (err) {
            // API failed — restore the previous state
            setProjects(previous);
            throw err; // re-throw so the calling component can show an error
        }
    };

    return {
        projects,
        isLoading,
        error,
        createProject,
        updateProject,
        deleteProject,
        refresh: fetchProjects,
    };
}