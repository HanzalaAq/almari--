'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Shield, CreditCard, MapPin, Package } from 'lucide-react';
import Image from 'next/image';
import { calculatePlatformFee, hold } from '@/lib/payments/escrow';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  city: string;
  condition: string;
  category: string;
  size: string;
  user_id: string;
}

interface Seller {
  id: string;
  name: string;
  city: string;
  photo_url: string | null;
}

export default function BuyListingPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const listingId = params.id as string;
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
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
        
        if (listingData.price <= 0) {
          setError('This listing is not available for purchase');
          setLoading(false);
          return;
        }
        
        if (listingData.user_id === currentUser.id) {
          setError('You cannot purchase your own listing');
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
        
        setLoading(false);
      } catch (err) {
        setError('An error occurred while fetching the listing');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [listingId, supabase, router]);
  
  const handleBuyNow = async () => {
    if (!listing || !user || !seller) return;
    
    setProcessing(true);
    setError('');
    
    try {
      const platformFee = calculatePlatformFee(listing.price);
      const totalAmount = listing.price + platformFee;
      
      // Hold funds in escrow (mocked)
      const paymentResult = await hold({
        amount: totalAmount,
        buyerId: user.id,
        sellerId: seller.id,
        orderId: listingId, // Will be replaced with actual order ID
      });
      
      if (!paymentResult.success) {
        setError('Payment failed. Please try again.');
        setProcessing(false);
        return;
      }
      
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: seller.id,
          listing_id: listing.id,
          type: 'buy',
          amount: listing.price,
          platform_fee: platformFee,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'held',
          payment_transaction_id: paymentResult.transactionId,
        })
        .select()
        .single();
      
      if (orderError) {
        setError('Failed to create order. Please try again.');
        setProcessing(false);
        return;
      }
      
      // Mark listing as sold
      const { error: updateError } = await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', listing.id);
      
      if (updateError) {
        console.error('Failed to mark listing as sold:', updateError);
      }
      
      // Redirect to orders page
      router.push('/orders');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setProcessing(false);
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
  
  const platformFee = calculatePlatformFee(listing.price);
  const totalAmount = listing.price + platformFee;
  
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Listing Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="relative aspect-square mb-4">
              <Image
                src={listing.images[0] || '/placeholder.jpg'}
                alt={listing.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">{listing.title}</h1>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-gray-light rounded-full text-sm">{listing.category}</span>
              {listing.size && (
                <span className="px-3 py-1 bg-gray-light rounded-full text-sm">Size: {listing.size}</span>
              )}
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {listing.condition}
              </span>
            </div>
            
            <p className="text-gray-dark mb-4">{listing.description}</p>
            
            {seller && (
              <div className="border-t border-gray-medium pt-4">
                <h3 className="font-semibold text-foreground mb-2">Seller</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-light overflow-hidden">
                    {seller.photo_url ? (
                      <Image
                        src={seller.photo_url}
                        alt={seller.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                        {seller.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{seller.name}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-dark">
                      <MapPin className="w-4 h-4" />
                      <span>{seller.city}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-dark">Item Price</span>
                  <span className="font-medium text-foreground">PKR {listing.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-dark">Platform Fee</span>
                  <span className="font-medium text-foreground">PKR {platformFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-medium pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-xl text-primary">PKR {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Buyer Protection</h4>
                    <p className="text-sm text-blue-700">
                      Your payment is held in escrow until you confirm receipt of the item.
                      If there are any issues, you can request a refund.
                    </p>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              
              <Button
                variant="primary"
                className="w-full py-4 text-lg"
                onClick={handleBuyNow}
                disabled={processing}
              >
                {processing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay PKR {totalAmount.toLocaleString()}
                  </>
                )}
              </Button>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
              <ol className="space-y-3 text-sm text-gray-dark">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Your payment is held in secure escrow</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Seller ships the item to you</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>You receive and inspect the item</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Confirm receipt to release payment to seller</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
