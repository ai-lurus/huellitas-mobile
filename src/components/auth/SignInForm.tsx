import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

import { colors, control, radius, shadows, spacing, typography } from '../../design/tokens';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';

const AUTH_ERROR_COPY = 'Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.';

function formatSubmitError(err: unknown): string {
  if (err instanceof Error && err.message) {
    const m = err.message.toLowerCase();
    if (
      m.includes('invalid') ||
      m.includes('credential') ||
      m.includes('401') ||
      m.includes('unauthorized')
    ) {
      return AUTH_ERROR_COPY;
    }
    return err.message;
  }
  return AUTH_ERROR_COPY;
}

export interface SignInFormProps {
  onSuccess: (result: { isFirstLogin: boolean }) => void;
  onGooglePress?: () => void;
  onApplePress?: () => void;
  onSignUpPress?: () => void;
}

type SignInFields = {
  email: string;
  password: string;
};

type SignInFieldErrors = Partial<Record<keyof SignInFields, string>>;

interface SignInFormState {
  fields: SignInFields;
  fieldErrors: SignInFieldErrors;
  submitError: string | null;
  isLoading: boolean;
}

const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Correo electrónico no válido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export function SignInForm({
  onSuccess,
  onGooglePress,
  onApplePress,
  onSignUpPress,
}: SignInFormProps): React.ReactElement {
  const [state, setState] = useState<SignInFormState>({
    fields: { email: '', password: '' },
    fieldErrors: {},
    submitError: null,
    isLoading: false,
  });
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleFieldFocus = (field: 'email' | 'password'): void => {
    clearBlurSchedule();
    setFocusedField(field);
  };

  const handleFieldBlur = (field: 'email' | 'password'): void => {
    blurTimeoutRef.current = setTimeout(() => {
      setFocusedField((prev) => (prev === field ? null : prev));
      blurTimeoutRef.current = null;
    }, 120);
  };

  const setField = (key: keyof SignInFields, value: string): void => {
    setState((prev) => ({
      ...prev,
      fields: { ...prev.fields, [key]: value },
      fieldErrors: { ...prev.fieldErrors, [key]: undefined },
      submitError: null,
    }));
  };

  const validate = (): { ok: true; data: SignInFields } | { ok: false } => {
    const result = signInSchema.safeParse(state.fields);
    if (result.success) return { ok: true, data: result.data };

    const fieldErrors: SignInFieldErrors = {};
    const flattened = result.error.flatten().fieldErrors;
    if (flattened.email?.[0]) fieldErrors.email = flattened.email[0];
    if (flattened.password?.[0]) fieldErrors.password = flattened.password[0];

    setState((prev) => ({ ...prev, fieldErrors }));
    return { ok: false };
  };

  const handleSubmit = async (): Promise<void> => {
    const validated = validate();
    if (!validated.ok) return;

    setState((prev) => ({ ...prev, isLoading: true, submitError: null }));
    try {
      const { user, isFirstLogin } = await authService.signIn(
        validated.data.email,
        validated.data.password,
      );

      useAuthStore.getState().setUser(user);
      onSuccess({ isFirstLogin });
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        submitError: formatSubmitError(err),
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const hasSubmitError = Boolean(state.submitError);
  const emailFieldInvalid = Boolean(state.fieldErrors.email);
  const passwordFieldInvalid = Boolean(state.fieldErrors.password);
  const verifying = state.isLoading;

  const emailErrorVisual = hasSubmitError || emailFieldInvalid;
  const passwordErrorVisual = hasSubmitError || passwordFieldInvalid;

  const emailBorderStyle = verifying
    ? styles.inputSuccess
    : emailErrorVisual
      ? styles.inputError
      : focusedField === 'email'
        ? styles.inputFocused
        : styles.inputDefault;

  const passwordBorderStyle = verifying
    ? styles.inputSuccess
    : passwordErrorVisual
      ? styles.inputError
      : focusedField === 'password'
        ? styles.inputFocused
        : styles.inputDefault;

  return (
    <View style={styles.container}>
      <View style={styles.branding}>
        <Ionicons name="paw-outline" size={control.logo} color={colors.primary} />
        <Text style={styles.brandTitle}>Huellitas</Text>
        <Text style={styles.brandSubtitle}>Encuentra a tu mascota perdida</Text>
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
        <Text style={styles.label}>Correo electrónico</Text>
        <View style={[styles.inputRow, emailBorderStyle]}>
          <TextInput
            testID="signIn.email"
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
            ) : emailErrorVisual ? (
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
        <View style={[styles.inputRow, passwordBorderStyle]}>
          <TextInput
            testID="signIn.password"
            value={state.fields.password}
            onChangeText={(t) => setField('password', t)}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            secureTextEntry={!showPassword}
            textContentType="password"
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
              testID="signIn.password.toggle"
              onPress={() => setShowPassword((v) => !v)}
              style={styles.inputTrailing}
              hitSlop={8}
              accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={control.icon}
                color={passwordErrorVisual ? colors.dangerIcon : colors.iconMuted}
              />
            </Pressable>
          )}
        </View>
        {state.fieldErrors.password ? (
          <Text style={styles.fieldError}>{state.fieldErrors.password}</Text>
        ) : null}

        <Pressable
          testID="signIn.submit"
          onPress={handleSubmit}
          disabled={state.isLoading}
          style={[styles.primaryButton, state.isLoading ? styles.primaryButtonLoading : null]}
        >
          {state.isLoading ? (
            <View style={styles.primaryButtonLoadingInner}>
              <Text style={styles.primaryButtonText}>Verificando...</Text>
              <ActivityIndicator
                testID="signIn.loading"
                color="#fff"
                size="small"
                style={styles.primaryButtonSpinner}
              />
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
          )}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>O CONTINÚA CON</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable testID="signIn.google" onPress={onGooglePress} style={styles.socialButton}>
          <View style={styles.socialIconSlot}>
            <Ionicons name="logo-google" size={control.iconLg} color={colors.google} />
          </View>
          <Text style={styles.socialButtonText}>Continuar con Google</Text>
          <View style={styles.socialIconSlot} />
        </Pressable>

        <Pressable
          testID="signIn.apple"
          onPress={onApplePress}
          style={[styles.socialButton, styles.socialButtonSpaced]}
        >
          <View style={styles.socialIconSlot}>
            <Ionicons name="logo-apple" size={control.iconLg} color={colors.black} />
          </View>
          <Text style={styles.socialButtonText}>Continuar con Apple</Text>
          <View style={styles.socialIconSlot} />
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>¿No tienes cuenta?</Text>
          <Pressable testID="signIn.signUp" onPress={onSignUpPress} hitSlop={8}>
            <Text style={styles.footerLink}> Regístrate</Text>
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
  branding: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandTitle: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    ...typography.title,
  },
  brandSubtitle: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    ...typography.body,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingVertical: 13,
    backgroundColor: colors.surface,
    minHeight: control.minHeight,
  },
  socialButtonSpaced: {
    marginTop: 12,
  },
  socialIconSlot: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
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
