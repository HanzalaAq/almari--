import '../global.css';
import { Stack } from 'expo-router';
import { QueryProvider } from '../lib/queryClient';
import { useAuthStore } from '../store/useAuthStore';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      useAuthStore.getState().setAuth(session?.user ?? null, session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.getState().setAuth(session?.user ?? null, session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="orders" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[username]" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      </Stack>
    </QueryProvider>
  );
}
