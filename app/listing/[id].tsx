import { View, Text, ScrollView, Pressable, Image, Platform, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  rent_price?: number;
  images: string[];
  city: string;
  condition: string;
  category: string;
  size?: string;
  brand?: string;
  is_buyable: boolean;
  is_rentable: boolean;
  is_exchangeable: boolean;
  seller_id: string;
  created_at: string;
}

interface Seller {
  id: string;
  name: string;
  city: string;
  photo_url?: string;
  rating?: number;
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'buy' | 'rent' | 'exchange'>('buy');

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

  const { data: seller } = useQuery({
    queryKey: ['seller', listing?.seller_id],
    queryFn: async () => {
      if (!listing?.seller_id) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', listing.seller_id)
        .single();

      if (error) throw error;
      return data as Seller;
    },
    enabled: !!listing?.seller_id,
  });

  useEffect(() => {
    if (listing) {
      if (listing.is_buyable) setActiveTab('buy');
      else if (listing.is_rentable) setActiveTab('rent');
      else if (listing.is_exchangeable) setActiveTab('exchange');
    }
  }, [listing]);

  const handleBuy = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to purchase items');
      router.push('/(auth)/login');
      return;
    }
    router.push(`/listing/${id}/buy`);
  };

  const handleRent = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to rent items');
      router.push('/(auth)/login');
      return;
    }
    router.push(`/listing/${id}/rent`);
  };

  const handleExchange = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to exchange items');
      router.push('/(auth)/login');
      return;
    }
    router.push(`/listing/${id}/exchange`);
  };

  const handleMessage = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to message seller');
      router.push('/(auth)/login');
      return;
    }
    router.push(`/messages?user=${listing?.seller_id}`);
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

  const isOwner = user?.id === listing.seller_id;

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Image Gallery */}
      <View className="relative">
        <Image
          source={{ uri: listing.images[selectedImage] }}
          className="w-full h-96"
          resizeMode="cover"
        />
        {listing.images.length > 1 && (
          <View className="absolute bottom-4 left-0 right-0 flex flex-row justify-center gap-2">
            {listing.images.map((_, index) => (
              <Pressable
                key={index}
                onPress={() => setSelectedImage(index)}
                className={`w-2 h-2 rounded-full ${
                  selectedImage === index ? 'bg-brand' : 'bg-white'
                }`}
              />
            ))}
          </View>
        )}
      </View>

      {/* Thumbnail Strip */}
      {listing.images.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="p-4 bg-white">
          {listing.images.map((image, index) => (
            <Pressable
              key={index}
              onPress={() => setSelectedImage(index)}
              className={`mr-2 rounded-lg overflow-hidden border-2 ${
                selectedImage === index ? 'border-brand' : 'border-transparent'
              }`}
            >
              <Image source={{ uri: image }} className="w-20 h-20" resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View className="p-6">
        {/* Title & Price */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-text-primary mb-2">{listing.title}</Text>
          <Text className="text-3xl font-bold text-brand">PKR {listing.price.toLocaleString()}</Text>
        </View>

        {/* Tags */}
        <View className="flex flex-row flex-wrap gap-2 mb-4">
          <Text className="bg-brand-light text-brand px-3 py-1 rounded-full text-sm">
            {listing.condition}
          </Text>
          <Text className="bg-gray-100 text-text-secondary px-3 py-1 rounded-full text-sm">
            {listing.category}
          </Text>
          {listing.size && (
            <Text className="bg-gray-100 text-text-secondary px-3 py-1 rounded-full text-sm">
              Size: {listing.size}
            </Text>
          )}
          {listing.brand && (
            <Text className="bg-gray-100 text-text-secondary px-3 py-1 rounded-full text-sm">
              {listing.brand}
            </Text>
          )}
          <Text className="bg-gray-100 text-text-secondary px-3 py-1 rounded-full text-sm">
            {listing.city}
          </Text>
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-text-primary mb-2">Description</Text>
          <Text className="text-text-secondary leading-relaxed">{listing.description}</Text>
        </View>

        {/* Seller Info */}
        {seller && (
          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            <View className="flex flex-row items-center mb-3">
              <View className="w-12 h-12 bg-brand rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold text-lg">
                  {seller.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-text-primary">{seller.name}</Text>
                <Text className="text-text-secondary text-sm">{seller.city}</Text>
              </View>
              {seller.rating && (
                <Text className="text-brand font-semibold">★ {seller.rating.toFixed(1)}</Text>
              )}
            </View>
            <Link href={`/profile/${seller.id}`} asChild>
              <Pressable className="bg-white border border-gray-300 rounded-lg py-2 items-center">
                <Text className="text-text-primary font-medium">View Profile</Text>
              </Pressable>
            </Link>
          </View>
        )}

        {/* Transaction Modes */}
        <View className="mb-6">
          <View className="flex flex-row border-b border-gray-200 mb-4">
            {listing.is_buyable && (
              <Pressable
                onPress={() => setActiveTab('buy')}
                className={`flex-1 pb-3 text-center ${
                  activeTab === 'buy' ? 'border-b-2 border-brand' : ''
                }`}
              >
                <Text
                  className={`font-medium ${activeTab === 'buy' ? 'text-brand' : 'text-text-muted'}`}
                >
                  Buy
                </Text>
              </Pressable>
            )}
            {listing.is_rentable && (
              <Pressable
                onPress={() => setActiveTab('rent')}
                className={`flex-1 pb-3 text-center ${
                  activeTab === 'rent' ? 'border-b-2 border-brand' : ''
                }`}
              >
                <Text
                  className={`font-medium ${activeTab === 'rent' ? 'text-brand' : 'text-text-muted'}`}
                >
                  Rent
                </Text>
              </Pressable>
            )}
            {listing.is_exchangeable && (
              <Pressable
                onPress={() => setActiveTab('exchange')}
                className={`flex-1 pb-3 text-center ${
                  activeTab === 'exchange' ? 'border-b-2 border-brand' : ''
                }`}
              >
                <Text
                  className={`font-medium ${
                    activeTab === 'exchange' ? 'text-brand' : 'text-text-muted'
                  }`}
                >
                  Exchange
                </Text>
              </Pressable>
            )}
          </View>

          <View className="bg-gray-50 rounded-xl p-4">
            {activeTab === 'buy' && (
              <View>
                <Text className="text-text-secondary mb-2">Purchase this item</Text>
                <Text className="text-2xl font-bold text-brand mb-4">
                  PKR {listing.price.toLocaleString()}
                </Text>
                <Pressable onPress={handleBuy} className="bg-brand rounded-full py-3 items-center">
                  <Text className="text-white font-semibold text-lg">Buy Now</Text>
                </Pressable>
              </View>
            )}
            {activeTab === 'rent' && (
              <View>
                <Text className="text-text-secondary mb-2">Rent this item</Text>
                <Text className="text-2xl font-bold text-brand mb-4">
                  PKR {listing.rent_price?.toLocaleString() || 'N/A'}/day
                </Text>
                <Pressable onPress={handleRent} className="bg-brand rounded-full py-3 items-center">
                  <Text className="text-white font-semibold text-lg">Rent This</Text>
                </Pressable>
              </View>
            )}
            {activeTab === 'exchange' && (
              <View>
                <Text className="text-text-secondary mb-2">Exchange with your item</Text>
                <Pressable onPress={handleExchange} className="bg-brand rounded-full py-3 items-center">
                  <Text className="text-white font-semibold text-lg">Propose Exchange</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Message Seller */}
        {!isOwner && (
          <Pressable
            onPress={handleMessage}
            className="bg-white border-2 border-brand rounded-full py-3 items-center mb-6"
          >
            <Text className="text-brand font-semibold text-lg">Message Seller</Text>
          </Pressable>
        )}

        {/* Owner Actions */}
        {isOwner && (
          <View className="flex flex-row gap-4">
            <Link href={`/listing/${id}/edit`} asChild>
              <Pressable className="flex-1 bg-gray-100 rounded-full py-3 items-center">
                <Text className="text-text-primary font-semibold">Edit Listing</Text>
              </Pressable>
            </Link>
            <Pressable
              onPress={() => Alert.alert('Delete', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive' },
              ])}
              className="flex-1 bg-red-100 rounded-full py-3 items-center"
            >
              <Text className="text-red-600 font-semibold">Delete</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
