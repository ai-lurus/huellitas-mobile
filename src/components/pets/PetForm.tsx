import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { colors, control, radius, shadows, spacing, typography } from '../../design/tokens';
import type { PetSex } from '../../domain/pets';
import {
  petFormSchema,
  type PetFormInput,
  type PetFormValues,
} from '../../validation/petFormSchema';
import { SPECIES_ICON_ASSETS, SPECIES_LABELS, SPECIES_ORDER } from './speciesIconAssets';

type SelectOption<T extends string> = { value: T; label: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function getPickerErrorCopy(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (isRecord(err) && typeof err['message'] === 'string') return String(err['message']);
  return 'No se pudo abrir la galería. Intenta de nuevo.';
}

export type PetFormSubmitPayload = Omit<PetFormValues, 'photos'> & { photos: string[] };

export interface PetFormProps {
  defaultValues?: Partial<PetFormInput>;
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmit: (data: PetFormSubmitPayload) => void | Promise<void>;
  onCancel: () => void;
}

export function PetForm({
  defaultValues,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
}: PetFormProps): React.ReactElement {
  const sexOptions: SelectOption<PetSex>[] = useMemo(
    () => [
      { value: 'male', label: 'Macho' },
      { value: 'female', label: 'Hembra' },
      { value: 'unknown', label: 'Desconocido' },
    ],
    [],
  );

  const [pickerError, setPickerError] = useState<string | null>(null);
  const [openSelect, setOpenSelect] = useState<null | 'sex'>(null);

  const {
    control: rhfControl,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PetFormInput>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: '',
      species: 'dog',
      sex: 'unknown',
      breed: '',
      color: '',
      age: '',
      notes: '',
      photos: [],
      ...defaultValues,
    },
    mode: 'onSubmit',
  });

  const photos = watch('photos') ?? [];
  const remainingPhotos = Math.max(0, 5 - photos.length);

  const pickPhotos = async (): Promise<void> => {
    setPickerError(null);
    if (remainingPhotos <= 0) return;

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setPickerError('Necesitas permisos para acceder a tus fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // `MediaTypeOptions` está deprecado en versiones nuevas.
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingPhotos,
        quality: 0.85,
      });

      if (result.canceled) return;
      const newUris = (result.assets ?? [])
        .map((a) => a.uri)
        .filter((u): u is string => typeof u === 'string' && u.length > 0);
      if (!newUris.length) return;

      const next = [...photos, ...newUris].slice(0, 5);
      setValue('photos', next, { shouldValidate: true });
    } catch (err: unknown) {
      setPickerError(getPickerErrorCopy(err));
    }
  };

  const removePhoto = (index: number): void => {
    const next = photos.filter((_, i) => i !== index);
    setValue('photos', next, { shouldValidate: true });
  };

  const submit = handleSubmit(async (values) => {
    setPickerError(null);
    const parsed: PetFormValues = petFormSchema.parse(values);
    await onSubmit({
      name: parsed.name,
      species: parsed.species,
      breed: parsed.breed,
      color: parsed.color,
      sex: parsed.sex,
      age: parsed.age,
      notes: parsed.notes,
      photos: parsed.photos ?? [],
    });
  });

  const currentSpecies = watch('species');
  const sexLabel = sexOptions.find((o) => o.value === watch('sex'))?.label ?? 'Selecciona';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {submitError ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Ionicons
              name="alert-circle-outline"
              size={control.icon}
              color={colors.dangerIcon}
              style={styles.errorBannerIcon}
            />
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}

        {pickerError ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Ionicons
              name="alert-circle-outline"
              size={control.icon}
              color={colors.dangerIcon}
              style={styles.errorBannerIcon}
            />
            <Text style={styles.errorBannerText}>{pickerError}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>FOTOS (HASTA 5)</Text>
        <View style={styles.photosRow}>
          <View style={styles.photoSlot} accessibilityLabel="Foto principal">
            <Image
              source={SPECIES_ICON_ASSETS[currentSpecies].default}
              style={styles.photoSlotSpeciesIcon}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>

          {photos.map((uri, idx) => (
            <View key={`${uri}-${idx}`} style={styles.photoThumbWrap}>
              <Image source={{ uri }} style={styles.photoThumb} />
              <Pressable
                testID={`petForm.photo.remove.${idx}`}
                onPress={() => removePhoto(idx)}
                style={styles.photoRemove}
                accessibilityLabel="Eliminar foto"
              >
                <Ionicons name="close" size={14} color={colors.white} />
              </Pressable>
            </View>
          ))}

          {photos.length < 5 ? (
            <Pressable
              testID="petForm.photo.add"
              onPress={pickPhotos}
              style={[styles.photoAdd, remainingPhotos <= 0 ? styles.disabled : null]}
              accessibilityRole="button"
              accessibilityLabel="Agregar foto"
            >
              <Ionicons name="add" size={22} color={colors.textSecondary} />
              <Text style={styles.photoAddText}>Agregar</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.photoHint}>{photos.length} de 5 fotos agregadas</Text>
        {errors.photos?.message ? (
          <Text style={styles.fieldError}>{errors.photos.message}</Text>
        ) : null}

        <Text style={styles.sectionLabel}>INFORMACIÓN BÁSICA</Text>

        <Text style={styles.inputLabel}>Nombre *</Text>
        <Controller
          control={rhfControl}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              testID="petForm.name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Nombre"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, errors.name ? styles.inputError : null]}
              maxLength={50}
              editable={!isSubmitting}
            />
          )}
        />
        {errors.name?.message ? <Text style={styles.fieldError}>{errors.name.message}</Text> : null}

        <Text style={styles.inputLabel}>Especie *</Text>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.speciesRow}
          testID="petForm.species"
        >
          {SPECIES_ORDER.map((sp) => {
            const selected = currentSpecies === sp;
            const assets = SPECIES_ICON_ASSETS[sp];
            return (
              <Pressable
                key={sp}
                testID={`petForm.species.${sp}`}
                onPress={() => setValue('species', sp, { shouldValidate: true })}
                style={[
                  styles.speciesChip,
                  selected ? styles.speciesChipSelected : styles.speciesChipIdle,
                  errors.species ? styles.speciesChipErrorOutline : null,
                ]}
                disabled={isSubmitting}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={SPECIES_LABELS[sp]}
              >
                <Image
                  source={selected ? assets.selected : assets.default}
                  style={styles.speciesChipImage}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.inputLabel}>Raza</Text>
        <Controller
          control={rhfControl}
          name="breed"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              testID="petForm.breed"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ej. Golden Retriever"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              editable={!isSubmitting}
            />
          )}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.inputLabel}>Color</Text>
            <Controller
              control={rhfControl}
              name="color"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="petForm.color"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Color"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  editable={!isSubmitting}
                />
              )}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.inputLabel}>Edad</Text>
            <Controller
              control={rhfControl}
              name="age"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="petForm.age"
                  value={typeof value === 'string' ? value : value == null ? '' : String(value)}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Años"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[styles.input, errors.age ? styles.inputError : null]}
                  editable={!isSubmitting}
                />
              )}
            />
            {errors.age?.message ? (
              <Text style={styles.fieldError}>{errors.age.message}</Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.inputLabel}>Sexo *</Text>
        <Pressable
          testID="petForm.sex"
          onPress={() => setOpenSelect('sex')}
          style={[styles.select, errors.sex ? styles.inputError : null]}
          disabled={isSubmitting}
        >
          <Text style={styles.selectText}>{sexLabel}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </Pressable>

        <Text style={styles.sectionLabel}>NOTAS ADICIONALES</Text>
        <Controller
          control={rhfControl}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              testID="petForm.notes"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Alergias, condiciones especiales, información de contacto..."
              placeholderTextColor={colors.textMuted}
              style={[styles.textarea, errors.notes ? styles.inputError : null]}
              editable={!isSubmitting}
              multiline
              maxLength={300}
            />
          )}
        />
        {errors.notes?.message ? (
          <Text style={styles.fieldError}>{errors.notes.message}</Text>
        ) : null}

        <Pressable
          testID="petForm.submit"
          onPress={submit}
          style={[styles.submit, isSubmitting ? styles.submitDisabled : null]}
          disabled={Boolean(isSubmitting)}
        >
          {isSubmitting ? (
            <View style={styles.submitInner}>
              <ActivityIndicator testID="petForm.loading" color={colors.white} />
              <Text style={styles.submitText}>Guardando…</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>Guardar mascota</Text>
          )}
        </Pressable>

        <Pressable
          testID="petForm.cancel"
          onPress={onCancel}
          disabled={Boolean(isSubmitting)}
          style={styles.cancel}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      </ScrollView>

      <SelectModal
        title="Selecciona sexo"
        visible={openSelect === 'sex'}
        options={sexOptions}
        selected={watch('sex')}
        onClose={() => setOpenSelect(null)}
        onSelect={(v) => {
          setValue('sex', v, { shouldValidate: true });
          setOpenSelect(null);
        }}
      />
    </View>
  );
}

function SelectModal<T extends string>({
  visible,
  title,
  options,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: SelectOption<T>[];
  selected: T;
  onClose: () => void;
  onSelect: (v: T) => void;
}): React.ReactElement {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((opt) => {
            const active = opt.value === selected;
            return (
              <Pressable
                key={opt.value}
                testID={`petForm.select.option.${opt.value}`}
                onPress={() => onSelect(opt.value)}
                style={[styles.modalOption, active ? styles.modalOptionActive : null]}
              >
                <Text
                  style={[styles.modalOptionText, active ? styles.modalOptionTextActive : null]}
                >
                  {opt.label}
                </Text>
                {active ? (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : (
                  <View style={{ width: 18, height: 18 }} />
                )}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },

  sectionLabel: {
    color: colors.textMuted,
    ...typography.caption,
    letterSpacing: 0.6,
    marginTop: spacing.md,
  },

  inputLabel: { color: colors.textPrimary, ...typography.label, marginTop: spacing.xs },

  input: {
    minHeight: control.minHeight,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
  },

  textarea: {
    minHeight: 120,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
    textAlignVertical: 'top',
  },

  select: {
    minHeight: control.minHeight,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { color: colors.textPrimary, ...typography.body },

  inputError: { borderColor: colors.danger },

  fieldError: { color: colors.dangerDark, ...typography.caption },

  row: { flexDirection: 'row', gap: spacing.sm },
  col: { flex: 1 },

  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  photoSlot: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoSlotSpeciesIcon: { width: 48, height: 48 },

  speciesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.xs,
  },
  speciesChip: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  speciesChipIdle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  speciesChipSelected: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.md,
  },
  speciesChipErrorOutline: { borderColor: colors.danger },
  speciesChipImage: { width: 52, height: 52 },
  photoThumbWrap: { width: 64, height: 64 },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  photoAdd: {
    width: 86,
    height: 64,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  photoAddText: { color: colors.textSecondary, ...typography.caption, marginTop: 2 },
  photoHint: { color: colors.textSecondary, ...typography.caption },

  submit: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  submitDisabled: { opacity: 0.75 },
  submitText: { color: colors.white, ...typography.button },
  submitInner: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },

  cancel: { alignItems: 'center', paddingVertical: spacing.md },
  cancelText: { color: colors.textSecondary, ...typography.bodyStrong },

  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorBannerIcon: { marginTop: 1 },
  errorBannerText: { color: colors.dangerDark, ...typography.body, flex: 1 },

  disabled: { opacity: 0.5 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  modalTitle: { color: colors.textPrimary, ...typography.heading, marginBottom: spacing.sm },
  modalOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOptionActive: { backgroundColor: '#EEF2FF' },
  modalOptionText: { color: colors.textPrimary, ...typography.bodyStrong },
  modalOptionTextActive: { color: colors.primary },
});
