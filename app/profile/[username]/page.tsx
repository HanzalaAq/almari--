'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Skeleton from '@/components/ui/Skeleton';
import ListingCard from '@/components/listings/ListingCard';
import EmptyState from '@/components/ui/EmptyState';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { MapPin, Star, Package, MessageCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
  id: string;
  name: string;
  city: string;
  photo_url: string | null;
  created_at: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  rental_price_per_day: number | null;
  is_rentable: boolean;
  is_exchangeable: boolean;
  images: string[];
  city: string;
  condition: string;
  category: string;
  size: string;
}

interface UserStats {
  total_listings: number;
  total_sold: number;
  total_rented: number;
  total_exchanged: number;
  rating: number;
  review_count: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const username = params.username as string;
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_listings: 0,
    total_sold: 0,
    total_rented: 0,
    total_exchanged: 0,
    rating: 0,
    review_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: loggedInUser } } = await supabase.auth.getUser();
        setCurrentUser(loggedInUser);
        
        // Find user by name (in production, you'd use a unique username field)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .ilike('name', username)
          .single();
        
        if (userError || !userData) {
          setError('User not found');
          setLoading(false);
          return;
        }
        
        setProfile(userData);
        
        // Fetch user's active listings
        const { data: listingsData } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', userData.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (listingsData) {
          setListings(listingsData);
        }
        
        // Fetch stats
        const { data: listingsCount } = await supabase
          .from('listings')
          .select('id', { count: 'exact' })
          .eq('user_id', userData.id);
        
        const { data: ordersData } = await supabase
          .from('orders')
          .select('type, status')
          .eq('seller_id', userData.id)
          .in('status', ['confirmed', 'delivered']);
        
        const { data: ratingData } = await supabase
          .rpc('get_seller_rating', { user_id: userData.id });
        
        const { data: reviewCountData } = await supabase
          .rpc('get_seller_review_count', { user_id: userData.id });
        
        setStats({
          total_listings: listingsCount?.length || 0,
          total_sold: ordersData?.filter((o: any) => o.type === 'buy').length || 0,
          total_rented: ordersData?.filter((o: any) => o.type === 'rent').length || 0,
          total_exchanged: ordersData?.filter((o: any) => o.type === 'exchange').length || 0,
          rating: ratingData || 0,
          review_count: reviewCountData || 0,
        });
        
        setLoading(false);
      } catch (err) {
        setError('An error occurred while fetching the profile');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [username, supabase]);
  
  const handleMessageUser = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    if (!profile) return;
    
    // Create conversation or navigate to existing one
    router.push(`/messages`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-gray-light py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Profile Header Skeleton */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Skeleton variant="circular" className="w-32 h-32" />
                <div className="flex-1 space-y-4 w-full">
                  <Skeleton variant="text" className="h-8 w-48" />
                  <Skeleton variant="text" className="h-4 w-64" />
                  <Skeleton variant="rectangular" className="h-10 w-32" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-medium">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center space-y-2">
                    <Skeleton variant="text" className="h-8 w-16 mx-auto" />
                    <Skeleton variant="text" className="h-4 w-20 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Listings Skeleton */}
            <div>
              <Skeleton variant="text" className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden shadow-sm p-4 space-y-2 bg-white">
                    <Skeleton variant="rectangular" className="aspect-square w-full" />
                    <Skeleton variant="text" className="h-4 w-full" />
                    <Skeleton variant="text" className="h-4 w-3/4" />
                    <Skeleton variant="text" className="h-6 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error && !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">{error}</h1>
            <Button variant="primary" onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!profile) return null;
  
  const isOwnProfile = currentUser && currentUser.id === profile.id;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-light py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cover Banner */}
        <div className="relative mb-16">
          <div className="w-full min-h-[200px] bg-gradient-to-r from-brand to-orange-600 rounded-xl" />
          <div className="absolute left-6 -bottom-16">
            <div className="w-32 h-32 rounded-full bg-gray-light overflow-hidden border-4 border-white shadow-lg">
              {profile.photo_url ? (
                <Image
                  src={profile.photo_url}
                  alt={profile.name}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-white text-4xl font-bold">
                  {profile.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-dark hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
        
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6 pt-8">
            <div className="flex-1 w-full">
              <h1 className="text-3xl font-bold text-foreground mb-2">{profile.name}</h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-dark">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.city}</span>
                </div>
                
                {stats.review_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{stats.rating.toFixed(1)}</span>
                    <span className="text-gray-dark">({stats.review_count} reviews)</span>
                  </div>
                )}
                
                <div className="text-sm text-gray-dark">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
              
              {!isOwnProfile && (
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={handleMessageUser}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Message
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:flex md:gap-8 mt-6 pt-6 border-t border-gray-medium">
            <div className="text-center md:text-left">
              <p className="text-2xl font-bold text-primary">{stats.total_listings}</p>
              <p className="text-sm text-text-muted">Total Listings</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-2xl font-bold text-primary">
                {stats.review_count > 0 ? stats.rating.toFixed(1) : 'N/A'}
              </p>
              <p className="text-sm text-text-muted">Rating</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-2xl font-bold text-primary">
                {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
              <p className="text-sm text-text-muted">Member Since</p>
            </div>
          </div>
        </div>
        
        {/* Listings with Tabs */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium rounded-full bg-brand text-white transition-fast">
                Active Listings
              </button>
              <button className="px-4 py-2 text-sm font-medium rounded-full bg-transparent border border-border text-text-secondary hover:border-brand transition-fast">
                Sold Items
              </button>
            </div>
          </div>
          
          {listings.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No listings yet"
              description={
                isOwnProfile 
                  ? "You haven't created any listings yet." 
                  : "This user hasn't posted any items"
              }
              actionLabel={isOwnProfile ? "Create Your First Listing" : undefined}
              actionHref={isOwnProfile ? "/sell" : undefined}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
