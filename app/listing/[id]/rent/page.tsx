'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Calendar, Shield, CreditCard, MapPin } from 'lucide-react';
import Image from 'next/image';
import { calculatePlatformFee, hold } from '@/lib/payments/escrow';

interface Listing {
  id: string;
  title: string;
  description: string;
  rental_price_per_day: number;
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

export default function RentListingPage() {
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
  
  // Date selection
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
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
        
        if (!listingData.is_rentable || !listingData.rental_price_per_day) {
          setError('This listing is not available for rent');
          setLoading(false);
          return;
        }
        
        if (listingData.user_id === currentUser.id) {
          setError('You cannot rent your own listing');
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
  
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  const calculateDeposit = () => {
    if (!listing) return 0;
    const days = calculateDays();
    // Deposit is 50% of total rental cost
    return Math.round(listing.rental_price_per_day * days * 0.5);
  };
  
  const handleRentNow = async () => {
    if (!listing || !user || !seller) return;
    
    const days = calculateDays();
    if (days < 1) {
      setError('Please select at least 1 rental day');
      return;
    }
    
    if (days > 30) {
      setError('Maximum rental period is 30 days');
      return;
    }
    
    setProcessing(true);
    setError('');
    
    try {
      const rentalCost = listing.rental_price_per_day * days;
      const depositAmount = calculateDeposit();
      const platformFee = calculatePlatformFee(rentalCost);
      const totalAmount = rentalCost + depositAmount + platformFee;
      
      // Hold funds in escrow (mocked)
      const paymentResult = await hold({
        amount: totalAmount,
        buyerId: user.id,
        sellerId: seller.id,
        orderId: listingId,
      });
      
      if (!paymentResult.success) {
        setError('Payment failed. Please try again.');
        setProcessing(false);
        return;
      }
      
      // Create order
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: seller.id,
          listing_id: listing.id,
          type: 'rent',
          amount: rentalCost,
          deposit_amount: depositAmount,
          platform_fee: platformFee,
          total_amount: totalAmount,
          rental_start: startDate,
          rental_end: endDate,
          status: 'pending',
          payment_status: 'held',
          payment_transaction_id: paymentResult.transactionId,
        });
      
      if (orderError) {
        setError('Failed to create order. Please try again.');
        setProcessing(false);
        return;
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
  
  const days = calculateDays();
  const rentalCost = listing.rental_price_per_day * days;
  const depositAmount = calculateDeposit();
  const platformFee = calculatePlatformFee(rentalCost);
  const totalAmount = rentalCost + depositAmount + platformFee;
  
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
            <p className="text-lg text-primary font-semibold mb-4">
              PKR {listing.rental_price_per_day.toLocaleString()} / day
            </p>
            
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
          
          {/* Booking Form */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Select Rental Dates</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              {days > 0 && (
                <div className="bg-gray-light rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-gray-dark mb-2">
                    <Calendar className="w-5 h-5" />
                    <span>{days} day{days > 1 ? 's' : ''} selected</span>
                  </div>
                </div>
              )}
              
              <h2 className="text-xl font-bold text-foreground mb-4">Price Breakdown</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-dark">Rental Cost ({days} days × PKR {listing.rental_price_per_day.toLocaleString()})</span>
                  <span className="font-medium text-foreground">PKR {rentalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-dark">Security Deposit (50%)</span>
                  <span className="font-medium text-foreground">PKR {depositAmount.toLocaleString()}</span>
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
                    <h4 className="font-medium text-blue-900 mb-1">Deposit Protection</h4>
                    <p className="text-sm text-blue-700">
                      Your security deposit is held in escrow and will be refunded when you return the item in good condition.
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
                onClick={handleRentNow}
                disabled={processing || days < 1}
              >
                {processing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Confirm & Pay PKR {totalAmount.toLocaleString()}
                  </>
                )}
              </Button>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">Rental Policy</h3>
              <ul className="space-y-2 text-sm text-gray-dark">
                <li>• Maximum rental period: 30 days</li>
                <li>• Security deposit: 50% of rental cost</li>
                <li>• Deposit refunded upon item return</li>
                <li>• Late returns may incur additional charges</li>
                <li>• Item must be returned in the same condition</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
