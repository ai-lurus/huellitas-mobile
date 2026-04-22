import type { AuthUser } from '../services/authService';
import { usersService } from '../services/usersService';

export interface PersistOnboardingProfileParams {
  name: string;
  photo: string | null;
  locationEnabled: boolean;
  notificationsEnabled: boolean;
}

/**
 * Envía al backend la foto (si hay URI local o remota), nombre y preferencias de permisos.
 * Si `photo` es null, no se modifica la imagen en el servidor.
 */
export async function persistOnboardingProfile(
  params: PersistOnboardingProfileParams,
): Promise<AuthUser> {
  return usersService.updateProfile({
    name: params.name,
    imageUri: params.photo === null ? undefined : params.photo,
    locationEnabled: params.locationEnabled,
    notificationsEnabled: params.notificationsEnabled,
  });
}
