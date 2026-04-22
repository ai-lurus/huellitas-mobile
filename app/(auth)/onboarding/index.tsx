import { Redirect } from 'expo-router';

export default function OnboardingIndex(): React.JSX.Element {
  return <Redirect href="/(auth)/onboarding/step-1" />;
}
