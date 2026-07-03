import { z } from 'zod';

import { MAX_REPORT_DESCRIPTION_LENGTH } from '../config/constants';

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

export const lostReportWizardDataFormSchema = z.object({
  lastSeenDate: z.date(),
  lastSeenTime: z.date(),
  message: z
    .string()
    .trim()
    .min(1, 'La descripción es requerida')
    .max(MAX_REPORT_DESCRIPTION_LENGTH),
});

export type LostReportWizardDataForm = z.infer<typeof lostReportWizardDataFormSchema>;

export const lostReportSubmitSchema = z
  .object({
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
    lastSeenAt: z.date(),
    message: z.string().trim().min(1).max(MAX_REPORT_DESCRIPTION_LENGTH),
  })
  .refine((d) => d.lastSeenAt.getTime() <= Date.now(), {
    message: 'La fecha y hora no pueden ser futuras',
    path: ['lastSeenAt'],
  });

export type LostReportSubmitInput = z.infer<typeof lostReportSubmitSchema>;
