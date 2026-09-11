import { api } from './api';

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  approved_at: string | null;
};

export const adminService = {
  listUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get<{ data: AdminUser[] }>('/admin/users');
    return response.data.data;
  },
  approve: async (id: number) => {
    await api.post(`/admin/users/${id}/approve`);
  },
  reject: async (id: number) => {
    await api.post(`/admin/users/${id}/reject`);
  },
  create: async (user: { name: string; email: string; password: string }) => {
    await api.post('/admin/users', user);
  },
  remove: async (id: number) => {
    await api.delete(`/admin/users/${id}`);
  },
};
