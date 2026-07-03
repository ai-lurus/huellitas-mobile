import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import type { Pet, PetSex } from '../../domain/pets';
import { computeAgeLabel } from '../../utils/date.utils';

const SEX_LABEL: Record<PetSex, string> = {
  male: 'Macho',
  female: 'Hembra',
  unknown: 'Desconocido',
};

export interface PetDatosTabProps {
  pet: Pet;
  onReportLost: () => void;
  onMarkFound: () => void;
  onQrCode: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function PetDatosTab({
  pet,
  onReportLost,
  onMarkFound,
  onQrCode,
  onDelete,
  isDeleting = false,
}: PetDatosTabProps): React.ReactElement {
  const status = pet.status ?? (pet.isLost ? 'lost' : undefined);
  const breed = pet.breed?.trim() || '—';
  const color = pet.color?.trim() || '—';
  const sexLabel = SEX_LABEL[pet.sex ?? 'unknown'];
  const age =
    computeAgeLabel(pet.birthDate) ??
    (typeof pet.age === 'number' ? `${pet.age} años` : 'Edad no especificada');
  const weight = typeof pet.weightKg === 'number' ? `${pet.weightKg} kg` : '—';
  const notes = pet.notes?.trim() || '—';

  return (
    <View style={styles.root} testID="petProfile.tab.datos.content">
      <View style={styles.grid}>
        <InfoCard label="RAZA" value={breed} />
        <InfoCard label="SEXO" value={sexLabel} />
        <InfoCard label="EDAD" value={age} />
        <InfoCard label="COLOR" value={color} />
        <InfoCard label="PESO" value={weight} />
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
        accessibilityLabel={status === 'lost' ? 'Marcar como encontrado' : 'Reportar como perdido'}
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
        testID="petDetail.qr"
        onPress={onQrCode}
        style={styles.qrAction}
        accessibilityRole="button"
        accessibilityLabel="Ver código QR"
      >
        <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
        <Text style={styles.qrActionText}>Código QR</Text>
      </Pressable>

      <Pressable
        testID="petDetail.delete"
        onPress={isDeleting ? undefined : onDelete}
        style={[styles.deleteAction, isDeleting ? styles.deleteActionDisabled : null]}
        accessibilityRole="button"
        accessibilityLabel="Eliminar tarjeta"
        accessibilityState={{ disabled: isDeleting }}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color={colors.danger} />
        ) : (
          <>
            <Text style={styles.deleteActionText}>Eliminar tarjeta</Text>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </>
        )}
      </Pressable>
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
  root: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
    marginTop: spacing.sm,
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
  deleteActionDisabled: { opacity: 0.5 },
  deleteActionText: { color: colors.danger, ...typography.button },
  qrAction: {
    marginTop: spacing.sm,
    height: 54,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  qrActionText: { color: colors.primary, ...typography.button },
});
