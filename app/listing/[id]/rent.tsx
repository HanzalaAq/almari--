import { View, Text, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../store/useAuthStore';

interface Listing {
  id: string;
  title: string;
  rent_price: number;
  images: string[];
  city: string;
}

export default function RentBookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  const calculateTotal = () => {
    if (!listing?.rent_price || !startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (days <= 0) return 0;

    const rentalCost = listing.rent_price * days;
    const deposit = rentalCost * 0.5; // 50% deposit
    const platformFee = rentalCost >= 2000 ? 100 : 50;

    return {
      days,
      rentalCost,
      deposit,
      platformFee,
      total: rentalCost + deposit + platformFee,
    };
  };

  const handleBook = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to rent items');
      router.push('/(auth)/login');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select rental dates');
      return;
    }

    const breakdown = calculateTotal();
    if (breakdown.days <= 0) {
      Alert.alert('Error', 'Invalid date range');
      return;
    }

    setLoading(true);
    try {
      // Create order
      const { error } = await supabase.from('orders').insert({
        listing_id: id,
        seller_id: listing?.seller_id,
        buyer_id: user.id,
        type: 'rent',
        status: 'pending',
        total_amount: breakdown.total,
        rental_start_date: startDate,
        rental_end_date: endDate,
        deposit_amount: breakdown.deposit,
      });

      if (error) throw error;

      // Mark listing as rented (temporarily)
      await supabase
        .from('listings')
        .update({ status: 'rented' })
        .eq('id', id);

      Alert.alert('Success', 'Rental booked successfully');
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

  const breakdown = calculateTotal();

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold text-brand mb-6">Book Rental</Text>

        {/* Listing Info */}
        <View className="bg-gray-50 rounded-xl p-4 mb-6">
          <Text className="text-lg font-semibold text-text-primary mb-2">{listing?.title}</Text>
          <Text className="text-brand font-bold">PKR {listing?.rent_price?.toLocaleString()}/day</Text>
        </View>

        {/* Date Selection */}
        <View className="mb-6">
          <Text className="text-text-primary font-medium mb-2">Start Date</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-text-primary"
            placeholder="YYYY-MM-DD"
            value={startDate}
            onChangeText={setStartDate}
          />
        </View>

        <View className="mb-6">
          <Text className="text-text-primary font-medium mb-2">End Date</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-text-primary"
            placeholder="YYYY-MM-DD"
            value={endDate}
            onChangeText={setEndDate}
          />
        </View>

        {/* Price Breakdown */}
        {breakdown.days > 0 && (
          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            <Text className="text-lg font-bold text-brand mb-4">Price Breakdown</Text>

            <View className="flex flex-row justify-between mb-2">
              <Text className="text-text-secondary">Rental ({breakdown.days} days)</Text>
              <Text className="text-text-primary">PKR {breakdown.rentalCost.toLocaleString()}</Text>
            </View>

            <View className="flex flex-row justify-between mb-2">
              <Text className="text-text-secondary">Security Deposit (50%)</Text>
              <Text className="text-text-primary">PKR {breakdown.deposit.toLocaleString()}</Text>
            </View>

            <View className="flex flex-row justify-between mb-2">
              <Text className="text-text-secondary">Platform Fee</Text>
              <Text className="text-text-primary">PKR {breakdown.platformFee.toLocaleString()}</Text>
            </View>

            <View className="border-t border-gray-300 my-3" />

            <View className="flex flex-row justify-between">
              <Text className="text-lg font-bold text-brand">Total</Text>
              <Text className="text-lg font-bold text-brand">PKR {breakdown.total.toLocaleString()}</Text>
            </View>

            <Text className="text-text-muted text-sm mt-2">
              Deposit will be refunded upon return confirmation
            </Text>
          </View>
        )}

        {/* Book Button */}
        <Pressable
          onPress={handleBook}
          disabled={loading || breakdown.days <= 0}
          className="bg-brand rounded-full py-4 items-center"
        >
          <Text className="text-white font-semibold text-lg">
            {loading ? 'Processing...' : 'Confirm & Pay'}
          </Text>
        </Pressable>

        {/* Buyer Protection */}
        <View className="mt-6 bg-brand-light rounded-xl p-4">
          <Text className="text-brand font-semibold mb-2">Buyer Protection</Text>
          <Text className="text-text-secondary text-sm">
            Your payment is held in escrow until you confirm receipt. The security deposit is refunded
            when you return the item in good condition.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
