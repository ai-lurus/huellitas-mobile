import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../../../design/tokens';

const MAX_PHOTOS = 3;

export interface PhotoPickerProps {
  photoUris: string[];
  onChange: (next: string[]) => void;
  testID?: string;
}

export function PhotoPicker({
  photoUris,
  onChange,
  testID = 'radar.wizard.photos',
}: PhotoPickerProps): React.ReactElement {
  const canAddMore = photoUris.length < MAX_PHOTOS;

  async function pickPhotos(): Promise<void> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: MAX_PHOTOS - photoUris.length,
    });
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      onChange([...photoUris, ...newUris].slice(0, MAX_PHOTOS));
    }
  }

  function removePhoto(uri: string): void {
    onChange(photoUris.filter((u) => u !== uri));
  }

  return (
    <View testID={testID}>
      <View style={styles.row}>
        {photoUris.map((uri) => (
          <View key={uri} style={styles.thumb}>
            <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
            <Pressable
              onPress={() => removePhoto(uri)}
              style={styles.remove}
              testID={`${testID}.remove`}
            >
              <Ionicons color={colors.white} name="close-circle" size={20} />
            </Pressable>
          </View>
        ))}
        {canAddMore ? (
          <Pressable onPress={() => void pickPhotos()} style={styles.add} testID={`${testID}.add`}>
            <Ionicons color={colors.textSecondary} name="camera-outline" size={24} />
            <Text style={styles.addLabel}>
              {photoUris.length === 0 ? 'Agregar foto' : 'Agregar más'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.hint}>
        {photoUris.length}/{MAX_PHOTOS} fotos
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: { width: 80, height: 80 },
  remove: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
  },
  add: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
});
