import React from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Place } from '../../domain/places';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../../domain/places';
import { colors, radius, spacing, typography } from '../../design/tokens';

interface PlaceBottomSheetProps {
  place: Place | null;
  visible: boolean;
  onClose: () => void;
  onViewDetail: (placeId: string) => void;
  onUpvote: (placeId: string, currentlyUpvoted: boolean) => void;
  isUpvoting: boolean;
}

export function PlaceBottomSheet({
  place,
  visible,
  onClose,
  onViewDetail,
  onUpvote,
  isUpvoting,
}: PlaceBottomSheetProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="place-bottom-sheet"
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {place == null ? null : (
          <>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.icon}>{CATEGORY_ICONS[place.category] ?? '📍'}</Text>
                <View style={styles.headerInfo}>
                  <Text style={styles.name} numberOfLines={2}>
                    {place.name}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryLabel}>
                      {CATEGORY_LABELS[place.category] ?? 'Lugar'}
                    </Text>
                  </View>
                </View>
              </View>
              <Pressable onPress={onClose} testID="place-sheet.close">
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {place.coverPhotoUrl != null ? (
              <Image
                source={{ uri: place.coverPhotoUrl }}
                style={styles.photo}
                resizeMode="cover"
                testID="place-sheet.photo"
              />
            ) : null}

            {place.address != null ? (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.address} numberOfLines={2}>
                  {place.address}
                </Text>
              </View>
            ) : null}

            {place.description != null ? (
              <Text style={styles.description}>{place.description}</Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                onPress={() => onUpvote(place.id, place.hasUpvoted ?? false)}
                disabled={isUpvoting}
                style={[styles.upvoteBtn, place.hasUpvoted === true && styles.upvoteBtnActive]}
                testID="place-sheet.upvote"
              >
                {isUpvoting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons
                      name={place.hasUpvoted ? 'thumbs-up' : 'thumbs-up-outline'}
                      size={18}
                      color={place.hasUpvoted ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.upvoteLabel,
                        place.hasUpvoted === true && styles.upvoteLabelActive,
                      ]}
                    >
                      {place.upvoteCount}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => onViewDetail(place.id)}
                style={styles.detailBtn}
                testID="place-sheet.detail"
              >
                <Text style={styles.detailBtnLabel}>Ver detalles</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.white} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
    maxHeight: '60%',
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
  headerText: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.sm,
  },
  icon: { fontSize: 28, marginTop: 2 },
  headerInfo: { flex: 1, gap: 4 },
  name: { ...typography.heading, color: colors.textPrimary },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundApp,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryLabel: { ...typography.caption, color: colors.textSecondary },
  photo: {
    height: 140,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  address: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    minWidth: 72,
    justifyContent: 'center',
  },
  upvoteBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 138, 52, 0.08)',
  },
  upvoteLabel: { ...typography.button, color: colors.textSecondary },
  upvoteLabelActive: { color: colors.primary },
  detailBtn: {
    flex: 1,
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
