/**
 * Rutas HTTP de autenticación.
 * Better Auth (típico en Next.js) expone el handler en `/api/auth` y endpoints como
 * `POST /api/auth/sign-up/email` y `POST /api/auth/sign-in/email`.
 *
 * Si tu API usa otro prefijo, define `EXPO_PUBLIC_AUTH_BASE_PATH` en `.env` (ej. `/v1/auth`).
 */
function normalizeBasePath(raw: string): string {
  let p = raw.trim();
  if (p === '') p = '/api/auth';
  if (!p.startsWith('/')) p = `/${p}`;
  return p.replace(/\/+$/, '');
}

export function getAuthBasePath(): string {
  const fromEnv = process.env['EXPO_PUBLIC_AUTH_BASE_PATH'];
  return normalizeBasePath(
    typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv : '/api/auth',
  );
}

export function getSignUpPath(): string {
  return `${getAuthBasePath()}/sign-up/email`;
}

export function getSignInPath(): string {
  return `${getAuthBasePath()}/sign-in/email`;
}
