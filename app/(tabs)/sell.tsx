import { View, Text, ScrollView, Pressable, TextInput, Image, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadToR2, generateListingKey } from '../../lib/storage/r2';
import { supabase } from '../../lib/supabase/client';

const CATEGORIES = ['Women', 'Men', 'Kids', 'Traditional', 'Western', 'Accessories'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];

export default function SellScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [size, setSize] = useState('');
  const [brand, setBrand] = useState('');
  const [city, setCity] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Transaction modes
  const [isBuyable, setIsBuyable] = useState(true);
  const [isRentable, setIsRentable] = useState(false);
  const [isExchangeable, setIsExchangeable] = useState(false);
  const [buyPrice, setBuyPrice] = useState('');
  const [rentPrice, setRentPrice] = useState('');

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setImages([...images, ...result.assets.map((asset) => asset.uri)]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to create a listing');
      router.push('/(auth)/login');
      return;
    }

    if (!title || !description || !category || !condition || !city) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    if (isBuyable && !buyPrice) {
      Alert.alert('Error', 'Please set a buy price');
      return;
    }

    if (isRentable && !rentPrice) {
      Alert.alert('Error', 'Please set a rent price');
      return;
    }

    setLoading(true);
    try {
      // Upload images to R2
      const imageUrls = await Promise.all(
        images.map(async (uri, index) => {
          const key = generateListingKey(user.id, index);
          // TODO: Implement actual R2 upload
          // For now, return the URI as placeholder
          return uri;
        })
      );

      // Create listing
      const { error } = await supabase.from('listings').insert({
        seller_id: user.id,
        title,
        description,
        category,
        condition,
        size: size || null,
        brand: brand || null,
        city,
        images: imageUrls,
        price: isBuyable ? parseInt(buyPrice) : 0,
        rent_price: isRentable ? parseInt(rentPrice) : null,
        is_buyable: isBuyable,
        is_rentable: isRentable,
        is_exchangeable: isExchangeable,
        status: 'active',
      });

      if (error) throw error;

      Alert.alert('Success', 'Listing created successfully');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold text-brand mb-6">Create Listing</Text>

        {/* Image Upload */}
        <View className="mb-6">
          <Text className="text-text-primary font-medium mb-2">Photos *</Text>
          <View className="flex flex-row flex-wrap gap-3">
            {images.map((uri, index) => (
              <View key={index} className="relative">
                <Image source={{ uri }} className="w-24 h-24 rounded-lg" />
                <Pressable
                  onPress={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                >
                  <Text className="text-white text-xs">✕</Text>
                </Pressable>
              </View>
            ))}
            {images.length < 8 && (
              <Pressable
                onPress={pickImages}
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center bg-gray-50"
              >
                <Text className="text-text-muted text-2xl">+</Text>
              </Pressable>
            )}
          </View>
          <Text className="text-text-muted text-sm mt-2">Up to 8 photos</Text>
        </View>

        {/* Title */}
        <View className="mb-4">
          <Text className="text-text-primary font-medium mb-2">Title *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-text-primary"
            placeholder="What are you selling?"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-text-primary font-medium mb-2">Description *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-text-primary h-32"
            placeholder="Describe your item..."
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View className="mb-4">
          <Text className="text-text-primary font-medium mb-2">Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                className={`mr-2 px-4 py-2 rounded-full border ${
                  category === cat ? 'bg-brand border-brand text-white' : 'border-gray-300 text-text-primary'
                }`}
              >
                <Text className="font-medium">{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Condition */}
        <View className="mb-4">
          <Text className="text-text-primary font-medium mb-2">Condition *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CONDITIONS.map((cond) => (
              <Pressable
                key={cond}
                onPress={() => setCondition(cond)}
                className={`mr-2 px-4 py-2 rounded-full border ${
                  condition === cond ? 'bg-brand border-brand text-white' : 'border-gray-300 text-text-primary'
                }`}
              >
                <Text className="font-medium">{cond}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Size */}
        <View className="mb-4">
          <Text className="text-text-primary font-medium mb-2">Size</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable
              onPress={() => setSize('')}
              className={`mr-2 px-4 py-2 rounded-full border ${
                !size ? 'bg-brand border-brand text-white' : 'border-gray-300 text-text-primary'
              }`}
            >
              <Text className="font-medium">N/A</Text>
            </Pressable>
            {SIZES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSize(s)}
                className={`mr-2 px-4 py-2 rounded-full border ${
                  size === s ? 'bg-brand border-brand text-white' : 'border-gray-300 text-text-primary'
                }`}
              >
                <Text className="font-medium">{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Brand */}
        <View className="mb-4">
          <Text className="text-text-primary font-medium mb-2">Brand</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-text-primary"
            placeholder="Brand name (optional)"
            value={brand}
            onChangeText={setBrand}
          />
        </View>

        {/* City */}
        <View className="mb-4">
          <Text className="text-text-primary font-medium mb-2">City *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CITIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCity(c)}
                className={`mr-2 px-4 py-2 rounded-full border ${
                  city === c ? 'bg-brand border-brand text-white' : 'border-gray-300 text-text-primary'
                }`}
              >
                <Text className="font-medium">{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Transaction Modes */}
        <View className="mb-6">
          <Text className="text-text-primary font-medium mb-3">Transaction Modes</Text>

          <View className="flex flex-row items-center mb-3">
            <Pressable
              onPress={() => setIsBuyable(!isBuyable)}
              className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                isBuyable ? 'bg-brand border-brand' : 'border-gray-300'
              }`}
            >
              {isBuyable && <Text className="text-white text-xs">✓</Text>}
            </Pressable>
            <Text className="text-text-primary">Sell</Text>
          </View>

          {isBuyable && (
            <View className="mb-3 ml-9">
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-text-primary"
                placeholder="Price in PKR"
                value={buyPrice}
                onChangeText={setBuyPrice}
                keyboardType="numeric"
              />
            </View>
          )}

          <View className="flex flex-row items-center mb-3">
            <Pressable
              onPress={() => setIsRentable(!isRentable)}
              className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                isRentable ? 'bg-brand border-brand' : 'border-gray-300'
              }`}
            >
              {isRentable && <Text className="text-white text-xs">✓</Text>}
            </Pressable>
            <Text className="text-text-primary">Rent</Text>
          </View>

          {isRentable && (
            <View className="mb-3 ml-9">
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-text-primary"
                placeholder="Daily rent price in PKR"
                value={rentPrice}
                onChangeText={setRentPrice}
                keyboardType="numeric"
              />
            </View>
          )}

          <View className="flex flex-row items-center">
            <Pressable
              onPress={() => setIsExchangeable(!isExchangeable)}
              className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                isExchangeable ? 'bg-brand border-brand' : 'border-gray-300'
              }`}
            >
              {isExchangeable && <Text className="text-white text-xs">✓</Text>}
            </Pressable>
            <Text className="text-text-primary">Exchange</Text>
          </View>
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="bg-brand rounded-full py-4 items-center"
        >
          <Text className="text-white font-semibold text-lg">
            {loading ? 'Publishing...' : 'Publish Listing'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
