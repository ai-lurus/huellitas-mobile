import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, radius, shadows, spacing, typography } from '../../src/design/tokens';
import { useServiceCatalog } from '../../src/hooks/useServices';
import { CATEGORY_ICONS } from '../../src/domain/services';
import type { ServiceCategory } from '../../src/domain/services';
import { useGuestGate } from '../../src/hooks/useGuestGate';

export default function ServicesScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useServiceCatalog();
  const categories = data ?? [];
  const { requireAuth, GuestGateModal } = useGuestGate();

  const openCategory = (category: ServiceCategory): void => {
    router.push(`/(app)/services/${category.id}`);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']} testID="services.screen">
      <View style={styles.headerRow}>
        <Text style={styles.title}>Servicios</Text>
        <Pressable
          onPress={(): void => requireAuth(() => router.push('/(app)/services/bookings'))}
          testID="services.myBookings"
          style={styles.myBookingsLink}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.myBookingsText}>Mis reservas</Text>
        </Pressable>
      </View>

      {isPending ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={styles.listContent}
          renderItem={() => <View style={[styles.card, styles.skeletonCard]} />}
        />
      ) : isError ? (
        <View style={styles.stateWrap} testID="services.error">
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
          <Text style={styles.stateTitle}>Algo salió mal</Text>
          <Pressable onPress={(): void => void refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.stateWrap} testID="services.empty">
          <Ionicons name="storefront-outline" size={40} color={colors.textMuted} />
          <Text style={styles.stateTitle}>Aún no hay servicios disponibles en tu zona</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={(): void => openCategory(item)}
              style={styles.card}
              testID={`services.category.${item.id}`}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={CATEGORY_ICONS[item.key]} size={22} color={colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
      <GuestGateModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { ...typography.heading, color: colors.textPrimary },
  myBookingsLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  myBookingsText: { ...typography.bodyStrong, color: colors.primary },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
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
  skeletonCard: { height: 72, backgroundColor: colors.border, opacity: 0.4 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.infoBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  stateTitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  retryButton: {
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
  },
  retryButtonText: { ...typography.button, color: colors.white },
});
