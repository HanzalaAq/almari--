import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export function MobileTabBar(props: any) {
  return (
    <View className="bg-white border-t border-gray-200 pb-safe pt-2">
      <Tabs.TabBar
        {...props}
        screenOptions={{
          tabBarActiveTintColor: '#FF7A1A',
          tabBarInactiveTintColor: '#888888',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E5E5',
          },
        }}
      >
        <Tabs.TabBarScreen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }: any) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.TabBarScreen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, size }: any) => (
              <Ionicons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tabs.TabBarScreen
          name="sell"
          options={{
            title: 'Sell',
            tabBarIcon: ({ color, size }: any) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.TabBarScreen
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size }: any) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
          }}
        />
        <Tabs.TabBarScreen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }: any) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs.TabBar>
    </View>
  );
}
