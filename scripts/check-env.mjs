import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import dotenv from 'dotenv';
import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_MAP_API_KEY: z.string().min(1),
  EXPO_PUBLIC_BETTER_AUTH_URL: z.string().url(),
  EXPO_PUBLIC_OAUTH_CALLBACK_PATH: z.string().url(),
  EXPO_PUBLIC_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  EXPO_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const cwd = process.cwd();
const envPath = path.join(cwd, '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Si no existe .env, igual intentamos con variables del entorno del proceso.
}

const raw = {
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_MAP_API_KEY: process.env.EXPO_PUBLIC_MAP_API_KEY,
  EXPO_PUBLIC_BETTER_AUTH_URL: process.env.EXPO_PUBLIC_BETTER_AUTH_URL,
  EXPO_PUBLIC_OAUTH_CALLBACK_PATH: process.env.EXPO_PUBLIC_OAUTH_CALLBACK_PATH,
  EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
};

const result = envSchema.safeParse(raw);

if (!result.success) {
  console.error('Variables de entorno inválidas o faltantes:');
  for (const [key, errs] of Object.entries(result.error.flatten().fieldErrors)) {
    if (!errs?.length) continue;
    console.error(`- ${key}: ${errs.join(', ')}`);
  }
  process.exit(1);
}

console.log('OK: .env válido para build');

