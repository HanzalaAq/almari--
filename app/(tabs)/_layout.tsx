import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { WebNavbar } from '../../components/layout/WebNavbar';
import { MobileTabBar } from '../../components/layout/MobileTabBar';

export default function TabsLayout() {
  return (
    <>
      {Platform.OS === 'web' && <WebNavbar />}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: Platform.OS === 'web' ? { display: 'none' } : undefined,
          tabBar: Platform.OS === 'web' ? () => null : (props) => <MobileTabBar {...props} />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            href: '/',
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            href: '/search',
          }}
        />
        <Tabs.Screen
          name="sell"
          options={{
            title: 'Sell',
            href: '/sell',
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            href: '/messages',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            href: '/profile',
          }}
        />
      </Tabs>
    </>
  );
}
