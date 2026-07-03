import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    rental_price_per_day: number | null;
    is_rentable: boolean;
    is_exchangeable: boolean;
    images: string[];
    city: string;
    condition: string;
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  const { id, title, price, rental_price_per_day, is_rentable, is_exchangeable, images, city } = listing;

  const imageUrl = images && images.length > 0 ? images[0] : '/placeholder-image.jpg';

  // Show ALL applicable modes (not exclusive)
  const getBadges = () => {
    const badges = [];

    // Always show Buy badge unless it's only for swap/rent
    if (!is_exchangeable || !is_rentable) {
      badges.push({ text: 'Buy', color: 'bg-success' });
    }

    if (is_rentable) {
      badges.push({ text: 'Rent', color: 'bg-info' });
    }

    if (is_exchangeable) {
      badges.push({ text: 'Swap', color: 'bg-warning' });
    }

    return badges;
  };

  const badges = getBadges();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement favorite functionality
    console.log('Favorite clicked for listing:', id);
  };

  return (
    <Link href={`/listing/${id}`}>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 ease-out overflow-hidden cursor-pointer group hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Hover overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Mode Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {badges.map((badge, index) => (
              <span
                key={index}
                className={`${badge.color} text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm backdrop-blur-sm`}
              >
                {badge.text}
              </span>
            ))}
          </div>

          {/* Heart Icon (Favorite Button) */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 hover:bg-white active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 shadow-sm cursor-pointer group/heart"
            aria-label="Add to favorites"
          >
            <Heart className="w-4 h-4 text-gray-500 group-hover/heart:text-red-400 transition-colors duration-200" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-4">
          <h3 className="font-semibold text-text-primary text-sm mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-brand transition-colors duration-200">
            {title}
          </h3>

          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-brand">
                PKR {price.toLocaleString()}
              </span>
              {is_rentable && rental_price_per_day && (
                <span className="text-[11px] text-text-muted">
                  PKR {rental_price_per_day.toLocaleString()}/day
                </span>
              )}
            </div>
            <span className="text-[11px] text-text-muted flex items-center gap-0.5">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {city}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
