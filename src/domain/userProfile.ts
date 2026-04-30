import { z } from 'zod';

import { petSpeciesSchema } from './pets';
import { lostReportKindSchema } from './lostReports';

const nonEmptyString = z.string().trim().min(1);

export const activeUserReportSchema = z.object({
  id: nonEmptyString,
  petName: nonEmptyString,
  petSpecies: petSpeciesSchema,
  petBreed: z.string().trim().min(1).nullable().optional(),
  petPhotoUrl: z.string().trim().min(1).nullable().optional(),
  reportKind: lostReportKindSchema.optional(),
  createdAt: nonEmptyString.optional(),
});

export const publicUserProfileSchema = z.object({
  id: nonEmptyString,
  name: nonEmptyString,
  imageUrl: z.string().trim().min(1).nullable().optional(),
  createdAt: nonEmptyString.optional(),
  joinedAt: nonEmptyString.optional(),

  email: z.string().email().optional(),
  phone: nonEmptyString.optional(),

  medalsCount: z.number().int().nonnegative().optional(),
  petsHelpedCount: z.number().int().nonnegative().optional(),

  activeReports: z.array(activeUserReportSchema).optional(),
});

export type PublicUserProfile = z.infer<typeof publicUserProfileSchema>;
export type ActiveUserReport = z.infer<typeof activeUserReportSchema>;
