'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import { authApi, ApiError } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      setError(null);
    } catch {
      // User is not authenticated or cookie is expired
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login({ email, password });
      const loggedUser: User = response.user || {
        id: response.id,
        email: response.email,
        name: response.name,
        role: response.role,
        walletAddress: response.walletAddress,
      };
      setUser(loggedUser);
      return loggedUser;
    } catch (err: any) {
      const message = err instanceof ApiError ? err.message : (err?.message || 'Error al iniciar sesión');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register({ email, password, name });
      const registeredUser: User = response.user || {
        id: response.id,
        email: response.email,
        name: response.name,
        role: response.role,
        walletAddress: response.walletAddress,
      };
      setUser(registeredUser);
      return registeredUser;
    } catch (err: any) {
      const message = err instanceof ApiError ? err.message : (err?.message || 'Error al registrarse');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Error during logout request:', err);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
