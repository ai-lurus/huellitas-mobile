import 'dotenv/config';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Expo fusiona `app.json` en `config`. Aquí solo volcamos `.env` a `extra`
 * para que `expo-constants` y el validador de `env.ts` tengan respaldo estable.
 *
 * `EXPO_PUBLIC_MAP_API_KEY` debe inyectarse también en la config nativa de Google Maps
 * (Android `PROVIDER_GOOGLE`); si solo está en `extra`, el mapa puede quedar en gris.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const base = { ...config } as ExpoConfig;
  const mapApiKey = process.env.EXPO_PUBLIC_MAP_API_KEY?.trim() ?? '';
  const isProduction = process.env.EXPO_PUBLIC_ENV === 'production';

  /** HTTP hacia IP LAN (p. ej. API en http://192.168.x.x) en Android 9+; en producción usa HTTPS y desactívalo. */
  const android = {
    ...base.android,
    ...(!isProduction ? { usesCleartextTraffic: true } : {}),
    config: {
      ...base.android?.config,
      ...(mapApiKey.length > 0 ? { googleMaps: { apiKey: mapApiKey } } : {}),
    },
  };

  const ios = {
    ...base.ios,
    config: {
      ...base.ios?.config,
      ...(mapApiKey.length > 0 ? { googleMapsApiKey: mapApiKey } : {}),
    },
  };

  return {
    ...base,
    android,
    ios,
    extra: {
      ...base.extra,
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_AUTH_BASE_PATH: process.env.EXPO_PUBLIC_AUTH_BASE_PATH,
      EXPO_PUBLIC_MAP_API_KEY: process.env.EXPO_PUBLIC_MAP_API_KEY,
      EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
      EXPO_PUBLIC_BETTER_AUTH_URL: process.env.EXPO_PUBLIC_BETTER_AUTH_URL,
      EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
      eas: {
        ...((base.extra as { eas?: Record<string, unknown> } | undefined)?.eas ?? {}),
        projectId:
          process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
          ((base.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId as
            | string
            | undefined),
      },
    },
  };
};
