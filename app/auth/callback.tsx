import { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { setAuth, setProfile } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const timeoutId = setTimeout(() => {
      setError('Sign-in is taking too long. Please try again.');
    }, 15000);

    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          clearTimeout(timeoutId);
          setError('Could not complete sign-in. Please try again.');
          return;
        }

        setAuth(session.user, session);

        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        clearTimeout(timeoutId);

        if (profileError || !profile) {
          // No profile yet - send to profile setup
          router.replace('/(auth)/profile-setup');
        } else {
          setProfile(profile);
          router.replace('/(tabs)');
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        setError(err.message || 'An unexpected error occurred.');
      }
    };

    handleAuthCallback();

    return () => clearTimeout(timeoutId);
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F9F9', padding: 24 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}>
          <Ionicons name="alert-circle-outline" size={40} color="#DC2626" />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 14, textAlign: 'center' }}>Sign-in issue</Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>{error}</Text>
          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            style={{ backgroundColor: '#007782', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 28, marginTop: 20 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Back to login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F9F9' }}>
      <ActivityIndicator size="large" color="#007782" />
      <Text style={{ marginTop: 16, fontSize: 15, color: '#6B7280' }}>Completing sign in…</Text>
    </View>
  );
}
