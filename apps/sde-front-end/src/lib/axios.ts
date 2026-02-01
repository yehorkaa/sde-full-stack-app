'use client';

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Store for refresh token (will be set by auth context)
let refreshTokenGetter: (() => string | null) | null = null;
let refreshTokenSetter: ((token: string | null) => void) | null = null;
let logoutHandler: (() => void) | null = null;

export function setTokenHandlers(
  getter: () => string | null,
  setter: (token: string | null) => void,
  logout: () => void
) {
  refreshTokenGetter = getter;
  refreshTokenSetter = setter;
  logoutHandler = logout;
}

// Response interceptor for handling 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = refreshTokenGetter?.();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint
        const response = await api.post('/auth/refresh-token', {
          refreshToken,
        });

        // Update refresh token
        refreshTokenSetter?.(response.data.refreshToken);

        processQueue(null);

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        // Logout on refresh failure
        logoutHandler?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
