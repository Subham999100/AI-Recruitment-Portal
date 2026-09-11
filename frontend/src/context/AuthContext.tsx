import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { toPortalUser } from '../services/userMapper';
import { api } from '../services/api';
import { authService, PortalAuthUser } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (profile: PortalAuthUser) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const applySession = async () => {
      if (!mounted) return;
      if (!localStorage.getItem('portal_access_token')) {
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const response = await api.get<{ data: PortalAuthUser }>('/auth/me');
        if (!mounted) return;
        const profile = response.data.data;
        setToken(localStorage.getItem('portal_access_token'));
        setUser(toPortalUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          status: profile.status,
        }));
      } catch {
        if (!mounted) return;
        setToken(null);
        setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    applySession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = (profile: PortalAuthUser) => {
    setToken(localStorage.getItem('portal_access_token'));
    setUser(toPortalUser({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      status: profile.status,
    }));
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
