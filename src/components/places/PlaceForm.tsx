import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';

import type { PlaceCategory } from '../../domain/places';
import { CATEGORY_ICONS, CATEGORY_LABELS, placeCategorySchema } from '../../domain/places';
import { colors, radius, spacing, typography } from '../../design/tokens';
import type { PlaceFormValues } from '../../validation/placeSchema';

const CATEGORIES = placeCategorySchema.options;

interface PlaceFormProps {
  lat: number;
  lng: number;
  onSubmit: (values: PlaceFormValues & { lat: number; lng: number }) => void;
  isSubmitting: boolean;
}

export function PlaceForm({ lat, lng, onSubmit, isSubmitting }: PlaceFormProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('park');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (): void => {
    if (name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    setError(null);
    onSubmit({
      name: name.trim(),
      category,
      address: address.trim() || undefined,
      description: description.trim() || undefined,
      lat,
      lng,
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Nombre del lugar *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ej. Parque Núñez"
        placeholderTextColor={colors.textMuted}
        maxLength={120}
        testID="place-form.name"
      />

      <Text style={styles.label}>Categoría *</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategory(cat)}
            style={[styles.chip, category === cat && styles.chipActive]}
            testID={`place-form.category.${cat}`}
          >
            <Text style={styles.chipIcon}>{CATEGORY_ICONS[cat]}</Text>
            <Text style={[styles.chipLabel, category === cat && styles.chipLabelActive]}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Dirección (opcional)</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Calle o colonia"
        placeholderTextColor={colors.textMuted}
        maxLength={200}
        testID="place-form.address"
      />

      <Text style={styles.label}>Descripción (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        placeholder="¿Por qué es pet-friendly? ¿Qué ofrece?"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={300}
        testID="place-form.description"
      />
      <Text style={styles.counter}>{description.length}/300</Text>

      {error != null ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={[styles.submit, isSubmitting && styles.submitDisabled]}
        testID="place-form.submit"
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitLabel}>Agregar lugar</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  textarea: { height: 96, textAlignVertical: 'top', paddingTop: spacing.sm },
  counter: { ...typography.caption, color: colors.textMuted, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: 'rgba(255,138,52,0.08)' },
  chipIcon: { fontSize: 14 },
  chipLabel: { ...typography.caption, color: colors.textSecondary },
  chipLabelActive: { color: colors.primary },
  error: { ...typography.caption, color: colors.danger },
  submit: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.6 },
  submitLabel: { ...typography.button, color: colors.white },
});
