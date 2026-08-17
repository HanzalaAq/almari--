import { View, Text, TextInput, Pressable, ScrollView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth, setProfile } = useAuthStore();

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('92')) return `+${cleaned}`;
    if (cleaned.startsWith('0')) return `+92${cleaned.substring(1)}`;
    return `+92${cleaned}`;
  };

  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setError('');
      const formattedPhone = formatPhone(phone);
      const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      if (error) throw error;
      setStep('otp');
      if (Platform.OS !== 'web') Alert.alert('Success', 'OTP sent to your phone');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setLoading(true);
      setError('');
      const formattedPhone = formatPhone(phone);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      if (data.user) {
        setAuth(data.user, data.session);
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (!profile) router.replace('/(auth)/profile-setup');
        else {
          setProfile(profile);
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web' ? `${window.location.origin}/auth/callback` : undefined,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
                </Pressable>
        try {
          // keep UI-level loading state minimal; actual redirect happens via Supabase
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: Platform.OS === 'web' ? `${window.location.origin}/auth/callback` : undefined,
            },
          });
          if (error) throw error;
                      maxLength={6}
                    />
    import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
    import { useState } from 'react';
    import { useRouter } from 'expo-router';
    import { supabase } from '../../lib/supabase/client';
    import { useAuthStore } from '../../store/useAuthStore';
    import { Ionicons } from '@expo/vector-icons';

    export default function LoginScreen() {
      const router = useRouter();
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState('');
      const { setAuth, setProfile } = useAuthStore();

      const handleGoogleLogin = async () => {
        try {
          setLoading(true);
          setError('');
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: Platform.OS === 'web' ? `${window.location.origin}/auth/callback` : undefined,
            },
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
                  className="bg-white border border-border rounded-full py-3.5 flex flex-row items-center justify-center gap-2"
                >
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                  <Text className="text-text-primary font-medium text-base">Sign in with Google</Text>
                </Pressable>

                <Text className="text-text-muted text-center text-xs mt-5 leading-relaxed">
                  By continuing, you agree to Almari's <Text className="text-brand">Terms of Service</Text> and <Text className="text-brand">Privacy Policy</Text>
                </Text>
              </View>

              <View className="mt-6 flex flex-row items-center justify-center gap-1">
                <Ionicons name="information-circle-outline" size={16} color="#8B9393" />
                <Text className="text-text-muted text-sm text-center">New to Almari? Just sign in to create an account</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      );
    }
                      maxLength={6}
