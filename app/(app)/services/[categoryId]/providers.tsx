import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, radius, shadows, spacing, typography } from '../../../../src/design/tokens';
import { useServiceProviders } from '../../../../src/hooks/useServices';

export default function ServiceProvidersScreen(): React.JSX.Element {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { data, isPending } = useServiceProviders(categoryId, Boolean(categoryId));
  const providers = data ?? [];

  const selectProvider = (providerId: string): void => {
    router.push(`/(app)/services/${categoryId}?providerId=${providerId}`);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={(): void => router.back()}
          style={styles.backBtn}
          testID="services.providers.back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Elige un proveedor</Text>
        <View style={styles.backBtn} />
      </View>

      {isPending ? null : (
        <FlatList
          data={providers}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={(): void => selectProvider(item.id)}
              style={styles.card}
              testID={`services.providers.item.${item.id}`}
            >
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.address ? <Text style={styles.cardSubtitle}>{item.address}</Text> : null}
                <View style={styles.metaRow}>
                  {item.distanceKm != null ? (
                    <Text style={styles.metaText}>{item.distanceKm.toFixed(1)} km</Text>
                  ) : null}
                  {item.rating != null ? (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color={colors.primary} />
                      <Text style={styles.metaText}>{item.rating.toFixed(1)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaText: { ...typography.caption, color: colors.textSecondary },
});
