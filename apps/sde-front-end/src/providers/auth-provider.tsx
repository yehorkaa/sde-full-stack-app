'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { setTokenHandlers } from '../lib/axios';
import { getMe, logout as apiLogout } from '../lib/api/auth';
import type { User } from '@sde-challenge/shared-types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshToken: string | null;
  setAuth: (user: User, refreshToken: string) => void;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_TOKEN_KEY = 'sde_refresh_token';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      if (refreshToken) {
        await apiLogout({ refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setRefreshToken(null);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      router.push('/sign-in');
    }
  }, [refreshToken, router]);

  const setAuth = useCallback((user: User, token: string) => {
    setUser(user);
    setRefreshToken(token);
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }, []);

  useEffect(() => {
    setTokenHandlers(
      () => refreshToken || localStorage.getItem(REFRESH_TOKEN_KEY),
      (token) => {
        setRefreshToken(token);
        if (token) {
          localStorage.setItem(REFRESH_TOKEN_KEY, token);
        } else {
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
      },
      () => {
        setUser(null);
        setRefreshToken(null);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        router.push('/sign-in');
      }
    );
  }, [refreshToken, router]);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setRefreshToken(storedToken);

      try {
        const userData = await getMe();
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setRefreshToken(null);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        refreshToken,
        setAuth,
        logout,
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
