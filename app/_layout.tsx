import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LocationAppIntegration } from '../src/components/location/LocationAppIntegration';
import { colors } from '../src/design/tokens';
import { authClient } from '../src/services/auth.service';

WebBrowser.maybeCompleteAuthSession();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 2,
    },
  },
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
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1 }}>
          <AuthDeepLinkSync />
          <StatusBar style="dark" backgroundColor={colors.background} />
          <Stack screenOptions={{ headerShown: false }} />
          <LocationAppIntegration />
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
