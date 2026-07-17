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
    if (cleaned.startsWith('92')) {
      return `+${cleaned}`;
    }
    if (cleaned.startsWith('0')) {
      return `+92${cleaned.substring(1)}`;
    }
    return `+92${cleaned}`;
  };

  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setError('');
      
      const formattedPhone = formatPhone(phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;
      
      setStep('otp');
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'OTP sent to your phone');
      }
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
        
        // Check if profile exists
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profile) {
          router.replace('/(auth)/profile-setup');
        } else {
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
    <ScrollView className="flex-1 bg-gradient-to-br from-brand-light via-orange-50 to-pink-50">
      <View className="min-h-screen flex items-center justify-center px-8 py-12">
        {/* Decorative Elements */}
        <View className="absolute top-20 right-20 w-64 h-64 bg-brand/10 rounded-full blur-3xl" />
        <View className="absolute bottom-20 left-20 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl" />

        <View className="w-full max-w-md relative z-10">
          {/* Logo Section */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-gradient-to-r from-brand to-orange-600 rounded-3xl items-center justify-center mb-4 shadow-2xl shadow-brand/30">
              <Text className="text-white text-4xl font-bold">A</Text>
            </View>
            <Text className="text-4xl font-bold bg-gradient-to-r from-brand to-orange-600 bg-clip-text text-transparent mb-2">
              Welcome to Almari
            </Text>
            <Text className="text-text-secondary text-center text-lg">
              {step === 'phone' 
                ? 'Sign in to start buying and selling' 
                : 'Enter the OTP sent to your phone'}
            </Text>
          </View>

          {/* Login Card */}
          <View className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-900/10 p-8 border border-gray-100">
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex flex-row items-center gap-3">
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                <Text className="text-red-600 flex-1">{error}</Text>
              </View>
            ) : null}

            {step === 'phone' ? (
              <>
                {/* Phone Input */}
                <View className="mb-6">
                  <Text className="text-text-primary font-semibold mb-3 text-base">
                    Phone Number
                  </Text>
                  <View className="flex flex-row items-center bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-brand px-4 py-4">
                    <Text className="text-text-secondary mr-3 text-lg">+92</Text>
                    <TextInput
                      className="flex-1 text-text-primary text-lg"
                      placeholder="3001234567"
                      placeholderTextColor="#888"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                    <Ionicons name="phone-portrait-outline" size={24} color="#888" />
                  </View>
                </View>

                {/* Send OTP Button */}
                <Pressable
                  onPress={handleSendOTP}
                  disabled={loading || phone.length !== 10}
                  className={`bg-gradient-to-r from-brand to-orange-600 rounded-xl py-4 shadow-lg shadow-brand/30 mb-6 ${
                    loading || phone.length !== 10 ? 'opacity-50' : ''
                  }`}
                >
                  <Text className="text-white text-center font-bold text-lg">
                    {loading ? 'Sending...' : 'Send OTP'}
                  </Text>
                </Pressable>

                {/* Divider */}
                <View className="flex flex-row items-center mb-6">
                  <View className="flex-1 h-px bg-gray-200" />
                  <Text className="text-text-muted px-4">or continue with</Text>
                  <View className="flex-1 h-px bg-gray-200" />
                </View>

                {/* Google Sign In */}
                <Pressable
                  onPress={handleGoogleLogin}
                  disabled={loading}
                  className="bg-white border-2 border-gray-200 rounded-xl py-4 mb-6 flex flex-row items-center justify-center gap-3 hover:border-brand transition-colors"
                >
                  <Ionicons name="logo-google" size={24} color="#4285F4" />
                  <Text className="text-text-primary font-semibold text-lg">
                    Sign in with Google
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* OTP Input */}
                <View className="mb-6">
                  <Text className="text-text-primary font-semibold mb-3 text-base">
                    Verification Code
                  </Text>
                  <View className="flex flex-row items-center bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-brand px-4 py-4">
                    <TextInput
                      className="flex-1 text-text-primary text-2xl tracking-widest text-center font-bold"
                      placeholder="000000"
                      placeholderTextColor="#ccc"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <Ionicons name="keypad-outline" size={24} color="#888" />
                  </View>
                </View>

                {/* Verify Button */}
                <Pressable
                  onPress={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className={`bg-gradient-to-r from-brand to-orange-600 rounded-xl py-4 shadow-lg shadow-brand/30 mb-4 ${
                    loading || otp.length !== 6 ? 'opacity-50' : ''
                  }`}
                >
                  <Text className="text-white text-center font-bold text-lg">
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </Text>
                </Pressable>

                {/* Resend OTP */}
                <Pressable onPress={() => setStep('phone')} className="items-center">
                  <Text className="text-brand font-semibold">
                    Change Phone Number
                  </Text>
                </Pressable>
              </>
            )}

            {/* Terms */}
            <Text className="text-text-muted text-center text-sm mt-6 leading-relaxed">
              By continuing, you agree to Almari's{' '}
              <Text className="text-brand">Terms of Service</Text> and{' '}
              <Text className="text-brand">Privacy Policy</Text>
            </Text>
          </View>

          {/* Sign Up Link */}
          <View className="mt-8 flex flex-row items-center justify-center gap-2">
            <Ionicons name="information-circle-outline" size={20} color="#888" />
            <Text className="text-text-secondary text-center">
              New to Almari? Just sign in to create an account
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
