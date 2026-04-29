import { z } from 'zod';

import { MAX_LOST_REPORT_MESSAGE_LENGTH } from '../config/constants';

export { MAX_LOST_REPORT_MESSAGE_LENGTH };

export const reportLostDetailsFormSchema = z.object({
  lastSeenDate: z.date(),
  lastSeenTime: z.date(),
  message: z.string().max(MAX_LOST_REPORT_MESSAGE_LENGTH).optional(),
});

export type ReportLostDetailsForm = z.infer<typeof reportLostDetailsFormSchema>;

export function combineReportDateTime(date: Date, time: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0,
  );
}

export const reportLostSubmitSchema = z
  .object({
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
    lastSeenAt: z.date(),
    message: z.string().max(MAX_LOST_REPORT_MESSAGE_LENGTH).optional(),
  })
  .refine((d) => d.lastSeenAt.getTime() <= Date.now(), {
    message: 'La fecha y hora no pueden ser futuras',
    path: ['lastSeenAt'],
  });

export type ReportLostSubmitInput = z.infer<typeof reportLostSubmitSchema>;
