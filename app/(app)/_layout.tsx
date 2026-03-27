import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, control, radius, spacing } from '../../src/design/tokens';

export default function AppLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: spacing.xs,
          paddingTop: spacing.xs,
        },
        tabBarItemStyle: {
          borderRadius: radius.sm,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <Ionicons name="map-outline" size={control.icon} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications-outline" size={control.icon} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: 'Pets',
          tabBarIcon: ({ color }) => (
            <Ionicons name="paw-outline" size={control.icon} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={control.icon} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
