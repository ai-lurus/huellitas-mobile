import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadows, spacing, typography } from '../../../design/tokens';

export interface ReportPreviewData {
  kind: 'lost' | 'stray';
  title: string;
  badgeLabel: string;
  badgeColor: string;
  photoUri: string | null;
  photoSource?: number;
  lat: number;
  lng: number;
  when: Date;
  description: string;
}

export type ReviewSubmitPhase = 'idle' | 'loading' | 'success' | 'pending';

export interface ReportReviewStepProps {
  preview: ReportPreviewData;
  infoLines: string[];
  submitPhase: ReviewSubmitPhase;
  submitError: string | null;
  onSubmit: () => void;
  onSuccessDismiss: () => void;
  onViewMap: () => void;
}

function formatDateEs(d: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function formatTimeEs(d: Date): string {
  return new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' }).format(d);
}

export function ReportReviewStep({
  preview,
  infoLines,
  submitPhase,
  submitError,
  onSubmit,
  onSuccessDismiss,
  onViewMap,
}: ReportReviewStepProps): React.ReactElement {
  const isSubmitting = submitPhase === 'loading';

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.warnBox}>
          <View style={styles.warnStrip} />
          <Ionicons color={colors.navActive} name="information-circle-outline" size={20} />
          <View style={styles.warnTextWrap}>
            <Text style={styles.warnTitle}>Revisa tu reporte</Text>
            <Text style={styles.warnText}>
              Este reporte se enviará a la comunidad cercana y quedará visible en el Radar.
            </Text>
          </View>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewRowTop}>
            <View style={styles.previewThumbWrap}>
              {preview.photoUri ? (
                <Image source={{ uri: preview.photoUri }} style={styles.previewThumb} />
              ) : preview.photoSource ? (
                <Image
                  resizeMode="cover"
                  source={preview.photoSource}
                  style={styles.previewThumb}
                />
              ) : (
                <Ionicons color={colors.textMuted} name="paw" size={24} />
              )}
            </View>
            <View style={styles.previewMeta}>
              <View style={[styles.badge, { backgroundColor: preview.badgeColor }]}>
                <Text style={styles.badgeText}>● {preview.badgeLabel}</Text>
              </View>
              <Text style={styles.previewTitle}>{preview.title}</Text>
            </View>
          </View>

          <View style={styles.previewRow}>
            <Ionicons color={colors.textSecondary} name="location-outline" size={18} />
            <Text style={styles.previewRowText} testID="radar.wizard.review.coords">
              Lat: {preview.lat.toFixed(6)}, Lng: {preview.lng.toFixed(6)}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Ionicons color={colors.textSecondary} name="calendar-outline" size={18} />
            <Text style={styles.previewRowText}>{formatDateEs(preview.when)}</Text>
          </View>
          <View style={styles.previewRow}>
            <Ionicons color={colors.textSecondary} name="time-outline" size={18} />
            <Text style={styles.previewRowText}>{formatTimeEs(preview.when)}</Text>
          </View>
          <View style={styles.previewRow}>
            <Ionicons color={colors.textSecondary} name="chatbubble-outline" size={18} />
            <Text style={styles.previewRowText}>{preview.description}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>¿Qué sucederá después?</Text>
          {infoLines.map((line) => (
            <Text key={line} style={styles.infoLine}>
              • {line}
            </Text>
          ))}
        </View>

        {submitError ? (
          <View style={styles.submitErrorBox} testID="radar.wizard.review.error">
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        ) : null}

        <Pressable
          disabled={isSubmitting}
          onPress={onSubmit}
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          testID="radar.wizard.review.submit"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Enviar reporte</Text>
          )}
        </Pressable>
      </ScrollView>

      <Modal animationType="fade" transparent visible={submitPhase === 'loading'}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ActivityIndicator color={colors.navActive} size="large" />
            <Text style={styles.modalTitle}>Enviando reporte…</Text>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={submitPhase === 'success'}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIcon}>
              <Ionicons color={colors.white} name="checkmark" size={32} />
            </View>
            <Text style={styles.modalTitle}>¡Reporte enviado!</Text>
            <Text style={styles.modalBody}>
              Tu reporte se ha publicado exitosamente y ya es visible en el Radar.
            </Text>
            <Pressable
              onPress={onSuccessDismiss}
              style={styles.successBtn}
              testID="radar.wizard.review.success.ok"
            >
              <Text style={styles.successBtnText}>Entendido</Text>
            </Pressable>
            <Pressable onPress={onViewMap} testID="radar.wizard.review.success.viewMap">
              <Text style={styles.linkMuted}>Ver en el mapa</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={submitPhase === 'pending'}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.pendingIcon}>
              <Ionicons color={colors.white} name="cloud-offline-outline" size={28} />
            </View>
            <Text style={styles.modalTitle}>Pendiente de enviar</Text>
            <Text style={styles.modalBody}>
              No detectamos conexión. Guardamos tu reporte y lo enviaremos automáticamente en cuanto
              vuelvas a tener internet.
            </Text>
            <Pressable
              onPress={onSuccessDismiss}
              style={styles.successBtn}
              testID="radar.wizard.review.pending.ok"
            >
              <Text style={styles.successBtnText}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  warnBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.25)',
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  warnStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.navActive,
  },
  warnTextWrap: { flex: 1, gap: 2 },
  warnTitle: { ...typography.bodyStrong, color: colors.navActive },
  warnText: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
    marginBottom: spacing.md,
  },
  previewRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  previewThumbWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ECEFF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewThumb: { width: '100%', height: '100%' },
  previewMeta: { flex: 1, minWidth: 0, gap: 6 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: { ...typography.caption, color: colors.white, fontWeight: '800' },
  previewTitle: { ...typography.bodyStrong, fontSize: 18, color: colors.textPrimary },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  previewRowText: { ...typography.body, color: colors.textPrimary, flex: 1, lineHeight: 22 },
  infoBox: {
    backgroundColor: colors.infoBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  infoTitle: { ...typography.bodyStrong, color: colors.primary, marginBottom: spacing.xs },
  infoLine: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
  submitErrorBox: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  submitErrorText: { ...typography.caption, color: colors.dangerDark, textAlign: 'center' },
  submitBtn: {
    height: 54,
    borderRadius: radius.button,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { ...typography.button, color: colors.white },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  modalBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtn: {
    width: '100%',
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  successBtnText: { ...typography.button, color: colors.white },
  linkMuted: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
