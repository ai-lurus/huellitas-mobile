import { z } from 'zod';
import Constants from 'expo-constants';

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_MAP_API_KEY: z.string().min(1),
  EXPO_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  EXPO_PUBLIC_BETTER_AUTH_URL: z.string().url(),
  EXPO_PUBLIC_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

const raw = Constants.expoConfig?.extra ?? process.env;
const result = envSchema.safeParse(raw);

if (!result.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
  );
}

export const env = result.data;
