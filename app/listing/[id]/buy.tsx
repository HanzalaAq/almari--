import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
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
  seller_id: string;
}

export default function BuyScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
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

  const calculatePlatformFee = (price: number) => {
    return price >= 2000 ? 100 : 50;
  };

  const handleBuy = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to purchase items');
      router.push('/(auth)/login');
      return;
    }

    if (!listing) return;

    const platformFee = calculatePlatformFee(listing.price);
    const total = listing.price + platformFee;

    setLoading(true);
    try {
      // Create order
      const { error } = await supabase.from('orders').insert({
        listing_id: id,
        seller_id: listing.seller_id,
        buyer_id: user.id,
        type: 'buy',
        status: 'pending',
        total_amount: total,
        platform_fee: platformFee,
      });

      if (error) throw error;

      // Mark listing as sold
      await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', id);

      Alert.alert('Success', 'Order placed successfully');
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

  if (!listing) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-muted">Listing not found</Text>
      </View>
    );
  }

  const platformFee = calculatePlatformFee(listing.price);
  const total = listing.price + platformFee;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold text-brand mb-6">Complete Purchase</Text>

        {/* Order Summary */}
        <View className="bg-gray-50 rounded-xl p-4 mb-6">
          <Text className="text-lg font-bold text-brand mb-4">Order Summary</Text>

          <View className="flex flex-row justify-between mb-3">
            <Text className="text-text-primary font-medium">{listing.title}</Text>
            <Text className="text-text-primary font-medium">
              PKR {listing.price.toLocaleString()}
            </Text>
          </View>

          <View className="flex flex-row justify-between mb-3">
            <Text className="text-text-secondary">Platform Fee</Text>
            <Text className="text-text-secondary">PKR {platformFee.toLocaleString()}</Text>
          </View>

          <View className="border-t border-gray-300 my-3" />

          <View className="flex flex-row justify-between">
            <Text className="text-lg font-bold text-brand">Total</Text>
            <Text className="text-lg font-bold text-brand">PKR {total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View className="bg-brand-light rounded-xl p-4 mb-6">
          <Text className="text-brand font-semibold mb-2">Payment Information</Text>
          <Text className="text-text-secondary text-sm">
            Your payment will be held in escrow until you confirm receipt of the item.
            The seller will receive payment after confirmation.
          </Text>
        </View>

        {/* Buyer Protection */}
        <View className="bg-green-50 rounded-xl p-4 mb-6">
          <Text className="text-green-700 font-semibold mb-2">Buyer Protection</Text>
          <Text className="text-text-secondary text-sm">
            • Full refund if item doesn't match description{'\n'}
            • Secure payment through escrow{'\n'}
            • Seller only paid after you confirm receipt{'\n'}
            • 5-day auto-release if no action taken
          </Text>
        </View>

        {/* Buy Button */}
        <Pressable
          onPress={handleBuy}
          disabled={loading}
          className="bg-brand rounded-full py-4 items-center"
        >
          <Text className="text-white font-semibold text-lg">
            {loading ? 'Processing...' : `Pay PKR ${total.toLocaleString()}`}
          </Text>
        </Pressable>

        {/* Cancel */}
        <Pressable
          onPress={() => router.back()}
          className="mt-4 py-3 items-center"
        >
          <Text className="text-text-muted">Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
