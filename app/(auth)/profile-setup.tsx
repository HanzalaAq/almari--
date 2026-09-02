import { View, Text, TextInput, Pressable, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfileImage } from '../../lib/storage/upload';
import { Ionicons } from '@expo/vector-icons';

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, setProfile } = useAuthStore();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    if (!user) {
      setError('You must be signed in to complete your profile.');
      return;
    }
    if (!name.trim() || !city) {
      setError('Please fill in your name and select a city.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      let photoUrl = '';
      if (photo) {
        photoUrl = await uploadProfileImage(photo, user.id);
      }

      // Create user profile (upsert to handle edge cases)
      const { error: insertError } = await supabase.from('users').upsert(
        {
          id: user.id,
          name: name.trim(),
          city,
          photo_url: photoUrl,
        },
        { onConflict: 'id' }
      );

      if (insertError) {
        // If it's a duplicate key error, try updating instead
        if (insertError.code === '23505') {
          const { error: updateError } = await supabase
            .from('users')
            .update({ name: name.trim(), city, photo_url: photoUrl })
            .eq('id', user.id);
          if (updateError) throw updateError;
        } else {
          throw insertError;
        }
      }

      const newProfile = {
        id: user.id,
        name: name.trim(),
        city,
        photo_url: photoUrl || null,
      };

      setProfile(newProfile);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Could not save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 px-6 py-10 justify-center max-w-md self-center w-full">
        <View className="mb-8">
          <View className="w-14 h-14 bg-brand rounded-2xl items-center justify-center mb-4">
            <Ionicons name="person-outline" size={28} color="#fff" />
          </View>
          <Text className="text-3xl font-bold text-brand mb-2">Complete Your Profile</Text>
          <Text className="text-text-secondary text-base">
            Tell us a bit about yourself so we can personalize your experience.
          </Text>
        </View>

        {/* Error display */}
        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex-row items-start gap-3">
            <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
            <Text className="text-red-600 flex-1 text-sm leading-5">{error}</Text>
          </View>
        ) : null}

        {/* Photo picker */}
        <View className="items-center mb-8">
          <Pressable onPress={pickImage} className="w-28 h-28 rounded-full bg-gray-100 items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
            {photo ? (
              <Image source={{ uri: photo }} className="w-full h-full rounded-full" />
            ) : (
              <View className="items-center">
                <Ionicons name="camera-outline" size={30} color="#9CA3AF" />
                <Text className="text-text-muted text-xs mt-1">Add Photo</Text>
              </View>
            )}
          </Pressable>
          <Text className="text-text-muted text-xs mt-2">Optional but recommended</Text>
        </View>

        {/* Name */}
        <View className="mb-5">
          <Text className="text-text-primary font-bold mb-2">Name *</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3.5 text-text-primary bg-gray-50"
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* City picker */}
        <View className="mb-8">
          <Text className="text-text-primary font-bold mb-2">City *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
            {CITIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCity(c)}
                className={`mr-3 px-5 py-2.5 rounded-full border ${
                  city === c
                    ? 'bg-brand border-brand shadow-sm shadow-brand/20'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`font-bold ${
                    city === c ? 'text-white' : 'text-text-secondary'
                  }`}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleComplete}
          disabled={loading}
          className={`rounded-full py-4 items-center ${
            loading ? 'bg-brand/60' : 'bg-brand'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Complete Setup</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
