import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, radius, shadows, spacing, typography } from '../../../src/design/tokens';
import { useCancelBookingMutation, useMyBookings } from '../../../src/hooks/useServices';
import { BOOKING_STATUS_LABELS, canSelfCancel, type Booking } from '../../../src/domain/bookings';
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';

function formatWhen(booking: Booking): string {
  if (booking.deliveryWindowLabel) return booking.deliveryWindowLabel;
  if (booking.scheduledAt) {
    const d = new Date(booking.scheduledAt);
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return '';
}

function statusStyle(status: Booking['status']): { bg: string; text: string } {
  switch (status) {
    case 'confirmed':
      return { bg: colors.infoBackground, text: colors.primary };
    case 'cancelled':
      return { bg: colors.dangerSoft, text: colors.dangerDark };
    default:
      return { bg: colors.border, text: colors.textSecondary };
  }
}

export default function MyBookingsScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useMyBookings();
  const cancelMutation = useCancelBookingMutation();
  const bookings = data ?? [];

  const onCancelPress = (booking: Booking): void => {
    if (!canSelfCancel(booking.scheduledAt)) {
      Alert.alert(
        'No se puede cancelar',
        'Estás dentro de la ventana previa a la cita. Contacta a soporte para cancelar.',
      );
      return;
    }
    Alert.alert('¿Cancelar reserva?', 'Esta acción no se puede deshacer.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: (): void => {
          cancelMutation.mutate(booking.id);
        },
      },
    ]);
  };

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Mis reservas" onBack={() => router.back()} testID="services.bookings" />

      {isPending ? null : isError ? (
        <View style={styles.stateWrap} testID="services.bookings.error">
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
          <Text style={styles.stateText}>Algo salió mal</Text>
          <Pressable onPress={(): void => void refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.stateWrap} testID="services.bookings.empty">
          <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
          <Text style={styles.stateText}>Aún no tienes reservas</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const pill = statusStyle(item.status);
            return (
              <View style={styles.card} testID={`services.bookings.item.${item.id}`}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.serviceName}</Text>
                  <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                    <Text style={[styles.statusPillText, { color: pill.text }]}>
                      {BOOKING_STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                </View>
                {item.petName ? <Text style={styles.cardMeta}>{item.petName}</Text> : null}
                <Text style={styles.cardMeta}>{formatWhen(item)}</Text>
                {item.address ? <Text style={styles.cardMeta}>{item.address}</Text> : null}

                {item.status !== 'cancelled' ? (
                  <Pressable
                    onPress={(): void => onCancelPress(item)}
                    style={styles.cancelButton}
                    testID={`services.bookings.cancel.${item.id}`}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xxs,
    ...shadows.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  cardMeta: { ...typography.caption, color: colors.textSecondary },
  statusPill: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusPillText: { ...typography.caption, fontWeight: '700' },
  cancelButton: { alignSelf: 'flex-start', marginTop: spacing.xs },
  cancelButtonText: { ...typography.bodyStrong, color: colors.dangerDark },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  stateText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  retryButton: {
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
  },
  retryButtonText: { ...typography.button, color: colors.white },
});
