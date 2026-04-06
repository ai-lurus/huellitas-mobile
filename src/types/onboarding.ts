export type OnboardingPermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface OnboardingProfileUpdatePayload {
  name?: string;
  imageUri?: string | null;
  locationEnabled?: boolean;
  notificationsEnabled?: boolean;
}
