import { api, delay } from './api';
import { User } from '../types';

export const authService = {
  login: async (credentials: any) => {
    // In a real app: return api.post('/auth/login', credentials);
    await delay(1000); // Simulate network
    
    if (credentials.email === 'admin@example.com' || credentials.password) {
      return {
        data: {
          token: 'mock-jwt-token-12345',
          user: {
            id: 1,
            name: 'Jane Recruiter',
            email: credentials.email,
            role: 'recruiter'
          } as User
        }
      };
    }
    throw new Error('Invalid credentials');
  },
  
  register: async (userData: any) => {
    // return api.post('/auth/register', userData);
    await delay(1000);
    return { data: { success: true } };
  }
};
