import { zodResolver } from '@hookform/resolvers/zod';
import React, { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { MAX_REPORT_DESCRIPTION_LENGTH } from '../../../config/constants';
import { colors, radius, spacing, typography } from '../../../design/tokens';
import type { Pet } from '../../../domain/pets';
import {
  combineReportDateTime,
  lostReportWizardDataFormSchema,
  type LostReportWizardDataForm,
} from '../../../validation/reportLostSchema';
import { DateTimeField } from './DateTimeField';
import { LocationField } from './LocationField';

import DOG_DEFAULT from '../../../../assets/pet-defaults/dog.png';
import CAT_DEFAULT from '../../../../assets/pet-defaults/cat.png';
import BIRD_DEFAULT from '../../../../assets/pet-defaults/bird.png';
import RABBIT_DEFAULT from '../../../../assets/pet-defaults/rabbit.png';
import OTHER_DEFAULT from '../../../../assets/pet-defaults/other.png';

function defaultCoverForSpecies(species: string | undefined): number {
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

export interface LostReportDataResult {
  lat: number;
  lng: number;
  lastSeenAt: Date;
  message: string;
}

export interface LostReportDataStepProps {
  pet: Pick<Pet, 'name' | 'species' | 'photos'>;
  initialLocation: { lat: number; lng: number };
  initialLastSeenAt?: Date;
  initialMessage?: string;
  submitLabel?: string;
  onSubmit: (result: LostReportDataResult) => void;
}

export function LostReportDataStep({
  pet,
  initialLocation,
  initialLastSeenAt,
  initialMessage,
  submitLabel = 'Ver vista previa',
  onSubmit,
}: LostReportDataStepProps): React.ReactElement {
  const [location, setLocation] = React.useState(initialLocation);

  const photoUri = useMemo(() => {
    const photos = pet.photos?.filter((u) => typeof u === 'string' && u.trim().length > 0) ?? [];
    return photos[0] ?? null;
  }, [pet.photos]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LostReportWizardDataForm>({
    resolver: zodResolver(lostReportWizardDataFormSchema),
    defaultValues: {
      lastSeenDate: initialLastSeenAt ?? new Date(),
      lastSeenTime: initialLastSeenAt ?? new Date(),
      message: initialMessage ?? '',
    },
  });

  const messageLen = watch('message')?.length ?? 0;
  const lastSeenDate = watch('lastSeenDate');
  const lastSeenTime = watch('lastSeenTime');

  const onValid = handleSubmit((data) => {
    onSubmit({
      lat: location.lat,
      lng: location.lng,
      lastSeenAt: combineReportDateTime(data.lastSeenDate, data.lastSeenTime),
      message: data.message.trim(),
    });
  });

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.fieldLabel}>Foto de la mascota</Text>
      <View style={styles.photoWrap}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <Image
            accessibilityLabel="Foto por defecto"
            resizeMode="cover"
            source={defaultCoverForSpecies(pet.species)}
            style={styles.photo}
          />
        )}
      </View>
      <Text style={styles.hint}>Se usa la foto del perfil de {pet.name}.</Text>

      <Text style={styles.fieldLabel}>
        Fecha y hora en que se perdió <Text style={styles.req}>*</Text>
      </Text>
      <DateTimeField
        dateValue={lastSeenDate}
        timeValue={lastSeenTime}
        onChangeDate={(d) => setValue('lastSeenDate', d)}
        onChangeTime={(t) => setValue('lastSeenTime', t)}
        testID="radar.wizard.lost.lastSeen"
      />
      {errors.lastSeenDate ? (
        <Text style={styles.fieldError}>{errors.lastSeenDate.message}</Text>
      ) : null}

      <Text style={styles.fieldLabel}>Ubicación de pérdida</Text>
      <LocationField
        lat={location.lat}
        lng={location.lng}
        onChange={(lat, lng) => setLocation({ lat, lng })}
        testID="radar.wizard.lost.location"
      />

      <Text style={styles.fieldLabel}>
        Descripción <Text style={styles.req}>*</Text>
      </Text>
      <Controller
        control={control}
        name="message"
        render={({ field: { value, onChange } }) => (
          <TextInput
            maxLength={MAX_REPORT_DESCRIPTION_LENGTH}
            multiline
            onChangeText={onChange}
            placeholder="Ej: Llevaba collar rojo, responde al nombre de Max..."
            placeholderTextColor={colors.textMuted}
            style={styles.textArea}
            testID="radar.wizard.lost.description"
            value={value}
          />
        )}
      />
      <Text style={styles.counter}>
        {messageLen}/{MAX_REPORT_DESCRIPTION_LENGTH} caracteres
      </Text>
      {errors.message ? <Text style={styles.fieldError}>{errors.message.message}</Text> : null}

      <Pressable onPress={onValid} style={styles.primaryBtn} testID="radar.wizard.lost.continue">
        <Text style={styles.primaryBtnText}>{submitLabel}</Text>
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
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  photoWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    height: 180,
    backgroundColor: colors.border,
  },
  photo: { width: '100%', height: '100%' },
  textArea: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    minHeight: 100,
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
    backgroundColor: colors.navActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { ...typography.button, color: colors.white },
});
