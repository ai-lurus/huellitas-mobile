import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, radius, spacing, typography } from '../../../../src/design/tokens';
import { useServiceDetail } from '../../../../src/hooks/useServices';
import { useCreateBookingMutation } from '../../../../src/hooks/useServices';
import { usePets } from '../../../../src/hooks/usePets';
import {
  isHomeDeliveryCategory,
  requiresPetSelection,
  usesCart,
} from '../../../../src/domain/services';
import { SlotPicker } from '../../../../src/components/services/SlotPicker';
import type { KibbleProduct } from '../../../../src/domain/services';
import { useGuestGate } from '../../../../src/hooks/useGuestGate';

export default function BookServiceScreen(): React.JSX.Element {
  const router = useRouter();
  const { categoryId, providerId } = useLocalSearchParams<{
    categoryId: string;
    providerId?: string;
  }>();
  const detailQuery = useServiceDetail(categoryId, providerId);
  const detail = detailQuery.data;
  const { pets = [] } = usePets();
  const createBooking = useCreateBookingMutation();
  const { requireAuth, GuestGateModal } = useGuestGate();

  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const needsPet = detail ? requiresPetSelection(detail.categoryKey) : false;
  const isCart = detail ? usesCart(detail.categoryKey) : false;
  const isHomeDelivery = detail ? isHomeDeliveryCategory(detail.categoryKey) : false;

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([productId, quantity]) => {
          const product = detail?.products.find((p) => p.id === productId);
          return { productId, productName: product?.name ?? productId, quantity };
        }),
    [cart, detail],
  );

  const setQty = (productId: string, delta: number): void => {
    setCart((prev) => {
      const next = Math.max(0, (prev[productId] ?? 0) + delta);
      return { ...prev, [productId]: next };
    });
  };

  const canSubmit =
    !saving &&
    Boolean(detail) &&
    (!needsPet || Boolean(selectedPetId)) &&
    (!isCart ? Boolean(selectedSlot) : cartItems.length > 0 && Boolean(selectedWindow)) &&
    (!isHomeDelivery || address.trim().length > 0);

  const onSubmit = async (): Promise<void> => {
    if (!detail || !canSubmit) return;
    setSaving(true);
    try {
      await createBooking.mutateAsync({
        serviceId: detail.id,
        providerId: detail.providerId ?? providerId,
        petId: needsPet ? (selectedPetId ?? undefined) : undefined,
        scheduledAt: !isCart ? (selectedSlot ?? undefined) : undefined,
        address: isHomeDelivery ? address.trim() : undefined,
        cart: isCart
          ? cartItems.map(({ productId, quantity }) => ({ productId, quantity }))
          : undefined,
      });
      router.replace('/(app)/services/bookings');
    } catch {
      Alert.alert('No se pudo enviar la solicitud', 'Inténtalo de nuevo en unos momentos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={(): void => router.back()}
          style={styles.backBtn}
          testID="services.book.back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Solicitar servicio</Text>
        <View style={styles.backBtn} />
      </View>

      {!detail ? (
        <View style={styles.stateWrap} testID="services.book.loading">
          <Text style={styles.stateText}>Cargando…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.serviceName}>{detail.name}</Text>

          {needsPet ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>¿Para qué mascota?</Text>
              {pets.length === 0 ? (
                <Text style={styles.hintText} testID="services.book.noPets">
                  Agrega una mascota primero para poder solicitar este servicio.
                </Text>
              ) : (
                <View style={styles.petRow}>
                  {pets.map((pet) => (
                    <Pressable
                      key={pet.id}
                      onPress={(): void => setSelectedPetId(pet.id)}
                      testID={`services.book.pet.${pet.id}`}
                      style={[
                        styles.petChip,
                        selectedPetId === pet.id ? styles.petChipSelected : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.petChipText,
                          selectedPetId === pet.id ? styles.petChipTextSelected : null,
                        ]}
                      >
                        {pet.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {isCart ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Productos</Text>
              {detail.products.map((product: KibbleProduct) => (
                <View key={product.id} style={styles.productRow}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    {product.priceLabel ? (
                      <Text style={styles.productPrice}>{product.priceLabel}</Text>
                    ) : null}
                  </View>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={(): void => setQty(product.id, -1)}
                      testID={`services.book.cart.${product.id}.minus`}
                      style={styles.stepperBtn}
                    >
                      <Ionicons name="remove" size={16} color={colors.primary} />
                    </Pressable>
                    <Text style={styles.stepperValue}>{cart[product.id] ?? 0}</Text>
                    <Pressable
                      onPress={(): void => setQty(product.id, 1)}
                      testID={`services.book.cart.${product.id}.plus`}
                      style={styles.stepperBtn}
                    >
                      <Ionicons name="add" size={16} color={colors.primary} />
                    </Pressable>
                  </View>
                </View>
              ))}

              <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
                Ventana de entrega
              </Text>
              <View style={styles.petRow}>
                {detail.deliveryWindows.map((w) => (
                  <Pressable
                    key={w}
                    onPress={(): void => setSelectedWindow(w)}
                    testID={`services.book.window.${w}`}
                    style={[styles.petChip, selectedWindow === w ? styles.petChipSelected : null]}
                  >
                    <Text
                      style={[
                        styles.petChipText,
                        selectedWindow === w ? styles.petChipTextSelected : null,
                      ]}
                    >
                      {w}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fecha y horario</Text>
              <SlotPicker
                slots={detail.availableSlots}
                occupiedSlots={detail.occupiedSlots}
                selected={selectedSlot}
                onSelect={setSelectedSlot}
                testID="services.book.slots"
              />
            </View>
          )}

          {isHomeDelivery ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dirección</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Calle, número, colonia…"
                placeholderTextColor={colors.textMuted}
                style={styles.addressInput}
                testID="services.book.address"
              />
            </View>
          ) : null}

          <Pressable
            disabled={!canSubmit}
            onPress={(): void => requireAuth(() => void onSubmit())}
            style={[styles.ctaButton, !canSubmit ? styles.ctaButtonDisabled : null]}
            testID="services.book.submit"
          >
            <Text style={styles.ctaButtonText}>Confirmar solicitud</Text>
          </Pressable>
        </ScrollView>
      )}
      <GuestGateModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  serviceName: { ...typography.heading, color: colors.textPrimary },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  sectionTitleSpaced: { marginTop: spacing.sm },
  hintText: { ...typography.body, color: colors.textSecondary },
  petRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  petChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  petChipSelected: { borderColor: colors.primary, backgroundColor: colors.infoBackground },
  petChipText: { ...typography.body, color: colors.textPrimary },
  petChipTextSelected: { color: colors.primary, fontWeight: '700' },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  productInfo: { gap: 2 },
  productName: { ...typography.body, color: colors.textPrimary },
  productPrice: { ...typography.caption, color: colors.textSecondary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    minWidth: 18,
    textAlign: 'center',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    ...typography.body,
  },
  ctaButton: {
    marginTop: spacing.md,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  ctaButtonDisabled: { opacity: 0.5 },
  ctaButtonText: { ...typography.button, color: colors.white },
  stateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { ...typography.body, color: colors.textSecondary },
});
