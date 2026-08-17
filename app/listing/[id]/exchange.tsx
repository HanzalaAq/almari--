import { View, Text, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../store/useAuthStore';

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  city: string;
}

interface UserListing {
  id: string;
  title: string;
  images: string[];
  price: number;
}

export default function ExchangeProposalScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Listing;
    },
  });

  const { data: userListings } = useQuery({
    queryKey: ['user-listings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', 'active')
        .eq('is_exchangeable', true);

      if (error) throw error;
      return data as UserListing[];
    },
    enabled: !!user?.id,
  });

  const handlePropose = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to propose an exchange');
      router.push('/(auth)/login');
      return;
    }

    if (!selectedListingId) {
      Alert.alert('Error', 'Please select one of your listings to exchange');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('exchange_proposals').insert({
        listing_id: id,
        proposer_id: user.id,
        offered_listing_id: selectedListingId,
        top_up_amount: topUpAmount ? parseInt(topUpAmount) : 0,
        status: 'pending',
      });

      if (error) throw error;

      Alert.alert('Success', 'Exchange proposal sent');
      router.replace('/orders');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-muted">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold text-brand mb-6">Propose Exchange</Text>

        {/* Their Item */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-text-primary mb-3">Their Item</Text>
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex flex-row">
              <View className="w-24 h-24 bg-gray-200 rounded-lg mr-4" />
              <View className="flex-1">
                <Text className="font-semibold text-text-primary mb-1">{listing?.title}</Text>
                <Text className="text-brand font-bold">PKR {listing?.price.toLocaleString()}</Text>
                <Text className="text-text-secondary text-sm">{listing?.city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Your Item */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-text-primary mb-3">Your Item</Text>
          {userListings?.length === 0 ? (
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="text-text-muted">
                You don't have any exchangeable listings. Create one first!
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {userListings?.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedListingId(item.id)}
                  className={`mr-3 rounded-xl overflow-hidden border-2 ${
                    selectedListingId === item.id ? 'border-brand' : 'border-transparent'
                  }`}
                >
                  <View className="w-32 h-32 bg-gray-200" />
                  <View className="p-2 bg-white">
                    <Text className="text-text-primary text-sm font-medium" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-brand text-sm font-bold">
                      PKR {item.price.toLocaleString()}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Top-up Amount */}
        <View className="mb-6">
          <Text className="text-text-primary font-medium mb-2">Top-up Amount (Optional)</Text>
          <Text className="text-text-secondary text-sm mb-2">
            Add cash to balance the exchange value
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-text-primary"
            placeholder="Amount in PKR"
            value={topUpAmount}
            onChangeText={setTopUpAmount}
            keyboardType="numeric"
          />
        </View>

        {/* Submit */}
        <Pressable
          onPress={handlePropose}
          disabled={loading || !selectedListingId}
          className="bg-brand rounded-full py-4 items-center"
        >
          <Text className="text-white font-semibold text-lg">
            {loading ? 'Sending...' : 'Send Exchange Offer'}
          </Text>
        </Pressable>

        {/* Info */}
        <View className="mt-6 bg-brand-light rounded-xl p-4">
          <Text className="text-brand font-semibold mb-2">How Exchange Works</Text>
          <Text className="text-text-secondary text-sm">
            1. Select one of your listings to offer{'\n'}
            2. Optionally add a cash top-up for value difference{'\n'}
            3. The other party can accept, counter-offer, or decline{'\n'}
            4. Once accepted, both parties ship their items{'\n'}
            5. Confirm receipt to complete the exchange
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
