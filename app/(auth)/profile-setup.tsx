import { View, Text, TextInput, Pressable, Alert, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (!name || !city) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Upload photo if provided
      let photoUrl = '';
      if (photo) {
        // TODO: Implement R2 upload
        photoUrl = photo; // Temporary
      }

      // Create user profile
      const { error } = await supabase.from('users').insert({
        id: user?.id,
        name,
        city,
        photo_url: photoUrl,
      });

      if (error) throw error;

      // Update store
      useAuthStore.getState().setProfile({
        id: user?.id,
        name,
        city,
        photo_url: photoUrl,
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-brand mb-2">Complete Your Profile</Text>
        <Text className="text-text-secondary">
          Tell us a bit about yourself
        </Text>
      </View>

      <View className="items-center mb-6">
        <Pressable onPress={pickImage} className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center mb-2">
          {photo ? (
            <Image source={{ uri: photo }} className="w-full h-full rounded-full" />
          ) : (
            <Text className="text-text-muted text-center">Add Photo</Text>
          )}
        </Pressable>
      </View>

      <View className="mb-4">
        <Text className="text-text-primary font-medium mb-2">Name</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-text-primary"
          placeholder="Your name"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View className="mb-6">
        <Text className="text-text-primary font-medium mb-2">City</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-text-primary"
          placeholder="Your city"
          value={city}
          onChangeText={setCity}
        />
      </View>

      <Pressable
        onPress={handleComplete}
        disabled={loading}
        className="bg-brand rounded-full py-4 items-center"
      >
        <Text className="text-white font-semibold text-lg">
          {loading ? 'Saving...' : 'Complete Setup'}
        </Text>
      </Pressable>
    </View>
  );
}
