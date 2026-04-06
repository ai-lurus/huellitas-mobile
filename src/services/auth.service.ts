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

export function formatOAuthErrorMessage(err: unknown): string {
  if (err instanceof BetterFetchError) {
    const msg = err.message?.trim();
    if (msg) return msg;
  }
  if (err instanceof Error && err.message) {
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

  const session = await authClient.getSession();
  if (session.error || !session.data?.user) {
    return { status: 'cancelled' };
  }

  return { status: 'success' };
}

export async function syncBetterAuthSessionToAuthStore(): Promise<boolean> {
  const session = await authClient.getSession();
  const user = session.data?.user;
  if (!user) {
    return false;
  }
  useAuthStore.getState().setUser(mapSessionUserToAuthUser(user));
  return true;
}

export async function runGoogleSignInFlow(): Promise<{
  result: GoogleSignInResult;
  navigateTo: '/onboarding' | '/(app)' | null;
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
    navigateTo: dest === 'onboarding' ? '/onboarding' : '/(app)',
  };
}
