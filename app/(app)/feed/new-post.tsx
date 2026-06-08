import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreatePostForm } from '../../../src/components/feed/CreatePostForm';
import { colors } from '../../../src/design/tokens';
import { useCreatePost } from '../../../src/hooks/useCreatePost';
import { useAuthStore } from '../../../src/stores/authStore';

export default function NewPostScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const user = useAuthStore((s) => s.user);
  const { mutate: createPost, isPending } = useCreatePost();

  function handleSubmit(data: {
    content?: string;
    photoUri?: string;
    lat?: number;
    lng?: number;
    locationLabel?: string;
  }): void {
    createPost(
      { ...data, groupId: groupId ?? undefined },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <CreatePostForm
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        onCancel={() => router.back()}
        authorName={user?.name}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
