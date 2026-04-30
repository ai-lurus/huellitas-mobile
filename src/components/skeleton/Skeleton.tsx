import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { radius } from '../../design/tokens';

export function Skeleton({
  style,
  borderRadius,
}: {
  style?: ViewStyle | ViewStyle[];
  borderRadius?: number;
}): React.JSX.Element {
  const translate = useRef(new Animated.Value(0)).current;

  useEffect((): void | (() => void) => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translate, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(translate, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [translate]);

  const shimmerTranslateX = translate.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 80],
  });

  const r = borderRadius ?? radius.lg;
  const containerStyle = useMemo(
    () => [styles.container, { borderRadius: r }, style] as const,
    [r, style],
  );

  return (
    <View style={containerStyle}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: shimmerTranslateX }] }]}
      >
        <LinearGradient
          colors={['rgba(236,239,245,0)', 'rgba(236,239,245,0.9)', 'rgba(236,239,245,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ECEFF5',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
});
