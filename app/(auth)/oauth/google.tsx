import { Redirect } from 'expo-router';

/**
 * Ruta legada: el flujo OAuth vive en la pantalla de inicio de sesión (Better Auth + Expo).
 */
export default function GoogleOAuthRedirect(): React.JSX.Element {
  return <Redirect href="/(auth)/sign-in" />;
}
