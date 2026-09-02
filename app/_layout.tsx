import '../global.css';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryProvider } from '../lib/queryClient';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase/client';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setAuth, setAuthLoading, isAuthLoading, refreshProfile } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setAuthLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          // Check if the session has expired
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          if (expiresAt && expiresAt < now) {
            // Session expired - clear everything
            setAuth(null, null);
            setAuthLoading(false);
            return;
          }

          setAuth(session.user, session);
          // Refresh profile from DB in the background (non-blocking)
          refreshProfile();
        } else {
          setAuth(null, null);
        }
      } catch {
        if (mounted) {
          setAuth(null, null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes (token refresh, sign out from other tab, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setAuth(null, null);
        useAuthStore.getState().setProfile(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setAuth(session.user, session);
          if (event === 'SIGNED_IN') {
            refreshProfile();
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F9F9' }}>
        <ActivityIndicator size={Platform.OS === 'web' ? 'large' : 36} color="#007782" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthInitializer>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="orders" options={{ headerShown: false }} />
          <Stack.Screen name="profile/[username]" options={{ headerShown: false }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="addresses/index" options={{ headerShown: false }} />
        </Stack>
      </AuthInitializer>
    </QueryProvider>
  );
}
