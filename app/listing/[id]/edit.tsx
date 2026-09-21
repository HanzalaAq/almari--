import { View, Text, ScrollView, TextInput, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadListingImage } from '../../../lib/storage/upload';
import { supabase } from '../../../lib/supabase/client';
import { WebPressable } from '../../../components/ui/WebPressable';
import { WebNavbar } from '../../../components/layout/WebNavbar';
import { WebFooter } from '../../../components/layout/WebFooter';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = ['Women', 'Men', 'Kids', 'Traditional', 'Western', 'Accessories'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];

export default function EditListingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formError, setFormError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [size, setSize] = useState('');
  const [brand, setBrand] = useState('');
  const [city, setCity] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const [isBuyable, setIsBuyable] = useState(false);
  const [isRentable, setIsRentable] = useState(false);
  const [isExchangeable, setIsExchangeable] = useState(false);
  const [buyPrice, setBuyPrice] = useState('');
  const [rentPrice, setRentPrice] = useState('');

  useEffect(() => {
    if (!id) return;
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        Alert.alert('Error', 'Listing not found');
        router.back();
        return;
      }

      setTitle(data.title || '');
      setDescription(data.description || '');
      setCategory(data.category || '');
      setCondition(data.condition || '');
      setSize(data.size || '');
      setBrand(data.brand || '');
      setCity(data.city || '');
      setImages(data.images || []);
      setIsBuyable((data.price && Number(data.price) > 0) || false);
      setIsRentable(Boolean(data.is_rentable));
      setIsExchangeable(Boolean(data.is_exchangeable));
      setBuyPrice(data.price ? String(data.price) : '');
      setRentPrice(data.rental_price_per_day ? String(data.rental_price_per_day) : '');
    } catch (error: any) {
      console.error('[Edit] Load error:', error);
      Alert.alert('Error', error.message || 'Could not load listing');
      router.back();
    } finally {
      setFetching(false);
    }
  };

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
      Alert.alert('Login Required', 'Please login to edit a listing');
      router.push('/(auth)/login');
      return;
    }

    if (!title.trim() || !description.trim() || !category || !condition || !city) {
      setFormError('Please fill in all required fields (title, description, category, condition, and city).');
      return;
    }

    if (images.length === 0) {
      setFormError('Please add at least one photo of your item.');
      return;
    }

    if (isBuyable && !buyPrice) {
      setFormError('Please set a buy price.');
      return;
    }

    if (isRentable && !rentPrice) {
      setFormError('Please set a daily rent price.');
      return;
    }

    setLoading(true);
    setFormError('');
    try {
      // 1. Verify fresh session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setFormError('Your session has expired. Please sign in again.');
        router.push('/(auth)/login');
        return;
      }

      const authUserId = session.user.id;

      // 2. Identify existing vs newly picked images
      const isNewImage = (uri: string) =>
        uri.startsWith('file://') ||
        uri.startsWith('blob:') ||
        (uri.startsWith('data:') && !uri.includes('supabase.co'));

      const existingImages = images.filter((uri) => !isNewImage(uri));
      const newUris = images.filter((uri) => isNewImage(uri));

      // 3. Upload any newly picked images
      const newImageUrls: string[] = [];
      for (let i = 0; i < newUris.length; i++) {
        setUploadProgress(`Processing photo ${i + 1} of ${newUris.length}…`);
        const url = await uploadListingImage(newUris[i], authUserId, id!, existingImages.length + i);
        newImageUrls.push(url);
      }

      const imageUrls = [...existingImages, ...newImageUrls];

      setUploadProgress('Saving updates…');

      // 4. Update the database record (note: no is_buyable column in schema)
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          user_id: authUserId,
          title: title.trim(),
          description: description.trim(),
          category,
          condition,
          size: size || null,
          brand: brand ? brand.trim() : null,
          city,
          images: imageUrls,
          price: isBuyable ? parseInt(buyPrice, 10) : 0,
          rental_price_per_day: isRentable ? parseInt(rentPrice, 10) : null,
          is_rentable: isRentable,
          is_exchangeable: isExchangeable,
        })
        .eq('id', id);

      if (updateError) {
        console.error('[Edit] DB update error:', updateError);
        throw updateError;
      }

      // 5. Invalidate query caches
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
      queryClient.invalidateQueries({ queryKey: ['home-listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-listings'] });
      queryClient.invalidateQueries({ queryKey: ['catalogue'] });

      Alert.alert('Success', 'Listing updated successfully!');
      router.replace(`/listing/${id}`);
    } catch (error: any) {
      console.error('[Edit] Submit error:', error);
      setFormError(error.message || 'Could not save your changes. Please try again.');
    } finally {
      setUploadProgress('');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#007782" />
        <Text className="text-text-muted mt-3">Loading listing details…</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface">
      {Platform.OS === 'web' && <WebNavbar />}
      <View className="w-full max-w-3xl self-center px-5 py-8">
        <View className="mb-7">
          <Text className="text-3xl font-bold text-text-primary">Edit Listing</Text>
          <Text className="text-text-secondary text-base mt-2">Update your listing details and photos.</Text>
        </View>

        {/* Photos Card */}
        <View className="bg-white border border-border/50 rounded-2xl p-6 mb-6 shadow-sm shadow-black/5">
          <Text className="text-text-primary font-extrabold text-xl mb-1">Photos *</Text>
          <Text className="text-text-muted text-sm mb-4">Add up to 8 photos. The first photo is your cover image.</Text>
          <View className="flex flex-row flex-wrap gap-4">
            {images.map((uri, index) => (
              <View key={index} className="relative">
                <Image source={{ uri }} className="w-28 h-28 rounded-xl" />
                <WebPressable
                  onPress={() => removeImage(index)}
                  className="absolute -top-3 -right-3 bg-red-500 rounded-full w-8 h-8 items-center justify-center shadow-sm"
                  accessibilityLabel="Remove photo"
                >
                  <Text className="text-white text-sm font-bold">✕</Text>
                </WebPressable>
              </View>
            ))}
            {images.length < 8 && (
              <WebPressable
                onPress={pickImages}
                className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl items-center justify-center bg-gray-50/50 hover:bg-gray-100 transition-colors"
                accessibilityLabel="Add photo"
              >
                <Text className="text-text-muted text-2xl">+</Text>
              </WebPressable>
            )}
          </View>
          <Text className="text-text-muted text-sm mt-3">Up to 8 photos · High resolution photos help items sell faster</Text>
        </View>

        {/* Item Details Card */}
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
                <WebPressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`mr-3 px-5 py-2.5 rounded-full border ${
                    category === cat ? 'bg-brand border-brand shadow-sm shadow-brand/20' : 'bg-white border-gray-200 hover:border-brand/50'
                  }`}
                >
                  <Text className={`font-bold ${category === cat ? 'text-white' : 'text-text-secondary'}`}>{cat}</Text>
                </WebPressable>
              ))}
            </ScrollView>
          </View>

          {/* Condition */}
          <View className="mb-5">
            <Text className="text-text-primary font-bold mb-2">Condition *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
              {CONDITIONS.map((cond) => (
                <WebPressable
                  key={cond}
                  onPress={() => setCondition(cond)}
                  className={`mr-3 px-5 py-2.5 rounded-full border ${
                    condition === cond ? 'bg-brand border-brand shadow-sm shadow-brand/20' : 'bg-white border-gray-200 hover:border-brand/50'
                  }`}
                >
                  <Text className={`font-bold ${condition === cond ? 'text-white' : 'text-text-secondary'}`}>{cond}</Text>
                </WebPressable>
              ))}
            </ScrollView>
          </View>

          {/* Size */}
          <View className="mb-5">
            <Text className="text-text-primary font-bold mb-2">Size</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
              <WebPressable
                onPress={() => setSize('')}
                className={`mr-3 px-5 py-2.5 rounded-full border ${
                  !size ? 'bg-brand border-brand shadow-sm shadow-brand/20' : 'bg-white border-gray-200 hover:border-brand/50'
                }`}
              >
                <Text className={`font-bold ${!size ? 'text-white' : 'text-text-secondary'}`}>N/A</Text>
              </WebPressable>
              {SIZES.map((s) => (
                <WebPressable
                  key={s}
                  onPress={() => setSize(s)}
                  className={`mr-3 px-5 py-2.5 rounded-full border ${
                    size === s ? 'bg-brand border-brand shadow-sm shadow-brand/20' : 'bg-white border-gray-200 hover:border-brand/50'
                  }`}
                >
                  <Text className={`font-bold ${size === s ? 'text-white' : 'text-text-secondary'}`}>{s}</Text>
                </WebPressable>
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
                <WebPressable
                  key={c}
                  onPress={() => setCity(c)}
                  className={`mr-3 px-5 py-2.5 rounded-full border ${
                    city === c ? 'bg-brand border-brand shadow-sm shadow-brand/20' : 'bg-white border-gray-200 hover:border-brand/50'
                  }`}
                >
                  <Text className={`font-bold ${city === c ? 'text-white' : 'text-text-secondary'}`}>{c}</Text>
                </WebPressable>
              ))}
            </ScrollView>
          </View>

          {/* Transaction Modes */}
          <View className="border-t border-gray-100 pt-5 mt-2">
            <Text className="text-text-primary font-extrabold text-xl mb-4">Price & Availability</Text>

            <View className="flex flex-row items-center mb-4">
              <WebPressable
                onPress={() => setIsBuyable(!isBuyable)}
                className={`w-6 h-6 rounded-md border-2 mr-3 items-center justify-center ${
                  isBuyable ? 'bg-brand border-brand' : 'border-gray-300'
                }`}
              >
                {isBuyable && <Text className="text-white text-xs font-bold">✓</Text>}
              </WebPressable>
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
              <WebPressable
                onPress={() => setIsRentable(!isRentable)}
                className={`w-6 h-6 rounded-md border-2 mr-3 items-center justify-center ${
                  isRentable ? 'bg-brand border-brand' : 'border-gray-300'
                }`}
              >
                {isRentable && <Text className="text-white text-xs font-bold">✓</Text>}
              </WebPressable>
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
              <WebPressable
                onPress={() => setIsExchangeable(!isExchangeable)}
                className={`w-6 h-6 rounded-md border-2 mr-3 items-center justify-center ${
                  isExchangeable ? 'bg-brand border-brand' : 'border-gray-300'
                }`}
              >
                {isExchangeable && <Text className="text-white text-xs font-bold">✓</Text>}
              </WebPressable>
              <Text className="text-text-primary font-bold">Open to Exchange</Text>
            </View>
          </View>
        </View>

        {/* Error Feedback */}
        {formError ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex-row items-start gap-3">
            <Text className="text-red-600 flex-1 text-sm">{formError}</Text>
          </View>
        ) : null}

        {/* Upload Progress */}
        {uploadProgress ? (
          <View className="bg-brand-light/50 border border-brand/20 rounded-xl p-4 mb-5 flex-row items-center gap-3">
            <ActivityIndicator size="small" color="#007782" />
            <Text className="text-brand-dark font-semibold text-sm">{uploadProgress}</Text>
          </View>
        ) : null}

        {/* Save Changes Button */}
        <WebPressable
          onPress={handleSubmit}
          disabled={loading}
          className={`rounded-2xl py-4 items-center shadow-md shadow-brand/30 ${
            loading ? 'bg-brand/60' : 'bg-brand hover:bg-brand-hover'
          }`}
        >
          <Text className="text-white font-extrabold text-lg tracking-wide">
            {loading ? 'Saving changes…' : 'Save Changes'}
          </Text>
        </WebPressable>
      </View>
      <WebFooter />
    </ScrollView>
  );
}
