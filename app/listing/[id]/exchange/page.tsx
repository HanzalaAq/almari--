'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, ArrowLeftRight, Package } from 'lucide-react';
import Image from 'next/image';

interface Listing {
  id: string;
  title: string;
  description: string;
  images: string[];
  city: string;
  condition: string;
  category: string;
  size: string;
  brand: string;
  user_id: string;
}

interface Seller {
  id: string;
  name: string;
  city: string;
  photo_url: string | null;
}

interface UserListing {
  id: string;
  title: string;
  images: string[];
  condition: string;
  size: string;
  category: string;
}

export default function ExchangeListingPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const listingId = params.id as string;
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
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
        
        if (!listingData.is_exchangeable) {
          setError('This listing is not available for exchange');
          setLoading(false);
          return;
        }
        
        if (listingData.user_id === currentUser.id) {
          setError('You cannot exchange with your own listing');
          setLoading(false);
          return;
        }
        
        if (listingData.status !== 'active') {
          setError('This listing is no longer available');
          setLoading(false);
          return;
        }
        
        setListing(listingData);
        
        // Fetch seller info
        const { data: sellerData } = await supabase
          .from('users')
          .select('id, name, city, photo_url')
          .eq('id', listingData.user_id)
          .single();
        
        if (sellerData) {
          setSeller(sellerData);
        }
        
        // Fetch user's active listings
        const { data: listingsData } = await supabase
          .from('listings')
          .select('id, title, images, condition, size, category')
          .eq('user_id', currentUser.id)
          .eq('status', 'active')
          .eq('is_exchangeable', true);
        
        if (listingsData) {
          setUserListings(listingsData);
          if (listingsData.length > 0) {
            setSelectedListingId(listingsData[0].id);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError('An error occurred while fetching the listing');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [listingId, supabase, router]);
  
  const handleSendProposal = async () => {
    if (!listing || !user || !seller) return;
    
    if (!selectedListingId) {
      setError('Please select one of your items to exchange');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Create exchange proposal
      const { error: proposalError } = await supabase
        .from('exchange_proposals')
        .insert({
          proposer_id: user.id,
          recipient_id: seller.id,
          target_listing_id: listing.id,
          offered_listing_id: selectedListingId,
          top_up_amount: topUpAmount ? parseFloat(topUpAmount) : null,
          status: 'pending',
        });
      
      if (proposalError) {
        setError('Failed to send exchange proposal. Please try again.');
        setSubmitting(false);
        return;
      }
      
      // Redirect to orders page
      router.push('/orders');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
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
  
  if (!listing) return null;
  
  const selectedListing = userListings.find(l => l.id === selectedListingId);
  
  return (
    <div className="min-h-screen bg-gray-light py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-dark hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Listing
          </button>
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-6">Exchange Proposal</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Their Item */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Their Item</h2>
            
            <div className="relative aspect-square mb-4">
              <Image
                src={listing.images[0] || '/placeholder.jpg'}
                alt={listing.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-2">{listing.title}</h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 bg-gray-light rounded-full text-sm">{listing.category}</span>
              {listing.size && (
                <span className="px-3 py-1 bg-gray-light rounded-full text-sm">Size: {listing.size}</span>
              )}
              {listing.brand && (
                <span className="px-3 py-1 bg-gray-light rounded-full text-sm">{listing.brand}</span>
              )}
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {listing.condition}
              </span>
            </div>
            
            <p className="text-gray-dark mb-4">{listing.description}</p>
            
            {seller && (
              <div className="border-t border-gray-medium pt-4">
                <p className="text-sm text-gray-dark">Offered by: <span className="font-medium text-foreground">{seller.name}</span></p>
                <p className="text-sm text-gray-dark">Location: <span className="font-medium text-foreground">{seller.city}</span></p>
              </div>
            )}
          </div>
          
          {/* Your Item */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Your Item</h2>
            
            {userListings.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-dark mx-auto mb-3" />
                <p className="text-gray-dark mb-4">You don't have any items available for exchange.</p>
                <Button variant="primary" onClick={() => router.push('/sell')}>
                  Create a Listing
                </Button>
              </div>
            ) : (
              <>
                {selectedListing && (
                  <div className="relative aspect-square mb-4">
                    <Image
                      src={selectedListing.images[0] || '/placeholder.jpg'}
                      alt={selectedListing.title}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select your item to offer
                  </label>
                  <select
                    value={selectedListingId}
                    onChange={(e) => setSelectedListingId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    {userListings.map((userListing) => (
                      <option key={userListing.id} value={userListing.id}>
                        {userListing.title} ({userListing.condition})
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedListing && (
                  <>
                    <h3 className="text-xl font-bold text-foreground mb-2">{selectedListing.title}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-gray-light rounded-full text-sm">{selectedListing.category}</span>
                      {selectedListing.size && (
                        <span className="px-3 py-1 bg-gray-light rounded-full text-sm">Size: {selectedListing.size}</span>
                      )}
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        {selectedListing.condition}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Add top-up amount (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-dark">PKR</span>
                    <input
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-3 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <p className="text-xs text-gray-dark mt-1">
                    Add cash to balance the exchange if your item is of lower value
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Exchange Icon */}
        <div className="flex justify-center my-4">
          <div className="bg-white rounded-full p-3 shadow-lg">
            <ArrowLeftRight className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        {/* Action */}
        {userListings.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="font-semibold text-foreground mb-3">Exchange Terms</h3>
              <ul className="space-y-2 text-sm text-gray-dark mb-6">
                <li>• The seller will review your proposal</li>
                <li>• They can Accept, Counter-offer, or Decline</li>
                <li>• If accepted, both parties will receive order confirmation</li>
                <li>• You can arrange pickup/delivery via messaging</li>
              </ul>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              
              <Button
                variant="primary"
                className="w-full py-4 text-lg"
                onClick={handleSendProposal}
                disabled={submitting}
              >
                {submitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Send Exchange Offer'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
