import { ActivityIndicator, View } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

const sizeMap = {
  sm: 16,
  md: 28,
  lg: 40,
};

export default function LoadingSpinner({
  size = 'md',
  className = '',
  color = '#007782',
}: LoadingSpinnerProps) {
  return (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator
        size={sizeMap[size]}
        color={color}
        accessibilityLabel="Loading"
      />
    </View>
  );
}
