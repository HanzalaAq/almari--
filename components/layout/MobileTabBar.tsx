import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE = '#007782';
const INACTIVE = '#8B9393';

export function MobileTabBar(props: any) {
  return (
    <View className="bg-white border-t border-gray-200">
      <Tabs.TabBar
        {...props}
        screenOptions={{
          tabBarActiveTintColor: ACTIVE,
          tabBarInactiveTintColor: INACTIVE,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            height: 50,
          },
          tabBarItemStyle: {
            paddingVertical: 6,
          },
        }}
      >
        <Tabs.TabBarScreen
          name="index"
          options={{
            tabBarIcon: ({ color, size }: any) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.TabBarScreen
          name="search"
          options={{
            tabBarIcon: ({ color, size }: any) => (
              <Ionicons name="search-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.TabBarScreen
          name="sell"
          options={{
            tabBarIcon: ({ color, size }: any) => (
              <Ionicons name="add-circle-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.TabBarScreen
          name="messages"
          options={{
            tabBarIcon: ({ color, size }: any) => (
              <Ionicons name="chatbubble-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.TabBarScreen
          name="profile"
          options={{
            tabBarIcon: ({ color, size }: any) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs.TabBar>
    </View>
  );
}
