import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { colors, control, radius, spacing, typography } from '../../design/tokens';

interface CreatePostFormProps {
  onSubmit: (data: {
    content?: string;
    photoUri?: string;
    lat?: number;
    lng?: number;
    locationLabel?: string;
  }) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
  authorName?: string;
}

export function CreatePostForm({
  onSubmit,
  isSubmitting,
  onCancel,
  authorName,
}: CreatePostFormProps): React.JSX.Element {
  const [content, setContent] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  async function pickImage(): Promise<void> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function handleSubmit(): void {
    if (!content.trim() && !photoUri) return;
    onSubmit({ content: content.trim() || undefined, photoUri });
  }

  const canSubmit = (content.trim().length > 0 || Boolean(photoUri)) && !isSubmitting;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle" size={40} color={colors.border} />
        </View>
        <Text style={styles.authorName}>{authorName ?? 'Tú'}</Text>
      </View>

      <TextInput
        style={styles.input}
        value={content}
        onChangeText={setContent}
        placeholder="¿Qué está haciendo tu mascota hoy?"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={500}
        autoFocus
        editable={!isSubmitting}
        testID="create-post-content"
      />

      {photoUri ? (
        <View style={styles.photoPreview}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
          <Pressable style={styles.removePhoto} onPress={() => setPhotoUri(undefined)}>
            <Ionicons name="close-circle" size={24} color={colors.danger} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.toolbar}>
        <Pressable style={styles.toolbarBtn} onPress={pickImage} disabled={isSubmitting}>
          <Ionicons name="image-outline" size={22} color={colors.primary} />
          <Text style={styles.toolbarLabel}>Foto</Text>
        </Pressable>
        <Text style={styles.charCount}>{content.length}/500</Text>
      </View>

      <View style={styles.actions}>
        {onCancel ? (
          <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={isSubmitting}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          testID="create-post-submit"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.submitText}>Publicar</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  input: {
    minHeight: 120,
    fontSize: 16,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  photoPreview: {
    position: 'relative',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  removePhoto: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  toolbarLabel: {
    ...typography.label,
    color: colors.primary,
  },
  charCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelBtn: {
    height: control.minHeight,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  submitBtn: {
    height: control.minHeight,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  submitBtnDisabled: {
    backgroundColor: colors.border,
  },
  submitText: {
    ...typography.button,
    color: colors.white,
  },
});
