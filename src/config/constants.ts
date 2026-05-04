export const MAX_PETS_PER_USER = 3;
export const MAX_PHOTOS_PER_PET = 5;
/** Coincide con la opción por defecto del desplegable de radio en Alertas. */
export const DEFAULT_ALERT_RADIUS_KM = 4;
export const MAX_ALERTS_PER_DAY = 3;
export const POLLING_INTERVAL_MS = 30_000;
export const LOCATION_UPDATE_THRESHOLD_METERS = 100;
/** Si el usuario rechaza el diálogo de ubicación en segundo plano, no volver a mostrarlo. */
export const STORAGE_KEY_LOCATION_BG_PROMPT_DECLINED = '@huellitas/location_bg_prompt_declined';
export const MAX_PET_NOTES_LENGTH = 300;
/** Mensaje opcional al reportar mascota perdida (FE-012). */
export const MAX_LOST_REPORT_MESSAGE_LENGTH = 500;

/** Token Expo Push guardado para detectar cambios y re-POST al backend (FE-013). */
export const STORAGE_KEY_PUSH_LAST_EXPO_TOKEN = '@huellitas/push_last_expo_token';
/** Evita solicitar permiso de notificaciones en cada arranque (FE-013). */
export const STORAGE_KEY_PUSH_PERMISSION_PROMPTED = '@huellitas/push_permission_prompted_v1';
