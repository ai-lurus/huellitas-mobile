import { useNotifications } from '../../hooks/useNotifications';

/**
 * Monta el hook de push en el árbol raíz (requiere `expo-router` y sesión en `useAuthStore`).
 */
export function NotificationBootstrap(): null {
  useNotifications();
  return null;
}
