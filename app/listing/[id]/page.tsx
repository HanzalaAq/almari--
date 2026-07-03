'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { MessageCircle, Edit, Trash2, Pause, Play, Star, MapPin, Package } from 'lucide-react';
import Image from 'next/image';

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
  status: string;
  created_at: string;
}

interface Seller {
  id: string;
  name: string;
  city: string;
  photo_url: string | null;
  rating: number;
  review_count: number;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const listingId = params.id as string;
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedMode, setSelectedMode] = useState<'buy' | 'rent' | 'exchange'>('buy');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        
        // Fetch listing
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single();
        
        if (listingError) {
          setError('Listing not found');
          setLoading(false);
          return;
        }
        
        if (!listingData || listingData.status !== 'active') {
          setError('Listing not available');
          setLoading(false);
          return;
        }
        
        setListing(listingData);
        
        // Fetch seller info with rating
        const { data: sellerData } = await supabase
          .from('users')
          .select('id, name, city, photo_url')
          .eq('id', listingData.user_id)
          .single();
        
        if (sellerData) {
          // Get seller rating using the Postgres function
          const { data: ratingData } = await supabase
            .rpc('get_seller_rating', { user_id: listingData.user_id });
          
          const { data: reviewCountData } = await supabase
            .rpc('get_seller_review_count', { user_id: listingData.user_id });
          
          setSeller({
            ...sellerData,
            rating: ratingData || 0,
            review_count: reviewCountData || 0,
          });
        }
        
        // Set default mode based on what's available
        if (listingData.is_rentable) {
          setSelectedMode('rent');
        } else if (listingData.is_exchangeable) {
          setSelectedMode('exchange');
        } else {
          setSelectedMode('buy');
        }
        
        setLoading(false);
      } catch (err) {
        setError('An error occurred while fetching the listing');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [listingId, supabase]);
  
  const isOwner = user && listing && user.id === listing.user_id;
  
  const handleModeChange = (mode: 'buy' | 'rent' | 'exchange') => {
    setSelectedMode(mode);
  };
  
  const handleAction = () => {
    if (!listing) return;
    
    switch (selectedMode) {
      case 'buy':
        router.push(`/listing/${listing.id}/buy`);
        break;
      case 'rent':
        router.push(`/listing/${listing.id}/rent`);
        break;
      case 'exchange':
        router.push(`/listing/${listing.id}/exchange`);
        break;
    }
  };
  
  const handleEdit = () => {
    router.push(`/listing/${listingId}/edit`);
  };
  
  const handleDelete = async () => {
    if (!listing) return;
    
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);
      
      if (error) {
        setError('Failed to delete listing');
        return;
      }
      
      router.push('/');
    } catch (err) {
      setError('An error occurred while deleting the listing');
    }
  };
  
  const handleToggleStatus = async () => {
    if (!listing) return;
    
    const newStatus = listing.status === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listing.id);
      
      if (error) {
        setError('Failed to update listing status');
        return;
      }
      
      setListing({ ...listing, status: newStatus });
    } catch (err) {
      setError('An error occurred while updating the listing');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {error || 'Listing not found'}
          </h1>
          <Button variant="primary" onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }
  
  const availableModes = [
    ...(listing.price > 0 ? [{ id: 'buy', label: 'Buy Now' }] : []),
    ...(listing.is_rentable ? [{ id: 'rent', label: 'Rent' }] : []),
    ...(listing.is_exchangeable ? [{ id: 'exchange', label: 'Exchange' }] : []),
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-light py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={listing.images[selectedImage] || '/placeholder.jpg'}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
              </div>
              
              {listing.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Listing Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {listing.title}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-gray-dark">
                    <MapPin className="w-4 h-4" />
                    <span>{listing.city}</span>
                  </div>
                </div>
                
                {isOwner && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleStatus}
                    >
                      {listing.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Price */}
              {listing.price > 0 && (
                <div className="mb-4">
                  <span className="text-3xl font-bold text-primary">
                    PKR {listing.price.toLocaleString()}
                  </span>
                </div>
              )}
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-gray-light rounded-full text-sm">
                  {listing.category}
                </span>
                {listing.size && (
                  <span className="px-3 py-1 bg-gray-light rounded-full text-sm">
                    Size: {listing.size}
                  </span>
                )}
                {listing.brand && (
                  <span className="px-3 py-1 bg-gray-light rounded-full text-sm">
                    {listing.brand}
                  </span>
                )}
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {listing.condition}
                </span>
              </div>
              
              {/* Description */}
              <div className="mb-6">
                <h2 className="font-semibold text-foreground mb-2">Description</h2>
                <p className="text-gray-dark whitespace-pre-line">{listing.description}</p>
              </div>
              
              {/* Seller Info */}
              {seller && (
                <div className="border-t border-gray-medium pt-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-light overflow-hidden">
                      {seller.photo_url ? (
                        <Image
                          src={seller.photo_url}
                          alt={seller.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xl font-bold">
                          {seller.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{seller.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-dark">
                        <MapPin className="w-4 h-4" />
                        <span>{seller.city}</span>
                      </div>
                      {seller.review_count > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{seller.rating.toFixed(1)}</span>
                          <span className="text-gray-dark">({seller.review_count} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            {!isOwner && (
              <>
                {/* Mode Selection */}
                {availableModes.length > 1 && (
                  <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="flex gap-2">
                      {availableModes.map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => handleModeChange(mode.id as any)}
                          className={`flex-1 py-3 px-4 rounded-full font-medium transition-fast ${
                            selectedMode === mode.id
                              ? 'bg-brand text-white'
                              : 'border border-border text-text-secondary hover:border-brand'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action Button */}
                <Button
                  variant="primary"
                  className="w-full py-4 text-lg"
                  onClick={handleAction}
                >
                  {selectedMode === 'buy' && 'Buy Now'}
                  {selectedMode === 'rent' && `Rent This (PKR ${listing.rental_price_per_day}/day)`}
                  {selectedMode === 'exchange' && 'Propose Exchange'}
                </Button>
                
                {/* Message Seller */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/messages')}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Message Seller
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
