import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { setAuth, setProfile } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        router.replace('/(auth)/login');
        return;
      }

      setAuth(session.user, session);

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        router.replace('/(auth)/profile-setup');
      } else {
        setProfile(profile);
        router.replace('/(tabs)');
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <Text className="text-text-muted text-lg">Completing sign in...</Text>
    </View>
  );
}
