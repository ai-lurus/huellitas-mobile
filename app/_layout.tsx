import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

import { colors } from '../src/design/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 2,
    },
  },
});

export default function RootLayout(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
