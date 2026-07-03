import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

export default function ListingCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden shadow-sm bg-white">
      {/* Image Skeleton */}
      <Skeleton variant="rectangular" className="aspect-square w-full" />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-2">
        {/* Title Skeleton (2 lines) */}
        <Skeleton variant="text" width="100%" height="16px" />
        <Skeleton variant="text" width="80%" height="16px" />
        
        {/* Price Skeleton */}
        <Skeleton variant="text" width="40%" height="20px" />
      </div>
    </div>
  );
}
