import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  profile?: any;
}

export default function ProfileHeader({ profile: propProfile }: ProfileHeaderProps = {}) {
  const router = useRouter();
  const { profile: authProfile, user } = useAuthStore();
  const profile = propProfile || authProfile;

  const avatar = profile?.photo_url ? { uri: profile.photo_url } : null;

  return (
    <View className="bg-white p-6 border-b border-gray-200 items-center mb-4">
      <View className="w-24 h-24 bg-brand rounded-full items-center justify-center mb-3 overflow-hidden">
        {avatar ? (
          <Image source={avatar} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Text className="text-white font-bold text-3xl">
            {profile?.name?.charAt(0).toUpperCase() ?? 'U'}
          </Text>
        )}
      </View>
      <Text className="text-xl font-bold text-text-primary mb-1">
        {profile?.name ?? 'User'}
      </Text>
      <Text className="text-text-secondary">
        {profile?.city ?? ''}
      </Text>
      {profile?.rating && (
        <Text className="text-brand font-semibold mt-1">
          ★ {profile.rating.toFixed(1)}
        </Text>
      )}
      {/* Edit Profile button placeholder */}
      <Pressable
        className="mt-3 bg-brand rounded-full py-1 px-4"
        onPress={() => {
          // future edit profile action
        }}
      >
        <Text className="text-white text-sm font-medium">Edit Profile</Text>
      </Pressable>
    </View>
  );
}
