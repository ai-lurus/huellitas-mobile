import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

import { colors, control, radius, shadows, spacing, typography } from '../../design/tokens';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';

export const signUpSchema = z
  .object({
    name: z.string().min(2, 'El nombre es obligatorio'),
    email: z
      .string()
      .min(1, 'El correo electrónico es obligatorio')
      .email('Ingresa un correo electrónico válido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type SignUpFields = z.infer<typeof signUpSchema>;

type SignUpFieldKey = keyof SignUpFields;

type SignUpFieldErrors = Partial<Record<SignUpFieldKey, string>>;

function formatSubmitError(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'No se pudo crear la cuenta. Intenta de nuevo.';
}

export interface SignUpFormProps {
  onSuccess: () => void;
  onSignInPress?: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
}

interface SignUpFormState {
  fields: SignUpFields;
  fieldErrors: SignUpFieldErrors;
  termsError: string | null;
  submitError: string | null;
  isLoading: boolean;
  acceptedTerms: boolean;
}

const initialFields: SignUpFields = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function SignUpForm({
  onSuccess,
  onSignInPress,
  onTermsPress,
  onPrivacyPress,
}: SignUpFormProps): React.ReactElement {
  const [state, setState] = useState<SignUpFormState>({
    fields: initialFields,
    fieldErrors: {},
    termsError: null,
    submitError: null,
    isLoading: false,
    acceptedTerms: false,
  });
  const [focusedField, setFocusedField] = useState<SignUpFieldKey | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return (): void => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const clearBlurSchedule = (): void => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  const handleFieldFocus = (field: SignUpFieldKey): void => {
    clearBlurSchedule();
    setFocusedField(field);
  };

  const handleFieldBlur = (field: SignUpFieldKey): void => {
    blurTimeoutRef.current = setTimeout(() => {
      setFocusedField((prev) => (prev === field ? null : prev));
      blurTimeoutRef.current = null;
    }, 120);
  };

  const setField = (key: SignUpFieldKey, value: string): void => {
    setState((prev) => ({
      ...prev,
      fields: { ...prev.fields, [key]: value },
      fieldErrors: { ...prev.fieldErrors, [key]: undefined },
      submitError: null,
    }));
  };

  const setAcceptedTerms = (value: boolean): void => {
    setState((prev) => ({
      ...prev,
      acceptedTerms: value,
      termsError: null,
      submitError: null,
    }));
  };

  const validate = (): { ok: true; data: SignUpFields } | { ok: false } => {
    const result = signUpSchema.safeParse(state.fields);
    if (!result.success) {
      const fieldErrors: SignUpFieldErrors = {};
      const flattened = result.error.flatten().fieldErrors;
      if (flattened.name?.[0]) fieldErrors.name = flattened.name[0];
      if (flattened.email?.[0]) fieldErrors.email = flattened.email[0];
      if (flattened.password?.[0]) fieldErrors.password = flattened.password[0];
      if (flattened.confirmPassword?.[0])
        fieldErrors.confirmPassword = flattened.confirmPassword[0];

      setState((prev) => ({
        ...prev,
        fieldErrors,
        termsError: null,
      }));
      return { ok: false };
    }

    if (!state.acceptedTerms) {
      setState((prev) => ({
        ...prev,
        fieldErrors: {},
        termsError: 'Debes aceptar los términos de servicio',
      }));
      return { ok: false };
    }

    return { ok: true, data: result.data };
  };

  const handleSubmit = async (): Promise<void> => {
    const validated = validate();
    if (!validated.ok) return;

    setState((prev) => ({ ...prev, isLoading: true, submitError: null }));
    try {
      const { user } = await authService.signUp(
        validated.data.name,
        validated.data.email,
        validated.data.password,
      );
      useAuthStore.getState().setUser(user);
      onSuccess();
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        submitError: formatSubmitError(err),
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const verifying = state.isLoading;
  const hasSubmitError = Boolean(state.submitError);

  const inputBorder = (field: SignUpFieldKey, fieldInvalid: boolean): ViewStyle => {
    if (verifying) return styles.inputSuccess;
    if (hasSubmitError || fieldInvalid) return styles.inputError;
    if (focusedField === field) return styles.inputFocused;
    return styles.inputDefault;
  };

  const nameInvalid = Boolean(state.fieldErrors.name);
  const emailInvalid = Boolean(state.fieldErrors.email);
  const passwordInvalid = Boolean(state.fieldErrors.password);
  const confirmInvalid = Boolean(state.fieldErrors.confirmPassword);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Crea tu cuenta</Text>
        <Text style={styles.screenSubtitle}>
          Únete a una comunidad unida para ayudar a reunir mascotas con sus familias
        </Text>
      </View>

      {state.submitError ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Ionicons
            name="alert-circle-outline"
            size={control.icon}
            color={colors.dangerIcon}
            style={styles.errorBannerIcon}
          />
          <Text style={styles.errorBannerText}>{state.submitError}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <Text style={styles.label}>Nombre completo</Text>
        <View style={[styles.inputRow, inputBorder('name', nameInvalid)]}>
          <TextInput
            testID="signUp.name"
            value={state.fields.name}
            onChangeText={(t) => setField('name', t)}
            placeholder="Ana García"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            editable={!state.isLoading}
            onFocus={() => handleFieldFocus('name')}
            onBlur={() => handleFieldBlur('name')}
            selectionColor={colors.primary}
            style={styles.inputField}
          />
          <View style={styles.inputTrailing} pointerEvents="none">
            {verifying ? (
              <Ionicons
                name="checkmark-circle-outline"
                size={control.icon}
                color={colors.successIcon}
              />
            ) : nameInvalid ? (
              <Ionicons name="alert-circle-outline" size={control.icon} color={colors.dangerIcon} />
            ) : (
              <Ionicons name="person-outline" size={control.icon} color={colors.iconMuted} />
            )}
          </View>
        </View>
        {state.fieldErrors.name ? (
          <Text style={styles.fieldError}>{state.fieldErrors.name}</Text>
        ) : null}

        <Text style={[styles.label, styles.labelSpaced]}>Correo electrónico</Text>
        <View style={[styles.inputRow, inputBorder('email', emailInvalid)]}>
          <TextInput
            testID="signUp.email"
            value={state.fields.email}
            onChangeText={(t) => setField('email', t)}
            placeholder="ejemplo@correo.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!state.isLoading}
            onFocus={() => handleFieldFocus('email')}
            onBlur={() => handleFieldBlur('email')}
            selectionColor={colors.primary}
            style={styles.inputField}
          />
          <View style={styles.inputTrailing} pointerEvents="none">
            {verifying ? (
              <Ionicons
                name="checkmark-circle-outline"
                size={control.icon}
                color={colors.successIcon}
              />
            ) : emailInvalid ? (
              <Ionicons name="alert-circle-outline" size={control.icon} color={colors.dangerIcon} />
            ) : (
              <Ionicons name="mail-outline" size={control.icon} color={colors.iconMuted} />
            )}
          </View>
        </View>
        {state.fieldErrors.email ? (
          <Text style={styles.fieldError}>{state.fieldErrors.email}</Text>
        ) : null}

        <Text style={[styles.label, styles.labelSpaced]}>Contraseña</Text>
        <View style={[styles.inputRow, inputBorder('password', passwordInvalid)]}>
          <TextInput
            testID="signUp.password"
            value={state.fields.password}
            onChangeText={(t) => setField('password', t)}
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            secureTextEntry={!showPassword}
            textContentType="newPassword"
            editable={!state.isLoading}
            onFocus={() => handleFieldFocus('password')}
            onBlur={() => handleFieldBlur('password')}
            selectionColor={colors.primary}
            style={styles.inputField}
          />
          {verifying ? (
            <View style={styles.inputTrailing} pointerEvents="none">
              <Ionicons
                name="checkmark-circle-outline"
                size={control.icon}
                color={colors.successIcon}
              />
            </View>
          ) : (
            <Pressable
              testID="signUp.password.toggle"
              onPress={() => setShowPassword((v) => !v)}
              style={styles.inputTrailing}
              hitSlop={8}
              accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={control.icon}
                color={passwordInvalid ? colors.dangerIcon : colors.iconMuted}
              />
            </Pressable>
          )}
        </View>
        {state.fieldErrors.password ? (
          <Text style={styles.fieldError}>{state.fieldErrors.password}</Text>
        ) : null}

        <Text style={[styles.label, styles.labelSpaced]}>Confirmar contraseña</Text>
        <View style={[styles.inputRow, inputBorder('confirmPassword', confirmInvalid)]}>
          <TextInput
            testID="signUp.confirmPassword"
            value={state.fields.confirmPassword}
            onChangeText={(t) => setField('confirmPassword', t)}
            placeholder="Repite tu contraseña"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            secureTextEntry={!showConfirmPassword}
            textContentType="newPassword"
            editable={!state.isLoading}
            onFocus={() => handleFieldFocus('confirmPassword')}
            onBlur={() => handleFieldBlur('confirmPassword')}
            selectionColor={colors.primary}
            style={styles.inputField}
          />
          {verifying ? (
            <View style={styles.inputTrailing} pointerEvents="none">
              <Ionicons
                name="checkmark-circle-outline"
                size={control.icon}
                color={colors.successIcon}
              />
            </View>
          ) : (
            <Pressable
              testID="signUp.confirmPassword.toggle"
              onPress={() => setShowConfirmPassword((v) => !v)}
              style={styles.inputTrailing}
              hitSlop={8}
              accessibilityLabel={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={control.icon}
                color={confirmInvalid ? colors.dangerIcon : colors.iconMuted}
              />
            </Pressable>
          )}
        </View>
        {state.fieldErrors.confirmPassword ? (
          <Text style={styles.fieldError}>{state.fieldErrors.confirmPassword}</Text>
        ) : null}

        <View style={styles.termsRow}>
          <Pressable
            testID="signUp.terms"
            onPress={() => setAcceptedTerms(!state.acceptedTerms)}
            disabled={state.isLoading}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: state.acceptedTerms }}
            style={styles.checkboxHit}
          >
            <View style={[styles.checkbox, state.acceptedTerms ? styles.checkboxChecked : null]}>
              {state.acceptedTerms ? (
                <Ionicons name="checkmark" size={16} color={colors.white} />
              ) : null}
            </View>
          </Pressable>
          <Text style={styles.termsText}>
            Acepto los{' '}
            <Text onPress={() => onTermsPress?.()} style={styles.termsLink}>
              términos de servicio
            </Text>{' '}
            y la{' '}
            <Text onPress={() => onPrivacyPress?.()} style={styles.termsLink}>
              política de privacidad
            </Text>
          </Text>
        </View>
        {state.termsError ? <Text style={styles.fieldError}>{state.termsError}</Text> : null}

        <Pressable
          testID="signUp.submit"
          onPress={handleSubmit}
          disabled={state.isLoading}
          style={[styles.primaryButton, state.isLoading ? styles.primaryButtonLoading : null]}
        >
          {state.isLoading ? (
            <View style={styles.primaryButtonLoadingInner}>
              <Text style={styles.primaryButtonText}>Creando cuenta...</Text>
              <ActivityIndicator
                testID="signUp.loading"
                color="#fff"
                size="small"
                style={styles.primaryButtonSpinner}
              />
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>Crear cuenta</Text>
          )}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <Pressable testID="signUp.signIn" onPress={onSignInPress} hitSlop={8}>
            <Text style={styles.footerLink}> Inicia sesión</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    marginBottom: spacing.lg,
    alignSelf: 'stretch',
  },
  screenTitle: {
    color: colors.textPrimary,
    ...typography.title,
  },
  screenSubtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    ...typography.body,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  errorBannerIcon: {
    marginRight: spacing.md,
    marginTop: 1,
  },
  errorBannerText: {
    flex: 1,
    color: colors.dangerDark,
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    width: '100%',
  },
  label: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    ...typography.label,
  },
  labelSpaced: {
    marginTop: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: control.ringWidth,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingRight: spacing.md,
    minHeight: control.minHeight,
  },
  inputDefault: {
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputSuccess: {
    borderColor: colors.success,
  },
  inputField: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputTrailing: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldError: {
    marginTop: 6,
    color: colors.danger,
    fontSize: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  checkboxHit: {
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  termsText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: control.minHeight,
    ...shadows.button,
  },
  primaryButtonLoading: {
    opacity: 0.92,
  },
  primaryButtonLoadingInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonSpinner: {
    marginLeft: 10,
  },
  primaryButtonText: {
    color: colors.white,
    ...typography.button,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
    paddingBottom: 8,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
