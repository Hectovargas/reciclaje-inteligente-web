import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { fetchWithAuth } from './api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const result = await fetchWithAuth('/auth/me');
        if (mounted && result?.user) {
          setUser(result.user);
          setStatus('authenticated');
        } else {
          if (mounted) {
            setUser(null);
            setStatus('unauthenticated');
          }
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const logout = async () => {
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignorar errores de logout
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  const setUserAndStatus = (newUser: User | null) => {
    setUser(newUser);
    setStatus(newUser ? 'authenticated' : 'unauthenticated');
  };

  return (
    <AuthContext.Provider value={{ user, status, setUser: setUserAndStatus, logout }}>
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
