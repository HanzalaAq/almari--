import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE = '#007782';
const INACTIVE = '#8B9393';

interface TabRoute {
  key: string;
  name: string;
}

interface TabDescriptor {
  options: {
    tabBarIcon?: (props: { color: string; size: number }) => React.ReactNode;
    tabBarLabel?: string;
    tabBarAccessibilityLabel?: string;
    tabBarTestID?: string;
  };
}

interface MobileTabBarProps {
  state: {
    index: number;
    routes: TabRoute[];
  };
  descriptors: Record<string, TabDescriptor>;
  navigation: {
    navigate: (name: string) => void;
  };
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  search: 'search-outline',
  sell: 'add-circle-outline',
  messages: 'chatbubble-outline',
  profile: 'person-outline',
};

export function MobileTabBar({ state, descriptors, navigation }: MobileTabBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        height: 56,
        alignItems: 'center',
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const color = isFocused ? ACTIVE : INACTIVE;
        const descriptor = descriptors[route.key];
        const icon = descriptor?.options?.tabBarIcon;
        const iconName = ICONS[route.name] || 'ellipse-outline';

        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole="button"
            accessibilityLabel={descriptor?.options?.tabBarAccessibilityLabel}
            accessibilityState={isFocused ? { selected: true } : {}}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 6,
            }}
          >
            {icon ? (
              icon({ color, size: 24 })
            ) : (
              <Ionicons name={iconName} size={24} color={color} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
