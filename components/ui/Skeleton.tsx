// components/ui/Skeleton.tsx
import React from 'react';
import { View, ViewStyle, Animated, DimensionValue } from 'react-native';
import { spacing } from '../theme/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  style?: ViewStyle;
}

export const Skeleton = ({ width = '100%', height = spacing.md, style }: SkeletonProps) => {
  const opacity = new Animated.Value(0.3);
  Animated.loop(
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
    ])
  ).start();

  return (
    <Animated.View
      style={[{ backgroundColor: '#E0E0E0', width, height, borderRadius: spacing.xs }, style, { opacity }]}
    />
  );
};
