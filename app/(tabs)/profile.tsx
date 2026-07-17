import { View, Text, ScrollView, Pressable, Image, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';

interface UserProfile {
  id: string;
  name: string;
  city: string;
  photo_url?: string;
  rating?: number;
  stats?: {
    listings_count: number;
    sold_count: number;
    rented_count: number;
    exchanged_count: number;
  };
}

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  city: string;
  condition: string;
}

export default function ProfileScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const { user, profile, logout, setProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editCity, setEditCity] = useState(profile?.city || '');
  const [editPhoto, setEditPhoto] = useState<string | null>(profile?.photo_url || null);

  const isOwnProfile = !username || username === user?.id;
  const targetUserId = isOwnProfile ? user?.id : username;

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['profile', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!targetUserId,
  });

  const { data: listings } = useQuery({
    queryKey: ['user-listings', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', targetUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Listing[];
    },
    enabled: !!targetUserId,
  });

  const { data: walletBalance } = useQuery({
    queryKey: ['wallet-balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      // Calculate wallet balance from completed orders
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('seller_id', user.id)
        .eq('status', 'confirmed');

      if (error) throw error;
      const total = data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      return total * 0.9; // 10% commission
    },
    enabled: isOwnProfile && !!user?.id,
  });

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editName,
          city: editCity,
          photo_url: editPhoto,
        })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile({
        ...profile,
        name: editName,
        city: editCity,
        photo_url: editPhoto,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleWithdraw = () => {
    Alert.alert('Withdraw', 'This feature is coming soon. Bank transfer integration pending.');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditPhoto(result.assets[0].uri);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-muted">Loading...</Text>
      </View>
    );
  }

  const displayProfile = isOwnProfile ? profile : userProfile;

  if (!displayProfile) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-muted">Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="items-center mb-4">
          {isEditing ? (
            <Pressable onPress={pickImage} className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center mb-3">
              {editPhoto ? (
                <Image source={{ uri: editPhoto }} className="w-full h-full rounded-full" />
              ) : (
                <Text className="text-text-muted">Add Photo</Text>
              )}
            </Pressable>
          ) : (
            <View className="w-24 h-24 bg-brand rounded-full items-center justify-center mb-3">
              <Text className="text-white font-bold text-3xl">
                {displayProfile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {isEditing ? (
            <TextInput
              className="text-xl font-bold text-text-primary text-center mb-1"
              value={editName}
              onChangeText={setEditName}
            />
          ) : (
            <Text className="text-xl font-bold text-text-primary mb-1">{displayProfile.name}</Text>
          )}

          {isEditing ? (
            <TextInput
              className="text-text-secondary text-center"
              value={editCity}
              onChangeText={setEditCity}
            />
          ) : (
            <Text className="text-text-secondary">{displayProfile.city}</Text>
          )}

          {displayProfile.rating && (
            <Text className="text-brand font-semibold mt-1">★ {displayProfile.rating.toFixed(1)}</Text>
          )}
        </View>

        {isOwnProfile ? (
          <View className="flex flex-row gap-3">
            {isEditing ? (
              <>
                <Pressable
                  onPress={handleSaveProfile}
                  className="flex-1 bg-brand rounded-full py-2 items-center"
                >
                  <Text className="text-white font-semibold">Save</Text>
                </Pressable>
                <Pressable
                  onPress={() => setIsEditing(false)}
                  className="flex-1 bg-gray-200 rounded-full py-2 items-center"
                >
                  <Text className="text-text-primary font-semibold">Cancel</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => setIsEditing(true)}
                  className="flex-1 bg-gray-200 rounded-full py-2 items-center"
                >
                  <Text className="text-text-primary font-semibold">Edit Profile</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    logout();
                    router.replace('/(auth)/login');
                  }}
                  className="flex-1 bg-red-100 rounded-full py-2 items-center"
                >
                  <Text className="text-red-600 font-semibold">Logout</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <Link href={`/messages?user=${displayProfile.id}`} asChild>
            <Pressable className="bg-brand rounded-full py-2 items-center">
              <Text className="text-white font-semibold">Message</Text>
            </Pressable>
          </Link>
        )}
      </View>

      {/* Wallet (Own Profile Only) */}
      {isOwnProfile && (
        <View className="bg-white p-6 mb-4 border-b border-gray-200">
          <Text className="text-lg font-bold text-brand mb-2">Wallet Balance</Text>
          <Text className="text-3xl font-bold text-text-primary mb-4">
            PKR {walletBalance?.toLocaleString() || '0'}
          </Text>
          <Pressable onPress={handleWithdraw} className="bg-brand rounded-full py-3 items-center">
            <Text className="text-white font-semibold">Withdraw</Text>
          </Pressable>
        </View>
      )}

      {/* Stats */}
      <View className="bg-white p-6 mb-4 border-b border-gray-200">
        <Text className="text-lg font-bold text-brand mb-4">Stats</Text>
        <View className="grid grid-cols-2 gap-4">
          <View className="bg-gray-50 rounded-lg p-4 items-center">
            <Text className="text-2xl font-bold text-brand">
              {displayProfile.stats?.listings_count || 0}
            </Text>
            <Text className="text-text-secondary">Listings</Text>
          </View>
          <View className="bg-gray-50 rounded-lg p-4 items-center">
            <Text className="text-2xl font-bold text-brand">
              {displayProfile.stats?.sold_count || 0}
            </Text>
            <Text className="text-text-secondary">Sold</Text>
          </View>
          <View className="bg-gray-50 rounded-lg p-4 items-center">
            <Text className="text-2xl font-bold text-brand">
              {displayProfile.stats?.rented_count || 0}
            </Text>
            <Text className="text-text-secondary">Rented</Text>
          </View>
          <View className="bg-gray-50 rounded-lg p-4 items-center">
            <Text className="text-2xl font-bold text-brand">
              {displayProfile.stats?.exchanged_count || 0}
            </Text>
            <Text className="text-text-secondary">Exchanged</Text>
          </View>
        </View>
      </View>

      {/* Active Listings */}
      <View className="bg-white p-6">
        <Text className="text-lg font-bold text-brand mb-4">Active Listings</Text>
        {listings?.length === 0 ? (
          <Text className="text-text-muted">No active listings</Text>
        ) : (
          <View className="grid grid-cols-2 gap-4">
            {listings?.map((item) => (
              <Link key={item.id} href={`/listing/${item.id}`} asChild>
                <Pressable className="bg-gray-50 rounded-xl overflow-hidden">
                  <Image source={{ uri: item.images[0] }} className="w-full h-32" resizeMode="cover" />
                  <View className="p-3">
                    <Text className="text-text-primary font-semibold mb-1" numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text className="text-brand font-bold">PKR {item.price.toLocaleString()}</Text>
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </View>

      {isOwnProfile && (
        <Link href="/orders" asChild>
          <Pressable className="bg-white p-4 mt-4 border-t border-gray-200">
            <Text className="text-text-primary font-semibold text-center">View Order History</Text>
          </Pressable>
        </Link>
      )}
    </ScrollView>
  );
}
