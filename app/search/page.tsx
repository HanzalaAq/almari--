'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ListingCard from '@/components/listings/ListingCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, X } from 'lucide-react';

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

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [size, setSize] = useState(searchParams.get('size') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [buyMode, setBuyMode] = useState(searchParams.get('buy') === 'true');
  const [rentMode, setRentMode] = useState(searchParams.get('rent') === 'true');
  const [exchangeMode, setExchangeMode] = useState(searchParams.get('exchange') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  
  const categories = ['Women', 'Men', 'Kids', 'Traditional', 'Western', 'Accessories'];
  const conditions = ['New', 'Like New', 'Good', 'Fair'];
  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Sukkur', 'Larkana', 'Abbottabad', 'Sargodha'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_low', label: 'Price Low to High' },
    { value: 'price_high', label: 'Price High to Low' },
  ];
  
  const PAGE_SIZE = 20;
  
  useEffect(() => {
    // Only push to URL if the state actually changed from user interaction
    // to prevent circular dependency with the searchParams effect
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (category) params.set('category', category);
    if (size) params.set('size', size);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (condition) params.set('condition', condition);
    if (city) params.set('city', city);
    if (buyMode) params.set('buy', 'true');
    if (rentMode) params.set('rent', 'true');
    if (exchangeMode) params.set('exchange', 'true');
    if (sortBy) params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    // Compare to current URL before replacing to avoid loops
    if (newUrl !== `${window.location.pathname}${window.location.search}`) {
      router.replace(newUrl, { scroll: false });
    }
  }, [searchQuery, category, size, minPrice, maxPrice, condition, city, buyMode, rentMode, exchangeMode, sortBy, currentPage, router]);
  
  useEffect(() => {
    // Sync state FROM URL params when they change (e.g. clicking a Navbar link)
    setSearchQuery(searchParams.get('q') || '');
    setCategory(searchParams.get('category') || '');
    setSize(searchParams.get('size') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setCondition(searchParams.get('condition') || '');
    setCity(searchParams.get('city') || '');
    setBuyMode(searchParams.get('buy') === 'true');
    setRentMode(searchParams.get('rent') === 'true');
    setExchangeMode(searchParams.get('exchange') === 'true');
    setSortBy(searchParams.get('sort') || 'newest');
    
    const pageParam = searchParams.get('page');
    if (pageParam) {
      setCurrentPage(parseInt(pageParam));
    } else {
      setCurrentPage(1);
    }
  }, [searchParams]);

  
  const fetchListings = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .eq('status', 'active');
      
      // Search query
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      
      // Filters
      if (category) query = query.eq('category', category);
      if (size) query = query.ilike('size', `%${size}%`);
      if (minPrice) query = query.gte('price', parseFloat(minPrice));
      if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
      if (condition) query = query.eq('condition', condition);
      if (city) query = query.eq('city', city);
      if (buyMode) query = query.gt('price', 0);
      if (rentMode) query = query.eq('is_rentable', true);
      if (exchangeMode) query = query.eq('is_exchangeable', true);
      
      // Sorting
      switch (sortBy) {
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        default:
          query = query.order('id', { ascending: false });
      }
      
      // Pagination (using cursor-based under the hood)
      const offset = (currentPage - 1) * PAGE_SIZE;
      query = query.range(offset, offset + PAGE_SIZE - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching listings:', error);
        return;
      }
      
      setListings(data || []);
      setTotalResults(count || 0);
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchListings();
  }, [searchQuery, category, size, minPrice, maxPrice, condition, city, buyMode, rentMode, exchangeMode, sortBy, currentPage, supabase]);
  
  const clearFilters = () => {
    setSearchQuery('');
    setCategory('');
    setSize('');
    setMinPrice('');
    setMaxPrice('');
    setCondition('');
    setCity('');
    setBuyMode(false);
    setRentMode(false);
    setExchangeMode(false);
    setSortBy('newest');
    setCurrentPage(1);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for items..."
                className="w-full pl-10 pr-4 py-3 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentPage(1);
                  }
                }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-medium rounded-lg hover:bg-gray-light transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
              {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:underline"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Size</label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g., M, 28"
                  className="w-full px-3 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="">All Conditions</option>
                  {conditions.map((cond) => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>
              
              {/* City */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="">All Cities</option>
                  {cities.map((cityOption) => (
                    <option key={cityOption} value={cityOption}>{cityOption}</option>
                  ))}
                </select>
              </div>
              
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Price Range (PKR)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-1/2 px-3 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-1/2 px-3 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              {/* Transaction Type */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-foreground mb-2">Transaction Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={buyMode}
                      onChange={(e) => setBuyMode(e.target.checked)}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span>Buy</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rentMode}
                      onChange={(e) => setRentMode(e.target.checked)}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span>Rent</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exchangeMode}
                      onChange={(e) => setExchangeMode(e.target.checked)}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span>Exchange</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Sort and Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-dark">
            {totalResults} {totalResults === 1 ? 'result' : 'results'}
          </p>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-dark">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Results */}
        {loading ? (
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
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No items match your search"
            description="Try adjusting your filters or search terms"
            actionLabel="Clear filters"
            actionHref="/search"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-medium rounded-lg hover:bg-gray-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 border border-gray-medium rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-light'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-medium rounded-lg hover:bg-gray-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
