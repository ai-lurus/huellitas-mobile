import { z } from 'zod';
import Constants from 'expo-constants';

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_MAP_API_KEY: z.string().min(1),
  EXPO_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  EXPO_PUBLIC_BETTER_AUTH_URL: z.string().url(),
  EXPO_PUBLIC_OAUTH_CALLBACK_PATH: z.string().url(),
  EXPO_PUBLIC_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

/**
 * Metro solo inyecta variables si lees `process.env.EXPO_PUBLIC_*` de forma literal (no `process.env[key]`).
 * No uses `safeParse(process.env)` con el objeto entero: en el bundle suele venir vacío.
 * `expo.extra` (app.config) es un buen respaldo si defines ahí las mismas claves.
 */
function readEnvRaw(): Record<string, string | undefined> {
  const extra = Constants.expoConfig?.extra;
  const fromExtra =
    extra && typeof extra === 'object' && !Array.isArray(extra)
      ? (extra as Record<string, unknown>)
      : {};

  const pick = (key: string, explicit?: string): string | undefined => {
    if (typeof explicit === 'string' && explicit.length > 0) return explicit;
    const v = fromExtra[key];
    return typeof v === 'string' ? v : undefined;
  };

  return {
    EXPO_PUBLIC_API_URL: pick('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL),
    EXPO_PUBLIC_MAP_API_KEY: pick('EXPO_PUBLIC_MAP_API_KEY', process.env.EXPO_PUBLIC_MAP_API_KEY),
    EXPO_PUBLIC_SENTRY_DSN: pick('EXPO_PUBLIC_SENTRY_DSN', process.env.EXPO_PUBLIC_SENTRY_DSN),
    EXPO_PUBLIC_BETTER_AUTH_URL: pick(
      'EXPO_PUBLIC_BETTER_AUTH_URL',
      process.env.EXPO_PUBLIC_BETTER_AUTH_URL,
    ),
    EXPO_PUBLIC_ENV: pick('EXPO_PUBLIC_ENV', process.env.EXPO_PUBLIC_ENV),
    EXPO_PUBLIC_OAUTH_CALLBACK_PATH: pick(
      'EXPO_PUBLIC_OAUTH_CALLBACK_PATH',
      process.env.EXPO_PUBLIC_OAUTH_CALLBACK_PATH,
    ),
  };
}

const raw = readEnvRaw();
const result = envSchema.safeParse(raw);

if (!result.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
  );
}

export const env = result.data;
