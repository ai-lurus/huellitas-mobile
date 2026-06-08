import { z } from 'zod';

export const groupTypeSchema = z.enum(['neighborhood', 'breed', 'custom']);
export type GroupType = z.infer<typeof groupTypeSchema>;

export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: groupTypeSchema,
  description: z.string().nullable(),
  photoUrl: z.string().nullable(),
  memberCount: z.number().default(0),
  breed: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  isMember: z.boolean().default(false),
  createdAt: z.string(),
});

export const groupsResponseSchema = z.object({
  myGroups: z.array(groupSchema),
  suggested: z.array(groupSchema),
});

export type Group = z.infer<typeof groupSchema>;
export type GroupsResponse = z.infer<typeof groupsResponseSchema>;

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  neighborhood: 'Vecinal',
  breed: 'Raza',
  custom: 'Grupo',
};

export const GROUP_TYPE_ICONS: Record<GroupType, string> = {
  neighborhood: '🏘️',
  breed: '🐾',
  custom: '👥',
};
