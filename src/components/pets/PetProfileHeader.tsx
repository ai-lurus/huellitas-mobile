import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { PetPhoto } from '../common/PetPhoto';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import type { Pet, PetSpecies } from '../../domain/pets';

import LOST_BADGE from '../../../assets/badges/badge-perdido.png';
import FOUND_BADGE from '../../../assets/badges/badge-encontrado.png';

import DOG_DEFAULT from '../../../assets/pet-defaults/dog.png';
import CAT_DEFAULT from '../../../assets/pet-defaults/cat.png';
import BIRD_DEFAULT from '../../../assets/pet-defaults/bird.png';
import RABBIT_DEFAULT from '../../../assets/pet-defaults/rabbit.png';
import OTHER_DEFAULT from '../../../assets/pet-defaults/other.png';

import DOG_SPECIES_BADGE from '../../../assets/pet-detail-species/dog.png';
import CAT_SPECIES_BADGE from '../../../assets/pet-detail-species/cat.png';
import BIRD_SPECIES_BADGE from '../../../assets/pet-detail-species/bird.png';
import RABBIT_SPECIES_BADGE from '../../../assets/pet-detail-species/rabbit.png';
import OTHER_SPECIES_BADGE from '../../../assets/pet-detail-species/other.png';

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function defaultCoverForSpecies(species: PetSpecies): number {
  switch (species) {
    case 'dog':
      return DOG_DEFAULT;
    case 'cat':
      return CAT_DEFAULT;
    case 'bird':
      return BIRD_DEFAULT;
    case 'rabbit':
      return RABBIT_DEFAULT;
    default:
      return OTHER_DEFAULT;
  }
}

function speciesBadgeAsset(species: PetSpecies): number {
  switch (species) {
    case 'dog':
      return DOG_SPECIES_BADGE;
    case 'cat':
      return CAT_SPECIES_BADGE;
    case 'bird':
      return BIRD_SPECIES_BADGE;
    case 'rabbit':
      return RABBIT_SPECIES_BADGE;
    default:
      return OTHER_SPECIES_BADGE;
  }
}

export interface PetProfileHeaderProps {
  pet: Pet;
  onBack: () => void;
  onEdit: () => void;
}

export function PetProfileHeader({
  pet,
  onBack,
  onEdit,
}: PetProfileHeaderProps): React.ReactElement {
  const { width } = useWindowDimensions();
  const carouselHeight = Math.round(width * 0.5);
  const species = pet.species ?? 'other';
  const photos = useMemo(() => (pet.photos ?? []).filter(isNonEmptyString), [pet.photos]);
  const gallery = photos.length ? photos : [''];

  const [page, setPage] = useState(0);

  const status = pet.status ?? (pet.isLost ? 'lost' : undefined);
  const badgeSource = status === 'lost' ? LOST_BADGE : status === 'found' ? FOUND_BADGE : null;

  return (
    <View style={styles.root}>
      <View style={[styles.carouselWrap, { height: carouselHeight }]}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const next = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width));
            setPage(next);
          }}
          testID="petDetail.gallery"
        >
          {gallery.map((uri, idx) => (
            <View key={`${uri}-${idx}`} style={{ width, height: carouselHeight }}>
              <PetPhoto
                uri={uri || null}
                fallback={defaultCoverForSpecies(species)}
                style={styles.heroImg}
                resizeMode="cover"
                fallbackResizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>

        <Pressable
          testID="petDetail.back"
          onPress={onBack}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          testID="petDetail.edit"
          onPress={onEdit}
          style={[styles.editBtn, styles.editBtnShadow]}
          accessibilityRole="button"
          accessibilityLabel="Editar"
        >
          <Ionicons name="pencil" size={16} color={colors.white} />
          <Text style={styles.editBtnText}>Editar</Text>
        </Pressable>

        {gallery.length > 1 ? (
          <View style={styles.dots}>
            {gallery.map((_, idx) => (
              <View key={idx} style={[styles.dot, idx === page ? styles.dotActive : null]} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {pet.name ?? 'Mascota'}
          </Text>
          {badgeSource ? (
            <Image
              source={badgeSource}
              style={styles.statusBadge}
              resizeMode="contain"
              accessibilityLabel={status === 'lost' ? 'Perdido' : 'Encontrado'}
            />
          ) : null}
        </View>

        <Image
          testID="petDetail.speciesBadge"
          source={speciesBadgeAsset(species)}
          style={styles.speciesBadge}
          resizeMode="contain"
          accessibilityLabel={species}
        />

        {status === 'lost' ? (
          <View style={styles.lostNotice} accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={18} color={colors.navActive} />
            <View style={styles.lostNoticeText}>
              <Text style={styles.lostNoticeTitle}>Reportado</Text>
              <Text style={styles.lostNoticeSub}>Si lo encontraste, contacta al dueño.</Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.backgroundApp },
  carouselWrap: { width: '100%', backgroundColor: colors.backgroundApp },
  heroImg: { width: '100%', height: '100%' },
  dots: {
    position: 'absolute',
    bottom: spacing.sm,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: { backgroundColor: colors.white },

  iconBtn: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  editBtnShadow: { ...shadows.button },
  editBtnText: { color: colors.white, ...typography.bodyStrong },

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { color: colors.textPrimary, ...typography.title, flex: 1 },
  statusBadge: { height: 26, width: 160 },

  speciesBadge: { height: 32, width: 104, alignSelf: 'center' },

  lostNotice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: '#FFEDE5',
    borderWidth: 1,
    borderColor: '#FFCAB8',
    alignItems: 'flex-start',
  },
  lostNoticeText: { flex: 1 },
  lostNoticeTitle: { color: colors.navActive, ...typography.bodyStrong },
  lostNoticeSub: {
    color: colors.textSecondary,
    ...typography.caption,
    marginTop: 2,
    lineHeight: 18,
  },
});
