'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../services/api.service';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: Role) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string; photoUrl?: string; password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load user from localStorage or API on mount
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('taskflow_token');
      const cachedUser = localStorage.getItem('taskflow_user');

      if (token && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          // Refresh profile details in the background
          const freshProfile = await AuthService.getProfile();
          setUser(freshProfile);
          localStorage.setItem('taskflow_user', JSON.stringify(freshProfile));
        } catch (error) {
          console.error('Session restoration failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await AuthService.login(email, password);
      localStorage.setItem('taskflow_token', data.token);
      localStorage.setItem('taskflow_user', JSON.stringify(data.user));
      setUser(data.user as any);
      setLoading(false);
      router.push('/dashboard');
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role?: Role) => {
    setLoading(true);
    try {
      const data = await AuthService.register(name, email, password, role);
      localStorage.setItem('taskflow_token', data.token);
      localStorage.setItem('taskflow_user', JSON.stringify(data.user));
      setUser(data.user as any);
      setLoading(false);
      router.push('/dashboard');
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
    }
    router.push('/login');
  };

  const updateProfile = async (data: { name?: string; email?: string; photoUrl?: string; password?: string }) => {
    try {
      const res = await AuthService.updateProfile(data);
      const updatedUser = {
        ...user,
        ...res.user
      };
      setUser(updatedUser);
      localStorage.setItem('taskflow_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
