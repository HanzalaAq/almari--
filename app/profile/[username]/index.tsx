import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase/client';
import { Ionicons } from '@expo/vector-icons';

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

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      if (!username) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', username)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!username,
  });

  const { data: listings } = useQuery({
    queryKey: ['user-listings', username],
    queryFn: async () => {
      if (!username) return [];
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', username)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Listing[];
    },
    enabled: !!username,
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-text-muted">Loading...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-text-muted">Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="items-center mb-4">
          <View className="w-24 h-24 bg-brand rounded-full items-center justify-center mb-3">
            <Text className="text-white font-bold text-3xl">
              {userProfile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-xl font-bold text-text-primary mb-1">{userProfile.name}</Text>
          <Text className="text-text-secondary">{userProfile.city}</Text>
          {userProfile.rating && (
            <Text className="text-brand font-semibold mt-1">★ {userProfile.rating.toFixed(1)}</Text>
          )}
        </View>

        <Link href={`/messages?user=${userProfile.id}`} asChild>
          <Pressable className="bg-brand rounded-full py-2 items-center">
            <Text className="text-white font-semibold">Message</Text>
          </Pressable>
        </Link>
      </View>

      <View className="bg-white p-6 mb-4 border-b border-gray-200">
        <Text className="text-lg font-bold text-brand mb-4">Stats</Text>
        <View className="grid grid-cols-2 gap-4">
          <View className="bg-gray-50 rounded-lg p-4 items-center">
            <Text className="text-2xl font-bold text-brand">
              {userProfile.stats?.listings_count || 0}
            </Text>
            <Text className="text-text-secondary">Listings</Text>
          </View>
          <View className="bg-gray-50 rounded-lg p-4 items-center">
            <Text className="text-2xl font-bold text-brand">
              {userProfile.stats?.sold_count || 0}
            </Text>
            <Text className="text-text-secondary">Sold</Text>
          </View>
          <View className="bg-gray-50 rounded-lg p-4 items-center">
            <Text className="text-2xl font-bold text-brand">
              {userProfile.stats?.rented_count || 0}
            </Text>
            <Text className="text-text-secondary">Rented</Text>
          </View>
          <View className="bg-gray-50 rounded-lg p-4 items-center">
            <Text className="text-2xl font-bold text-brand">
              {userProfile.stats?.exchanged_count || 0}
            </Text>
            <Text className="text-text-secondary">Exchanged</Text>
          </View>
        </View>
      </View>

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
    </ScrollView>
  );
}
