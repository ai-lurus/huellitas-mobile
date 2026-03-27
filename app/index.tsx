import { Redirect } from 'expo-router';

// Entry point — redirects based on auth state
// Replace with auth check once authStore is implemented
export default function Index(): React.JSX.Element {
  return <Redirect href="/(auth)/sign-in" />;
}
