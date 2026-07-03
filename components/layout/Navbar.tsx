'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, User, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface NavbarProps {
  minimal?: boolean; // Default: false. If true, shows minimal variant (logo + auth only)
}

export default function Navbar({ minimal = false }: NavbarProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Scroll listener for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = [
    { name: 'Women', href: '/search?category=Women' },
    { name: 'Men', href: '/search?category=Men' },
    { name: 'Kids', href: '/search?category=Kids' },
    { name: 'Traditional', href: '/search?category=Traditional' },
    { name: 'Western', href: '/search?category=Western' },
    { name: 'Accessories', href: '/search?category=Accessories' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav
      className={`sticky top-0 z-40 h-16 transition-all duration-300 ease-out ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm'
          : 'bg-white border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 group">
            <span className="text-2xl font-bold text-brand transition-transform duration-200 inline-block group-hover:scale-105">
              Almari
            </span>
          </Link>

          {/* Minimal Mode: Only Logo + Auth Actions */}
          {minimal ? (
            <>
              {/* Spacer */}
              <div className="flex-1" />

              {/* Auth Actions */}
              <div className="flex items-center space-x-4">
                {user ? (
                  <Link href="/account">
                    <div className="flex items-center space-x-2 text-foreground hover:text-brand cursor-pointer transition-colors duration-200">
                      <User className="w-5 h-5" />
                      <span className="text-sm font-medium">Account</span>
                    </div>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button variant="primary" size="sm">
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Full Mode: Search Bar + Categories + Auth */}

              {/* Search Bar - Desktop (≥768px) */}
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
                <div className="relative w-full group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for clothes, brands, categories..."
                    className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand focus:bg-white transition-all duration-200"
                  />
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-brand transition-colors duration-200" />
                </div>
              </form>

              {/* Desktop Navigation (≥1024px) */}
              <div className="hidden lg:flex items-center space-x-6">
                {/* Categories - visible at ≥1024px */}
                <div className="flex items-center space-x-1">
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      href={category.href}
                      className="px-3 py-1.5 text-foreground hover:text-brand hover:bg-brand-light rounded-lg transition-all duration-200 text-sm font-medium"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>

                {/* Auth */}
                {user ? (
                  <Link href="/account">
                    <div className="flex items-center space-x-2 text-foreground hover:text-brand cursor-pointer transition-colors duration-200">
                      <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center">
                        <User className="w-4 h-4 text-brand" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button variant="primary" size="sm">
                      Login
                    </Button>
                  </Link>
                )}
              </div>

              {/* Tablet Navigation (768px-1023px): Search + Hamburger + Auth */}
              <div className="hidden md:flex lg:hidden items-center space-x-3">
                {/* Hamburger menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 text-foreground" />
                  ) : (
                    <Menu className="w-5 h-5 text-foreground" />
                  )}
                </button>

                {/* Auth */}
                {user ? (
                  <Link href="/account">
                    <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center hover:bg-brand/10 transition-colors">
                      <User className="w-4 h-4 text-brand" />
                    </div>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button variant="primary" size="sm">
                      Login
                    </Button>
                  </Link>
                )}
              </div>

              {/* Mobile Navigation (<768px): Hamburger + Auth */}
              <div className="flex md:hidden items-center space-x-3">
                {/* Hamburger menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 text-foreground" />
                  ) : (
                    <Menu className="w-5 h-5 text-foreground" />
                  )}
                </button>

                {/* Auth */}
                {user ? (
                  <Link href="/account">
                    <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center">
                      <User className="w-4 h-4 text-brand" />
                    </div>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button variant="primary" size="sm">
                      Login
                    </Button>
                  </Link>
                )}
              </div>

              {/* Mobile / Tablet Menu Drawer */}
              <div
                className={`lg:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/60 shadow-lg z-50 transition-all duration-300 ease-out origin-top ${
                  isMobileMenuOpen
                    ? 'opacity-100 scale-y-100 translate-y-0'
                    : 'opacity-0 scale-y-95 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="py-4">
                  {/* Search - Mobile only (hidden on ≥768px since search bar is in navbar) */}
                  <form onSubmit={handleSearch} className="px-4 mb-4 md:hidden">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand focus:bg-white transition-all duration-200"
                      />
                      <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                    </div>
                  </form>

                  {/* Categories */}
                  <div className="px-4">
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Link
                          key={category.name}
                          href={category.href}
                          className="px-4 py-2 bg-gray-50 hover:bg-brand-light hover:text-brand rounded-xl text-sm font-medium transition-all duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
