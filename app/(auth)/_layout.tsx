import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import { WebNavbar } from '../../components/layout/WebNavbar';
import { WebFooter } from '../../components/layout/WebFooter';
import { useAuthStore } from '../../store/useAuthStore';

export default function AuthLayout() {
  const { user, isAuthLoading } = useAuthStore();

  // Redirect authenticated users away from auth screens
  if (!isAuthLoading && user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={{ flex: 1 }}>
      {Platform.OS === 'web' && <WebNavbar />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="profile-setup" />
      </Stack>
      <WebFooter />
    </View>
  );
}
