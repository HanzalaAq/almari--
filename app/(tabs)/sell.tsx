import { View, Text, ScrollView, Pressable, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadListingImage } from '../../lib/storage/upload';
import { supabase } from '../../lib/supabase/client';
import { WebFooter } from '../../components/layout/WebFooter';

const CATEGORIES = ['Women', 'Men', 'Kids', 'Traditional', 'Western', 'Accessories'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];

export default function SellScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  // Auth guard
  if (isAuthLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#007782" />
      </View>
    );
  }
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [size, setSize] = useState('');
  const [brand, setBrand] = useState('');
  const [city, setCity] = useState('');
  const [images, setImages] = useState<string[]>([]);
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
    setFormError('');
    try {
      // Create listing first to get an ID for image paths
      const { data: listing, error: insertError } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title,
          description,
          category,
          condition,
          size: size || null,
          brand: brand || null,
          city,
          images: [],
          price: isBuyable ? parseInt(buyPrice) : 0,
          rental_price_per_day: isRentable ? parseInt(rentPrice) : null,
          is_rentable: isRentable,
          is_exchangeable: isExchangeable,
          status: 'active',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload images to Supabase Storage
      const imageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(`Uploading image ${i + 1} of ${images.length}…`);
        const url = await uploadListingImage(images[i], user.id, listing.id, i);
        imageUrls.push(url);
      }

      setUploadProgress('Finalizing listing…');

      // Update listing with image URLs
      const { error: updateError } = await supabase
        .from('listings')
        .update({ images: imageUrls })
        .eq('id', listing.id);

      if (updateError) throw updateError;

      // Invalidate listing caches so home and user listings refresh
      queryClient.invalidateQueries({ queryKey: ['home-listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-listings'] });
      queryClient.invalidateQueries({ queryKey: ['catalogue'] });

      router.replace(`/listing/${listing.id}`);
    } catch (error: any) {
      setFormError(error.message || 'Could not publish your listing. Please try again.');
    } finally {
      setUploadProgress('');
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="w-full max-w-3xl self-center px-5 py-8">
        <View className="mb-7">
          <Text className="text-3xl font-bold text-text-primary">Sell an item</Text>
          <Text className="text-text-secondary text-base mt-2">Add clear details to help your item find its next home.</Text>
        </View>
        <View className="bg-white border border-border/50 rounded-2xl p-6 mb-6 shadow-sm shadow-black/5">

        {/* Image Upload */}
        <View className="mb-2">
          <Text className="text-text-primary font-extrabold text-xl mb-1">Photos *</Text>
          <Text className="text-text-muted text-sm mb-4">Add up to 8 clear photos. The first photo is your cover image.</Text>
          <View className="flex flex-row flex-wrap gap-4">
            {images.map((uri, index) => (
              <View key={index} className="relative">
                <Image source={{ uri }} className="w-28 h-28 rounded-xl" />
                <Pressable
                  onPress={() => removeImage(index)}
                  className="absolute -top-3 -right-3 bg-error rounded-full w-8 h-8 items-center justify-center shadow-sm"
                >
                  <Text className="text-white text-sm font-bold">✕</Text>
                </Pressable>
              </View>
            ))}
            {images.length < 8 && (
              <Pressable
                onPress={pickImages}
                className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl items-center justify-center bg-gray-50/50 hover:bg-gray-100 transition-colors"
              >
                <Text className="text-text-muted text-2xl">+</Text>
              </Pressable>
            )}
          </View>
          <Text className="text-text-muted text-sm mt-2">Up to 8 photos · Show the item clearly and accurately</Text>
        </View>

        </View>

        <View className="bg-white border border-border/50 rounded-2xl p-6 mb-6 shadow-sm shadow-black/5">
        <Text className="text-text-primary font-extrabold text-xl mb-5">Item details</Text>

        {/* Title */}
        <View className="mb-5">
          <Text className="text-text-primary font-bold mb-2">Title *</Text>
          <TextInput
            className="border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand rounded-xl px-4 py-3.5 text-text-primary shadow-sm"
            placeholder="What are you selling?"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View className="mb-5">
          <Text className="text-text-primary font-bold mb-2">Description *</Text>
          <TextInput
            className="border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand rounded-xl px-4 py-3.5 text-text-primary h-32 shadow-sm"
            placeholder="Describe your item..."
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View className="mb-5">
          <Text className="text-text-primary font-bold mb-2">Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                className={`mr-3 px-5 py-2.5 rounded-full border ${
                  category === cat ? 'bg-brand border-brand shadow-sm shadow-brand/20' : 'bg-white border-gray-200 hover:border-brand/50'
                }`}
              >
                <Text className={`font-bold ${category === cat ? 'text-white' : 'text-text-secondary'}`}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Condition */}
        <View className="mb-5">
          <Text className="text-text-primary font-bold mb-2">Condition *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
            {CONDITIONS.map((cond) => (
              <Pressable
                key={cond}
                onPress={() => setCondition(cond)}
                className={`mr-3 px-5 py-2.5 rounded-full border ${
                  condition === cond ? 'bg-brand border-brand shadow-sm shadow-brand/20' : 'bg-white border-gray-200 hover:border-brand/50'
                }`}
              >
                <Text className={`font-bold ${condition === cond ? 'text-white' : 'text-text-secondary'}`}>{cond}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Size */}
        <View className="mb-5">
          <Text className="text-text-primary font-bold mb-2">Size</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
            <Pressable
              onPress={() => setSize('')}
              className={`mr-3 px-5 py-2.5 rounded-full border ${
                !size ? 'bg-brand border-brand shadow-sm shadow-brand/20' : 'bg-white border-gray-200 hover:border-brand/50'
              }`}
            >
              <Text className={`font-bold ${!size ? 'text-white' : 'text-text-secondary'}`}>N/A</Text>
            </Pressable>
            {SIZES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSize(s)}
                className={`mr-3 px-5 py-2.5 rounded-full border ${
                  size === s ? 'bg-brand border-brand shadow-sm shadow-brand/20' : 'bg-white border-gray-200 hover:border-brand/50'
                }`}
              >
                <Text className={`font-bold ${size === s ? 'text-white' : 'text-text-secondary'}`}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Brand */}
        <View className="mb-5">
          <Text className="text-text-primary font-bold mb-2">Brand</Text>
          <TextInput
            className="border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand rounded-xl px-4 py-3.5 text-text-primary shadow-sm"
            placeholder="Brand name (optional)"
            value={brand}
            onChangeText={setBrand}
          />
        </View>

        {/* City */}
        <View className="mb-5">
          <Text className="text-text-primary font-bold mb-2">City *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
            {CITIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCity(c)}
                className={`mr-3 px-5 py-2.5 rounded-full border ${
                  city === c ? 'bg-brand border-brand shadow-sm shadow-brand/20' : 'bg-white border-gray-200 hover:border-brand/50'
                }`}
              >
                <Text className={`font-bold ${city === c ? 'text-white' : 'text-text-secondary'}`}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Transaction Modes */}
        <View className="mb-2">
          <Text className="text-text-primary font-extrabold text-xl mb-4">Price & Availability</Text>

          <View className="flex flex-row items-center mb-4">
            <Pressable
              onPress={() => setIsBuyable(!isBuyable)}
              className={`w-6 h-6 rounded-md border-2 mr-3 items-center justify-center ${
                isBuyable ? 'bg-brand border-brand' : 'border-gray-300'
              }`}
            >
              {isBuyable && <Text className="text-white text-xs font-bold">✓</Text>}
            </Pressable>
            <Text className="text-text-primary font-bold">Sell this item</Text>
          </View>
          {isBuyable && (
            <View className="mb-5 ml-9">
              <TextInput
                className="border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand rounded-xl px-4 py-3.5 text-text-primary shadow-sm"
                placeholder="Price in PKR"
                value={buyPrice}
                onChangeText={setBuyPrice}
                keyboardType="numeric"
              />
            </View>
          )}

          <View className="flex flex-row items-center mb-4">
            <Pressable
              onPress={() => setIsRentable(!isRentable)}
              className={`w-6 h-6 rounded-md border-2 mr-3 items-center justify-center ${
                isRentable ? 'bg-brand border-brand' : 'border-gray-300'
              }`}
            >
              {isRentable && <Text className="text-white text-xs font-bold">✓</Text>}
            </Pressable>
            <Text className="text-text-primary font-bold">Rent this item</Text>
          </View>
          {isRentable && (
            <View className="mb-5 ml-9">
              <TextInput
                className="border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand rounded-xl px-4 py-3.5 text-text-primary shadow-sm"
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
              className={`w-6 h-6 rounded-md border-2 mr-3 items-center justify-center ${
                isExchangeable ? 'bg-brand border-brand' : 'border-gray-300'
              }`}
            >
              {isExchangeable && <Text className="text-white text-xs font-bold">✓</Text>}
            </Pressable>
            <Text className="text-text-primary font-bold">Open to Exchange</Text>
          </View>
        </View>

        </View>
        <View className="bg-brand-light/50 border border-brand/20 rounded-2xl p-5 mb-6">
          <Text className="text-brand-dark font-extrabold mb-1.5">Listing guidelines</Text>
          <Text className="text-brand-dark/80 text-sm leading-5">Only list items you own. Use accurate photos and descriptions so buyers know exactly what to expect.</Text>
        </View>
        {/* Error display */}
        {formError ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex-row items-start gap-3">
            <Text className="text-red-600 flex-1 text-sm">{formError}</Text>
          </View>
        ) : null}

        {/* Upload progress */}
        {uploadProgress ? (
          <View className="bg-brand-light/50 border border-brand/20 rounded-xl p-4 mb-5 flex-row items-center gap-3">
            <ActivityIndicator size="small" color="#007782" />
            <Text className="text-brand-dark font-semibold text-sm">{uploadProgress}</Text>
          </View>
        ) : null}

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className={`rounded-2xl py-4 items-center shadow-md shadow-brand/30 ${
            loading ? 'bg-brand/60' : 'bg-brand hover:bg-brand-hover'
          }`}
        >
          <Text className="text-white font-extrabold text-lg tracking-wide">
            {loading ? 'Publishing…' : 'List Item'}
          </Text>
        </Pressable>
      </View><WebFooter />
    </ScrollView>
  );
}
