import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const redirectTo =
        Platform.OS === 'web'
          ? `${(globalThis as any)?.location?.origin ?? 'http://localhost:19006'}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="min-h-screen flex items-center justify-center px-8 py-12">
        <View className="w-full max-w-md">
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-brand rounded-2xl items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">A</Text>
            </View>
            <Text className="text-2xl font-bold text-text-primary mb-2">Welcome to Almari</Text>
            <Text className="text-text-secondary text-center text-base">Sign in to start buying and selling</Text>
          </View>

          <View className="bg-white rounded-xl p-6 border border-border">
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text className="text-red-600 flex-1 text-sm">{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleGoogleLogin}
              disabled={loading}
              className="bg-brand rounded-full py-3.5 flex flex-row items-center justify-center gap-2"
            >
              <Ionicons name="logo-google" size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold text-base">
                {loading ? 'Opening Google...' : 'Continue with Google'}
              </Text>
            </Pressable>

            <Text className="text-text-muted text-center text-xs mt-5 leading-relaxed">
              By continuing with Google, you agree to Almari's <Text className="text-brand">Terms of Service</Text> and <Text className="text-brand">Privacy Policy</Text>
            </Text>
          </View>

          <View className="mt-6 flex flex-row items-center justify-center gap-1">
            <Ionicons name="information-circle-outline" size={16} color="#8B9393" />
            <Text className="text-text-muted text-sm text-center">New to Almari? Continue with Google to create an account</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
