import { z } from 'zod';

import { MAX_REPORT_DESCRIPTION_LENGTH } from '../config/constants';

export const strayReportWizardDataFormSchema = z.object({
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']),
  seenDate: z.date(),
  seenTime: z.date(),
  color: z.string().max(100).optional(),
  description: z
    .string()
    .trim()
    .min(1, 'La descripción es requerida')
    .max(MAX_REPORT_DESCRIPTION_LENGTH),
});

export type StrayReportWizardDataForm = z.infer<typeof strayReportWizardDataFormSchema>;

export const strayReportSubmitSchema = z
  .object({
    species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']),
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
    seenAt: z.date(),
    color: z.string().max(100).optional(),
    description: z.string().trim().min(1).max(MAX_REPORT_DESCRIPTION_LENGTH),
    photoUris: z.array(z.string()).min(1, 'Agrega al menos una foto').max(3),
  })
  .refine((d) => d.seenAt.getTime() <= Date.now(), {
    message: 'La fecha y hora no pueden ser futuras',
    path: ['seenAt'],
  });

export type StrayReportSubmitInput = z.infer<typeof strayReportSubmitSchema>;
