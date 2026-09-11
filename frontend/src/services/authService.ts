import { api } from './api';

export type PortalAuthUser = {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post<{ access_token: string; user: PortalAuthUser }>('/auth/login', credentials);
    localStorage.setItem('portal_access_token', response.data.access_token);
    return response.data;
  },

  register: async (userData: { name: string; email: string; password: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    localStorage.removeItem('portal_access_token');
  },
};
