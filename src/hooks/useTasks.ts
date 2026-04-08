import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '@/lib/api/tasks';
import type { Task, TaskCreateInput, TaskUpdateInput } from '@/types/projects';

interface UseTasksOptions {
    projectId?: number; // if provided, fetch only this project's tasks
}

interface UseTasksReturn {
    tasks: Task[];
    isLoading: boolean;
    error: string | null;
    createTask: (projectId: number, data: TaskCreateInput) => Promise<Task>;
    updateTask: (projectId: number, taskId: number, data: TaskUpdateInput) => Promise<Task>;
    deleteTask: (projectId: number, taskId: number) => Promise<void>;
    refresh: () => void;
}

export function useTasks({ projectId }: UseTasksOptions = {}): UseTasksReturn {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // If a projectId was passed, fetch only that project's tasks.
            // Otherwise fetch all tasks (for the /tasks page).
            const data = projectId
                ? await tasksApi.list(projectId)
                : await tasksApi.listAll();
            setTasks(data);
        } catch {
            setError('Failed to load tasks. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]); // re-run if projectId changes

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const createTask = async (pid: number, data: TaskCreateInput): Promise<Task> => {
        const newTask = await tasksApi.create(pid, data);
        setTasks((prev) => [newTask, ...prev]);
        return newTask;
    };

    const updateTask = async (pid: number, tid: number, data: TaskUpdateInput): Promise<Task> => {
        const updated = await tasksApi.update(pid, tid, data);
        setTasks((prev) => prev.map((t) => (t.id === tid ? updated : t)));
        return updated;
    };

    const deleteTask = async (pid: number, tid: number): Promise<void> => {
        const previous = tasks;
        setTasks((prev) => prev.filter((t) => t.id !== tid));
        try {
            await tasksApi.delete(pid, tid);
        } catch (err) {
            setTasks(previous);
            throw err;
        }
    };

    return {
        tasks,
        isLoading,
        error,
        createTask,
        updateTask,
        deleteTask,
        refresh: fetchTasks,
    };
}