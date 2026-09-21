import { Platform, Pressable, PressableProps, View } from 'react-native';

/**
 * A Pressable wrapper that works reliably inside ScrollView on React Native Web.
 *
 * React Native Web's ScrollView intercepts touch-start events for scroll detection,
 * which breaks Pressable's onPress handler (the "Cannot record touch end without a
 * touch start" warning). On web, this component renders a View with a native DOM
 * onClick handler, bypassing RN's touch responder system entirely.
 *
 * On native platforms, it's a transparent pass-through to Pressable.
 */
export function WebPressable({
  onPress,
  disabled,
  style,
  className,
  children,
  ...props
}: PressableProps & { className?: string; onClick?: any }) {
  if (Platform.OS === 'web') {
    const handleClick = (e: any) => {
      if (disabled) return;
      e.stopPropagation?.();
      onPress?.(e);
    };

    return (
      <View
        onClick={handleClick}
        style={[{ cursor: disabled ? 'not-allowed' : 'pointer', userSelect: 'none' }, style as any]}
        className={className}
        {...(props as any)}
      >
        {typeof children === 'function' ? children({ pressed: false, hovered: false } as any) : children}
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={disabled} style={style} className={className} {...props}>
      {children}
    </Pressable>
  );
}
