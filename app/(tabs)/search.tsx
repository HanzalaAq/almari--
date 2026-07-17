import { View, Text, ScrollView, Pressable, Platform, TextInput } from 'react-native';
import { useState } from 'react';
import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  city: string;
  condition: string;
  category: string;
  size?: string;
}

const CATEGORIES = ['Women', 'Men', 'Kids', 'Traditional', 'Western', 'Accessories'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchListings = async () => {
    let dbQuery = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (query) {
      dbQuery = dbQuery.ilike('title', `%${query}%`);
    }
    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }
    if (condition) {
      dbQuery = dbQuery.eq('condition', condition);
    }
    if (size) {
      dbQuery = dbQuery.eq('size', size);
    }
    if (city) {
      dbQuery = dbQuery.eq('city', city);
    }
    if (minPrice) {
      dbQuery = dbQuery.gte('price', parseInt(minPrice));
    }
    if (maxPrice) {
      dbQuery = dbQuery.lte('price', parseInt(maxPrice));
    }

    const { data, error } = await dbQuery;
    if (error) throw error;
    return data as Listing[];
  };

  const { data: listings, isLoading } = useQuery({
    queryKey: ['search', query, category, condition, size, city, minPrice, maxPrice],
    queryFn: fetchListings,
  });

  const clearFilters = () => {
    setQuery('');
    setCategory(null);
    setCondition(null);
    setSize(null);
    setCity(null);
    setMinPrice('');
    setMaxPrice('');
  };

  const renderFilters = () => (
    <View className="bg-white p-4 border-b border-gray-200">
      <View className="flex flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-text-primary">Filters</Text>
        <Pressable onPress={clearFilters}>
          <Text className="text-brand font-medium">Clear All</Text>
        </Pressable>
      </View>

      <View className="mb-4">
        <Text className="text-text-primary font-medium mb-2">Search</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-2 text-text-primary"
          placeholder="Search listings..."
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View className="mb-4">
        <Text className="text-text-primary font-medium mb-2">Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            onPress={() => setCategory(null)}
            className={`mr-2 px-4 py-2 rounded-full ${
              !category ? 'bg-brand text-white' : 'bg-gray-100 text-text-primary'
            }`}
          >
            <Text className="text-sm">All</Text>
          </Pressable>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              className={`mr-2 px-4 py-2 rounded-full ${
                category === cat ? 'bg-brand text-white' : 'bg-gray-100 text-text-primary'
              }`}
            >
              <Text className="text-sm">{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="mb-4">
        <Text className="text-text-primary font-medium mb-2">Condition</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            onPress={() => setCondition(null)}
            className={`mr-2 px-4 py-2 rounded-full ${
              !condition ? 'bg-brand text-white' : 'bg-gray-100 text-text-primary'
            }`}
          >
            <Text className="text-sm">All</Text>
          </Pressable>
          {CONDITIONS.map((cond) => (
            <Pressable
              key={cond}
              onPress={() => setCondition(cond)}
              className={`mr-2 px-4 py-2 rounded-full ${
                condition === cond ? 'bg-brand text-white' : 'bg-gray-100 text-text-primary'
              }`}
            >
              <Text className="text-sm">{cond}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="mb-4">
        <Text className="text-text-primary font-medium mb-2">Size</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            onPress={() => setSize(null)}
            className={`mr-2 px-4 py-2 rounded-full ${
              !size ? 'bg-brand text-white' : 'bg-gray-100 text-text-primary'
            }`}
          >
            <Text className="text-sm">All</Text>
          </Pressable>
          {SIZES.map((s) => (
            <Pressable
              key={s}
              onPress={() => setSize(s)}
              className={`mr-2 px-4 py-2 rounded-full ${
                size === s ? 'bg-brand text-white' : 'bg-gray-100 text-text-primary'
              }`}
            >
              <Text className="text-sm">{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="mb-4">
        <Text className="text-text-primary font-medium mb-2">City</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            onPress={() => setCity(null)}
            className={`mr-2 px-4 py-2 rounded-full ${
              !city ? 'bg-brand text-white' : 'bg-gray-100 text-text-primary'
            }`}
          >
            <Text className="text-sm">All</Text>
          </Pressable>
          {CITIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCity(c)}
              className={`mr-2 px-4 py-2 rounded-full ${
                city === c ? 'bg-brand text-white' : 'bg-gray-100 text-text-primary'
              }`}
            >
              <Text className="text-sm">{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="flex flex-row gap-4">
        <View className="flex-1">
          <Text className="text-text-primary font-medium mb-2">Min Price</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-2 text-text-primary"
            placeholder="PKR"
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <Text className="text-text-primary font-medium mb-2">Max Price</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-2 text-text-primary"
            placeholder="PKR"
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {Platform.OS === 'web' ? (
        <View className="flex flex-row min-h-screen">
          {/* Sidebar Filters */}
          <View className="w-80 bg-white border-r border-gray-200 p-6 sticky top-0 h-screen overflow-y-auto">
            <Text className="text-xl font-bold text-brand mb-6">Search & Filters</Text>
            {renderFilters()}
          </View>

          {/* Results */}
          <View className="flex-1 p-6">
            <Text className="text-lg font-semibold text-text-primary mb-4">
              {listings?.length || 0} Results
            </Text>
            <View className="grid grid-cols-3 gap-4">
              {listings?.map((item) => (
                <Link key={item.id} href={`/listing/${item.id}`} asChild>
                  <Pressable className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <View className="aspect-square bg-gray-200" />
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
          </View>
        </View>
      ) : (
        <>
          {/* Mobile Header */}
          <View className="bg-white px-4 py-3 border-b border-gray-200 flex flex-row items-center justify-between">
            <TextInput
              className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-text-primary mr-3"
              placeholder="Search..."
              value={query}
              onChangeText={setQuery}
            />
            <Pressable onPress={() => setShowFilters(!showFilters)} className="bg-brand px-4 py-2 rounded-lg">
              <Text className="text-white font-medium">Filters</Text>
            </Pressable>
          </View>

          {showFilters && renderFilters()}

          {/* Results */}
          <ScrollView className="flex-1 p-4">
            {isLoading ? (
              <View className="items-center justify-center py-12">
                <Text className="text-text-muted">Loading...</Text>
              </View>
            ) : (
              <View className="grid grid-cols-2 gap-4">
                {listings?.map((item) => (
                  <Link key={item.id} href={`/listing/${item.id}`} asChild>
                    <Pressable className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <View className="aspect-square bg-gray-200" />
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
          </ScrollView>
        </>
      )}
    </ScrollView>
  );
}
