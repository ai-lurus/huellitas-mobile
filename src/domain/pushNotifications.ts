import { z } from 'zod';

/**
 * Datos `data` enviados en notificaciones push (FCM/Expo) para deep linking.
 * El backend debe incluir `reportId` cuando la alerta esté ligada a un reporte.
 */
export const pushNotificationDataSchema = z
  .object({
    reportId: z.string().min(1),
  })
  .passthrough();

export type PushNotificationData = z.infer<typeof pushNotificationDataSchema>;
