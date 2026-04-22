import { Redirect } from 'expo-router';

/** Ruta legada: el flujo vive en `/(auth)/onboarding/`. */
export default function OnboardingLegacyRedirect(): React.JSX.Element {
  return <Redirect href="/(auth)/onboarding/step-1" />;
}
