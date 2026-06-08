import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { RouteDifficulty } from '../../domain/routes';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../../domain/routes';
import { colors, radius, spacing, typography } from '../../design/tokens';
import type { Waypoint } from '../../domain/routes';

const DIFFICULTIES: RouteDifficulty[] = ['easy', 'moderate', 'hard'];

export interface RouteFormValues {
  name: string;
  description?: string;
  distanceKm?: number;
  difficulty?: RouteDifficulty;
  offLeashAllowed: boolean;
  estimatedMinutes?: number;
  waypoints: Waypoint[];
}

interface RouteFormProps {
  waypoints: Waypoint[];
  onSubmit: (values: RouteFormValues) => void;
  isSubmitting: boolean;
}

export function RouteForm({
  waypoints,
  onSubmit,
  isSubmitting,
}: RouteFormProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<RouteDifficulty>('easy');
  const [offLeash, setOffLeash] = useState(false);
  const [distanceKm, setDistanceKm] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (): void => {
    if (name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (waypoints.length < 2) {
      setError('Agrega al menos 2 puntos en el mapa.');
      return;
    }
    setError(null);
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
      difficulty,
      offLeashAllowed: offLeash,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
      waypoints,
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Nombre de la ruta *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ej. Ruta del río Colima"
        placeholderTextColor={colors.textMuted}
        maxLength={100}
        testID="route-form.name"
      />

      <Text style={styles.label}>Descripción (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        placeholder="¿Qué hace especial esta ruta?"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={500}
        testID="route-form.description"
      />

      <Text style={styles.label}>Dificultad</Text>
      <View style={styles.chips}>
        {DIFFICULTIES.map((d) => {
          const color = DIFFICULTY_COLORS[d];
          const active = difficulty === d;
          return (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              style={[styles.chip, active && { borderColor: color, backgroundColor: `${color}18` }]}
              testID={`route-form.difficulty.${d}`}
            >
              <Text style={[styles.chipLabel, active && { color }]}>{DIFFICULTY_LABELS[d]}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Distancia (km)</Text>
          <TextInput
            style={styles.input}
            value={distanceKm}
            onChangeText={setDistanceKm}
            placeholder="2.5"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            maxLength={6}
            testID="route-form.distance"
          />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>Tiempo (min)</Text>
          <TextInput
            style={styles.input}
            value={estimatedMinutes}
            onChangeText={setEstimatedMinutes}
            placeholder="30"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={4}
            testID="route-form.minutes"
          />
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>¿Permite perros sin correa?</Text>
        <Switch
          value={offLeash}
          onValueChange={setOffLeash}
          trackColor={{ true: colors.success, false: colors.border }}
          testID="route-form.off-leash"
        />
      </View>

      <View style={styles.waypointInfo}>
        <Text style={styles.waypointText}>
          {waypoints.length < 2
            ? `Puntos en mapa: ${waypoints.length} (mín. 2)`
            : `✓ ${waypoints.length} puntos marcados`}
        </Text>
      </View>

      {error != null ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={[styles.submit, isSubmitting && styles.submitDisabled]}
        testID="route-form.submit"
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitLabel}>Publicar ruta</Text>
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
  textarea: { height: 80, textAlignVertical: 'top', paddingTop: spacing.sm },
  chips: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipLabel: { ...typography.caption, color: colors.textSecondary },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfField: { flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  switchLabel: { ...typography.body, color: colors.textPrimary },
  waypointInfo: {
    backgroundColor: colors.backgroundApp,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  waypointText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
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
