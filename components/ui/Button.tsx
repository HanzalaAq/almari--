import React from 'react';
import { Pressable, Text, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onPress,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const baseStyles: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    opacity: disabled ? 0.5 : 1,
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: '#FF7A1A',
    },
    secondary: {
      backgroundColor: '#F3F4F6',
    },
    outline: {
      borderWidth: 2,
      borderColor: '#FF7A1A',
      backgroundColor: 'transparent',
    },
  };

  const sizeStyles: Record<string, ViewStyle> = {
    sm: {
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    md: {
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    lg: {
      paddingHorizontal: 32,
      paddingVertical: 14,
    },
  };

  const textVariantStyles: Record<string, TextStyle> = {
    primary: {
      color: '#FFFFFF',
    },
    secondary: {
      color: '#1A1A1A',
    },
    outline: {
      color: '#FF7A1A',
    },
  };

  const textSizeStyles: Record<string, TextStyle> = {
    sm: {
      fontSize: 14,
    },
    md: {
      fontSize: 16,
    },
    lg: {
      fontSize: 18,
    },
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[baseStyles, variantStyles[variant], sizeStyles[size], style]}
    >
      <Text
        style={[
          { fontWeight: '600' },
          textVariantStyles[variant],
          textSizeStyles[size],
          textStyle,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}
