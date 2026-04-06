import { isAxiosError } from 'axios';
import { z } from 'zod';

import { getSignInPath, getSignUpPath } from '../config/authEndpoints';
import { apiClient } from './api';
import { setSessionTokenAsync } from './sessionTokenStorage';

function toFriendlyAuthError(err: unknown): Error {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 404) {
      return new Error(
        'No se encontró la ruta de registro (404). Si usas Better Auth, la URL suele ser /api/auth/sign-up/email: deja EXPO_PUBLIC_API_URL=http://localhost:PUERTO y, si tu handler no está en /api/auth, define EXPO_PUBLIC_AUTH_BASE_PATH en .env.',
      );
    }
    if (status === 422) {
      const data = err.response?.data as { message?: string; code?: string } | undefined;
      return new Error(
        data?.message ?? 'No se pudo crear la cuenta (datos no válidos o correo ya registrado).',
      );
    }
    if (status === 401) {
      const data = err.response?.data as { message?: string } | undefined;
      if (data?.message) return new Error(data.message);
      return new Error('Credenciales no válidas.');
    }
    if (status === 403) {
      const data = err.response?.data as { message?: string } | undefined;
      const raw = typeof data?.message === 'string' ? data.message : '';
      const lower = raw.toLowerCase();
      if (lower.includes('origin') || lower.includes('invalid origin')) {
        return new Error(
          'El servidor rechazó el origen de la app (403). En tu API Better Auth añade en trustedOrigins el origen de Expo web, por ejemplo: "http://localhost:8081" (y el que use tu móvil/emulador si pruebas ahí). Reinicia el API tras cambiarlo.',
        );
      }
      if (raw) return new Error(raw);
      return new Error('Acceso denegado (403).');
    }
    if (status === 409) {
      const data = err.response?.data as { message?: string } | undefined;
      return new Error(data?.message ?? 'El correo ya está registrado.');
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return new Error(
        'No hay conexión con el servidor. Comprueba que el API esté en marcha y la URL en .env.',
      );
    }
    if (status != null) {
      const data = err.response?.data as { message?: string } | undefined;
      if (data?.message) return new Error(data.message);
      return new Error(`Error del servidor (${status}).`);
    }
  }
  if (err instanceof Error) return err;
  return new Error('Algo salió mal. Intenta de nuevo.');
}

const userSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    image: z.union([z.string(), z.null()]).optional(),
  })
  .transform((u) => {
    const img = u.image;
    const asUrl = typeof img === 'string' && img.length > 0 ? img : undefined;
    const parsedUrl = asUrl && z.string().url().safeParse(asUrl).success ? asUrl : undefined;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      ...(parsedUrl ? { image: parsedUrl } : {}),
    };
  });

const authSessionSchema = z.object({
  token: z.string().min(1).nullable().optional(),
  user: userSchema,
});

export type AuthUser = z.infer<typeof userSchema>;

async function signIn(
  email: string,
  password: string,
): Promise<{
  user: AuthUser;
  isFirstLogin: boolean;
}> {
  try {
    const res = await apiClient.post(getSignInPath(), { email, password });
    const parsed = authSessionSchema.parse(res.data);

    if (parsed.token) {
      await setSessionTokenAsync(parsed.token);
    }

    return { user: parsed.user, isFirstLogin: false };
  } catch (err: unknown) {
    throw toFriendlyAuthError(err);
  }
}

async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<{
  user: AuthUser;
  isFirstLogin: boolean;
}> {
  try {
    const res = await apiClient.post(getSignUpPath(), { name, email, password });
    const parsed = authSessionSchema.parse(res.data);

    if (!parsed.token) {
      throw new Error(
        'La cuenta se creó pero el servidor no devolvió sesión (token vacío). Revisa la verificación por correo en tu backend o desactiva requireEmailVerification en Better Auth para pruebas.',
      );
    }
    await setSessionTokenAsync(parsed.token);

    return { user: parsed.user, isFirstLogin: true };
  } catch (err: unknown) {
    throw toFriendlyAuthError(err);
  }
}

export const authService = {
  signIn,
  signUp,
};
