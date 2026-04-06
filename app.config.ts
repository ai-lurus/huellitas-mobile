import 'dotenv/config';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Expo fusiona `app.json` en `config`. Aquí solo volcamos `.env` a `extra`
 * para que `expo-constants` y el validador de `env.ts` tengan respaldo estable.
 */
export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    extra: {
      ...config.extra,
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_AUTH_BASE_PATH: process.env.EXPO_PUBLIC_AUTH_BASE_PATH,
      EXPO_PUBLIC_MAP_API_KEY: process.env.EXPO_PUBLIC_MAP_API_KEY,
      EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
      EXPO_PUBLIC_BETTER_AUTH_URL: process.env.EXPO_PUBLIC_BETTER_AUTH_URL,
      EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
    },
  }) as ExpoConfig;
