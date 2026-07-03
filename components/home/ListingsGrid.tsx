'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import ListingCard from '@/components/listings/ListingCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Skeleton from '@/components/ui/Skeleton';

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
  created_at: string;
}

export default function ListingsGrid() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const PAGE_SIZE = 20;

  const fetchListings = async (currentCursor: typeof cursor | null = null) => {
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);

      if (currentCursor) {
        query = query.lt('id', currentCursor.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching listings:', error);
        return;
      }

      if (data) {
        setListings((prev) => (currentCursor ? [...prev, ...data] : data));
        setHasMore(data.length === PAGE_SIZE);

        if (data.length > 0) {
          const lastItem = data[data.length - 1];
          setCursor({ created_at: lastItem.created_at, id: lastItem.id });
        }
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (!loading && hasMore && loadMoreRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchListings(cursor);
          }
        },
        { threshold: 0.1 }
      );

      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, cursor]);

  if (loading && listings.length === 0) {
    return (
      <section id="listings" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-8 tracking-tight">
            Fresh Listings
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-sm p-4 space-y-3 bg-white">
                <Skeleton variant="rectangular" className="aspect-square w-full rounded-xl" />
                <Skeleton variant="text" className="h-4 w-full rounded" />
                <Skeleton variant="text" className="h-4 w-3/4 rounded" />
                <Skeleton variant="text" className="h-6 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="listings" className="py-12 sm:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
            Fresh Listings
          </h2>
          <span className="text-sm text-text-muted hidden sm:block">
            {listings.length > 0 ? `Showing ${listings.length} items` : ''}
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">👗</span>
            </div>
            <p className="text-text-secondary text-lg font-medium">No listings available yet.</p>
            <p className="text-text-muted text-sm mt-1">Be the first to list something!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center mt-14">
                <LoadingSpinner size="md" />
              </div>
            )}

            {!hasMore && listings.length > 0 && (
              <div className="text-center mt-12 py-6 border-t border-gray-200">
                <p className="text-text-muted text-sm">You&apos;ve seen everything — check back later for new finds ✨</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
