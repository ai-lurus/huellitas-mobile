import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadows, spacing, typography } from '../../../design/tokens';
import type { Pet } from '../../../domain/pets';

export interface ReportTypeStepProps {
  pets: Pet[];
  onSelectLost: (petId: string) => void;
  onSelectStray: () => void;
  onNoPets: () => void;
}

export function ReportTypeStep({
  pets,
  onSelectLost,
  onSelectStray,
  onNoPets,
}: ReportTypeStepProps): React.ReactElement {
  const [choosingPet, setChoosingPet] = useState(false);

  function handlePressLost(): void {
    if (pets.length === 0) {
      onNoPets();
      return;
    }
    if (pets.length === 1) {
      onSelectLost(pets[0].id);
      return;
    }
    setChoosingPet(true);
  }

  if (choosingPet) {
    return (
      <View style={styles.wrap} testID="radar.wizard.type.petPicker">
        <Text style={styles.title}>¿Cuál mascota se perdió?</Text>
        {pets.map((pet) => (
          <Pressable
            key={pet.id}
            onPress={() => onSelectLost(pet.id)}
            style={styles.petRow}
            testID={`radar.wizard.type.pet.${pet.id}`}
          >
            {pet.photos?.[0] ? (
              <Image source={{ uri: pet.photos[0] }} style={styles.petAvatar} />
            ) : (
              <View style={styles.petAvatarPlaceholder}>
                <Ionicons color={colors.textMuted} name="paw" size={20} />
              </View>
            )}
            <Text style={styles.petName}>{pet.name ?? 'Mascota sin nombre'}</Text>
            <Ionicons color={colors.textSecondary} name="chevron-forward" size={18} />
          </Pressable>
        ))}
        <Pressable onPress={() => setChoosingPet(false)} testID="radar.wizard.type.petPicker.back">
          <Text style={styles.backLink}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>¿Qué quieres reportar?</Text>
      <Pressable onPress={handlePressLost} style={styles.card} testID="radar.wizard.type.lost">
        <View style={[styles.cardIcon, { backgroundColor: colors.dangerSoft }]}>
          <Ionicons color={colors.danger} name="alert-circle" size={26} />
        </View>
        <View style={styles.cardTextWrap}>
          <Text style={styles.cardTitle}>Perdí a mi mascota</Text>
          <Text style={styles.cardSubtitle}>
            Publica una alerta para que la comunidad te ayude a encontrarla.
          </Text>
        </View>
        <Ionicons color={colors.textSecondary} name="chevron-forward" size={20} />
      </Pressable>

      <Pressable onPress={onSelectStray} style={styles.card} testID="radar.wizard.type.stray">
        <View style={[styles.cardIcon, { backgroundColor: 'rgba(255, 138, 52, 0.12)' }]}>
          <Ionicons color={colors.accent} name="paw" size={26} />
        </View>
        <View style={styles.cardTextWrap}>
          <Text style={styles.cardTitle}>Encontré un animal</Text>
          <Text style={styles.cardSubtitle}>
            Reporta un animal suelto para ayudar a identificar a su dueño.
          </Text>
        </View>
        <Ionicons color={colors.textSecondary} name="chevron-forward" size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.md },
  title: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.md,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: { flex: 1, gap: 2 },
  cardTitle: { ...typography.bodyStrong, fontSize: 17, color: colors.textPrimary },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  petAvatar: { width: 44, height: 44, borderRadius: 22 },
  petAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petName: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
  backLink: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
