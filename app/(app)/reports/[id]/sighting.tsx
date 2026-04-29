import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { LocationPicker } from '../../../../src/components/map/LocationPicker';
import { colors, radius, shadows, spacing, typography } from '../../../../src/design/tokens';
import { MAX_LOST_REPORT_MESSAGE_LENGTH } from '../../../../src/config/constants';
import {
  useCreateSightingMutation,
  useLostReportDetail,
} from '../../../../src/hooks/useLostReports';
import {
  sightingFormSchema,
  type SightingFormInput,
  SIGHTING_NOTES_MAX_LENGTH,
} from '../../../../src/validation/sightingSchema';

function firstN<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

const MAX_PHOTOS = 5;

async function pickFromCamera(maxPhotos: number): Promise<string[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Necesitas permisos para usar la cámara.');
  }
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.85,
  });
  if (res.canceled) return [];
  return firstN(
    (res.assets ?? []).map((a) => a.uri).filter((u): u is string => u.length > 0),
    maxPhotos,
  );
}

async function pickFromGallery(remaining: number): Promise<string[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Necesitas permisos para acceder a tu galería.');
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.85,
  });
  if (res.canceled) return [];
  return firstN(
    (res.assets ?? []).map((a) => a.uri).filter((u): u is string => u.length > 0),
    remaining,
  );
}

export default function ReportSightingScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportId = id ?? '';

  const detailQuery = useLostReportDetail(reportId);
  const createSightingMutation = useCreateSightingMutation(reportId);

  const [pickerBusy, setPickerBusy] = useState(false);

  const {
    control,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SightingFormInput>({
    resolver: zodResolver(sightingFormSchema),
    defaultValues: {
      photos: [],
      location: null,
      notes: '',
    },
    mode: 'onSubmit',
  });

  const selectedPhotos = watch('photos') ?? [];
  const selectedLocation = watch('location');

  const petLabel = detailQuery.data?.petName?.trim() || 'tu mascota';

  const onSelectLocation = useCallback(
    (lat: number, lng: number): void => {
      setValue('location', { lat, lng }, { shouldValidate: true });
    },
    [setValue],
  );

  const addPhotos = useCallback(
    async (uris: string[]): Promise<void> => {
      if (uris.length === 0) return;
      const current = selectedPhotos ?? [];
      const next = [...current, ...uris].filter(Boolean).slice(0, MAX_PHOTOS);
      setValue('photos', next, { shouldValidate: true });
    },
    [selectedPhotos, setValue],
  );

  const onPickCamera = useCallback(async (): Promise<void> => {
    if (pickerBusy) return;
    setPickerBusy(true);
    try {
      const uris = await pickFromCamera(MAX_PHOTOS - selectedPhotos.length);
      await addPhotos(uris);
    } catch (e) {
      Alert.alert(
        'No se pudo abrir la cámara',
        e instanceof Error ? e.message : 'Intenta de nuevo.',
      );
    } finally {
      setPickerBusy(false);
    }
  }, [addPhotos, pickerBusy, selectedPhotos.length]);

  const onPickGallery = useCallback(async (): Promise<void> => {
    if (pickerBusy) return;
    const remaining = MAX_PHOTOS - selectedPhotos.length;
    if (remaining <= 0) return;

    setPickerBusy(true);
    try {
      const uris = await pickFromGallery(remaining);
      await addPhotos(uris);
    } catch (e) {
      Alert.alert(
        'No se pudo abrir la galería',
        e instanceof Error ? e.message : 'Intenta de nuevo.',
      );
    } finally {
      setPickerBusy(false);
    }
  }, [addPhotos, pickerBusy, selectedPhotos.length]);

  const onBack = useCallback((): void => {
    router.back();
  }, [router]);

  const submit = handleSubmit(async (values) => {
    if (values.location == null) {
      Alert.alert('Falta la ubicación', 'Selecciona en el mapa dónde se vio la mascota.');
      return;
    }
    if (values.photos.length === 0) {
      Alert.alert('Falta la foto', 'Agrega al menos 1 foto del avistamiento.');
      return;
    }

    try {
      await createSightingMutation.mutateAsync({
        lat: values.location.lat,
        lng: values.location.lng,
        notes: values.notes ?? undefined,
        photoUris: values.photos,
      });
      router.replace(`/(app)/reports/${reportId}`);
    } catch (e) {
      Alert.alert('Error al enviar avistamiento', 'Intenta nuevamente en unos minutos.');
    }
  });

  const petPhotoUrl = detailQuery.data?.petPhotoUrl ?? undefined;

  const notesMax = useMemo(
    () => Math.min(MAX_LOST_REPORT_MESSAGE_LENGTH, SIGHTING_NOTES_MAX_LENGTH),
    [],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={40}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={onBack}
              style={styles.backBtn}
              testID="reportSighting.back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Informar avistamiento</Text>
            <View style={styles.backBtn} />
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.thumbWrap}>
              {petPhotoUrl ? (
                <Image source={{ uri: petPhotoUrl }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbFallback} />
              )}
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>Para: {petLabel}</Text>
              <Text style={styles.summarySub}>Confirma dónde viste a la mascota</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Fotos del avistamiento</Text>
          {errors.photos ? <Text style={styles.fieldError}>{errors.photos.message}</Text> : null}

          <View style={styles.photoGrid}>
            {selectedPhotos.map((uri, idx) => (
              <View key={`${uri}-${idx}`} style={styles.photoTile}>
                <Image source={{ uri }} style={styles.photoImg} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar foto"
                  testID={`reportSighting.photo.remove.${idx}`}
                  onPress={() => {
                    const next = selectedPhotos.filter((_, i) => i !== idx);
                    setValue('photos', next, { shouldValidate: true });
                  }}
                  style={styles.photoRemove}
                >
                  <Ionicons name="close" size={14} color={colors.white} />
                </Pressable>
              </View>
            ))}
            {selectedPhotos.length < MAX_PHOTOS ? (
              <Pressable
                accessibilityRole="button"
                disabled={pickerBusy}
                onPress={() => void onPickGallery()}
                style={[styles.addTile, pickerBusy ? styles.addTileDisabled : null]}
                testID="reportSighting.photo.add"
              >
                <Ionicons name="add" size={20} color={colors.textSecondary} />
                <Text style={styles.addTileText}>Agregar</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.photoActions}>
            <Pressable
              accessibilityRole="button"
              disabled={pickerBusy || selectedPhotos.length >= MAX_PHOTOS}
              onPress={() => void onPickCamera()}
              style={styles.secondaryBtn}
              testID="reportSighting.photo.camera"
            >
              {pickerBusy ? (
                <ActivityIndicator color={colors.textSecondary} />
              ) : (
                <Ionicons name="camera" size={18} color={colors.textSecondary} />
              )}
              <Text style={styles.secondaryBtnText}>Cámara</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={pickerBusy || selectedPhotos.length >= MAX_PHOTOS}
              onPress={() => void onPickGallery()}
              style={styles.secondaryBtn}
              testID="reportSighting.photo.gallery"
            >
              {pickerBusy ? (
                <ActivityIndicator color={colors.textSecondary} />
              ) : (
                <Ionicons name="images-outline" size={18} color={colors.textSecondary} />
              )}
              <Text style={styles.secondaryBtnText}>Galería</Text>
            </Pressable>
          </View>

          <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Ubicación</Text>
          {errors.location ? (
            <Text style={styles.fieldError}>{errors.location.message}</Text>
          ) : null}

          <View style={styles.mapWrap}>
            <LocationPicker
              initialCenter={detailQuery.data ? detailQuery.data.lossLocation : null}
              onSelect={onSelectLocation}
              testID="reportSighting.locationPicker"
            />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Notas</Text>
          <Controller
            name="notes"
            control={control}
            render={({ field: { onChange, value } }) => (
              <View>
                <View style={styles.notesWrap}>
                  <TextInput
                    placeholder="Ej: tenía un collar rojo y cojeaba"
                    placeholderTextColor={colors.textMuted}
                    style={styles.notesInput}
                    multiline
                    maxLength={notesMax}
                    value={value ?? ''}
                    onChangeText={onChange}
                    editable={!createSightingMutation.isPending}
                    testID="reportSighting.notes"
                  />
                </View>
              </View>
            )}
          />
          {errors.notes ? <Text style={styles.fieldError}>{errors.notes.message}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => void submit()}
            disabled={
              createSightingMutation.isPending ||
              selectedPhotos.length === 0 ||
              selectedLocation == null
            }
            style={[
              styles.primaryBtn,
              createSightingMutation.isPending ||
              selectedPhotos.length === 0 ||
              selectedLocation == null
                ? styles.primaryBtnDisabled
                : null,
            ]}
            testID="reportSighting.submit"
          >
            {createSightingMutation.isPending ? (
              <View style={styles.btnRow}>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.primaryBtnText}>Enviando…</Text>
              </View>
            ) : (
              <Text style={styles.primaryBtnText}>Enviar avistamiento</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.heading, color: colors.textPrimary, flex: 1, textAlign: 'center' },

  summaryCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.md,
  },
  thumbWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ECEFF5',
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { width: '100%', height: '100%', backgroundColor: '#ECEFF5' },
  summaryText: { flex: 1, gap: 2 },
  summaryTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  summarySub: { ...typography.caption, color: colors.textSecondary },

  sectionLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: 2,
    letterSpacing: 0.6,
  },
  fieldError: { ...typography.caption, color: colors.dangerDark, marginTop: 4 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoTile: {
    width: 86,
    height: 86,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  photoImg: { width: '100%', height: '100%' },
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
  addTile: {
    width: 86,
    height: 86,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addTileDisabled: { opacity: 0.55 },
  addTileText: { ...typography.caption, color: colors.textSecondary },

  photoActions: { flexDirection: 'row', gap: spacing.sm },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  secondaryBtnText: { ...typography.bodyStrong, color: colors.textSecondary },

  mapWrap: {
    height: 320,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  notesInput: {
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },

  primaryBtn: {
    marginTop: spacing.lg,
    minHeight: 54,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...typography.button, color: colors.white, textAlign: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
