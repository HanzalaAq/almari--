'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Upload, X, ArrowLeft } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  rental_price_per_day: number | null;
  is_rentable: boolean;
  is_exchangeable: boolean;
  category: string;
  size: string;
  brand: string;
  condition: string;
  city: string;
  images: string[];
  user_id: string;
}

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const listingId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notAuthorized, setNotAuthorized] = useState(false);
  
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
  
  // Image upload
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const categories = ['Women', 'Men', 'Kids', 'Traditional', 'Western', 'Accessories'];
  const conditions = ['New', 'Like New', 'Good', 'Fair'];
  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Sukkur', 'Larkana', 'Abbottabad', 'Sargodha'];
  
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      
      // Fetch listing
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();
      
      if (listingError || !listingData) {
        setError('Listing not found');
        setLoading(false);
        return;
      }
      
      // Check ownership
      if (listingData.user_id !== currentUser.id) {
        setNotAuthorized(true);
        setLoading(false);
        return;
      }
      
      setListing(listingData);
      
      // Populate form
      setTitle(listingData.title);
      setDescription(listingData.description);
      setCategory(listingData.category);
      setSize(listingData.size || '');
      setBrand(listingData.brand || '');
      setCondition(listingData.condition);
      setCity(listingData.city);
      setAvailableToBuy(listingData.price > 0);
      setAvailableToRent(listingData.is_rentable);
      setAvailableToExchange(listingData.is_exchangeable);
      setPrice(listingData.price > 0 ? listingData.price.toString() : '');
      setRentalPricePerDay(listingData.rental_price_per_day?.toString() || '');
      setExistingImages(listingData.images);
      
      setLoading(false);
    };
    
    fetchData();
  }, [listingId, supabase, router]);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (existingImages.length + newImages.length + files.length > 8) {
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
    
    setNewImages(prev => [...prev, ...validFiles]);
    setError('');
  };
  
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const uploadImagesToSupabase = async (userId: string): Promise<string[]> => {
    if (newImages.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
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
    
    if (!user || !listing) return;
    
    // Validation
    if (!title.trim() || !description.trim() || !category || !condition || !city) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (existingImages.length + newImages.length === 0) {
      setError('Please keep at least one image');
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
      // Upload new images
      const uploadedImageUrls = await uploadImagesToSupabase(user.id);
      
      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedImageUrls];
      
      // Update listing
      const { error: updateError } = await supabase
        .from('listings')
        .update({
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
          images: allImages,
        })
        .eq('id', listing.id);
      
      if (updateError) {
        setError(updateError.message);
        return;
      }
      
      router.push(`/listing/${listing.id}`);
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (notAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Not Authorized
          </h1>
          <p className="text-gray-dark mb-4">You can only edit your own listings.</p>
          <Button variant="primary" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  if (error && !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{error}</h1>
          <Button variant="primary" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-light py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-dark hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Listing
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">Edit Listing</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Photos <span className="text-gray-dark">(Max 8 images)</span>
              </label>
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-dark mb-2">Current images:</p>
                  <div className="grid grid-cols-4 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={image}
                          alt={`Existing ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                            Cover
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* New Images */}
              {newImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-dark mb-2">New images to upload:</p>
                  <div className="grid grid-cols-4 gap-4">
                    {newImages.map((image, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`New ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Upload Button */}
              <div className="border-2 border-dashed border-gray-medium rounded-lg p-6 text-center hover:border-primary transition-colors">
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
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-gray-dark mb-2" />
                  <p className="text-sm text-gray-dark">
                    Add more images
                  </p>
                </label>
              </div>
            </div>
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-foreground mb-2">
                  Size
                </label>
                <input
                  id="size"
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-foreground mb-2">
                  Brand
                </label>
                <input
                  id="brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-foreground mb-2">
                  Condition *
                </label>
                <select
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  required
                >
                  {conditions.map((cond) => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
                  City *
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  required
                >
                  {cities.map((cityOption) => (
                    <option key={cityOption} value={cityOption}>{cityOption}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            {/* Listing Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-4">
                Listing Type <span className="text-gray-dark">(Select at least one)</span>
              </label>
              
              <div className="space-y-4">
                {/* Buy Toggle */}
                <div className="flex items-center justify-between p-4 border border-gray-medium rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">Available to Buy</h3>
                    <p className="text-sm text-gray-dark">Sell this item at a fixed price</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableToBuy}
                      onChange={(e) => setAvailableToBuy(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-medium peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
                
                {availableToBuy && (
                  <div className="ml-4">
                    <label htmlFor="price" className="block text-sm font-medium text-foreground mb-2">
                      Price (PKR) *
                    </label>
                    <input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full md:w-1/2 px-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                )}
                
                {/* Rent Toggle */}
                <div className="flex items-center justify-between p-4 border border-gray-medium rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">Available to Rent</h3>
                    <p className="text-sm text-gray-dark">Rent this item daily</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableToRent}
                      onChange={(e) => setAvailableToRent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-medium peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
                
                {availableToRent && (
                  <div className="ml-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="rentalPrice" className="block text-sm font-medium text-foreground mb-2">
                        Rental Price per Day (PKR) *
                      </label>
                      <input
                        id="rentalPrice"
                        type="number"
                        value={rentalPricePerDay}
                        onChange={(e) => setRentalPricePerDay(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="deposit" className="block text-sm font-medium text-foreground mb-2">
                        Security Deposit (PKR) *
                      </label>
                      <input
                        id="deposit"
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                )}
                
                {/* Exchange Toggle */}
                <div className="flex items-center justify-between p-4 border border-gray-medium rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">Open to Exchange</h3>
                    <p className="text-sm text-gray-dark">Exchange with other items</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableToExchange}
                      onChange={(e) => setAvailableToExchange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-medium peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={submitting || uploadingImages}
              >
                {submitting || uploadingImages ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Update Listing'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting || uploadingImages}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
