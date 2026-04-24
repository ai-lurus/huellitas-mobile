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
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import type { Pet, PetSex, PetSpecies } from '../../domain/pets';
import { SPECIES_LABELS } from './speciesIconAssets';

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

const SEX_LABEL: Record<PetSex, string> = {
  male: 'Macho',
  female: 'Hembra',
  unknown: 'Desconocido',
};

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

export interface PetDetailProps {
  pet: Pet;
  onBack: () => void;
  onEdit: () => void;
  onReportLost: () => void;
  onMarkFound: () => void;
  onDelete: () => void;
}

export function PetDetail({
  pet,
  onBack,
  onEdit,
  onReportLost,
  onMarkFound,
  onDelete,
}: PetDetailProps): React.ReactElement {
  const { width } = useWindowDimensions();
  const carouselHeight = Math.round(width * 0.62);
  const species = pet.species ?? 'other';
  const photos = useMemo(() => (pet.photos ?? []).filter(isNonEmptyString), [pet.photos]);
  const gallery = photos.length
    ? photos
    : [
        // fallback: fondo default por especie
        '',
      ];

  const [page, setPage] = useState(0);

  const sex = pet.sex ?? 'unknown';
  const speciesLabel = SPECIES_LABELS[species];
  const sexLabel = SEX_LABEL[sex];

  const breed = pet.breed?.trim() || '—';
  const color = pet.color?.trim() || '—';
  const age = typeof pet.age === 'number' ? `${pet.age} años` : '—';
  const notes = pet.notes?.trim() || '—';
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
              {uri ? (
                <Image source={{ uri }} style={styles.heroImg} />
              ) : (
                <View style={styles.heroFallback}>
                  <Image
                    source={defaultCoverForSpecies(species)}
                    style={styles.heroDefaultBg}
                    resizeMode="cover"
                    accessibilityLabel="Fondo por defecto"
                  />
                </View>
              )}
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        <View style={styles.chips}>
          <Image
            testID="petDetail.speciesBadge"
            source={speciesBadgeAsset(species)}
            style={styles.speciesBadge}
            resizeMode="contain"
            accessibilityLabel={speciesLabel}
          />
          <View style={[styles.chip, { backgroundColor: '#E7E9FF' }]}>
            <Text style={[styles.chipText, { color: colors.primary }]}>{sexLabel}</Text>
          </View>
        </View>

        {status === 'lost' ? (
          <View style={styles.lostNotice} accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={18} color={colors.navActive} />
            <View style={styles.lostNoticeText}>
              <Text style={styles.lostNoticeTitle}>Reportado</Text>
              <Text style={styles.lostNoticeSub}>Si lo encontraste, contacta al dueño.</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.grid}>
          <InfoCard label="RAZA" value={breed} />
          <InfoCard label="COLOR" value={color} />
          <InfoCard label="EDAD" value={age} />
          <InfoCard
            label="ESTADO"
            value={status === 'lost' ? 'Perdido' : 'En casa'}
            dotColor={status === 'lost' ? colors.navActive : colors.success}
          />
        </View>

        <View style={styles.notesCard}>
          <Text style={styles.sectionLabel}>NOTAS</Text>
          <Text style={styles.notesText}>{notes}</Text>
        </View>

        <Pressable
          testID="petDetail.reportLost"
          onPress={status === 'lost' ? onMarkFound : onReportLost}
          style={[
            styles.primaryAction,
            { backgroundColor: status === 'lost' ? colors.success : colors.navActive },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            status === 'lost' ? 'Marcar como encontrado' : 'Reportar como perdido'
          }
        >
          <Text style={styles.primaryActionText}>
            {status === 'lost' ? 'Marcar como encontrado' : 'Reportar como perdido'}
          </Text>
          <Ionicons
            name={status === 'lost' ? 'checkmark' : 'location-outline'}
            size={18}
            color={colors.white}
          />
        </Pressable>

        <Pressable
          testID="petDetail.delete"
          onPress={onDelete}
          style={styles.deleteAction}
          accessibilityRole="button"
          accessibilityLabel="Eliminar tarjeta"
        >
          <Text style={styles.deleteActionText}>Eliminar tarjeta</Text>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InfoCard({
  label,
  value,
  dotColor,
}: {
  label: string;
  value: string;
  dotColor?: string;
}): React.ReactElement {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueRow}>
        {dotColor ? <View style={[styles.statusDot, { backgroundColor: dotColor }]} /> : null}
        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundApp },
  carouselWrap: { width: '100%', backgroundColor: colors.backgroundApp },
  heroImg: { width: '100%', height: '100%' },
  heroFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEE8E2',
    overflow: 'hidden',
  },
  heroDefaultBg: { width: '100%', height: '100%' },
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

  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { color: colors.textPrimary, ...typography.title, flex: 1 },
  statusBadge: { height: 26, width: 160 },

  chips: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  speciesBadge: { height: 36, width: 118, alignSelf: 'center' },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.full },
  chipText: { ...typography.bodyStrong },

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

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  infoCard: {
    width: '48%',
    minWidth: 150,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoLabel: { color: colors.textMuted, ...typography.caption, letterSpacing: 0.6 },
  infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  infoValue: { color: colors.textPrimary, ...typography.bodyStrong, flexShrink: 1 },

  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  sectionLabel: { color: colors.textMuted, ...typography.caption, letterSpacing: 0.6 },
  notesText: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
    fontSize: 15,
    marginTop: spacing.xs,
    lineHeight: 24,
  },

  primaryAction: {
    marginTop: spacing.lg,
    height: 54,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.button,
  },
  primaryActionText: { color: colors.white, ...typography.button },

  deleteAction: {
    marginTop: spacing.sm,
    height: 54,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: '#F2B7B7',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  deleteActionText: { color: colors.danger, ...typography.button },
});
