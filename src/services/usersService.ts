import { z } from 'zod';

import type { AuthUser } from './authService';
import { httpClient } from '../network';
import type { OnboardingProfileUpdatePayload } from '../types/onboarding';

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  image: z.union([z.string().url(), z.null()]).optional(),
});

function isLocalImageUri(uri: string): boolean {
  return uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('ph://');
}

async function updateProfile(payload: OnboardingProfileUpdatePayload): Promise<AuthUser> {
  const hasLocalImage =
    typeof payload.imageUri === 'string' &&
    payload.imageUri.length > 0 &&
    isLocalImageUri(payload.imageUri);

  if (hasLocalImage && payload.imageUri) {
    const uri = payload.imageUri;
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const form = new FormData();
    form.append('image', {
      uri,
      name: filename.includes('.') ? filename : 'photo.jpg',
      type: mimeType,
    } as unknown as Blob);
    if (payload.name != null) form.append('name', payload.name);
    if (payload.locationEnabled != null) {
      form.append('locationEnabled', String(payload.locationEnabled));
    }
    if (payload.notificationsEnabled != null) {
      form.append('notificationsEnabled', String(payload.notificationsEnabled));
    }
    const res = await httpClient.patch<unknown>('/users/me', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const parsed = userSchema.parse(res.data);
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      image: parsed.image ?? undefined,
    };
  }

  const body: Record<string, unknown> = {};
  if (payload.name != null) body['name'] = payload.name;
  if (payload.imageUri === null) body['image'] = null;
  else if (
    typeof payload.imageUri === 'string' &&
    payload.imageUri.length > 0 &&
    !isLocalImageUri(payload.imageUri)
  ) {
    body['image'] = payload.imageUri;
  }
  if (payload.locationEnabled != null) body['locationEnabled'] = payload.locationEnabled;
  if (payload.notificationsEnabled != null)
    body['notificationsEnabled'] = payload.notificationsEnabled;

  const res = await httpClient.patch<unknown>('/users/me', body);
  const parsed = userSchema.parse(res.data);
  return {
    id: parsed.id,
    name: parsed.name,
    email: parsed.email,
    image: parsed.image ?? undefined,
  };
}

export const usersService = {
  updateProfile,
};
