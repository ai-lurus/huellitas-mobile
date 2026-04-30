import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);

export const inboxNotificationKindSchema = z.enum([
  'sighting',
  'lost',
  'resolved',
  'reminder',
  'system',
]);

export type InboxNotificationKind = z.infer<typeof inboxNotificationKindSchema>;

export const inboxNotificationSchema = z.object({
  id: nonEmptyString,
  createdAt: nonEmptyString,
  title: nonEmptyString,
  body: z.string().optional(),
  kind: inboxNotificationKindSchema.default('system'),
  /** Si la notificación refiere a un reporte, navegamos al detalle. */
  reportId: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isRead: z.boolean().default(false),
});

export type InboxNotification = z.infer<typeof inboxNotificationSchema>;
