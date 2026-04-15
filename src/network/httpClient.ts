import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

import { env } from '../config/env';
import { getSessionTokenAsync, SESSION_TOKEN_KEY } from '../services/sessionTokenStorage';

/**
 * Cliente HTTP de la app (capa de red).
 * OJO: esto NO es "la API"; la API vive en el backend externo.
 * Aquí solo configuramos cómo la app se conecta a esa API.
 */
export const httpClient = axios.create({
  baseURL: env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getSessionTokenAsync();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Better Auth puede requerir cookie en algunos flujos (según servidor/origen).
  try {
    const { getBetterAuthCookieHeader } = await import('../services/auth.service');
    const cookie = getBetterAuthCookieHeader();
    if (cookie) {
      config.headers['Cookie'] = cookie;
    }
  } catch {
    // Evita dependencias circulares en arranque o tests sin módulo auth
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error),
);

export { SESSION_TOKEN_KEY };
