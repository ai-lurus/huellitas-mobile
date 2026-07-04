import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocationAppIntegration } from '../src/components/location/LocationAppIntegration';
import { NotificationBootstrap } from '../src/components/notifications/NotificationBootstrap';
import { GlobalErrorBoundary } from '../src/components/errors/GlobalErrorBoundary';
import { OfflineBanner } from '../src/components/offline/OfflineBanner';
import { HuellitasToast } from '../src/components/toasts/HuellitasToast';
import { SentryUserSync } from '../src/components/analytics/SentryUserSync';
import { colors } from '../src/design/tokens';
import { authClient } from '../src/services/googleAuthService';
import i18n from '../src/config/i18n';
import { loadLanguage } from '../src/i18n/languagePreference';
import { useAppFonts } from '../src/hooks/useAppFonts';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '../src/query/queryClient';
import { queryPersister } from '../src/query/queryPersister';
import { shouldPersistQuery } from '../src/query/shouldPersistQuery';
import * as Sentry from '@sentry/react-native';
import { env } from '../src/config/env';
import { httpClient } from '../src/network';

WebBrowser.maybeCompleteAuthSession();

Sentry.init({
  dsn: env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: Boolean(env.EXPO_PUBLIC_SENTRY_DSN),
});

function AuthDeepLinkSync(): null {
  useEffect(() => {
    const refreshIfCallback = (url: string): void => {
      if (url.includes('auth/callback')) {
        void authClient.getSession().catch(() => {});
      }
    };

    const sub = Linking.addEventListener('url', ({ url }) => {
      refreshIfCallback(url);
    });

    void Linking.getInitialURL().then((url) => {
      if (url) refreshIfCallback(url);
    });

    return (): void => {
      sub.remove();
    };
  }, []);

  return null;
}

export default function RootLayout(): React.JSX.Element {
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    // Carga el idioma guardado (best-effort) al iniciar la app.
    void loadLanguage().then((lng) => {
      void i18n.changeLanguage(lng);
    });

    // Despierta la base de datos Neon (arranque en frío) en segundo plano
    void httpClient.get('/health').catch(() => {});
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaProvider>
      <GlobalErrorBoundary onError={(e) => Sentry.captureException(e)}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: queryPersister,
            maxAge: 1000 * 60 * 60 * 24,
            dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
            // Invalida cachés ya guardados en dispositivos antes de excluir 'pets' de la
            // persistencia (evita que un conteo de mascotas desactualizado se rehidrate una
            // última vez). Solo subir este valor si hace falta invalidar de nuevo.
            buster: 'pets-not-persisted-v1',
          }}
        >
          <View style={{ flex: 1 }}>
            <AuthDeepLinkSync />
            <StatusBar style="dark" backgroundColor={colors.background} />
            <Stack screenOptions={{ headerShown: false }} />
            <NotificationBootstrap />
            <LocationAppIntegration />
            <SentryUserSync />
            <OfflineBanner />
            <HuellitasToast />
          </View>
        </PersistQueryClientProvider>
      </GlobalErrorBoundary>
    </SafeAreaProvider>
  );
}
