import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Route } from '../../domain/routes';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../../domain/routes';
import { colors, radius, spacing, typography } from '../../design/tokens';

interface RouteBottomSheetProps {
  route: Route | null;
  visible: boolean;
  onClose: () => void;
  onViewDetail: (routeId: string) => void;
  onRate: (routeId: string, rating: number) => void;
  isRating: boolean;
}

function Stars({
  value,
  onSelect,
}: {
  value: number;
  onSelect?: (n: number) => void;
}): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onSelect?.(n)} hitSlop={6}>
          <Ionicons
            name={n <= Math.round(value) ? 'star' : 'star-outline'}
            size={onSelect ? 26 : 16}
            color="#F59E0B"
          />
        </Pressable>
      ))}
    </View>
  );
}

export function RouteBottomSheet({
  route,
  visible,
  onClose,
  onViewDetail,
  onRate,
  isRating,
}: RouteBottomSheetProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="route-bottom-sheet"
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {route == null ? null : (
          <>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.name} numberOfLines={2}>
                  {route.name}
                </Text>
                <View style={styles.badges}>
                  {route.difficulty != null ? (
                    <View
                      style={[
                        styles.diffBadge,
                        { borderColor: DIFFICULTY_COLORS[route.difficulty] },
                      ]}
                    >
                      <Text
                        style={[styles.diffLabel, { color: DIFFICULTY_COLORS[route.difficulty] }]}
                      >
                        {DIFFICULTY_LABELS[route.difficulty]}
                      </Text>
                    </View>
                  ) : null}
                  {route.offLeashAllowed ? (
                    <View style={styles.offLeashBadge}>
                      <Text style={styles.offLeashLabel}>🐕 Sin correa</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Pressable onPress={onClose} testID="route-sheet.close">
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.stats}>
              {route.distanceKm != null ? (
                <View style={styles.stat}>
                  <Ionicons name="navigate-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.statText}>{route.distanceKm.toFixed(1)} km</Text>
                </View>
              ) : null}
              {route.estimatedMinutes != null ? (
                <View style={styles.stat}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.statText}>{route.estimatedMinutes} min</Text>
                </View>
              ) : null}
              <View style={styles.stat}>
                <Stars value={route.ratingAvg} />
                <Text style={styles.statText}>({route.ratingCount})</Text>
              </View>
            </View>

            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Tu valoración:</Text>
              {isRating ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Stars value={route.userRating ?? 0} onSelect={(n) => onRate(route.id, n)} />
              )}
            </View>

            <Pressable
              onPress={() => onViewDetail(route.id)}
              style={styles.detailBtn}
              testID="route-sheet.detail"
            >
              <Text style={styles.detailBtnLabel}>Ver ruta completa</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.white} />
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerText: { flex: 1, gap: 6 },
  name: { ...typography.heading, color: colors.textPrimary },
  badges: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  diffBadge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  diffLabel: { ...typography.caption, fontWeight: '600' },
  offLeashBadge: {
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  offLeashLabel: { ...typography.caption, color: colors.success },
  stats: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', marginBottom: spacing.sm },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...typography.caption, color: colors.textSecondary },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rateLabel: { ...typography.label, color: colors.textSecondary },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
  },
  detailBtnLabel: { ...typography.button, color: colors.white },
});
