import { Tabs } from 'expo-router';

import { AppTabBar } from '../../src/components/navigation/AppTabBar';

export default function AppLayout(): React.JSX.Element {
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
