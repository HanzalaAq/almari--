'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Upload, X, Plus, Image as ImageIcon } from 'lucide-react';

export default function CreateListingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [city, setCity] = useState('');
  
  // Listing type toggles
  const [availableToBuy, setAvailableToBuy] = useState(true);
  const [availableToRent, setAvailableToRent] = useState(false);
  const [availableToExchange, setAvailableToExchange] = useState(false);
  
  // Price fields
  const [price, setPrice] = useState('');
  const [rentalPricePerDay, setRentalPricePerDay] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [preferredExchange, setPreferredExchange] = useState('');
  
  // Image upload
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const categories = ['Women', 'Men', 'Kids', 'Traditional', 'Western', 'Accessories'];
  const conditions = ['New', 'Like New', 'Good', 'Fair'];
  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Sukkur', 'Larkana', 'Abbottabad', 'Sargodha'];
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      // Get user's city from profile
      const { data: userData } = await supabase
        .from('users')
        .select('city')
        .eq('id', user.id)
        .single();
      
      if (userData?.city) {
        setCity(userData.city);
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [supabase, router]);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (images.length + files.length > 8) {
      setError('Maximum 8 images allowed');
      return;
    }
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setImages(prev => [...prev, ...validFiles]);
    setError('');
  };
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const uploadImagesToSupabase = async (userId: string): Promise<string[]> => {
    if (images.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `listing-images/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(filePath, file);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(filePath);
        
        uploadedUrls.push(publicUrl);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!user) return;
    
    // Validation
    if (!title.trim() || !description.trim() || !category || !condition || !city) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }
    
    if (!availableToBuy && !availableToRent && !availableToExchange) {
      setError('Please enable at least one listing type');
      return;
    }
    
    if (availableToBuy && !price) {
      setError('Please enter a price for Buy option');
      return;
    }
    
    if (availableToRent && (!rentalPricePerDay || !depositAmount)) {
      setError('Please enter rental price and deposit amount');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Upload images
      const uploadedImageUrls = await uploadImagesToSupabase(user.id);
      
      // Create listing
      const { error: insertError } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          price: availableToBuy ? parseFloat(price) : 0,
          rental_price_per_day: availableToRent ? parseFloat(rentalPricePerDay) : null,
          is_rentable: availableToRent,
          is_exchangeable: availableToExchange,
          category,
          size,
          brand,
          condition,
          city,
          images: uploadedImageUrls,
          status: 'active',
        });
      
      if (insertError) {
        setError(insertError.message);
        return;
      }
      
      // Redirect to home (in Phase 3, redirect to listing detail page)
      router.push('/');
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Create Listing</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Two-column layout on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Photo Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Photos <span className="text-text-muted">(Max 8 images)</span>
              </label>
              
              {/* Drag & Drop Zone */}
              <div className="min-h-[300px] border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-brand hover:bg-brand-light transition-colors cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center h-full"
                >
                  <Upload className="w-12 h-12 text-text-muted mb-3" />
                  <p className="text-sm font-medium text-text-primary mb-1">
                    Drag & drop photos here or click to browse
                  </p>
                  <p className="text-xs text-text-muted">
                    PNG, JPG up to 5MB each
                  </p>
                </label>
              </div>
              
              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-error text-white rounded-full p-1 hover:opacity-80 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-1 left-1 bg-brand text-white text-xs px-2 py-0.5 rounded">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Right Column: Listing Form Fields */}
            <div className="space-y-6">
              {/* Title and Category */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Embroidered Lawn Suit"
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-text-primary mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent bg-white transition-all"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your item in detail..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all resize-none"
                  required
                />
              </div>
              
              {/* Size, Brand, Condition, City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-text-primary mb-2">
                    Size
                  </label>
                  <input
                    id="size"
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g., M, 28"
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-text-primary mb-2">
                    Brand
                  </label>
                  <input
                    id="brand"
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g., Khaadi"
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-text-primary mb-2">
                    Condition *
                  </label>
                  <select
                    id="condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent bg-white transition-all"
                    required
                  >
                    <option value="">Select condition</option>
                    {conditions.map((cond) => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-text-primary mb-2">
                    City *
                  </label>
                  <select
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent bg-white transition-all"
                    required
                  >
                    <option value="">Select city</option>
                    {cities.map((cityOption) => (
                      <option key={cityOption} value={cityOption}>{cityOption}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Listing Type Toggles */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-4">
                  Listing Type <span className="text-text-muted">(Select at least one)</span>
                </label>
                
                <div className="space-y-4">
                  {/* Buy Toggle */}
                  <div className="border border-border rounded-xl p-4 transition-colors hover:border-brand">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary">Available to Buy</h3>
                        <p className="text-sm text-text-muted">Sell this item at a fixed price</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={availableToBuy}
                          onChange={(e) => setAvailableToBuy(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                      </label>
                    </div>
                    
                    {/* Price Field - Revealed with smooth transition */}
                    <div 
                      className="overflow-hidden transition-all duration-200 ease-out"
                      style={{ 
                        maxHeight: availableToBuy ? '100px' : '0',
                        opacity: availableToBuy ? 1 : 0,
                        marginTop: availableToBuy ? '16px' : '0'
                      }}
                    >
                      <label htmlFor="price" className="block text-sm font-medium text-text-primary mb-2">
                        Price (PKR) *
                      </label>
                      <input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g., 2500"
                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                        required={availableToBuy}
                      />
                    </div>
                  </div>
                  
                  {/* Rent Toggle */}
                  <div className="border border-border rounded-xl p-4 transition-colors hover:border-brand">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary">Available to Rent</h3>
                        <p className="text-sm text-text-muted">Rent this item daily</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={availableToRent}
                          onChange={(e) => setAvailableToRent(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                      </label>
                    </div>
                    
                    {/* Rental Fields - Revealed with smooth transition */}
                    <div 
                      className="overflow-hidden transition-all duration-200 ease-out"
                      style={{ 
                        maxHeight: availableToRent ? '200px' : '0',
                        opacity: availableToRent ? 1 : 0,
                        marginTop: availableToRent ? '16px' : '0'
                      }}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="rentalPrice" className="block text-sm font-medium text-text-primary mb-2">
                            Rental Price/Day (PKR) *
                          </label>
                          <input
                            id="rentalPrice"
                            type="number"
                            value={rentalPricePerDay}
                            onChange={(e) => setRentalPricePerDay(e.target.value)}
                            placeholder="e.g., 150"
                            className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                            required={availableToRent}
                          />
                        </div>
                        <div>
                          <label htmlFor="deposit" className="block text-sm font-medium text-text-primary mb-2">
                            Security Deposit (PKR) *
                          </label>
                          <input
                            id="deposit"
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="e.g., 500"
                            className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                            required={availableToRent}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Exchange Toggle */}
                  <div className="border border-border rounded-xl p-4 transition-colors hover:border-brand">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary">Open to Exchange</h3>
                        <p className="text-sm text-text-muted">Exchange with other items</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={availableToExchange}
                          onChange={(e) => setAvailableToExchange(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                      </label>
                    </div>
                    
                    {/* Exchange Preference Field - Revealed with smooth transition */}
                    <div 
                      className="overflow-hidden transition-all duration-200 ease-out"
                      style={{ 
                        maxHeight: availableToExchange ? '100px' : '0',
                        opacity: availableToExchange ? 1 : 0,
                        marginTop: availableToExchange ? '16px' : '0'
                      }}
                    >
                      <label htmlFor="preferredExchange" className="block text-sm font-medium text-text-primary mb-2">
                        Preferred Exchange (Optional)
                      </label>
                      <input
                        id="preferredExchange"
                        type="text"
                        value={preferredExchange}
                        onChange={(e) => setPreferredExchange(e.target.value)}
                        placeholder="e.g., Traditional wear, Size M"
                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit Button - Prominent at bottom, sticky on mobile */}
          <div className="mt-8 sticky bottom-0 md:static bg-white md:bg-transparent py-4 md:py-0 border-t md:border-t-0 border-border -mx-4 px-4 md:mx-0 md:px-0 md:mt-8">
            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1 py-3 text-lg font-semibold"
                disabled={submitting || uploadingImages}
              >
                {submitting || uploadingImages ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Publish Listing'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="px-8"
                onClick={() => router.back()}
                disabled={submitting || uploadingImages}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
      </main>
      <Footer />
    </div>
  );
}
