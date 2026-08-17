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
    borderRadius: 9999,
    opacity: disabled ? 0.5 : 1,
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: '#007782',
    },
    secondary: {
      backgroundColor: '#EDF2F2',
    },
    outline: {
      borderWidth: 1.5,
      borderColor: '#007782',
      backgroundColor: 'transparent',
    },
  };

  const sizeStyles: Record<string, ViewStyle> = {
    sm: {
      paddingHorizontal: 12,
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
      color: '#090A0A',
    },
    outline: {
      color: '#007782',
    },
  };

  const textSizeStyles: Record<string, TextStyle> = {
    sm: {
      fontSize: 13,
    },
    md: {
      fontSize: 15,
    },
    lg: {
      fontSize: 17,
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
