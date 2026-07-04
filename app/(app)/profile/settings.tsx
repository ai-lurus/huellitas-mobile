import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { colors, radius, shadows, spacing, typography } from '../../../src/design/tokens';
import { deleteSessionTokenAsync } from '../../../src/services/sessionTokenStorage';
import { authClient } from '../../../src/services/googleAuthService';
import { notificationsService } from '../../../src/services/notificationsService';
import { loadPendingRadarReport } from '../../../src/services/pendingRadarReportStore';
import { usersService } from '../../../src/services/usersService';
import { useAuthStore } from '../../../src/stores/authStore';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { queryClient } from '../../../src/query/queryClient';
import { useAppLanguage } from '../../../src/i18n/useAppLanguage';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SUPPORT_EMAIL = 'soporte@plaka.app';

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: '¿Cómo reporto una mascota perdida?',
    answer:
      'Ve a Radar y toca "Reportar". Podrás elegir la mascota, el lugar y la hora en que se perdió.',
  },
  {
    question: '¿Cómo cancelo una reserva de un servicio?',
    answer:
      'En Servicios > Mis reservas, toca "Cancelar". Si faltan menos de 2 horas para la cita, contacta a soporte.',
  },
  {
    question: '¿Cómo cambio mi correo o teléfono?',
    answer: 'Entra a "Editar perfil" dentro de esta pantalla y actualiza el campo correspondiente.',
  },
];

function kmLabel(km: number): string {
  return `${km} km`;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string): boolean {
  return /^[0-9+\-\s()]{7,20}$/.test(value.trim());
}

const BRAND_NAVY = '#002B5B';
const serifName = { fontFamily: 'Georgia', fontWeight: '700' as const, fontSize: 22 };

function SettingsIconTile({
  backgroundColor,
  children,
}: {
  backgroundColor: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={[styles.iconTile, { backgroundColor }]} accessibilityElementsHidden>
      {children}
    </View>
  );
}

export interface SettingsScreenProps {
  showBack?: boolean;
}

export default function SettingsScreen({
  showBack = true,
}: SettingsScreenProps): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const email = user?.email ?? '';
  const name = user?.name ?? 'Usuario';
  const phone = user?.phone ?? '';
  const profileImageUri = user?.image;
  const alertRadiusKm = useSettingsStore((s) => s.alertRadiusKm);
  const taskRemindersEnabled = useSettingsStore((s) => s.taskRemindersEnabled);
  const radarAlertsEnabled = useSettingsStore((s) => s.radarAlertsEnabled);
  const serviceUpdatesEnabled = useSettingsStore((s) => s.serviceUpdatesEnabled);
  const plakaNewsEnabled = useSettingsStore((s) => s.plakaNewsEnabled);
  const setAlertRadius = useSettingsStore((s) => s.setAlertRadius);
  const setTaskRemindersEnabled = useSettingsStore((s) => s.setTaskRemindersEnabled);
  const setRadarAlertsEnabled = useSettingsStore((s) => s.setRadarAlertsEnabled);
  const setServiceUpdatesEnabled = useSettingsStore((s) => s.setServiceUpdatesEnabled);
  const setPlakaNewsEnabled = useSettingsStore((s) => s.setPlakaNewsEnabled);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const language = useAppLanguage();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRunRef = useRef(true);
  const isMountedRef = useRef(true);

  const canDelete = useMemo(() => deleteText.trim().toUpperCase() === 'DELETE', [deleteText]);

  useEffect((): void | (() => void) => {
    isMountedRef.current = true;
    return (): void => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect((): void | (() => void) => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (saveIdleTimerRef.current) clearTimeout(saveIdleTimerRef.current);

    if (isMountedRef.current) setSaveStatus('saving');
    debounceRef.current = setTimeout(() => {
      void usersService
        .patchSettings({
          alertRadiusKm,
          taskRemindersEnabled,
          radarAlertsEnabled,
          serviceUpdatesEnabled,
          plakaNewsEnabled,
        })
        .then((settings) => {
          if (!isMountedRef.current) return;
          useSettingsStore.getState().hydrateFromProfile(settings);
          setSaveStatus('saved');
          if (saveIdleTimerRef.current) clearTimeout(saveIdleTimerRef.current);
          saveIdleTimerRef.current = setTimeout((): void => {
            if (!isMountedRef.current) return;
            setSaveStatus('idle');
          }, 900);
        })
        .catch(() => {
          if (!isMountedRef.current) return;
          setSaveStatus('error');
        });
    }, 500);

    return (): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (saveIdleTimerRef.current) clearTimeout(saveIdleTimerRef.current);
    };
  }, [
    alertRadiusKm,
    taskRemindersEnabled,
    radarAlertsEnabled,
    serviceUpdatesEnabled,
    plakaNewsEnabled,
  ]);

  const appVersion = useMemo(() => {
    const v = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.1.0';
    return v;
  }, []);

  const onEditProfilePhoto = useCallback(async (): Promise<void> => {
    if (!user || photoBusy) return;
    setPhotoBusy(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para cambiar la foto.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;
      const uri = res.assets[0].uri;
      const updated = await usersService.updateProfile({ name: user.name, imageUri: uri });
      if (!isMountedRef.current) return;
      setUser(updated);
    } catch {
      if (!isMountedRef.current) return;
      Alert.alert('No se pudo actualizar la foto', 'Intenta de nuevo en unos minutos.');
    } finally {
      if (isMountedRef.current) setPhotoBusy(false);
    }
  }, [user, photoBusy, setUser]);

  async function performSignOut(): Promise<void> {
    try {
      await authClient.signOut();
    } catch {
      // Si Better Auth falla, igualmente limpiamos sesión local.
    }
    await notificationsService.deletePushToken().catch(() => {});
    await notificationsService.clearStoredExpoPushToken().catch(() => {});
    await deleteSessionTokenAsync().catch(() => {});
    useAuthStore.getState().clearAuth();
    useSettingsStore.getState().reset();
    // Evita que la próxima sesión en este dispositivo herede datos cacheados/persistidos.
    queryClient.clear();
    router.replace('/(auth)/sign-in');
  }

  async function onPressLogout(): Promise<void> {
    const pendingDraft = await loadPendingRadarReport().catch(() => null);
    const message = pendingDraft
      ? 'Tienes un reporte de Radar sin sincronizar. Se guardará en este dispositivo y se enviará si vuelves a iniciar sesión con la misma cuenta aquí. ¿Deseas continuar?'
      : 'Se cerrará tu sesión en este dispositivo.';

    Alert.alert('¿Cerrar sesión?', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: (): void => {
          void performSignOut();
        },
      },
    ]);
  }

  async function onSaveEditProfile(): Promise<void> {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();
    const trimmedPhone = editPhone.trim();

    if (trimmedName.length < 1 || trimmedName.length > 80) {
      setEditError('El nombre debe tener entre 1 y 80 caracteres.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEditError('Ingresa un correo válido.');
      return;
    }
    if (trimmedPhone.length > 0 && !isValidPhone(trimmedPhone)) {
      setEditError('Ingresa un teléfono válido.');
      return;
    }

    setEditError(null);
    setEditSaving(true);
    const emailChanged = trimmedEmail !== email;
    try {
      const updated = await usersService.updateAccountProfile({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone.length > 0 ? trimmedPhone : null,
      });
      if (!isMountedRef.current) return;
      setUser(updated);
      setEditProfileOpen(false);
      if (emailChanged) {
        Alert.alert('Revisa tu correo', 'Revisa tu correo para confirmar el cambio.');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setEditError(err instanceof Error ? err.message : 'No se pudo guardar los cambios.');
    } finally {
      if (isMountedRef.current) setEditSaving(false);
    }
  }

  function onOpenEditProfile(): void {
    setEditName(name);
    setEditEmail(email);
    setEditPhone(phone);
    setEditError(null);
    setEditProfileOpen(true);
  }

  async function onConfirmDelete(): Promise<void> {
    if (!canDelete || deleteBusy) return;
    setDeleteBusy(true);
    try {
      await usersService.deleteAccount();
      setDeleteOpen(false);
      setDeleteText('');
      await performSignOut();
    } catch {
      Alert.alert('No se pudo eliminar la cuenta', 'Intenta de nuevo en unos minutos.');
    } finally {
      setDeleteBusy(false);
    }
  }

  const savePill = useMemo(() => {
    if (saveStatus === 'saving') return 'Guardando…';
    if (saveStatus === 'saved') return 'Guardado';
    if (saveStatus === 'error') return 'Error al guardar';
    return null;
  }, [saveStatus]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} testID="settings.screen">
        <View style={styles.header}>
          <View style={styles.brandRow} testID="settings.brand">
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.brandLogo}
              accessibilityLabel="Huellitas"
              contentFit="contain"
            />
            <Text style={styles.brand}>Huellitas</Text>
          </View>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              testID="settings.back"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>Volver</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar} testID="settings.avatar">
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Ionicons name="person" size={40} color={colors.white} />
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Editar foto de perfil"
              testID="settings.editPhoto"
              onPress={() => void onEditProfilePhoto()}
              style={styles.editFab}
              disabled={photoBusy}
            >
              {photoBusy ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Ionicons name="pencil" size={16} color={colors.white} />
              )}
            </Pressable>
          </View>
          <Text style={[styles.profileName, serifName]} testID="settings.name">
            {name}
          </Text>
        </View>

        {savePill ? (
          <View
            style={[
              styles.savePill,
              saveStatus === 'error' ? styles.savePillError : styles.savePillOk,
            ]}
            testID="settings.saveStatus"
          >
            <Text style={styles.savePillText}>{savePill}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>CUENTA</Text>
          <Text style={styles.sectionRightMuted}>Miembro desde enero 2024</Text>
        </View>

        <Text style={styles.sectionLabel}>IDIOMA</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <SettingsIconTile backgroundColor="rgba(66, 133, 244, 0.18)">
              <Ionicons name="language" size={18} color={colors.google} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Idioma</Text>
              <Text style={styles.rowSubtitle}>
                {language.isLoading
                  ? 'Cargando…'
                  : language.language === 'es'
                    ? 'Español'
                    : 'English'}
              </Text>
            </View>
            <View style={styles.langButtons}>
              <Pressable
                accessibilityRole="button"
                testID="settings.lang.es"
                disabled={language.isLoading}
                onPress={() => void language.setLanguage('es')}
                style={[
                  styles.langChip,
                  language.language === 'es' ? styles.langChipActive : styles.langChipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.langChipText,
                    language.language === 'es'
                      ? styles.langChipTextActive
                      : styles.langChipTextInactive,
                  ]}
                >
                  ES
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                testID="settings.lang.en"
                disabled={language.isLoading}
                onPress={() => void language.setLanguage('en')}
                style={[
                  styles.langChip,
                  language.language === 'en' ? styles.langChipActive : styles.langChipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.langChipText,
                    language.language === 'en'
                      ? styles.langChipTextActive
                      : styles.langChipTextInactive,
                  ]}
                >
                  EN
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            testID="settings.editProfile"
            onPress={onOpenEditProfile}
            style={styles.row}
          >
            <SettingsIconTile backgroundColor="rgba(60, 60, 70, 0.08)">
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Editar perfil</Text>
              <Text style={styles.rowSubtitle} testID="settings.email">
                {name} · {email || '—'}
                {phone ? ` · ${phone}` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            accessibilityRole="button"
            testID="settings.passwordRow"
            onPress={() =>
              Alert.alert('Próximamente', 'Aquí irá el flujo para cambiar contraseña.')
            }
            style={styles.row}
          >
            <SettingsIconTile backgroundColor="rgba(60, 60, 70, 0.08)">
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Contraseña</Text>
              <Text style={styles.rowSubtitle}>Cambiar contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>NOTIFICACIONES</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <SettingsIconTile backgroundColor="rgba(255, 107, 53, 0.16)">
              <Ionicons name="checkmark-done" size={18} color={colors.navActive} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Recordatorios de tareas</Text>
              <Text style={styles.rowSubtitle}>Rutinas y pendientes de tus mascotas</Text>
            </View>
            <Switch
              testID="settings.taskReminders"
              value={taskRemindersEnabled}
              onValueChange={(v) => setTaskRemindersEnabled(v)}
              trackColor={{ false: colors.border, true: colors.navActive }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <SettingsIconTile backgroundColor="rgba(255, 107, 53, 0.16)">
              <Ionicons name="notifications" size={18} color={colors.navActive} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Alertas de Radar cercanas</Text>
              <Text style={styles.rowSubtitle}>Mascotas perdidas o vistas cerca de ti</Text>
            </View>
            <Switch
              testID="settings.radarAlerts"
              value={radarAlertsEnabled}
              onValueChange={(v) => setRadarAlertsEnabled(v)}
              trackColor={{ false: colors.border, true: colors.navActive }}
              thumbColor={colors.white}
            />
          </View>

          {radarAlertsEnabled ? (
            <>
              <View style={styles.divider} />
              <View style={styles.sliderBlock}>
                <View style={styles.sliderHeader}>
                  <SettingsIconTile backgroundColor="rgba(255, 107, 53, 0.16)">
                    <Ionicons name="sunny" size={18} color={colors.navActive} />
                  </SettingsIconTile>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowTitle}>Radio de alertas</Text>
                    <Text style={styles.rowSubtitle}>Mascotas en esta distancia</Text>
                  </View>
                  <View style={styles.badge} testID="settings.radiusBadge">
                    <Text style={styles.badgeText}>{kmLabel(alertRadiusKm)}</Text>
                  </View>
                </View>

                <Slider
                  testID="settings.alertRadius"
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={alertRadiusKm}
                  minimumTrackTintColor={colors.navActive}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.white}
                  onValueChange={(v) => setAlertRadius(Number(v))}
                />

                <View style={styles.sliderTicks}>
                  <Text style={styles.tickText}>1 km</Text>
                  <Text style={styles.tickText}>10 km</Text>
                </View>
              </View>
            </>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.row}>
            <SettingsIconTile backgroundColor="rgba(67, 160, 71, 0.16)">
              <Ionicons name="cart-outline" size={18} color={colors.successIcon} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Actualizaciones de servicios</Text>
              <Text style={styles.rowSubtitle}>Estado de tus reservas y servicios</Text>
            </View>
            <Switch
              testID="settings.serviceUpdates"
              value={serviceUpdatesEnabled}
              onValueChange={(v) => setServiceUpdatesEnabled(v)}
              trackColor={{ false: colors.border, true: colors.navActive }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <SettingsIconTile backgroundColor="rgba(66, 133, 244, 0.16)">
              <Ionicons name="megaphone-outline" size={18} color={colors.google} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Novedades de Plaka</Text>
              <Text style={styles.rowSubtitle}>Anuncios y novedades de la app</Text>
            </View>
            <Switch
              testID="settings.plakaNews"
              value={plakaNewsEnabled}
              onValueChange={(v) => setPlakaNewsEnabled(v)}
              trackColor={{ false: colors.border, true: colors.navActive }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>PAGOS Y DIRECCIONES</Text>

        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            testID="settings.paymentMethods"
            onPress={() =>
              Alert.alert(
                'Próximamente',
                'La gestión de métodos de pago estará disponible más adelante.',
              )
            }
            style={styles.row}
          >
            <SettingsIconTile backgroundColor="rgba(60, 60, 70, 0.08)">
              <Ionicons name="card-outline" size={18} color={colors.textSecondary} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Métodos de pago</Text>
              <Text style={styles.rowSubtitle}>Próximamente</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            accessibilityRole="button"
            testID="settings.addresses"
            onPress={() =>
              Alert.alert(
                'Próximamente',
                'La gestión de direcciones estará disponible más adelante.',
              )
            }
            style={styles.row}
          >
            <SettingsIconTile backgroundColor="rgba(60, 60, 70, 0.08)">
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Direcciones</Text>
              <Text style={styles.rowSubtitle}>Próximamente</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>REPORTES Y AYUDA</Text>

        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            testID="settings.myReports"
            onPress={() => router.push('/(app)/profile/reports')}
            style={styles.row}
          >
            <SettingsIconTile backgroundColor="rgba(60, 60, 70, 0.08)">
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Mis reportes</Text>
              <Text style={styles.rowSubtitle}>Historial de reportes de Radar</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.card}>
          {FAQ_ITEMS.map((item, index) => (
            <View key={item.question}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.faqItem} testID={`settings.faq.${index}`}>
                <Text style={styles.rowTitle}>{item.question}</Text>
                <Text style={styles.rowSubtitle}>{item.answer}</Text>
              </View>
            </View>
          ))}

          <View style={styles.divider} />

          <Pressable
            accessibilityRole="button"
            testID="settings.contactSupport"
            onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            style={styles.row}
          >
            <SettingsIconTile backgroundColor="rgba(66, 133, 244, 0.16)">
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.google} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Contactar soporte</Text>
              <Text style={styles.rowSubtitle}>{SUPPORT_EMAIL}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>SESIÓN Y PRIVACIDAD</Text>

        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            testID="settings.logout"
            onPress={() => void onPressLogout()}
            style={styles.row}
          >
            <SettingsIconTile backgroundColor="rgba(60, 60, 70, 0.08)">
              <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Cerrar sesión</Text>
              <Text style={styles.rowSubtitle}>{email || '—'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            accessibilityRole="button"
            testID="settings.deleteAccount"
            onPress={() => setDeleteOpen(true)}
            style={styles.row}
          >
            <SettingsIconTile backgroundColor="rgba(229, 57, 53, 0.14)">
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </SettingsIconTile>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, styles.dangerTitle]}>Eliminar cuenta</Text>
              <Text style={styles.rowSubtitle}>Esta acción es permanente e irreversible</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.footer} testID="settings.footer">
          Huellitas v{appVersion} · Hecho con ❤️ en México
        </Text>
      </ScrollView>

      <Modal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDeleteOpen(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Eliminar cuenta</Text>
          <Text style={styles.modalSubtitle}>
            Esta acción es permanente e irreversible. Escribe{' '}
            <Text style={styles.mono}>DELETE</Text> para confirmar.
          </Text>

          <TextInput
            testID="settings.deleteConfirmInput"
            value={deleteText}
            onChangeText={setDeleteText}
            placeholder="Escribe aquí…"
            autoCapitalize="characters"
            autoCorrect={false}
            style={[styles.input, canDelete ? styles.inputOk : styles.inputDefault]}
          />

          <Pressable
            accessibilityRole="button"
            testID="settings.deleteConfirm"
            disabled={!canDelete || deleteBusy}
            onPress={() => void onConfirmDelete()}
            style={[
              styles.deleteButton,
              !canDelete || deleteBusy ? styles.deleteButtonDisabled : styles.deleteButtonEnabled,
            ]}
          >
            <Text style={styles.deleteButtonText}>
              {deleteBusy ? 'Eliminando…' : 'Eliminar mi cuenta'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            testID="settings.deleteCancel"
            onPress={() => {
              setDeleteOpen(false);
              setDeleteText('');
            }}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal
        visible={editProfileOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditProfileOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setEditProfileOpen(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Editar perfil</Text>

          <TextInput
            testID="settings.editProfile.name"
            value={editName}
            onChangeText={setEditName}
            placeholder="Nombre"
            style={[styles.input, styles.inputDefault]}
          />

          <TextInput
            testID="settings.editProfile.email"
            value={editEmail}
            onChangeText={setEditEmail}
            placeholder="Correo"
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, styles.inputDefault]}
          />

          <TextInput
            testID="settings.editProfile.phone"
            value={editPhone}
            onChangeText={setEditPhone}
            placeholder="Teléfono (opcional)"
            keyboardType="phone-pad"
            style={[styles.input, styles.inputDefault]}
          />

          {editError ? (
            <Text style={styles.editErrorText} testID="settings.editProfile.error">
              {editError}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            testID="settings.editProfile.save"
            disabled={editSaving}
            onPress={() => void onSaveEditProfile()}
            style={[styles.deleteButton, styles.saveProfileButton]}
          >
            {editSaving ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.deleteButtonText}>Guardar cambios</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            testID="settings.editProfile.cancel"
            onPress={() => setEditProfileOpen(false)}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  brand: {
    color: BRAND_NAVY,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  backText: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
  },
  profileCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  avatarWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.navActive,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    overflow: 'hidden',
    ...shadows.md,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  editFab: {
    position: 'absolute',
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.google,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.button,
  },
  profileName: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.caption,
    letterSpacing: 1,
  },
  sectionRightMuted: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: 'right',
    maxWidth: '55%',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLeft: {
    flex: 1,
    gap: spacing.xxs,
  },
  langButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  langChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  langChipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  langChipInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  langChipText: {
    ...typography.caption,
  },
  langChipTextActive: {
    color: colors.white,
  },
  langChipTextInactive: {
    color: colors.textPrimary,
  },
  rowTitle: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
  },
  rowSubtitle: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sliderBlock: {
    gap: spacing.sm,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.textPrimary,
  },
  badgeText: {
    color: colors.white,
    ...typography.caption,
  },
  sliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tickText: {
    color: colors.textMuted,
    ...typography.caption,
  },
  readOnlyPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(60, 60, 70, 0.08)',
  },
  readOnlyText: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  dangerTitle: {
    color: colors.danger,
  },
  footer: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.textMuted,
    ...typography.caption,
  },
  savePill: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  savePillOk: {
    backgroundColor: 'rgba(94, 114, 228, 0.06)',
    borderColor: 'rgba(94, 114, 228, 0.25)',
  },
  savePillError: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'rgba(229, 57, 53, 0.25)',
  },
  savePillText: {
    color: colors.textPrimary,
    ...typography.caption,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '25%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.md,
  },
  modalTitle: {
    color: colors.textPrimary,
    ...typography.heading,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    ...typography.body,
  },
  mono: {
    fontFamily: 'monospace',
    ...typography.bodyStrong,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputDefault: {
    borderColor: colors.border,
  },
  inputOk: {
    borderColor: colors.danger,
  },
  deleteButton: {
    minHeight: 52,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonEnabled: {
    backgroundColor: colors.danger,
  },
  deleteButtonDisabled: {
    backgroundColor: 'rgba(229, 57, 53, 0.35)',
  },
  deleteButtonText: {
    color: colors.white,
    ...typography.button,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    color: colors.textSecondary,
    ...typography.bodyStrong,
  },
  faqItem: {
    gap: spacing.xxs,
  },
  editErrorText: {
    color: colors.danger,
    ...typography.caption,
  },
  saveProfileButton: {
    backgroundColor: colors.navActive,
  },
});
