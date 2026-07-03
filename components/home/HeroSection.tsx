'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ArrowRight, Sparkles, ShoppingBag, RefreshCw } from 'lucide-react';

export default function HeroSection() {
  const categories = ['Women', 'Men', 'Kids', 'Traditional', 'Western', 'Accessories'];

  return (
    <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-gray-50">
      
      {/* --- Dynamic Background Animation (Visible on Desktop & Mobile) --- */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-white opacity-40 mix-blend-overlay z-10" />
        
        {/* Animated glowing orbs (blobs) */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand/30 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30rem] h-[30rem] bg-orange-300/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[25rem] h-[25rem] bg-pink-300/30 rounded-full mix-blend-multiply filter blur-[90px] opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute top-[40%] left-[40%] w-72 h-72 bg-brand-light/50 rounded-full mix-blend-multiply filter blur-[70px] opacity-60 animate-blob"></div>

        {/* Abstract grid texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] z-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* --- Left Column: Text Content --- */}
          <div className="text-center lg:text-left">
            {/* Pill badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-brand/20 text-brand text-sm font-semibold rounded-full mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-brand animate-pulse" />
              Pakistan&apos;s #1 Pre-Loved Fashion
            </div>

            <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 tracking-tight leading-[1.1]">
              Discover Fashion
              <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-orange-400">
                {' '}That Tells a Story
              </span>
            </h1>

            <p className="animate-fade-in-up delay-200 text-base sm:text-lg lg:text-xl text-gray-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Buy, sell, rent, and exchange quality clothing at affordable prices.
              Sustainable fashion made easy for everyone.
            </p>

            {/* CTAs */}
            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link href="/sell">
                <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 py-4 text-base shadow-xl shadow-brand/20 group">
                  Start Selling
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-4 text-base bg-white/50 backdrop-blur-sm border-gray-300 hover:bg-white/80">
                  Browse Listings
                </Button>
              </Link>
            </div>

            {/* Category Chips - Desktop hidden (moved to right side), Mobile visible */}
            <div className="lg:hidden animate-fade-in-up delay-400">
              <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Popular Categories</p>
              <div className="flex gap-2 overflow-x-auto pb-2 justify-center flex-wrap">
                {categories.map((category) => (
                  <Link
                    key={category}
                    href={`/search?category=${encodeURIComponent(category)}`}
                    className="px-5 py-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-brand hover:text-brand hover:bg-brand-light transition-all whitespace-nowrap"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* --- Right Column: Visual Showcase (Desktop Only) --- */}
          <div className="hidden lg:block relative h-full animate-fade-in-up delay-200">
            {/* Glassmorphic feature card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md aspect-square bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-2xl p-8 flex flex-col justify-between overflow-hidden group">
              {/* Internal subtle gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex justify-between items-start">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-brand">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live Now
                </div>
              </div>

              <div className="relative z-10 mt-auto">
                <h3 className="text-3xl font-bold text-gray-900 mb-2 group-hover:scale-105 origin-left transition-transform duration-300">
                  Trending Styles
                </h3>
                <p className="text-gray-600 mb-6">Discover the most sought-after pre-loved pieces curated just for you.</p>
                
                <div className="flex gap-3 flex-wrap">
                  {categories.slice(0, 4).map((category) => (
                    <Link
                      key={category}
                      href={`/search?category=${encodeURIComponent(category)}`}
                      className="px-4 py-2 bg-white border border-gray-100 shadow-sm rounded-full text-sm font-medium text-gray-700 hover:border-brand hover:text-brand transition-all hover:-translate-y-1"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Decorative floating icon inside card */}
              <div className="absolute top-1/4 right-1/4 w-12 h-12 bg-white/60 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-orange-400 animate-float">
                <RefreshCw className="w-5 h-5" />
              </div>
            </div>
            
            {/* Outer decorative floating elements */}
            <div className="absolute top-[10%] right-[10%] w-20 h-20 bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl flex items-center justify-center animate-float delay-300">
              <span className="text-3xl">👗</span>
            </div>
            <div className="absolute bottom-[20%] left-[5%] w-16 h-16 bg-white/60 backdrop-blur-xl border border-white/40 rounded-full shadow-xl flex items-center justify-center animate-float-slow delay-700">
              <span className="text-2xl">✨</span>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
