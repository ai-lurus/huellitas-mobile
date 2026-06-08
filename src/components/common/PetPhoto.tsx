import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

interface PetPhotoProps {
  uri: string | null | undefined;
  fallback: number;
  style: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  fallbackResizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export function PetPhoto({
  uri,
  fallback,
  style,
  resizeMode = 'cover',
  fallbackResizeMode = 'contain',
}: PetPhotoProps): React.ReactElement {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const hasPhoto = Boolean(uri?.trim()) && !errored;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={fallback}
        style={StyleSheet.absoluteFill}
        resizeMode={fallbackResizeMode}
        accessibilityIgnoresInvertColors
      />
      {hasPhoto && (
        <Image
          source={{ uri: uri as string }}
          style={[StyleSheet.absoluteFill, loaded ? null : styles.hidden]}
          resizeMode={resizeMode}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
      {hasPhoto && !loaded && (
        <ActivityIndicator style={StyleSheet.absoluteFill} size="small" color="rgba(0,0,0,0.25)" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  hidden: { opacity: 0 },
});
