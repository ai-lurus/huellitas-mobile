import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Group } from '../../../src/domain/groups';
import { GroupCard } from '../../../src/components/groups/GroupCard';
import { colors, spacing, typography } from '../../../src/design/tokens';
import { useGroups, useJoinGroup } from '../../../src/hooks/useGroups';
import { useLocationStore } from '../../../src/stores/locationStore';
import { DEFAULT_MAP_FALLBACK } from '../../../src/config/constants';

export default function GroupsScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const loc = currentLocation ?? DEFAULT_MAP_FALLBACK;

  const groupsQuery = useGroups({ lat: loc.lat, lng: loc.lng });
  const { mutate: joinGroup, isPending: isJoining, variables: joiningId } = useJoinGroup();

  const openGroup = useCallback(
    (id: string): void => {
      router.push(`/(app)/groups/${id}` as Href);
    },
    [router],
  );

  const myGroups = groupsQuery.data?.myGroups ?? [];
  const suggested = groupsQuery.data?.suggested ?? [];

  const sections: Array<{ title: string; data: Group[] }> = [];
  if (myGroups.length > 0) sections.push({ title: 'Mis grupos', data: myGroups });
  if (suggested.length > 0) sections.push({ title: 'Descubrir', data: suggested });

  const allItems = sections.flatMap((s) => [
    { type: 'header' as const, title: s.title },
    ...s.data.map((g) => ({ type: 'group' as const, group: g })),
  ]);

  if (groupsQuery.isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Grupos</Text>
      </View>

      <FlatList
        data={allItems}
        keyExtractor={(item, i) => (item.type === 'header' ? `header-${i}` : item.group.id)}
        contentContainerStyle={styles.listContent}
        refreshing={Boolean(groupsQuery.isRefetching)}
        onRefresh={() => void groupsQuery.refetch()}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.sectionTitle}>{item.title}</Text>;
          }
          return (
            <GroupCard
              group={item.group}
              onPress={() => openGroup(item.group.id)}
              onJoin={!item.group.isMember ? (): void => joinGroup(item.group.id) : undefined}
              isJoining={isJoining && joiningId === item.group.id}
            />
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No perteneces a ningún grupo aún.{'\n'}¡Explora grupos cerca de ti!
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xxs,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
    lineHeight: 22,
  },
});
