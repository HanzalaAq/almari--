import { View, Text, ScrollView, Pressable, Image, Platform, TextInput } from 'react-native';
import { useState } from 'react';
import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  city: string;
  condition: string;
  category: string;
  created_at: string;
}

const CATEGORIES = [
  { name: 'All', icon: 'apps' as const },
  { name: 'Women', icon: 'woman' as const },
  { name: 'Men', icon: 'man' as const },
  { name: 'Kids', icon: 'teddy-bear' as const, isMaterial: true },
  { name: 'Traditional', icon: 'shirt-outline' as const },
  { name: 'Western', icon: 'shirt' as const },
  { name: 'Accessories', icon: 'diamond-outline' as const },
];

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchListings = async () => {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (selectedCategory && selectedCategory !== 'All') {
      query = query.eq('category', selectedCategory);
    }

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Listing[];
  };

  const { data: listings, isLoading } = useQuery({
    queryKey: ['listings', selectedCategory, searchQuery],
    queryFn: fetchListings,
  });

  const renderWebLayout = () => (
    <ScrollView className="flex-1 bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <View className="relative bg-gradient-to-br from-brand-light via-orange-50 to-pink-50 pt-20 pb-32 px-8 overflow-hidden">
        {/* Decorative Elements */}
        <View className="absolute top-10 right-20 w-72 h-72 bg-brand/10 rounded-full blur-3xl" />
        <View className="absolute bottom-0 left-20 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
        
        <View className="max-w-6xl mx-auto relative z-10">
          <View className="items-center mb-12">
            <Text className="text-6xl font-bold text-gray-900 mb-4 text-center">
              Discover Pre-Loved{'\n'}
              <Text className="bg-gradient-to-r from-brand via-orange-600 to-pink-600 bg-clip-text text-transparent">
                Fashion Treasures
              </Text>
            </Text>
            <Text className="text-xl text-text-secondary max-w-2xl text-center leading-relaxed">
              Buy, sell, and rent sustainable fashion. Join Pakistan's most vibrant pre-loved marketplace.
            </Text>
          </View>

          {/* Search Bar */}
          <View className="max-w-3xl mx-auto relative mb-12">
            <View className="flex flex-row items-center bg-white rounded-2xl shadow-2xl shadow-brand/20 p-2 border border-gray-100">
              <View className="pl-4 pr-2">
                <Ionicons name="search" size={24} color="#888" />
              </View>
              <TextInput
                className="flex-1 px-4 py-4 text-lg text-text-primary"
                placeholder="Search for clothes, accessories, brands..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Pressable className="bg-gradient-to-r from-brand to-orange-600 px-8 py-4 rounded-xl flex flex-row items-center gap-2">
                <Text className="text-white font-bold text-lg">Search</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="flex flex-row justify-center items-center gap-16">
            <View className="items-center">
              <View className="flex flex-row items-center justify-center gap-2 mb-2">
                <Ionicons name="people" size={32} color="#FF7A1A" />
                <Text className="text-4xl font-bold text-brand">50K+</Text>
              </View>
              <Text className="text-text-secondary text-center">Happy Users</Text>
            </View>
            <View className="items-center">
              <View className="flex flex-row items-center justify-center gap-2 mb-2">
                <Ionicons name="checkmark-circle" size={32} color="#FF7A1A" />
                <Text className="text-4xl font-bold text-brand">200K+</Text>
              </View>
              <Text className="text-text-secondary text-center">Items Sold</Text>
            </View>
            <View className="items-center">
              <View className="flex flex-row items-center justify-center gap-2 mb-2">
                <Ionicons name="star" size={32} color="#FF7A1A" />
                <Text className="text-4xl font-bold text-brand">5.0</Text>
              </View>
              <Text className="text-text-secondary text-center">Rated Platform</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Categories Section */}
      <View className="max-w-7xl mx-auto px-8 -mt-16 relative z-20">
        <View className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 p-8 border border-gray-100">
          <Text className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex flex-row gap-4">
            {CATEGORIES.map((category) => (
              <Pressable
                key={category.name}
                onPress={() => setSelectedCategory(category.name)}
                className={`px-6 py-4 rounded-2xl border-2 transition-all ${
                  selectedCategory === category.name
                    ? 'bg-gradient-to-r from-brand to-orange-600 border-brand shadow-lg shadow-brand/30'
                    : 'bg-white border-gray-200 hover:border-brand'
                }`}
              >
                <View className="flex flex-row items-center gap-3">
                  {category.isMaterial ? (
                    <MaterialCommunityIcons 
                      name={category.icon as any} 
                      size={24} 
                      color={selectedCategory === category.name ? 'white' : '#1A1A1A'} 
                    />
                  ) : (
                    <Ionicons 
                      name={category.icon as any} 
                      size={24} 
                      color={selectedCategory === category.name ? 'white' : '#1A1A1A'} 
                    />
                  )}
                  <Text
                    className={`font-semibold text-base ${
                      selectedCategory === category.name ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {category.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Listings Grid */}
      <View className="max-w-7xl mx-auto px-8 py-16">
        <View className="flex flex-row items-center justify-between mb-8">
          <View>
            <Text className="text-3xl font-bold text-gray-900">Trending Now</Text>
            <Text className="text-text-secondary mt-1">Fresh arrivals from our community</Text>
          </View>
          <Link href="/search" asChild>
            <Pressable className="px-6 py-3 border-2 border-gray-200 rounded-xl hover:border-brand flex flex-row items-center gap-2">
              <Text className="text-text-primary font-semibold">View All</Text>
              <Ionicons name="arrow-forward" size={18} color="#1A1A1A" />
            </Pressable>
          </Link>
        </View>

        {isLoading ? (
          <View className="grid grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <View key={i} className="bg-gray-100 rounded-2xl h-96 animate-pulse" />
            ))}
          </View>
        ) : listings && listings.length > 0 ? (
          <View className="grid grid-cols-4 gap-6">
            {listings.map((item) => (
              <Link key={item.id} href={`/listing/${item.id}`} asChild>
                <Pressable className="group bg-white rounded-2xl overflow-hidden shadow-lg shadow-gray-900/5 hover:shadow-2xl hover:shadow-brand/20 transition-all border border-gray-100 hover:border-brand/30">
                  <View className="relative overflow-hidden">
                    <Image
                      source={{ uri: item.images[0] || 'https://via.placeholder.com/300' }}
                      className="w-full h-64 group-hover:scale-110 transition-transform duration-300"
                      resizeMode="cover"
                    />
                    <View className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex flex-row items-center gap-1">
                      <Ionicons name="checkmark-circle" size={14} color="#FF7A1A" />
                      <Text className="text-xs font-semibold text-brand">{item.condition}</Text>
                    </View>
                  </View>
                  <View className="p-5">
                    <Text className="text-lg font-bold text-gray-900 mb-2" numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text className="text-2xl font-bold bg-gradient-to-r from-brand to-orange-600 bg-clip-text text-transparent mb-3">
                      PKR {item.price.toLocaleString()}
                    </Text>
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex flex-row items-center gap-1">
                        <Ionicons name="location" size={14} color="#888" />
                        <Text className="text-sm text-text-secondary">{item.city}</Text>
                      </View>
                      <Text className="text-xs text-text-muted">{item.category}</Text>
                    </View>
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
        ) : (
          <View className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
            <View className="items-center mb-4">
              <Ionicons name="search" size={64} color="#ccc" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">No items found</Text>
            <Text className="text-text-secondary text-lg">Try adjusting your search or browse all categories</Text>
          </View>
        )}
      </View>

      {/* CTA Section */}
      <View className="bg-gradient-to-r from-brand via-orange-600 to-pink-600 py-20 px-8">
        <View className="max-w-4xl mx-auto text-center">
          <View className="items-center mb-6">
            <Ionicons name="sparkles" size={48} color="white" />
          </View>
          <Text className="text-5xl font-bold text-white mb-6">
            Start Selling Today
          </Text>
          <Text className="text-xl text-white/90 mb-8 leading-relaxed">
            Turn your wardrobe into cash. List items in minutes and reach thousands of buyers.
          </Text>
          <Link href="/sell" asChild>
            <Pressable className="bg-white px-10 py-5 rounded-2xl shadow-2xl mx-auto flex flex-row items-center gap-2">
              <Text className="text-brand font-bold text-xl">List Your First Item</Text>
              <Ionicons name="arrow-forward" size={24} color="#FF7A1A" />
            </Pressable>
          </Link>
        </View>
      </View>
    </ScrollView>
  );

  const renderMobileLayout = () => (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Mobile UI - keeping it simple for now */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-bold text-brand mb-2">Almari</Text>
        <TextInput
          className="bg-gray-100 rounded-lg px-4 py-2 text-text-primary"
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View className="p-4">
        <Text className="text-text-muted">Mobile view - Coming soon with enhanced UI</Text>
      </View>
    </ScrollView>
  );

  return Platform.OS === 'web' ? renderWebLayout() : renderMobileLayout();
}
