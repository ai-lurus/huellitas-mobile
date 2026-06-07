import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { StrayReportSubmitInput } from '../../validation/strayReportSchema';
import { colors, radius, spacing, typography } from '../../design/tokens';

type Species = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';

interface StrayFormProps {
  lat: number;
  lng: number;
  onSubmit: (input: StrayReportSubmitInput) => void;
  isSubmitting: boolean;
}

const SPECIES_OPTIONS: { value: Species; label: string; emoji: string }[] = [
  { value: 'dog', label: 'Perro', emoji: '🐶' },
  { value: 'cat', label: 'Gato', emoji: '🐱' },
  { value: 'bird', label: 'Ave', emoji: '🐦' },
  { value: 'rabbit', label: 'Conejo', emoji: '🐰' },
  { value: 'other', label: 'Otro', emoji: '🐾' },
];

export function StrayForm({ lat, lng, onSubmit, isSubmitting }: StrayFormProps): React.JSX.Element {
  const [species, setSpecies] = useState<Species>('dog');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(): void {
    if (!species) {
      setError('Selecciona el tipo de animal');
      return;
    }
    setError(null);
    onSubmit({
      species,
      lat,
      lng,
      color: color.trim() || undefined,
      description: description.trim() || undefined,
    });
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.sectionLabel}>¿Qué tipo de animal?</Text>
      <View style={styles.speciesRow}>
        {SPECIES_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setSpecies(opt.value)}
            style={[styles.speciesChip, species === opt.value && styles.speciesChipActive]}
            testID={`stray-form.species.${opt.value}`}
          >
            <Text style={styles.speciesEmoji}>{opt.emoji}</Text>
            <Text style={[styles.speciesLabel, species === opt.value && styles.speciesLabelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Color (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. café con manchas blancas"
        placeholderTextColor={colors.textMuted}
        value={color}
        onChangeText={setColor}
        maxLength={100}
        testID="stray-form.color"
      />

      <Text style={styles.sectionLabel}>Descripción (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Collar, tamaño, comportamiento…"
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
        maxLength={300}
        multiline
        numberOfLines={4}
        testID="stray-form.description"
      />
      <Text style={styles.charCount}>{description.length}/300</Text>

      {error != null ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
        testID="stray-form.submit"
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitLabel}>Reportar animal</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.md, gap: spacing.xs },
  sectionLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  speciesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  speciesChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  speciesChipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(255, 138, 52, 0.08)',
  },
  speciesEmoji: { fontSize: 20 },
  speciesLabel: { ...typography.caption, color: colors.textSecondary },
  speciesLabelActive: { color: colors.accent, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  textArea: { height: 88, textAlignVertical: 'top' },
  charCount: { ...typography.caption, color: colors.textMuted, alignSelf: 'flex-end' },
  errorText: { ...typography.caption, color: colors.danger },
  submitBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitLabel: { ...typography.button, color: colors.white },
});
