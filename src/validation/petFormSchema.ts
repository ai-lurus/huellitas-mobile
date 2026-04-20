import { z } from 'zod';

import { petSexSchema, petSpeciesSchema } from '../domain/pets';

export const petFormSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(50, 'El nombre debe tener máximo 50 caracteres'),
  species: petSpeciesSchema,
  breed: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  color: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  sex: petSexSchema,
  age: z.preprocess(
    (v) => {
      if (v == null) return undefined;
      if (typeof v === 'number') return v;
      if (typeof v !== 'string') return undefined;
      const trimmed = v.trim();
      if (!trimmed) return undefined;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : v;
    },
    z
      .number({ invalid_type_error: 'La edad debe ser un número' })
      .int('La edad debe ser un número entero')
      .min(0, 'La edad no puede ser negativa')
      .optional(),
  ),
  notes: z
    .string()
    .trim()
    .max(300, 'Las notas deben tener máximo 300 caracteres')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  photos: z.array(z.string().min(1)).max(5, 'Puedes agregar hasta 5 fotos').optional(),
});

export type PetFormInput = z.input<typeof petFormSchema>;
export type PetFormValues = z.output<typeof petFormSchema>;
