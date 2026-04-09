import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { BetterFetchError } from '@better-fetch/fetch';
import { Platform } from 'react-native';

import { env } from '../config/env';
import { useAuthStore } from '../stores/authStore';
import type { AuthUser } from './authService';
import { getPostOAuthDestination } from './postOAuthRouting';

/**
 * En web, `expo-secure-store` no implementa el nativo (stub vacío) y rompe `getItem`/`setItem` síncronos
 * que usa `@better-auth/expo`. Usamos localStorage con la misma API.
 */
function createWebAuthStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
} {
  return {
    getItem: (key: string): string | null => {
      try {
        if (typeof globalThis === 'undefined') return null;
        const ls = (globalThis as { localStorage?: Storage }).localStorage;
        return ls?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        const ls = (globalThis as { localStorage?: Storage }).localStorage;
        ls?.setItem(key, value);
      } catch {
        // cuota o modo privado
      }
    },
  };
}

const authStorage =
  Platform.OS === 'web'
    ? createWebAuthStorage()
    : (SecureStore as {
        getItem: (key: string) => string | null;
        setItem: (key: string, value: string) => void;
      });

/** Ruta relativa: el plugin Expo la convierte en `huellitas://…` (PKCE lo gestiona Better Auth en el servidor). */
export const OAUTH_CALLBACK_PATH = env.EXPO_PUBLIC_OAUTH_CALLBACK_PATH;
export const authClient = createAuthClient({
  baseURL: env.EXPO_PUBLIC_BETTER_AUTH_URL,
  includeCredentials: true,
  plugins: [
    expoClient({
      scheme: 'huellitas',
      storagePrefix: 'huellitas',
      storage: authStorage,
    }),
  ],
});

export function getBetterAuthCookieHeader(): string {
  const client = authClient as { getCookie?: () => string };
  return client.getCookie?.() ?? '';
}

export type GoogleSignInResult =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

function mapSessionUserToAuthUser(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}): AuthUser {
  return {
    id: user.id,
    name: user.name?.trim() || 'Usuario',
    email: user.email ?? '',
    image: user.image ? String(user.image) : undefined,
  };
}

const ORIGIN_403_COPY =
  'El servidor rechazó la petición (403). Con Expo en el navegador, añade el origen de la app (p. ej. http://localhost:8081) a trustedOrigins o BETTER_AUTH_TRUSTED_ORIGINS en tu API Better Auth y reinicia el servidor.';

const RATE_LIMIT_429_COPY =
  'Demasiadas peticiones al servidor (429). Espera un minuto sin pulsar de nuevo. En desarrollo, relaja o desactiva el rate limiting de Better Auth (p. ej. opción `rateLimit` en la config del auth).';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function statusFromUnknown(err: unknown): number | null {
  if (!isRecord(err)) return null;
  const s = err['status'];
  const sc = err['statusCode'];
  if (typeof s === 'number') return s;
  if (typeof sc === 'number') return sc;
  return null;
}

export function formatOAuthErrorMessage(err: unknown): string {
  const status = statusFromUnknown(err);
  if (status === 429) {
    return RATE_LIMIT_429_COPY;
  }
  if (status === 403) {
    return ORIGIN_403_COPY;
  }
  if (err instanceof BetterFetchError) {
    const msg = err.message?.trim();
    if (msg) {
      const lower = msg.toLowerCase();
      if (lower.includes('429') || lower.includes('too many')) {
        return RATE_LIMIT_429_COPY;
      }
      if (lower.includes('origin') || lower.includes('forbidden') || lower.includes('403')) {
        return ORIGIN_403_COPY;
      }
      return msg;
    }
  }
  if (err instanceof Error && err.message) {
    const lower = err.message.toLowerCase();
    if (lower.includes('429') || lower.includes('too many')) {
      return RATE_LIMIT_429_COPY;
    }
    if (lower.includes('origin') || (lower.includes('403') && lower.includes('forbidden'))) {
      return ORIGIN_403_COPY;
    }
    return err.message;
  }
  return 'No pudimos completar el inicio de sesión con Google. Intenta de nuevo en unos minutos.';
}

/**
 * Inicia OAuth con Google (PKCE en el servidor Better Auth + proxy de autorización en Expo).
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: OAUTH_CALLBACK_PATH,
    });
  } catch (err: unknown) {
    return { status: 'error', message: formatOAuthErrorMessage(err) };
  }

  try {
    const session = await authClient.getSession();
    if (session.error || !session.data?.user) {
      return { status: 'cancelled' };
    }
    return { status: 'success' };
  } catch (err: unknown) {
    return { status: 'error', message: formatOAuthErrorMessage(err) };
  }
}

export async function syncBetterAuthSessionToAuthStore(): Promise<boolean> {
  try {
    const session = await authClient.getSession();
    const user = session.data?.user;
    if (!user) {
      return false;
    }
    useAuthStore.getState().setUser(mapSessionUserToAuthUser(user));
    return true;
  } catch {
    return false;
  }
}

export async function runGoogleSignInFlow(): Promise<{
  result: GoogleSignInResult;
  navigateTo: '/(auth)/onboarding/step-1' | '/(app)' | null;
}> {
  const result = await signInWithGoogle();
  if (result.status !== 'success') {
    return { result, navigateTo: null };
  }
  const synced = await syncBetterAuthSessionToAuthStore();
  if (!synced) {
    return {
      result: { status: 'error', message: 'No se pudo guardar la sesión. Vuelve a intentarlo.' },
      navigateTo: null,
    };
  }
  const dest = await getPostOAuthDestination();
  return {
    result: { status: 'success' },
    navigateTo: dest === 'onboarding' ? '/(auth)/onboarding/step-1' : '/(app)',
  };
}
