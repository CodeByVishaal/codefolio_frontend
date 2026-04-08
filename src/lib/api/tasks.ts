import api from '@/lib/axios';
import type { Task, TaskCreateInput, TaskUpdateInput } from '@/types/projects';

export const tasksApi = {

    // GET /projects/:projectId/tasks
    list: async (projectId: number): Promise<Task[]> => {
        const res = await api.get<Task[]>(`/projects/${projectId}/tasks`);
        return res.data;
    },

    // GET /tasks — all tasks across all projects (for the /tasks page)
    listAll: async (): Promise<Task[]> => {
        const res = await api.get<Task[]>('/tasks');
        return res.data;
    },

    // POST /projects/:projectId/tasks
    create: async (projectId: number, data: TaskCreateInput): Promise<Task> => {
        const res = await api.post<Task>(`/projects/${projectId}/tasks`, data);
        return res.data;
    },

    // PATCH /projects/:projectId/tasks/:taskId
    update: async (projectId: number, taskId: number, data: TaskUpdateInput): Promise<Task> => {
        const res = await api.patch<Task>(`/projects/${projectId}/tasks/${taskId}`, data);
        return res.data;
    },

    // DELETE /projects/:projectId/tasks/:taskId
    delete: async (projectId: number, taskId: number): Promise<void> => {
        await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    },
};