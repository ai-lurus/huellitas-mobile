import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, radius, shadows, spacing, typography } from '../../../../src/design/tokens';
import { useServiceProviders } from '../../../../src/hooks/useServices';
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';

export default function ServiceProvidersScreen(): React.JSX.Element {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { data, isPending } = useServiceProviders(categoryId, Boolean(categoryId));
  const providers = data ?? [];

  const selectProvider = (providerId: string): void => {
    router.push(`/(app)/services/${categoryId}?providerId=${providerId}`);
  };

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Elige un proveedor"
        onBack={() => router.back()}
        testID="services.providers"
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
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
