import api from '@/lib/axios';
import type { Project, ProjectCreateInput, ProjectUpdateInput } from '@/types/projects';

export const projectsApi = {

    // GET /projects — returns all projects owned by the current user
    list: async (): Promise<Project[]> => {
        const res = await api.get<Project[]>('/projects');
        return res.data;
    },

    // GET /projects/:id — returns one project (includes tasks via joinedload)
    get: async (id: number): Promise<Project> => {
        const res = await api.get<Project>(`/projects/${id}`);
        return res.data;
    },

    // POST /projects
    create: async (data: ProjectCreateInput): Promise<Project> => {
        const res = await api.post<Project>('/projects', data);
        return res.data;
    },

    // PATCH /projects/:id — only fields present in data are updated
    update: async (id: number, data: ProjectUpdateInput): Promise<Project> => {
        const res = await api.patch<Project>(`/projects/${id}`, data);
        return res.data;
    },

    // DELETE /projects/:id
    delete: async (id: number): Promise<void> => {
        await api.delete(`/projects/${id}`);
    },
};