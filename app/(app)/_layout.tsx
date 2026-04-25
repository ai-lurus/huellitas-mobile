import { Tabs } from 'expo-router';
import { useEffect } from 'react';

import { AppTabBar } from '../../src/components/navigation/AppTabBar';
import { usersService } from '../../src/services/usersService';
import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';

export default function AppLayout(): React.JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect((): void | (() => void) => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void usersService
      .getMe()
      .then(({ settings }) => {
        if (cancelled) return;
        useSettingsStore.getState().hydrateFromProfile(settings);
      })
      .catch(() => {
        // no-op: si el backend aún no expone settings, usamos defaults locales.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="map" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerta' }} />
      <Tabs.Screen name="pets" options={{ title: 'Mascotas' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
