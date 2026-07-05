import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import type { PlaceCategory } from '../../../src/domain/places';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../../../src/domain/places';
import { colors, radius, spacing, typography } from '../../../src/design/tokens';
import { usePlaceDetail, useUpvotePlace } from '../../../src/hooks/usePlaces';
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';

export default function PlaceDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: place, isLoading, isError } = usePlaceDetail(id ?? '');
  const upvoteMutation = useUpvotePlace();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (isError || place == null) {
    return (
      <View style={styles.center}>
        <Ionicons name="location-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorTitle}>No se pudo cargar este lugar</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnLabel}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const icon = CATEGORY_ICONS[place.category as PlaceCategory] ?? '📍';
  const categoryLabel = CATEGORY_LABELS[place.category as PlaceCategory] ?? 'Lugar';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={place.name} onBack={() => router.back()} testID="place-detail" />

      {place.coverPhotoUrl != null ? (
        <Image
          source={{ uri: place.coverPhotoUrl }}
          style={styles.photo}
          resizeMode="cover"
          testID="place-detail.photo"
        />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.placeholderIcon}>{icon}</Text>
        </View>
      )}

      <View style={styles.nameRow}>
        <View>
          <Text style={styles.name}>{place.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryIcon}>{icon}</Text>
            <Text style={styles.categoryLabel}>{categoryLabel}</Text>
          </View>
        </View>
        <Pressable
          onPress={() =>
            upvoteMutation.mutate({
              placeId: place.id,
              currentlyUpvoted: place.hasUpvoted ?? false,
            })
          }
          disabled={upvoteMutation.isPending}
          style={[styles.upvoteBtn, place.hasUpvoted === true && styles.upvoteBtnActive]}
          testID="place-detail.upvote"
        >
          {upvoteMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons
                name={place.hasUpvoted ? 'thumbs-up' : 'thumbs-up-outline'}
                size={18}
                color={place.hasUpvoted ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[styles.upvoteCount, place.hasUpvoted === true && styles.upvoteCountActive]}
              >
                {place.upvoteCount}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {place.address != null ? (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>{place.address}</Text>
        </View>
      ) : null}

      {place.description != null ? (
        <Text style={styles.description}>{place.description}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  content: { paddingBottom: spacing.xxxl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  errorTitle: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  backBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  backBtnLabel: { ...typography.button, color: colors.white },
  photo: { marginHorizontal: spacing.md, height: 220, borderRadius: radius.xl },
  photoPlaceholder: {
    marginHorizontal: spacing.md,
    height: 220,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: { fontSize: 64 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  name: { ...typography.heading, color: colors.textPrimary, flex: 1 },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  categoryIcon: { fontSize: 14 },
  categoryLabel: { ...typography.caption, color: colors.textSecondary },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    minWidth: 64,
    justifyContent: 'center',
  },
  upvoteBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(255,138,52,0.08)' },
  upvoteCount: { ...typography.button, color: colors.textSecondary },
  upvoteCountActive: { color: colors.primary },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  infoText: { ...typography.body, color: colors.textSecondary, flex: 1 },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
