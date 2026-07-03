import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { MAX_REPORT_DESCRIPTION_LENGTH } from '../../../config/constants';
import { colors, radius, spacing, typography } from '../../../design/tokens';
import { combineReportDateTime } from '../../../validation/reportLostSchema';
import {
  strayReportWizardDataFormSchema,
  type StrayReportWizardDataForm,
} from '../../../validation/strayReportSchema';
import { DateTimeField } from './DateTimeField';
import { LocationField } from './LocationField';
import { PhotoPicker } from './PhotoPicker';

type Species = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';

const SPECIES_OPTIONS: { value: Species; label: string; emoji: string }[] = [
  { value: 'dog', label: 'Perro', emoji: '🐶' },
  { value: 'cat', label: 'Gato', emoji: '🐱' },
  { value: 'bird', label: 'Ave', emoji: '🐦' },
  { value: 'rabbit', label: 'Conejo', emoji: '🐰' },
  { value: 'other', label: 'Otro', emoji: '🐾' },
];

export interface StrayReportDataResult {
  species: Species;
  lat: number;
  lng: number;
  seenAt: Date;
  color?: string;
  description: string;
  photoUris: string[];
}

export interface StrayReportDataStepProps {
  initialLocation: { lat: number; lng: number };
  onSubmit: (result: StrayReportDataResult) => void;
}

export function StrayReportDataStep({
  initialLocation,
  onSubmit,
}: StrayReportDataStepProps): React.ReactElement {
  const [location, setLocation] = useState(initialLocation);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StrayReportWizardDataForm>({
    resolver: zodResolver(strayReportWizardDataFormSchema),
    defaultValues: {
      species: 'dog',
      seenDate: new Date(),
      seenTime: new Date(),
      color: '',
      description: '',
    },
  });

  const species = watch('species');
  const seenDate = watch('seenDate');
  const seenTime = watch('seenTime');
  const descriptionLen = watch('description')?.length ?? 0;

  const onValid = handleSubmit((data) => {
    if (photoUris.length === 0) {
      setPhotoError('Agrega al menos una foto');
      return;
    }
    setPhotoError(null);
    onSubmit({
      species: data.species,
      lat: location.lat,
      lng: location.lng,
      seenAt: combineReportDateTime(data.seenDate, data.seenTime),
      color: data.color?.trim() || undefined,
      description: data.description.trim(),
      photoUris,
    });
  });

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.fieldLabel}>¿Qué tipo de animal?</Text>
      <View style={styles.speciesRow}>
        {SPECIES_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setValue('species', opt.value)}
            style={[styles.speciesChip, species === opt.value && styles.speciesChipActive]}
            testID={`radar.wizard.stray.species.${opt.value}`}
          >
            <Text style={styles.speciesEmoji}>{opt.emoji}</Text>
            <Text style={[styles.speciesLabel, species === opt.value && styles.speciesLabelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>
        Fotos <Text style={styles.req}>*</Text>
      </Text>
      <PhotoPicker
        onChange={(next) => {
          setPhotoUris(next);
          if (next.length > 0) setPhotoError(null);
        }}
        photoUris={photoUris}
        testID="radar.wizard.stray.photos"
      />
      {photoError ? <Text style={styles.fieldError}>{photoError}</Text> : null}

      <Text style={styles.fieldLabel}>
        Fecha y hora del avistamiento <Text style={styles.req}>*</Text>
      </Text>
      <DateTimeField
        dateValue={seenDate}
        timeValue={seenTime}
        onChangeDate={(d) => setValue('seenDate', d)}
        onChangeTime={(t) => setValue('seenTime', t)}
        testID="radar.wizard.stray.seenAt"
      />

      <Text style={styles.fieldLabel}>Ubicación del avistamiento</Text>
      <LocationField
        lat={location.lat}
        lng={location.lng}
        onChange={(lat, lng) => setLocation({ lat, lng })}
        testID="radar.wizard.stray.location"
      />

      <Text style={styles.fieldLabel}>Color (opcional)</Text>
      <Controller
        control={control}
        name="color"
        render={({ field: { value, onChange } }) => (
          <TextInput
            maxLength={100}
            onChangeText={onChange}
            placeholder="Ej. café con manchas blancas"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            testID="radar.wizard.stray.color"
            value={value}
          />
        )}
      />

      <Text style={styles.fieldLabel}>
        Descripción <Text style={styles.req}>*</Text>
      </Text>
      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange } }) => (
          <TextInput
            maxLength={MAX_REPORT_DESCRIPTION_LENGTH}
            multiline
            onChangeText={onChange}
            placeholder="Collar, tamaño, comportamiento…"
            placeholderTextColor={colors.textMuted}
            style={styles.textArea}
            testID="radar.wizard.stray.description"
            value={value}
          />
        )}
      />
      <Text style={styles.counter}>
        {descriptionLen}/{MAX_REPORT_DESCRIPTION_LENGTH} caracteres
      </Text>
      {errors.description ? (
        <Text style={styles.fieldError}>{errors.description.message}</Text>
      ) : null}

      <Pressable onPress={onValid} style={styles.primaryBtn} testID="radar.wizard.stray.continue">
        <Text style={styles.primaryBtnText}>Ver vista previa</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  fieldLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  req: { color: colors.danger },
  speciesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
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
  speciesChipActive: { borderColor: colors.accent, backgroundColor: 'rgba(255, 138, 52, 0.08)' },
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
  },
  textArea: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  counter: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  fieldError: { ...typography.caption, color: colors.danger, marginTop: 4 },
  primaryBtn: {
    marginTop: spacing.lg,
    height: 54,
    borderRadius: radius.button,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { ...typography.button, color: colors.white },
});
