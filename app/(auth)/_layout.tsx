import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import { WebNavbar } from '../../components/layout/WebNavbar';
import { WebFooter } from '../../components/layout/WebFooter';

export default function AuthLayout() {
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
