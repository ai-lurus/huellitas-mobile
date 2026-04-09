import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

import { getSessionTokenAsync, SESSION_TOKEN_KEY } from './sessionTokenStorage';

export const apiClient = axios.create({
  baseURL: process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getSessionTokenAsync();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const { getBetterAuthCookieHeader } = await import('./auth.service');
    const cookie = getBetterAuthCookieHeader();
    if (cookie) {
      config.headers['Cookie'] = cookie;
    }
  } catch {
    // Evita dependencias circulares en arranque o tests sin módulo auth
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Pass through for callers to handle
    return Promise.reject(error);
  },
);

export { SESSION_TOKEN_KEY };
